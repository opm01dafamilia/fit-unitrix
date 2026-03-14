import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { writeCache, readCache, CACHE_KEYS } from "@/lib/smartCache";

/**
 * Prefetches diet data in background.
 * Call from Dashboard so Dieta opens instantly.
 */
export function useDietPrefetch(userId: string | undefined) {
  const prefetched = useRef(false);

  useEffect(() => {
    if (!userId || prefetched.current) return;
    prefetched.current = true;

    const prefetch = async () => {
      try {
        // Only fetch if cache is stale
        const cachedPlans = readCache<any[]>(CACHE_KEYS.dietPlans(userId), { maxAge: 15 * 60 * 1000 });
        const cachedTracking = readCache<any[]>(CACHE_KEYS.dietTracking(userId), { maxAge: 10 * 60 * 1000 });

        const promises: Promise<void>[] = [];

        if (!cachedPlans) {
          promises.push(
            supabase
              .from("diet_plans")
              .select("*")
              .eq("user_id", userId)
              .order("created_at", { ascending: false })
              .limit(1)
              .then(({ data }) => {
                if (data) writeCache(CACHE_KEYS.dietPlans(userId), data);
              })
          );
        }

        if (!cachedTracking) {
          promises.push(
            supabase
              .from("diet_tracking")
              .select("*")
              .eq("user_id", userId)
              .order("tracked_date", { ascending: false })
              .limit(14)
              .then(({ data }) => {
                if (data) writeCache(CACHE_KEYS.dietTracking(userId), data);
              })
          );
        }

        await Promise.all(promises);
      } catch {
        // Silent fail - background optimization
      }
    };

    if ("requestIdleCallback" in window) {
      (window as any).requestIdleCallback(() => prefetch());
    } else {
      setTimeout(prefetch, 800);
    }
  }, [userId]);
}
