/**
 * useOfflineData - Hook that reads cache-first and fetches in background.
 * Perfect for offline-capable pages.
 */

import { useState, useEffect, useCallback } from "react";
import { readCacheStale, writeCache, readCache } from "@/lib/smartCache";

interface UseOfflineDataOptions<T> {
  cacheKey: string;
  fetcher: () => Promise<T>;
  /** Max age in ms (default 10 min) */
  maxAge?: number;
  enabled?: boolean;
}

interface UseOfflineDataResult<T> {
  data: T | null;
  loading: boolean;
  isStale: boolean;
  isOffline: boolean;
  refetch: () => Promise<void>;
}

export function useOfflineData<T>({
  cacheKey,
  fetcher,
  maxAge = 10 * 60 * 1000,
  enabled = true,
}: UseOfflineDataOptions<T>): UseOfflineDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const on = () => setIsOffline(false);
    const off = () => setIsOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    // 1. Hydrate from cache immediately
    const cached = readCacheStale<T>(cacheKey);
    if (cached) {
      setData(cached.data);
      setIsStale(cached.stale);
      setLoading(false);
    }

    // 2. If online, fetch fresh data
    if (navigator.onLine) {
      try {
        const fresh = await fetcher();
        setData(fresh);
        setIsStale(false);
        writeCache(cacheKey, fresh);
      } catch {
        // Keep cached data on failure
        if (!cached) setLoading(false);
      }
    }

    setLoading(false);
  }, [cacheKey, fetcher, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Re-fetch when coming back online
  useEffect(() => {
    if (!isOffline && enabled) {
      fetchData();
    }
  }, [isOffline]);

  return { data, loading, isStale, isOffline, refetch: fetchData };
}
