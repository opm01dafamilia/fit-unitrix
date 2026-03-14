/**
 * Smart Cache - Stale-while-revalidate pattern for FitPulse
 * Shows cached data instantly, then syncs silently in background.
 */

const CACHE_PREFIX = "fitpulse_cache_";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version?: string;
}

interface CacheOptions {
  /** Max age in ms before data is considered stale (default: 10 min) */
  maxAge?: number;
  /** Version string - cache is invalidated if version changes */
  version?: string;
}

const DEFAULT_MAX_AGE = 10 * 60 * 1000; // 10 minutes

function getCacheKey(key: string): string {
  return `${CACHE_PREFIX}${key}`;
}

/** Read from cache. Returns null if expired or missing. */
export function readCache<T>(key: string, options?: CacheOptions): T | null {
  try {
    const raw = localStorage.getItem(getCacheKey(key));
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    
    // Version mismatch = invalidate
    if (options?.version && entry.version !== options.version) return null;
    
    const maxAge = options?.maxAge ?? DEFAULT_MAX_AGE;
    if (Date.now() - entry.timestamp > maxAge) return null;
    
    return entry.data;
  } catch {
    return null;
  }
}

/** Read from cache even if stale (for offline fallback). */
export function readCacheStale<T>(key: string): { data: T; stale: boolean } | null {
  try {
    const raw = localStorage.getItem(getCacheKey(key));
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    const stale = Date.now() - entry.timestamp > DEFAULT_MAX_AGE;
    return { data: entry.data, stale };
  } catch {
    return null;
  }
}

/** Write to cache. */
export function writeCache<T>(key: string, data: T, version?: string): void {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now(), version };
    localStorage.setItem(getCacheKey(key), JSON.stringify(entry));
  } catch {
    // Storage full - clear old caches
    clearOldCaches();
  }
}

/** Invalidate a specific cache key. */
export function invalidateCache(key: string): void {
  try {
    localStorage.removeItem(getCacheKey(key));
  } catch {}
}

/** Clear all FitPulse caches. */
export function clearAllCaches(): void {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
    keys.forEach(k => localStorage.removeItem(k));
  } catch {}
}

/** Clear oldest caches when storage is full. */
function clearOldCaches(): void {
  try {
    const entries: { key: string; timestamp: number }[] = [];
    for (const key of Object.keys(localStorage)) {
      if (!key.startsWith(CACHE_PREFIX)) continue;
      try {
        const parsed = JSON.parse(localStorage.getItem(key)!);
        entries.push({ key, timestamp: parsed.timestamp || 0 });
      } catch {}
    }
    // Remove oldest half
    entries.sort((a, b) => a.timestamp - b.timestamp);
    const toRemove = entries.slice(0, Math.ceil(entries.length / 2));
    toRemove.forEach(e => localStorage.removeItem(e.key));
  } catch {}
}

/**
 * Stale-while-revalidate fetch pattern.
 * Returns cached data immediately via onCached, then fetches fresh data via fetcher.
 * Returns the fresh data (or cached if fetch fails).
 */
export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: CacheOptions & { onCached?: (data: T) => void }
): Promise<T> {
  // 1. Try cache first
  const cached = readCache<T>(key, options);
  if (cached !== null && options?.onCached) {
    options.onCached(cached);
  }

  // 2. Fetch fresh data
  try {
    const fresh = await fetcher();
    writeCache(key, fresh, options?.version);
    return fresh;
  } catch (error) {
    // 3. On failure, try stale cache
    if (cached !== null) return cached;
    const stale = readCacheStale<T>(key);
    if (stale) return stale.data;
    throw error;
  }
}

// Cache keys used across the app
export const CACHE_KEYS = {
  workoutPlans: (userId: string) => `workout_plans_${userId}`,
  workoutSessions: (userId: string) => `workout_sessions_${userId}`,
  dietPlans: (userId: string) => `diet_plans_${userId}`,
  dietTracking: (userId: string) => `diet_tracking_${userId}`,
  bodyTracking: (userId: string) => `body_latest_${userId}`,
  fitnessGoals: (userId: string) => `fitness_goals_${userId}`,
  exerciseHistory: (userId: string) => `exercise_history_${userId}`,
  dashboardAll: (userId: string) => `dashboard_all_${userId}`,
  fitnessScore: (userId: string) => `fitness_score_${userId}`,
  rankingStats: (userId: string) => `ranking_stats_${userId}`,
} as const;
