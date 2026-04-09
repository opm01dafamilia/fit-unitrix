import { useEffect, useRef, useState } from "react";

export type SubscriptionStatus = "active" | "trial" | "pending" | "canceled" | "expired" | "lifetime";

/** Check if there are SSO params in the current URL */
export const hasSSOParams = (): boolean => {
  const params = new URLSearchParams(window.location.search);
  return !!(params.get("sso_token") && (params.get("app_key") || params.get("sso_app")));
};

const clearSSOParamsFromUrl = () => {
  const url = new URL(window.location.href);
  url.searchParams.delete("sso_token");
  url.searchParams.delete("app_key");
  url.searchParams.delete("sso_app");
  const cleanUrl = url.pathname + (url.search === "?" ? "" : url.search);
  window.history.replaceState({}, "", cleanUrl);
};

export const useSSOAuth = () => {
  const hasLegacyParams = hasSSOParams();
  const [ssoLoading, setSsoLoading] = useState(hasLegacyParams);
  const [ssoFinished, setSsoFinished] = useState(!hasLegacyParams);
  const [ssoError, setSsoError] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>(getStoredSubscriptionStatus());
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;

    if (!hasLegacyParams) {
      setSsoLoading(false);
      setSsoFinished(true);
      return;
    }

    didRun.current = true;
      clearSSOParamsFromUrl();
      setSsoError("O acesso via ecossistema foi desativado. Entre com seu login do FitPulse.");
      setSsoLoading(false);
      setSsoFinished(true);
  }, [hasLegacyParams]);

  return {
    ssoLoading,
    ssoFinished,
    ssoError,
    subscriptionStatus,
    setSubscriptionStatus,
  };
};

export const redirectToEcosystem = () => {
  window.location.replace(`${window.location.origin}/login`);
};

export const getStoredSubscriptionStatus = (): SubscriptionStatus => {
  return (localStorage.getItem("fitpulse_sub_status") as SubscriptionStatus) || "active";
};
