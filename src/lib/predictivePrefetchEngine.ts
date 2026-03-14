/**
 * Predictive Prefetch Engine — anticipates navigation and preloads data.
 * Tracks user navigation patterns and prefetches the most likely next page.
 */

import { supabase } from "@/integrations/supabase/client";
import { writeCache, readCache, CACHE_KEYS } from "@/lib/smartCache";

// ── Navigation pattern storage ──────────────────────────────────────
const NAV_HISTORY_KEY = "fitpulse_nav_patterns";
const MAX_PATTERN_ENTRIES = 200;

interface NavPattern {
  from: string;
  to: string;
  count: number;
}

function getPatterns(): NavPattern[] {
  try {
    return JSON.parse(localStorage.getItem(NAV_HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function savePatterns(patterns: NavPattern[]) {
  try {
    localStorage.setItem(NAV_HISTORY_KEY, JSON.stringify(patterns.slice(0, MAX_PATTERN_ENTRIES)));
  } catch {}
}

/** Record a navigation event from → to */
export function recordNavigation(from: string, to: string) {
  if (from === to) return;
  const patterns = getPatterns();
  const existing = patterns.find(p => p.from === from && p.to === to);
  if (existing) {
    existing.count++;
  } else {
    patterns.push({ from, to, count: 1 });
  }
  // Sort by count desc so most frequent are first
  patterns.sort((a, b) => b.count - a.count);
  savePatterns(patterns);
}

/** Get predicted next routes from current, sorted by likelihood */
export function getPredictedRoutes(current: string, limit = 3): string[] {
  const patterns = getPatterns().filter(p => p.from === current);
  return patterns.slice(0, limit).map(p => p.to);
}

// ── Context-based prefetch map ──────────────────────────────────────
const CONTEXT_PREFETCH: Record<string, string[]> = {
  "/":               ["/treino", "/dieta", "/metas"],
  "/treino":         ["/historico", "/evolucao", "/biblioteca"],
  "/dieta":          ["/evolucao-alimentar", "/acompanhamento"],
  "/perfil-fitness": ["/ranking", "/conquistas", "/desafios", "/minha-liga"],
  "/metas":          ["/acompanhamento", "/evolucao"],
  "/acompanhamento": ["/analise", "/metas"],
  "/analise":        ["/acompanhamento", "/evolucao"],
};

// ── Priority tiers for throttling ───────────────────────────────────
const HIGH_PRIORITY = new Set(["/treino", "/dieta", "/", "/metas"]);
const MED_PRIORITY = new Set(["/ranking", "/conquistas", "/desafios"]);

// ── Prefetch data functions per route ───────────────────────────────
type PrefetchFn = (userId: string) => Promise<void>;

const prefetchers: Record<string, PrefetchFn> = {
  "/treino": async (userId) => {
    if (readCache(CACHE_KEYS.workoutPlans(userId), { maxAge: 15 * 60_000 })) return;
    const { data } = await supabase
      .from("workout_plans").select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }).limit(3);
    if (data) writeCache(CACHE_KEYS.workoutPlans(userId), data);
  },

  "/dieta": async (userId) => {
    if (readCache(CACHE_KEYS.dietPlans(userId), { maxAge: 15 * 60_000 })) return;
    const { data } = await supabase
      .from("diet_plans").select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }).limit(1);
    if (data) writeCache(CACHE_KEYS.dietPlans(userId), data);
  },

  "/metas": async (userId) => {
    if (readCache(CACHE_KEYS.fitnessGoals(userId), { maxAge: 10 * 60_000 })) return;
    const { data } = await supabase
      .from("fitness_goals").select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (data) writeCache(CACHE_KEYS.fitnessGoals(userId), data);
  },

  "/historico": async (userId) => {
    if (readCache(CACHE_KEYS.workoutSessions(userId), { maxAge: 10 * 60_000 })) return;
    const { data } = await supabase
      .from("workout_sessions").select("*")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false }).limit(30);
    if (data) writeCache(CACHE_KEYS.workoutSessions(userId), data);
  },

  "/ranking": async (userId) => {
    if (readCache(CACHE_KEYS.rankingStats(userId), { maxAge: 10 * 60_000 })) return;
    const { data } = await supabase
      .from("user_ranking_stats").select("*")
      .eq("user_id", userId).limit(1);
    if (data) writeCache(CACHE_KEYS.rankingStats(userId), data);
  },

  "/acompanhamento": async (userId) => {
    if (readCache(CACHE_KEYS.bodyTracking(userId), { maxAge: 10 * 60_000 })) return;
    const { data } = await supabase
      .from("body_tracking").select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }).limit(10);
    if (data) writeCache(CACHE_KEYS.bodyTracking(userId), data);
  },

  "/conquistas": async (userId) => {
    // Achievements are computed from workout sessions
    if (readCache(CACHE_KEYS.workoutSessions(userId), { maxAge: 10 * 60_000 })) return;
    const { data } = await supabase
      .from("workout_sessions").select("*")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false }).limit(50);
    if (data) writeCache(CACHE_KEYS.workoutSessions(userId), data);
  },

  "/evolucao": async (userId) => {
    if (readCache(CACHE_KEYS.exerciseHistory(userId), { maxAge: 10 * 60_000 })) return;
    const { data } = await supabase
      .from("exercise_history").select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }).limit(100);
    if (data) writeCache(CACHE_KEYS.exerciseHistory(userId), data);
  },
};

