/**
 * Local public URL helpers used by FitPulse.
 *
 * Auth flows must stay inside the app itself, without external ecosystem redirects.
 */

export const FITPULSE_PUBLIC_URL: string =
  import.meta.env.VITE_PUBLIC_APP_URL || "https://fit.unitrixapp.com.br";
