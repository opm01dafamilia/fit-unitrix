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
  subscription_status?: string;
  error?: string;
  details?: string;
};

type ValidationAttempt = {
  url: string;
  status?: number;
  contentType?: string;
  error?: string;
  preview?: string;
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const parseJsonSafely = (raw: string): EcosystemValidationData | null => {
  try {
    return JSON.parse(raw) as EcosystemValidationData;
  } catch {
    return null;
  }
};

const isJsonContentType = (contentType: string) =>
  contentType.includes("application/json") || contentType.includes("+json");

const maskToken = (token: string) => `${token.slice(0, 6)}...${token.slice(-4)}`;

const ECOSYSTEM_VALIDATE_URL =
  Deno.env.get("ECOSYSTEM_SSO_VALIDATE_URL")?.trim() ||
  "https://rjhigmcbfbtyfbrvgeth.supabase.co/functions/v1/validate-sso-token";

const callValidationEndpoint = async (
  url: string,
  payload: Record<string, string>,
  timeoutMs = 8000
) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const rawBody = await response.text();
    const contentType = response.headers.get("content-type") || "unknown";

    return {
      response,
      rawBody,
      contentType,
      parsedBody: parseJsonSafely(rawBody),
    };
  } finally {
    clearTimeout(timeoutId);
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let body: Record<string, string>;

    try {
      body = await req.json();
    } catch {
      return jsonResponse(
        {
          error: "Invalid request body",
          stage: "request_validation",
        },
        400
      );
    }

    const sso_token = body.sso_token;
    const app_key = body.app_key || body.sso_app;

    console.log("[validate-sso-token] Request received", {
      app_key,
      hasToken: !!sso_token,
      tokenPreview: sso_token ? maskToken(sso_token) : null,
    });

    if (!sso_token || !app_key) {
      return jsonResponse(
        {
          error: "Missing sso_token or app_key",
          stage: "request_validation",
        },
        400
      );
    }

    const validationPayload = {
      token: sso_token,
      sso_token,
      app_key,
      sso_app: app_key,
    };

    const validationUrls = buildValidationUrls();
    const attempts: ValidationAttempt[] = [];

    console.log("[validate-sso-token] Trying ecosystem validation endpoints", validationUrls);

    let ecosystemData: EcosystemValidationData | null = null;
    let selectedEndpoint: string | null = null;

    for (const url of validationUrls) {
      try {
        const { response, rawBody, contentType, parsedBody } = await callValidationEndpoint(
          url,
          validationPayload
        );

        attempts.push({
          url,
          status: response.status,
          contentType,
          preview: rawBody.slice(0, 180),
        });

        console.log("[validate-sso-token] Ecosystem response", {
          url,
          status: response.status,
          contentType,
        });

        if (!isJsonContentType(contentType)) {
          console.warn("[validate-sso-token] Non-JSON response from ecosystem endpoint", {
            url,
            status: response.status,
            contentType,
          });
          continue;
        }

        if (!response.ok) {
          const upstreamError =
            parsedBody?.error || parsedBody?.details || "Ecosystem rejected SSO validation";

          return jsonResponse(
            {
              error: upstreamError,
              details: `Validation rejected by ecosystem at ${url}`,
              stage: "ecosystem_validation",
              ecosystem_status: response.status,
              ecosystem_url: url,
            },
            response.status === 401 ? 401 : 502
          );
        }

        if (!parsedBody) {
          return jsonResponse(
            {
              error: "Invalid validation response",
              details: `Endpoint ${url} respondeu JSON inválido`,
              stage: "ecosystem_validation",
              ecosystem_url: url,
            },
            502
          );
        }

        if (!parsedBody.email) {
          return jsonResponse(
            {
              error: "Missing email in SSO validation response",
              details: `Endpoint ${url} não retornou email`,
              stage: "ecosystem_validation",
              ecosystem_url: url,
            },
            502
          );
        }

        ecosystemData = parsedBody;
        selectedEndpoint = url;
        break;
      } catch (endpointError) {
        const message = endpointError instanceof Error ? endpointError.message : String(endpointError);
        attempts.push({ url, error: message });
        console.error("[validate-sso-token] Ecosystem endpoint request failed", { url, message });
      }
    }

    if (!ecosystemData || !selectedEndpoint) {
      return jsonResponse(
        {
          error: "Nenhum endpoint de validação SSO retornou JSON válido",
          details: "O ecossistema retornou HTML ou resposta inválida para todas as tentativas",
          stage: "ecosystem_validation",
          attempts,
        },
        502
      );
    }

    console.log("[validate-sso-token] Ecosystem validation succeeded", {
      email: ecosystemData.email,
      endpoint: selectedEndpoint,
    });

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
      console.log("[validate-sso-token] Creating new user", ecosystemData.email);

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
        console.error("[validate-sso-token] Failed to create user", createError.message);
        return jsonResponse(
          {
            error: "Failed to create user",
            details: createError.message,
            stage: "user_resolution",
          },
          500
        );
      }

      user = newUser.user;

      if (user) {
        const { error: profileUpdateError } = await supabaseAdmin
          .from("profiles")
          .update({ full_name: ecosystemData.full_name || null })
          .eq("user_id", user.id);

        if (profileUpdateError) {
          console.warn(
            "[validate-sso-token] Profile update failed (non-blocking)",
            profileUpdateError.message
          );
        }
      }
    }

    console.log("[validate-sso-token] Generating magic link", ecosystemData.email);

    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: ecosystemData.email!,
    });

    if (sessionError || !sessionData?.properties?.hashed_token) {
      console.error("[validate-sso-token] Failed to generate magic link", sessionError?.message);
      return jsonResponse(
        {
          error: "Failed to generate session",
          details: sessionError?.message || "missing hashed token",
          stage: "session_generation",
        },
        500
      );
    }

    if (user && ecosystemData.subscription_status) {
      const { data: existingSub } = await supabaseAdmin
        .from("user_subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (existingSub) {
        const { error: subError } = await supabaseAdmin
          .from("user_subscriptions")
          .update({ status: ecosystemData.subscription_status })
          .eq("user_id", user.id);

        if (subError) {
          console.warn("[validate-sso-token] Subscription update failed (non-blocking)", subError.message);
        }
      }
    }

    return jsonResponse({
      token_hash: sessionData.properties.hashed_token,
      email: ecosystemData.email,
      subscription_status: ecosystemData.subscription_status || "active",
      verification_type: "magiclink",
      stage: "session_ready",
      ecosystem_url: selectedEndpoint,
    });
  } catch (err) {
    console.error("[validate-sso-token] Internal error", err);
    return jsonResponse(
      {
        error: "Internal error",
        details: String(err),
        stage: "internal",
      },
      500
    );
  }
});