// Alias routes that share prefetchers
prefetchers["/evolucao-alimentar"] = prefetchers["/dieta"];
prefetchers["/analise"] = prefetchers["/acompanhamento"];
prefetchers["/desafios"] = prefetchers["/ranking"];
prefetchers["/minha-liga"] = prefetchers["/ranking"];

// ── Dedup & throttle active requests ────────────────────────────────
const activeRequests = new Set<string>();
const recentlyPrefetched = new Map<string, number>();
const COOLDOWN_MS = 60_000; // Don't re-prefetch same route within 1 min

async function safePrefetch(route: string, userId: string) {
  const fn = prefetchers[route];
  if (!fn) return;
  if (activeRequests.has(route)) return;

  const lastPrefetch = recentlyPrefetched.get(route);
  if (lastPrefetch && Date.now() - lastPrefetch < COOLDOWN_MS) return;

  activeRequests.add(route);
  try {
    await fn(userId);
    recentlyPrefetched.set(route, Date.now());
  } catch {
    // Silent fail — never break navigation
  } finally {
    activeRequests.delete(route);
  }
}

// ── Main entry point ────────────────────────────────────────────────

/** 
 * Called on every route change. Records the pattern and triggers
 * predictive prefetching for the most likely next routes.
 */
export function onRouteChange(previousRoute: string | null, currentRoute: string, userId: string) {
  // 1. Record navigation pattern
  if (previousRoute) {
    recordNavigation(previousRoute, currentRoute);
  }

  // 2. Build prefetch list: context-based + learned patterns (deduplicated)
  const contextRoutes = CONTEXT_PREFETCH[currentRoute] || [];
  const learnedRoutes = getPredictedRoutes(currentRoute, 2);
  const allRoutes = [...new Set([...contextRoutes, ...learnedRoutes])];

  // 3. Separate by priority and limit concurrent prefetches
  const high = allRoutes.filter(r => HIGH_PRIORITY.has(r));
  const med = allRoutes.filter(r => MED_PRIORITY.has(r) && !HIGH_PRIORITY.has(r));
  const low = allRoutes.filter(r => !HIGH_PRIORITY.has(r) && !MED_PRIORITY.has(r));

  // Connection-aware: skip low priority on slow connections
  const conn = (navigator as any).connection;
  const isSlow = conn && (conn.saveData || conn.effectiveType === "2g" || conn.effectiveType === "slow-2g");
  const maxConcurrent = isSlow ? 1 : 3;

  const prefetchList = [...high, ...med, ...(isSlow ? [] : low)].slice(0, maxConcurrent);

  // 4. Schedule with idle callback for zero impact on current page
  const schedule = (fn: () => void) => {
    if ("requestIdleCallback" in window) {
      (window as any).requestIdleCallback(fn, { timeout: 3000 });
    } else {
      setTimeout(fn, 300);
    }
  };

  // Stagger prefetches to avoid burst
  prefetchList.forEach((route, i) => {
    schedule(() => {
      setTimeout(() => safePrefetch(route, userId), i * 200);
    });
  });
}

/** Reset learned patterns */
export function resetNavigationPatterns() {
  localStorage.removeItem(NAV_HISTORY_KEY);
}
