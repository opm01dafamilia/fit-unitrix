import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const ECOSYSTEM_URL = "https://eco-platform-hub.lovable.app";
const APP_KEY = "fitpulse";

export type SubscriptionStatus = "active" | "trial" | "pending" | "canceled" | "expired";

/** Check if there are SSO params in the current URL */
export const hasSSOParams = (): boolean => {
  const params = new URLSearchParams(window.location.search);
  return !!(params.get("sso_token") && (params.get("app_key") || params.get("sso_app")));
};

export const useSSOAuth = () => {
  const [ssoLoading, setSsoLoading] = useState(() => hasSSOParams());
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>("active");
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    
    const params = new URLSearchParams(window.location.search);
    const ssoToken = params.get("sso_token");
    const appKey = params.get("app_key") || params.get("sso_app");

    if (ssoToken && appKey) {
      didRun.current = true;
      handleSSOLogin(ssoToken, appKey);
    }
  }, []);

  const handleSSOLogin = async (ssoToken: string, appKey: string) => {
    setSsoLoading(true);
    try {
      console.log("[SSO] Starting validation with app_key:", appKey);
      
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/validate-sso-token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ sso_token: ssoToken, app_key: appKey }),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error("[SSO] Validation failed:", response.status, errorData);
        setSsoLoading(false);
        return;
      }

      const data = await response.json();
      console.log("[SSO] Validation response received, creating session...");

      // Verify OTP with the hashed token
      const { data: authData, error } = await supabase.auth.verifyOtp({
        token_hash: data.token_hash,
        type: "magiclink",
      });

      if (error) {
        console.error("[SSO] Session creation failed:", error.message);
        setSsoLoading(false);
        return;
      }

      console.log("[SSO] Session created successfully for:", authData?.user?.email);

      // Store subscription status
      setSubscriptionStatus(data.subscription_status || "active");
      localStorage.setItem("fitpulse_sub_status", data.subscription_status || "active");

      // Clean URL params
      const url = new URL(window.location.href);
      url.searchParams.delete("sso_token");
      url.searchParams.delete("app_key");
      url.searchParams.delete("sso_app");
      window.history.replaceState({}, "", url.pathname + url.search);
    } catch (err) {
      console.error("[SSO] Error:", err);
    } finally {
      setSsoLoading(false);
    }
  };

  return { ssoLoading, subscriptionStatus, setSubscriptionStatus };
};

export const redirectToEcosystem = () => {
  const returnUrl = encodeURIComponent(window.location.origin);
  window.location.href = `${ECOSYSTEM_URL}/login?redirect=${returnUrl}&app_key=${APP_KEY}`;
};

export const getStoredSubscriptionStatus = (): SubscriptionStatus => {
  return (localStorage.getItem("fitpulse_sub_status") as SubscriptionStatus) || "active";
};
