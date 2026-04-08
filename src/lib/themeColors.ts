export type ThemeColor = "purple" | "green" | "red" | "gray";

export const THEME_COLORS: { id: ThemeColor; label: string; preview: string; hsl: string; hslLight: string }[] = [
  { id: "purple", label: "Roxo", preview: "#8B5CF6", hsl: "265 85% 62%", hslLight: "265 85% 58%" },
  { id: "green",  label: "Verde", preview: "#22C55E", hsl: "152 69% 46%", hslLight: "152 55% 45%" },
  { id: "red",    label: "Vermelho", preview: "#E11D48", hsl: "347 77% 50%", hslLight: "347 77% 47%" },
  { id: "gray",   label: "Cinza", preview: "#94A3B8", hsl: "215 16% 62%", hslLight: "215 16% 55%" },
];

// Secondary accent per theme (used for gradients to avoid mixing colors)
const SECONDARY_HSL: Record<ThemeColor, string> = {
  purple: "217 90% 58%",
  green: "160 60% 38%",
  red: "0 65% 42%",
  gray: "220 14% 50%",
};

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
  const secondary = SECONDARY_HSL[color];

  // Core color tokens
  root.style.setProperty("--primary", hsl);
  root.style.setProperty("--ring", hsl);
  root.style.setProperty("--sidebar-primary", hsl);
  root.style.setProperty("--sidebar-ring", hsl);
  root.style.setProperty("--chart-1", hsl);

  // Gradient & glow tokens
  root.style.setProperty("--gradient-primary", `linear-gradient(135deg, hsl(${hsl}), hsl(${secondary}))`);
  root.style.setProperty("--shadow-glow", `0 0 40px -8px hsl(${hsl} / 0.2)`);

  // Body background radial uses a desaturated version of the primary
  if (!isLight) {
    const hue = hsl.split(" ")[0];
    root.style.setProperty("--gradient-body-bg", `radial-gradient(ellipse at 50% 0%, hsl(${hue} 22% 15%) 0%, hsl(228 18% 9%) 60%)`);
  }
};

export const initThemeColor = () => {
  const color = getSavedThemeColor();
  applyThemeColor(color);
};
