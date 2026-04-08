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

// Chart palette per theme — 5 coordinated colors
const CHART_PALETTES: Record<ThemeColor, string[]> = {
  purple: ["265 85% 62%", "217 90% 58%", "280 65% 55%", "45 90% 55%", "0 72% 51%"],
  green:  ["152 69% 46%", "160 60% 38%", "180 55% 42%", "45 90% 55%", "0 72% 51%"],
  red:    ["347 77% 50%", "0 65% 42%", "15 75% 55%", "45 90% 55%", "280 50% 50%"],
  gray:   ["215 16% 62%", "220 14% 50%", "200 18% 55%", "45 60% 50%", "0 40% 50%"],
};

// Accent color per theme (for success/completion states that should also follow theme)
const ACCENT_HSL: Record<ThemeColor, { dark: string; light: string }> = {
  purple: { dark: "265 70% 55%", light: "265 70% 50%" },
  green:  { dark: "152 55% 48%", light: "152 55% 45%" },
  red:    { dark: "347 65% 52%", light: "347 65% 48%" },
  gray:   { dark: "215 16% 58%", light: "215 16% 52%" },
};

const STORAGE_KEY = "fitpulse_theme_color";

export const getSavedThemeColor = (): ThemeColor => {
  return (localStorage.getItem(STORAGE_KEY) as ThemeColor) || "purple";
};

export const saveThemeColor = (color: ThemeColor) => {
  localStorage.setItem(STORAGE_KEY, color);
  applyThemeColor(color);
};

/** Returns current primary HSL string from computed style */
export const getPrimaryHSL = (): string => {
  return getComputedStyle(document.documentElement).getPropertyValue("--primary").trim();
};

export const applyThemeColor = (color: ThemeColor) => {
  const theme = THEME_COLORS.find((t) => t.id === color);
  if (!theme) return;

  const root = document.documentElement;
  const isLight = root.classList.contains("light") || root.getAttribute("data-theme") === "light";
  const hsl = isLight ? theme.hslLight : theme.hsl;
  const secondary = SECONDARY_HSL[color];
  const accent = isLight ? ACCENT_HSL[color].light : ACCENT_HSL[color].dark;
  const charts = CHART_PALETTES[color];

  // Core color tokens
  root.style.setProperty("--primary", hsl);
  root.style.setProperty("--ring", hsl);
  root.style.setProperty("--accent", accent);
  root.style.setProperty("--sidebar-primary", hsl);
  root.style.setProperty("--sidebar-ring", hsl);
  root.style.setProperty("--sidebar-accent", isLight ? `${hsl.split(" ")[0]} 14% 96%` : `${hsl.split(" ")[0]} 22% 15%`);

  // Chart tokens
  root.style.setProperty("--chart-1", charts[0]);
  root.style.setProperty("--chart-2", charts[1]);
  root.style.setProperty("--chart-3", charts[2]);
  root.style.setProperty("--chart-4", charts[3]);
  root.style.setProperty("--chart-5", charts[4]);

  // Secondary color follows theme
  root.style.setProperty("--secondary", isLight ? `${hsl.split(" ")[0]} 14% 92%` : `${hsl.split(" ")[0]} 18% 18%`);

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
