import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type EcosystemValidationData = {
  email?: string;
  full_name?: string;
  user_id?: string;
  access_type?: string;
  subscription_status?: string;
  error?: string;
  details?: string;
};

// ─── helpers ────────────────────────────────────────────────────────

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const parseJson = (raw: string): EcosystemValidationData | null => {
  try {
    return JSON.parse(raw) as EcosystemValidationData;
  } catch {
    return null;
  }
};

const maskToken = (t: string) => `${t.slice(0, 6)}...${t.slice(-4)}`;

/**
 * Maps the ecosystem's `access_type` (pt-BR) to FitPulse subscription status.
 *
 *  vitalício → lifetime
 *  pago      → active
 *  trial     → trial
 *  (fallback)→ value from subscription_status field, or "active"
 */
const mapAccessType = (data: EcosystemValidationData): string => {
  const raw = (data.access_type || "").trim().toLowerCase();

  const map: Record<string, string> = {
    vitalicio: "lifetime",
    "vitalício": "lifetime",
    lifetime: "lifetime",
    pago: "active",
    paid: "active",
    active: "active",
    trial: "trial",
    pending: "pending",
    canceled: "canceled",
    expired: "expired",
  };

  if (map[raw]) return map[raw];

  // Fallback: use subscription_status if ecosystem sent it
  if (data.subscription_status) return data.subscription_status;

  return "active";
};

const ECOSYSTEM_VALIDATE_URL =
  Deno.env.get("ECOSYSTEM_SSO_VALIDATE_URL")?.trim() ||
  "https://rjhigmcbfbtyfbrvgeth.supabase.co/functions/v1/validate-sso-token";

// ─── main handler ───────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Parse request
    let body: Record<string, string>;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid request body", stage: "request_validation" }, 400);
    }

    const sso_token = body.sso_token;
    const app_key = body.app_key || body.sso_app;

    console.log("[validate-sso-token] Request received", {
      app_key,
      hasToken: !!sso_token,
      tokenPreview: sso_token ? maskToken(sso_token) : null,
    });

    if (!sso_token || !app_key) {
      return jsonResponse({ error: "Missing sso_token or app_key", stage: "request_validation" }, 400);
    }

    // 2. Call ecosystem validation
    console.log("[validate-sso-token] Calling ecosystem:", ECOSYSTEM_VALIDATE_URL);

    let ecosystemData: EcosystemValidationData;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const ecoRes = await fetch(ECOSYSTEM_VALIDATE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ token: sso_token, sso_token, app_key, sso_app: app_key }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const rawBody = await ecoRes.text();
      const contentType = ecoRes.headers.get("content-type") || "unknown";

      console.log("[validate-sso-token] Ecosystem response", {
        status: ecoRes.status,
        contentType,
        preview: rawBody.slice(0, 200),
      });

      if (!contentType.includes("application/json") && !contentType.includes("+json")) {
        return jsonResponse({
          error: "Endpoint de validação retornou resposta não-JSON",
          details: `Content-Type: ${contentType}`,
          stage: "ecosystem_validation",
        }, 502);
      }

      const parsed = parseJson(rawBody);

      if (!ecoRes.ok) {
        return jsonResponse({
          error: parsed?.error || "Ecosystem rejected SSO validation",
          details: parsed?.details || `HTTP ${ecoRes.status}`,
          stage: "ecosystem_validation",
        }, ecoRes.status === 401 ? 401 : 502);
      }

      if (!parsed?.email) {
        return jsonResponse({
          error: "Missing email in SSO validation response",
          details: JSON.stringify(parsed),
          stage: "ecosystem_validation",
        }, 502);
      }

      ecosystemData = parsed;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[validate-sso-token] Ecosystem call failed:", msg);
      return jsonResponse({
        error: "Falha ao conectar com o ecossistema",
        details: msg,
        stage: "ecosystem_validation",
      }, 502);
    }

    // 3. Resolve subscription status from access_type mapping
    const subscriptionStatus = mapAccessType(ecosystemData);

    console.log("[validate-sso-token] Ecosystem OK", {
      email: ecosystemData.email,
      access_type: ecosystemData.access_type,
      mappedStatus: subscriptionStatus,
    });

    // 4. Create or find local user
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    let user = existingUsers?.users?.find((u) => u.email === ecosystemData.email);

    if (!user) {
      console.log("[validate-sso-token] Creating new user:", ecosystemData.email);

      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: ecosystemData.email,
        email_confirm: true,
        user_metadata: {
          full_name: ecosystemData.full_name || ecosystemData.email,
          app_key,
          ecosystem_user_id: ecosystemData.user_id,
        },
      });

      if (createError) {
        console.error("[validate-sso-token] User creation failed:", createError.message);
        return jsonResponse({
          error: "Failed to create user",
          details: createError.message,
          stage: "user_resolution",
        }, 500);
      }

      user = newUser.user;
    }

    // 5. Sync profile data
    if (user) {
      const profileUpdate: Record<string, unknown> = {};
      if (ecosystemData.full_name) profileUpdate.full_name = ecosystemData.full_name;

      if (Object.keys(profileUpdate).length > 0) {
        const { error: profileErr } = await supabaseAdmin
          .from("profiles")
          .update(profileUpdate)
          .eq("user_id", user.id);

        if (profileErr) {
          console.warn("[validate-sso-token] Profile sync failed (non-blocking):", profileErr.message);
        }
      }
    }

    // 6. Sync subscription status
    if (user) {
      const { data: existingSub } = await supabaseAdmin
        .from("user_subscriptions")
        .select("id, status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (existingSub) {
        if (existingSub.status !== subscriptionStatus) {
          await supabaseAdmin
            .from("user_subscriptions")
            .update({ status: subscriptionStatus })
            .eq("id", existingSub.id);
        }
      } else {
        // Create subscription record if none exists
        await supabaseAdmin.from("user_subscriptions").insert({
          user_id: user.id,
          status: subscriptionStatus,
          plan_type: subscriptionStatus === "lifetime" ? "lifetime" : "individual",
        });
      }
    }

    // 7. Generate magic link for local session creation
    console.log("[validate-sso-token] Generating magic link for:", ecosystemData.email);

    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: ecosystemData.email!,
    });

    if (sessionError || !sessionData?.properties?.hashed_token) {
      console.error("[validate-sso-token] Magic link failed:", sessionError?.message);
      return jsonResponse({
        error: "Failed to generate session",
        details: sessionError?.message || "missing hashed token",
        stage: "session_generation",
      }, 500);
    }

    console.log("[validate-sso-token] Session ready for:", ecosystemData.email);

    return jsonResponse({
      token_hash: sessionData.properties.hashed_token,
      email: ecosystemData.email,
      full_name: ecosystemData.full_name,
      subscription_status: subscriptionStatus,
      verification_type: "magiclink",
      stage: "session_ready",
    });
  } catch (err) {
    console.error("[validate-sso-token] Internal error:", err);
    return jsonResponse({
      error: "Internal error",
      details: String(err),
      stage: "internal",
    }, 500);
  }
});
