/**
 * Centralised environment configuration.
 *
 * All external URLs and keys that may change between environments
 * (Lovable preview, Hostinger, VPS, etc.) are read from Vite env vars
 * with sensible defaults for backward-compatibility.
 *
 * In production, set them in your hosting panel or .env file:
 *   VITE_ECOSYSTEM_URL=https://meu-ecossistema.com
 *   VITE_APP_KEY=fitpulse
 */

/** Base URL of the ecosystem / Platform Hub */
export const ECOSYSTEM_URL: string =
  import.meta.env.VITE_ECOSYSTEM_URL || "https://eco.unitrixapp.com.br";

/** App key used in SSO handshake */
export const APP_KEY: string =
  import.meta.env.VITE_APP_KEY || "fitpulse";

/** SSO validation timeout in ms */
export const SSO_TIMEOUT_MS: number =
  Number(import.meta.env.VITE_SSO_TIMEOUT_MS) || 15000;

/** Full URL of the LOCAL SSO validation edge function (this project's proxy) */
export const SSO_VALIDATE_URL: string =
  import.meta.env.VITE_SSO_VALIDATE_URL ||
  `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID || "jaqmvfzbawokunalkmjz"}.supabase.co/functions/v1/validate-sso-token`;
