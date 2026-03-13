import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { writeCache, readCache, CACHE_KEYS } from "@/lib/smartCache";
import { preloadWorkoutDayGifs } from "@/lib/exerciseGifs";
import { format } from "date-fns";

/**
 * Prefetches today's workout data + GIFs in background.
 * Call from Dashboard so Treino opens instantly.
 */
export function useWorkoutPrefetch(userId: string | undefined) {
  const prefetched = useRef(false);

  useEffect(() => {
    if (!userId || prefetched.current) return;
    prefetched.current = true;

    const prefetch = async () => {
      try {
        // 1. Fetch plans (skip if fresh cache exists)
        let plans = readCache<any[]>(CACHE_KEYS.workoutPlans(userId), { maxAge: 30 * 60 * 1000 });
        if (!plans) {
          const { data } = await supabase
            .from("workout_plans")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });
          if (data) {
            plans = data;
            writeCache(CACHE_KEYS.workoutPlans(userId), data);
          }
        }

        // 2. Fetch sessions (skip if fresh cache exists)
        let sessions = readCache<any[]>(CACHE_KEYS.workoutSessions(userId), { maxAge: 10 * 60 * 1000 });
        if (!sessions) {
          const { data } = await supabase
            .from("workout_sessions")
            .select("*")
            .eq("user_id", userId)
            .order("completed_at", { ascending: false });
          if (data) {
            sessions = data;
            writeCache(CACHE_KEYS.workoutSessions(userId), data);
          }
        }

        // 3. Determine today's workout and preload its GIFs
        if (!plans || plans.length === 0) return;
        const activePlan = plans[0];
        const planData = activePlan.plan_data as any[];
        if (!Array.isArray(planData) || planData.length === 0) return;

        // Find next day index
        const todayKey = format(new Date(), "yyyy-MM-dd");
        let nextDayIndex = 0;
        if (sessions && sessions.length > 0) {
          const todaySessions = sessions.filter(
            (s: any) =>
              s.workout_plan_id === activePlan.id &&
              format(new Date(s.completed_at), "yyyy-MM-dd") === todayKey
          );
          if (todaySessions.length > 0) {
            const lastDone = Math.max(...todaySessions.map((s: any) => s.day_index));
            nextDayIndex = Math.min(lastDone + 1, planData.length - 1);
          } else {
            const planSessions = sessions.filter((s: any) => s.workout_plan_id === activePlan.id);
            if (planSessions.length > 0) {
              nextDayIndex = (planSessions[0].day_index + 1) % planData.length;
            }
          }
        }

        const todayWorkout = planData[nextDayIndex];
        if (todayWorkout?.exercicios) {
          // Preload GIFs for today's exercises (non-blocking)
          preloadWorkoutDayGifs(
            todayWorkout.exercicios.map((ex: any) => ({ id: ex.id, nome: ex.nome }))
          );
        }
      } catch {
        // Silent fail - this is a background optimization
      }
    };

    // Use requestIdleCallback to avoid blocking initial render
    if ("requestIdleCallback" in window) {
      (window as any).requestIdleCallback(() => prefetch());
    } else {
      setTimeout(prefetch, 500);
    }
  }, [userId]);
}
