import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const ECOSYSTEM_URL = "https://eco-platform-hub.lovable.app";

export type SubscriptionStatus = "active" | "trial" | "pending" | "canceled" | "expired";

export const useSSOAuth = () => {
  const [ssoLoading, setSsoLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>("active");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ssoToken = params.get("sso_token");
    const ssoApp = params.get("sso_app");

    if (ssoToken && ssoApp) {
      handleSSOLogin(ssoToken, ssoApp);
    }
  }, []);

  const handleSSOLogin = async (ssoToken: string, ssoApp: string) => {
    setSsoLoading(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/validate-sso-token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ sso_token: ssoToken, sso_app: ssoApp }),
        }
      );

      if (!response.ok) {
        console.error("SSO validation failed");
        redirectToEcosystem();
        return;
      }

      const data = await response.json();

      // Verify OTP with the hashed token
      const { error } = await supabase.auth.verifyOtp({
        token_hash: data.token_hash,
        type: "magiclink",
      });

      if (error) {
        console.error("SSO session creation failed:", error.message);
        redirectToEcosystem();
        return;
      }

      // Store subscription status
      setSubscriptionStatus(data.subscription_status || "active");
      localStorage.setItem("fitpulse_sub_status", data.subscription_status || "active");

      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete("sso_token");
      url.searchParams.delete("sso_app");
      window.history.replaceState({}, "", url.pathname + url.search);
    } catch (err) {
      console.error("SSO error:", err);
      redirectToEcosystem();
    } finally {
      setSsoLoading(false);
    }
  };

  return { ssoLoading, subscriptionStatus, setSubscriptionStatus };
};

export const redirectToEcosystem = () => {
  const returnUrl = encodeURIComponent(window.location.origin);
  window.location.href = `${ECOSYSTEM_URL}/login?redirect=${returnUrl}&app=fitpulse`;
};

export const getStoredSubscriptionStatus = (): SubscriptionStatus => {
  return (localStorage.getItem("fitpulse_sub_status") as SubscriptionStatus) || "active";
};
