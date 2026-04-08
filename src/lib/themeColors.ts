export type ThemeColor = "purple" | "green" | "red" | "gray";

export const THEME_COLORS: { id: ThemeColor; label: string; preview: string; hsl: string; hslLight: string }[] = [
  { id: "purple", label: "Roxo", preview: "#8B5CF6", hsl: "265 85% 62%", hslLight: "265 85% 58%" },
  { id: "green",  label: "Verde", preview: "#22C55E", hsl: "152 69% 46%", hslLight: "152 55% 45%" },
  { id: "red",    label: "Vermelho", preview: "#E11D48", hsl: "347 77% 50%", hslLight: "347 77% 47%" },
  { id: "gray",   label: "Cinza", preview: "#94A3B8", hsl: "215 16% 62%", hslLight: "215 16% 55%" },
];

const STORAGE_KEY = "fitpulse_theme_color";

export const getSavedThemeColor = (): ThemeColor => {
  return (localStorage.getItem(STORAGE_KEY) as ThemeColor) || "purple";
};

export const saveThemeColor = (color: ThemeColor) => {
  localStorage.setItem(STORAGE_KEY, color);
  applyThemeColor(color);
};

export const applyThemeColor = (color: ThemeColor) => {
  const theme = THEME_COLORS.find((t) => t.id === color);
  if (!theme) return;

  const root = document.documentElement;
  const isLight = root.classList.contains("light") || root.getAttribute("data-theme") === "light";
  const hsl = isLight ? theme.hslLight : theme.hsl;

  root.style.setProperty("--primary", hsl);
  root.style.setProperty("--ring", hsl);
  root.style.setProperty("--sidebar-primary", hsl);
  root.style.setProperty("--sidebar-ring", hsl);
  root.style.setProperty("--chart-1", hsl);

  // Update gradient-primary for dark mode
  if (!isLight) {
    root.style.setProperty("--gradient-primary", `linear-gradient(135deg, hsl(${hsl}), hsl(217 90% 58%))`);
    root.style.setProperty("--shadow-glow", `0 0 40px -8px hsl(${hsl} / 0.2)`);
  }
};

export const initThemeColor = () => {
  const color = getSavedThemeColor();
  if (color !== "purple") {
    applyThemeColor(color);
  }
};
