import { useState, useEffect, useMemo } from "react";
import { Activity } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import FitnessScoreCard from "@/components/FitnessScoreCard";
import CommunityScoreCard from "@/components/CommunityScoreCard";
import { calculateFitnessScore, type FitnessScoreInput } from "@/lib/fitnessScoreEngine";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";

const ScoreFitness = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [scoreInput, setScoreInput] = useState<FitnessScoreInput | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const now = new Date();
        const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
        const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
        const sevenDaysAgo = format(subDays(now, 7), "yyyy-MM-dd");

        const [sessionsWeekRes, sessionsAllRes, dietWeekRes, bodyRes, goalsRes, challengesRes] = await Promise.all([
          supabase.from("workout_sessions").select("*").eq("user_id", user.id).gte("completed_at", weekStart).lte("completed_at", weekEnd + "T23:59:59"),
          supabase.from("workout_sessions").select("*").eq("user_id", user.id).order("completed_at", { ascending: false }),
          supabase.from("diet_tracking").select("*").eq("user_id", user.id).gte("tracked_date", weekStart).lte("tracked_date", weekEnd),
          supabase.from("body_tracking").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
          supabase.from("fitness_goals").select("*").eq("user_id", user.id).eq("status", "active"),
          supabase.from("user_challenge_progress").select("*").eq("user_id", user.id).eq("completed", true),
        ]);

        const sessionsWeek = sessionsWeekRes.data || [];
        const sessionsAll = sessionsAllRes.data || [];
        const dietWeek = dietWeekRes.data || [];
        const bodyEntries = bodyRes.data || [];
        const goals = goalsRes.data || [];
        const challenges = challengesRes.data || [];

        // Workout streak
        const uniqueDays = [...new Set(sessionsAll.map(s => format(new Date(s.completed_at), "yyyy-MM-dd")))].sort().reverse();
        let streak = 0;
        const today = format(now, "yyyy-MM-dd");
        const yesterday = format(subDays(now, 1), "yyyy-MM-dd");
        if (uniqueDays[0] === today || uniqueDays[0] === yesterday) {
          for (let i = 0; i < uniqueDays.length; i++) {
            const expected = format(subDays(now, i + (uniqueDays[0] === today ? 0 : 1)), "yyyy-MM-dd");
            if (uniqueDays[i] === expected) streak++;
            else break;
          }
        }

        // Weeks consecutively active
        let weeksActive = 0;
        for (let w = 0; w < 8; w++) {
          const ws = format(subDays(startOfWeek(now, { weekStartsOn: 1 }), w * 7), "yyyy-MM-dd");
          const we = format(subDays(endOfWeek(now, { weekStartsOn: 1 }), w * 7), "yyyy-MM-dd");
          const hasSession = sessionsAll.some(s => {
            const d = format(new Date(s.completed_at), "yyyy-MM-dd");
            return d >= ws && d <= we;
          });
          if (hasSession) weeksActive++;
          else break;
        }

        // Diet
        const mealsCompleted = dietWeek.reduce((a, d) => a + (d.meals_done || 0), 0);
        const mealsTotal = dietWeek.reduce((a, d) => a + (d.meals_total || 0), 0);
        const consecutiveFailures = dietWeek.filter(d => !d.all_completed).length;

        // Days active this week
        const daysActive = new Set(sessionsWeek.map(s => format(new Date(s.completed_at), "yyyy-MM-dd"))).size;

        // Body tracking
        const hasRecentBody = bodyEntries.length > 0 && 
          format(new Date(bodyEntries[0].created_at), "yyyy-MM-dd") >= sevenDaysAgo;

        const input: FitnessScoreInput = {
          workoutsThisWeek: sessionsWeek.length,
          targetWorkoutsPerWeek: 5,
          workoutStreak: streak,
          totalWorkouts: sessionsAll.length,
          mealsCompletedThisWeek: mealsCompleted,
          mealsTotalThisWeek: mealsTotal || 1,
          consecutiveDietFailures: consecutiveFailures,
          hasRecentBodyRecord: hasRecentBody,
          bodyProgressDirection: "unknown",
          activeGoalsCount: goals.length,
          goalsOnTrack: goals.filter(g => (Number(g.current_value) / Number(g.target_value)) >= 0.5).length,
          challengesCompletedThisWeek: challenges.length,
          invitesSent: 0,
          daysActiveThisWeek: daysActive,
          weeksConsecutivelyActive: weeksActive,
        };
        setScoreInput(input);
      } catch (e) {
        console.error("Error loading score data", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const scoreResult = useMemo(() => {
    if (!scoreInput) return null;
    return calculateFitnessScore(scoreInput);
  }, [scoreInput]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-secondary/60 rounded-lg" />
        <div className="h-64 bg-secondary/30 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10">
          <Activity className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">Score Fitness</h1>
          <p className="text-sm text-muted-foreground">Sua métrica de aderência e disciplina</p>
        </div>
      </div>

      {scoreResult && (
        <>
          <FitnessScoreCard result={scoreResult} />
          <CommunityScoreCard userScore={scoreResult.score} />
        </>
      )}

      {!scoreResult && (
        <div className="glass-card p-8 text-center">
          <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="font-semibold text-lg mb-2">Dados insuficientes</h3>
          <p className="text-sm text-muted-foreground">Complete treinos e acompanhe sua dieta para gerar seu Score Fitness.</p>
        </div>
      )}
    </div>
  );
};

export default ScoreFitness;
