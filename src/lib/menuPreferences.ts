// Menu Preferences — localStorage-based menu customization

const MENU_PREFS_KEY = "fitpulse_menu_prefs";

export type MenuPreferences = {
  pinnedSocialItems: string[]; // route paths pinned to main menu
  menuOrder: string[]; // ordered route paths for sidebar
};

const DEFAULT_CORE_ROUTES = ["/", "/treino", "/dieta", "/historico", "/perfil-fitness"];

const SOCIAL_ROUTES = [
  { to: "/conquistas", label: "Conquistas", icon: "Trophy" },
  { to: "/ranking", label: "Ranking", icon: "Crown" },
  { to: "/comunidade", label: "Comunidade", icon: "Users" },
  { to: "/desafios", label: "Desafios", icon: "Target" },
  { to: "/temporadas", label: "Temporadas", icon: "Flame" },
  { to: "/minha-liga", label: "Minha Liga", icon: "Medal" },
];

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

export { DEFAULT_CORE_ROUTES, SOCIAL_ROUTES };
