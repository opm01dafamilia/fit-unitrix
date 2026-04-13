import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { applyThemeColor } from "./lib/themeColors";

// Public pages always use default purple
applyThemeColor("purple");

// PWA service worker — only register in production, never in iframes/preview
const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();
const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

if (isPreviewHost || isInIframe) {
  navigator.serviceWorker?.getRegistrations().then((regs) =>
    regs.forEach((r) => r.unregister())
  );
}

createRoot(document.getElementById("root")!).render(<App />);
