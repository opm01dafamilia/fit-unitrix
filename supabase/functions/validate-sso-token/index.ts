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
    const { sso_token, sso_app } = await req.json();

    if (!sso_token || !sso_app) {
      return new Response(
        JSON.stringify({ error: "Missing sso_token or sso_app" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate the SSO token against the ecosystem
    const ecosystemUrl = "https://eco-platform-hub.lovable.app";
    const validateResponse = await fetch(`${ecosystemUrl}/api/validate-sso`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: sso_token, app: sso_app }),
    });

    if (!validateResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Invalid SSO token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ecosystemData = await validateResponse.json();
    // Expected: { email, full_name, user_id, subscription_status }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if user exists by email
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    let user = existingUsers?.users?.find((u) => u.email === ecosystemData.email);

    if (!user) {
      // Create user automatically
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: ecosystemData.email,
        email_confirm: true,
        user_metadata: {
          full_name: ecosystemData.full_name || ecosystemData.email,
          sso_app: sso_app,
          ecosystem_user_id: ecosystemData.user_id,
        },
      });
      if (createError) {
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
    const { data: sessionData, error: sessionError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: ecosystemData.email,
      });

    if (sessionError || !sessionData) {
      return new Response(
        JSON.stringify({ error: "Failed to generate session" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
    return new Response(
      JSON.stringify({ error: "Internal error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
