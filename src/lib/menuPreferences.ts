// Menu Preferences — localStorage-based menu customization

const MENU_PREFS_KEY = "fitpulse_menu_prefs";

export type MenuPreferences = {
  pinnedSocialItems: string[]; // route paths pinned to main menu
  menuOrder: string[]; // ordered route paths for sidebar
};

// Fixed core routes (always visible)
const DEFAULT_CORE_ROUTES = [
  "/",
  "/treino",
  "/analise",
  "/metas",
  "/dieta",
  "/acompanhamento",
  "/evolucao",
  "/evolucao-alimentar",
  "/convites",
  "/historico",
  "/perfil-fitness",
];

// Modular routes (hidden by default, can be pinned)
const MODULAR_ROUTES = [
  { to: "/conquistas", label: "Conquistas", icon: "Trophy", desc: "Suas medalhas e marcos", color: "from-chart-3/20 to-chart-3/5", iconColor: "text-chart-3", borderColor: "border-chart-3/15" },
  { to: "/ranking", label: "Ranking", icon: "Crown", desc: "Posição no ranking global", color: "from-chart-4/20 to-chart-4/5", iconColor: "text-chart-4", borderColor: "border-chart-4/15" },
  { to: "/comunidade", label: "Comunidade", icon: "Users", desc: "Feed social e amigos", color: "from-chart-2/20 to-chart-2/5", iconColor: "text-chart-2", borderColor: "border-chart-2/15" },
  { to: "/desafios", label: "Desafios", icon: "Target", desc: "Desafios semanais ativos", color: "from-primary/20 to-primary/5", iconColor: "text-primary", borderColor: "border-primary/15" },
  { to: "/temporadas", label: "Temporadas", icon: "Flame", desc: "Temporadas competitivas", color: "from-orange-500/20 to-orange-500/5", iconColor: "text-orange-400", borderColor: "border-orange-500/15" },
  { to: "/minha-liga", label: "Minha Liga", icon: "Medal", desc: "Seu grupo e posição", color: "from-purple-500/20 to-purple-500/5", iconColor: "text-purple-400", borderColor: "border-purple-500/15" },
  { to: "/biblioteca", label: "Biblioteca", icon: "BookOpen", desc: "Exercícios e referências", color: "from-blue-500/20 to-blue-500/5", iconColor: "text-blue-400", borderColor: "border-blue-500/15" },
  { to: "/amigos", label: "Feed Fitness", icon: "Activity", desc: "Atividades dos amigos", color: "from-pink-500/20 to-pink-500/5", iconColor: "text-pink-400", borderColor: "border-pink-500/15" },
];

// Keep SOCIAL_ROUTES as alias for backward compatibility
const SOCIAL_ROUTES = MODULAR_ROUTES;

export function getMenuPreferences(): MenuPreferences {
  try {
    const raw = localStorage.getItem(MENU_PREFS_KEY);
    if (!raw) return { pinnedSocialItems: [], menuOrder: [] };
    return JSON.parse(raw);
  } catch {
    return { pinnedSocialItems: [], menuOrder: [] };
  }
}

export function saveMenuPreferences(prefs: MenuPreferences): void {
  localStorage.setItem(MENU_PREFS_KEY, JSON.stringify(prefs));
}

export function togglePinnedRoute(route: string): MenuPreferences {
  const prefs = getMenuPreferences();
  const idx = prefs.pinnedSocialItems.indexOf(route);
  if (idx >= 0) {
    prefs.pinnedSocialItems.splice(idx, 1);
  } else {
    prefs.pinnedSocialItems.push(route);
  }
  saveMenuPreferences(prefs);
  return prefs;
}

export function isPinned(route: string): boolean {
  return getMenuPreferences().pinnedSocialItems.includes(route);
}

export function resetMenuPreferences(): void {
  localStorage.removeItem(MENU_PREFS_KEY);
}

export { DEFAULT_CORE_ROUTES, MODULAR_ROUTES, SOCIAL_ROUTES };
