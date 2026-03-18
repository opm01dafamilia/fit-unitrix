import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    // Support both app_key (new) and sso_app (legacy)
    const sso_token = body.sso_token;
    const app_key = body.app_key || body.sso_app;

    console.log("[validate-sso-token] Received request with app_key:", app_key);

    if (!sso_token || !app_key) {
      console.log("[validate-sso-token] Missing sso_token or app_key");
      return new Response(
        JSON.stringify({ error: "Missing sso_token or app_key" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate the SSO token against the ecosystem
    const ecosystemUrl = "https://eco-platform-hub.lovable.app";
    console.log("[validate-sso-token] Calling ecosystem validation...");
    
    const validateResponse = await fetch(`${ecosystemUrl}/api/validate-sso`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: sso_token, app_key: app_key }),
    });

    console.log("[validate-sso-token] Ecosystem response status:", validateResponse.status);

    if (!validateResponse.ok) {
      const errorText = await validateResponse.text();
      console.log("[validate-sso-token] Ecosystem validation failed:", errorText);
      return new Response(
        JSON.stringify({ error: "Invalid SSO token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ecosystemData = await validateResponse.json();
    console.log("[validate-sso-token] Ecosystem data received for:", ecosystemData.email);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if user exists by email
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    let user = existingUsers?.users?.find((u) => u.email === ecosystemData.email);

    if (!user) {
      console.log("[validate-sso-token] Creating new user for:", ecosystemData.email);
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: ecosystemData.email,
        email_confirm: true,
        user_metadata: {
          full_name: ecosystemData.full_name || ecosystemData.email,
          app_key: app_key,
          ecosystem_user_id: ecosystemData.user_id,
        },
      });
      if (createError) {
        console.error("[validate-sso-token] Failed to create user:", createError.message);
        return new Response(
          JSON.stringify({ error: "Failed to create user", details: createError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      user = newUser.user;

      // Update profile with ecosystem data
      if (user) {
        await supabaseAdmin
          .from("profiles")
          .update({
            full_name: ecosystemData.full_name || null,
          })
          .eq("user_id", user.id);
      }
    }

    // Generate a session for the user
    console.log("[validate-sso-token] Generating magic link for:", ecosystemData.email);
    const { data: sessionData, error: sessionError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: ecosystemData.email,
      });

    if (sessionError || !sessionData) {
      console.error("[validate-sso-token] Failed to generate session:", sessionError?.message);
      return new Response(
        JSON.stringify({ error: "Failed to generate session" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[validate-sso-token] Magic link generated, hashed_token present:", !!sessionData.properties?.hashed_token);

    // Update subscription status
    if (user && ecosystemData.subscription_status) {
      const { data: existingSub } = await supabaseAdmin
        .from("user_subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (existingSub) {
        await supabaseAdmin
          .from("user_subscriptions")
          .update({ status: ecosystemData.subscription_status })
          .eq("user_id", user.id);
      }
    }

    return new Response(
      JSON.stringify({
        token_hash: sessionData.properties?.hashed_token,
        email: ecosystemData.email,
        subscription_status: ecosystemData.subscription_status || "active",
        verification_type: "magiclink",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[validate-sso-token] Internal error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
