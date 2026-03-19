import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ECOSYSTEM_URL, APP_KEY, SSO_TIMEOUT_MS, SSO_VALIDATE_URL } from "@/lib/env";

export type SubscriptionStatus = "active" | "trial" | "pending" | "canceled" | "expired" | "lifetime";

type ValidationPayload = {
  token_hash?: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  subscription_status?: SubscriptionStatus;
  error?: string;
  details?: string;
  stage?: string;
};

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
  window.history.replaceState({}, "", url.pathname + url.search);
};

const parseValidationPayload = (raw: string): ValidationPayload | null => {
  try {
    return JSON.parse(raw) as ValidationPayload;
  } catch {
    return null;
  }
};

const buildValidationErrorMessage = (status: number, payload: ValidationPayload | null) => {
  if (!payload) {
    return `Falha na validação SSO (HTTP ${status}). O servidor retornou uma resposta inválida.`;
  }

  const stagePart = payload.stage ? `[etapa: ${payload.stage}] ` : "";
  const errorPart = payload.error || "Falha na validação SSO";
  const detailsPart = payload.details ? ` ${payload.details}` : "";
  return `${stagePart}${errorPart}${detailsPart}`.trim();
};

export const useSSOAuth = () => {
  const hasParams = hasSSOParams();
  const [ssoLoading, setSsoLoading] = useState(hasParams);
  const [ssoFinished, setSsoFinished] = useState(!hasParams);
  const [ssoError, setSsoError] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>("active");
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;

    const params = new URLSearchParams(window.location.search);
    const ssoToken = params.get("sso_token");
    const receivedAppKey = params.get("app_key") || params.get("sso_app");

    console.log("[SSO] URL params detected:", {
      hasToken: !!ssoToken,
      receivedAppKey,
      expectedAppKey: APP_KEY,
    });

    if (!ssoToken || !receivedAppKey) {
      setSsoLoading(false);
      setSsoFinished(true);
      return;
    }

    didRun.current = true;

    if (receivedAppKey !== APP_KEY) {
      console.warn(
        `[SSO] app_key recebido (${receivedAppKey}) diferente do esperado (${APP_KEY}). Usando app_key do Fit-Pulse.`
      );
    }

    handleSSOLogin(ssoToken, APP_KEY);
  }, []);

  const handleSSOLogin = async (ssoToken: string, appKey: string) => {
    setSsoLoading(true);
    setSsoFinished(false);
    setSsoError(null);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), SSO_TIMEOUT_MS);

    try {
      console.log("[SSO] Starting validation at:", SSO_VALIDATE_URL, "with app_key:", appKey);

      const response = await fetch(SSO_VALIDATE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ sso_token: ssoToken, app_key: appKey }),
        signal: controller.signal,
      });

      const rawResponse = await response.text();
      const payload = parseValidationPayload(rawResponse);

      console.log("[SSO] validate-sso-token response:", {
        status: response.status,
        ok: response.ok,
        stage: payload?.stage,
      });

      if (!response.ok) {
        console.error("[SSO] Validation failed:", response.status, rawResponse);
        throw new Error(buildValidationErrorMessage(response.status, payload));
      }

      if (!payload?.token_hash) {
        console.error("[SSO] Missing token_hash in payload:", payload || rawResponse);
        throw new Error("A validação SSO não retornou um token de sessão válido.");
      }

      console.log("[SSO] Validation response received, creating local session...");

      const { data: authData, error } = await supabase.auth.verifyOtp({
        token_hash: payload.token_hash,
        type: "magiclink",
      });

      if (error || !authData?.session) {
        console.error("[SSO] verifyOtp failed:", error?.message);
        throw new Error(error?.message || "Não foi possível criar a sessão local do usuário.");
      }

      console.log("[SSO] Session created successfully for:", authData.user?.email);

      const nextSubscriptionStatus = payload.subscription_status || "active";
      setSubscriptionStatus(nextSubscriptionStatus);
      localStorage.setItem("fitpulse_sub_status", nextSubscriptionStatus);

      clearSSOParamsFromUrl();
    } catch (err) {
      const timeoutError = err instanceof Error && err.name === "AbortError";
      const message = timeoutError
        ? "O tempo de autenticação expirou. Volte ao ecossistema e tente novamente."
        : err instanceof Error
          ? err.message
          : "Falha inesperada no SSO. Volte ao ecossistema e tente novamente.";

      console.error("[SSO] Error:", err);
      setSsoError(message);
    } finally {
      window.clearTimeout(timeoutId);
      setSsoLoading(false);
      setSsoFinished(true);
    }
  };

  return {
    ssoLoading,
    ssoFinished,
    ssoError,
    subscriptionStatus,
    setSubscriptionStatus,
  };
};

export const redirectToEcosystem = () => {
  const returnUrl = encodeURIComponent(window.location.origin);
  window.location.href = `${ECOSYSTEM_URL}/login?redirect=${returnUrl}&app_key=${APP_KEY}`;
};

export const getStoredSubscriptionStatus = (): SubscriptionStatus => {
  return (localStorage.getItem("fitpulse_sub_status") as SubscriptionStatus) || "active";
};
