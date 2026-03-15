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
        const thirtyDaysAgo = format(subDays(now, 30), "yyyy-MM-dd");

        const [sessionsRes, dietRes, bodyRes, goalsRes] = await Promise.all([
          supabase.from("workout_sessions").select("*").eq("user_id", user.id).gte("completed_at", thirtyDaysAgo),
          supabase.from("diet_tracking").select("*").eq("user_id", user.id).gte("tracked_date", thirtyDaysAgo),
          supabase.from("body_tracking").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
          supabase.from("fitness_goals").select("*").eq("user_id", user.id).eq("status", "active"),
        ]);

        const sessions = sessionsRes.data || [];
        const dietDays = dietRes.data || [];
        const bodyEntries = bodyRes.data || [];
        const goals = goalsRes.data || [];

        // Calculate workout frequency (weekly avg over last 30 days)
        const uniqueDays = new Set(sessions.map(s => format(new Date(s.completed_at), "yyyy-MM-dd")));
        const weeklyFreq = Math.round((uniqueDays.size / 4.3) * 10) / 10;

        // Calculate streak
        const sortedDays = [...uniqueDays].sort().reverse();
        let streak = 0;
        const today = format(now, "yyyy-MM-dd");
        const yesterday = format(subDays(now, 1), "yyyy-MM-dd");
        if (sortedDays[0] === today || sortedDays[0] === yesterday) {
          for (let i = 0; i < sortedDays.length; i++) {
            const expected = format(subDays(now, i + (sortedDays[0] === today ? 0 : 1)), "yyyy-MM-dd");
            if (sortedDays[i] === expected) streak++;
            else break;
          }
        }

        // Diet adherence
        const dietAdherence = dietDays.length > 0
          ? Math.round(dietDays.reduce((a, d) => a + Number(d.adherence_pct || 0), 0) / dietDays.length)
          : 0;

        // Diet streak
        const dietDaysSorted = dietDays.filter(d => d.all_completed).map(d => d.tracked_date).sort().reverse();
        let dietStreak = 0;
        for (let i = 0; i < dietDaysSorted.length; i++) {
          const expected = format(subDays(now, i + 1), "yyyy-MM-dd");
          if (dietDaysSorted[i] === expected) dietStreak++;
          else break;
        }

        const input: FitnessScoreInput = {
          workoutFrequency: weeklyFreq,
          workoutStreak: streak,
          dietAdherence,
          dietStreak,
          bodyTrackingEntries: bodyEntries.length,
          goalsActive: goals.length,
          goalsCompleted: goals.filter(g => (g as any).status === "completed").length,
          communityEngagement: 0,
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
          <CommunityScoreCard
            userScore={scoreResult.score}
            userTier={scoreResult.tier}
            city={profile?.city || undefined}
            experienceLevel={profile?.experience_level || undefined}
          />
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
