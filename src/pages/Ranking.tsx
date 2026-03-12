import { useState, useEffect, useMemo } from "react";
import {
  Trophy, Flame, Dumbbell, Target, Medal, Crown,
  TrendingUp, Zap, ChevronRight, Loader2, UtensilsCrossed
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { Progress } from "@/components/ui/progress";

type RankingEntry = {
  user_id: string;
  user_name: string;
  ranking_score: number;
  total_workouts: number;
  total_series: number;
  diet_streak: number;
  workout_streak: number;
  achievements_count: number;
};

type Challenge = {
  id: string;
  title: string;
  description: string;
  challenge_type: string;
  target_value: number;
  icon: string;
  progress?: number;
  completed?: boolean;
};

const Ranking = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"ranking" | "challenges">("ranking");
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userStats, setUserStats] = useState<RankingEntry | null>(null);

  // Fetch and compute user stats then upsert to ranking table
  const computeAndSaveStats = async () => {
    if (!user) return;
    try {
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
      const weekStartStr = format(weekStart, "yyyy-MM-dd");

      const [sessionsRes, historyRes, dietRes] = await Promise.all([
        supabase.from("workout_sessions").select("id,completed_at,exercises_completed").eq("user_id", user.id),
        supabase.from("exercise_history").select("id,created_at").eq("user_id", user.id),
        supabase.from("diet_tracking").select("tracked_date,all_completed,adherence_pct").eq("user_id", user.id).order("tracked_date", { ascending: false }),
      ]);

      const sessions = sessionsRes.data || [];
      const history = historyRes.data || [];
      const diet = dietRes.data || [];

      // Filter by period
      const periodStart = period === "weekly" ? weekStart : startOfMonth(new Date());
      const periodEnd = period === "weekly" ? weekEnd : endOfMonth(new Date());

      const periodSessions = sessions.filter(s => {
        const d = new Date(s.completed_at);
        return d >= periodStart && d <= periodEnd;
      });
      const periodSeries = history.filter(h => {
        const d = new Date(h.created_at);
        return d >= periodStart && d <= periodEnd;
      });

      // Diet streak
      let dietStreak = 0;
      for (const d of diet) {
        if (d.all_completed) dietStreak++;
        else break;
      }

      // Workout streak
      const uniqueDays = [...new Set(sessions.map(s => format(new Date(s.completed_at), "yyyy-MM-dd")))].sort().reverse();
      let workoutStreak = 0;
      const today = format(new Date(), "yyyy-MM-dd");
      const yesterday = format(new Date(Date.now() - 86400000), "yyyy-MM-dd");
      if (uniqueDays[0] === today || uniqueDays[0] === yesterday) {
        for (let i = 0; i < uniqueDays.length; i++) {
          const expected = format(new Date(Date.now() - i * 86400000 - (uniqueDays[0] === yesterday ? 86400000 : 0)), "yyyy-MM-dd");
          if (uniqueDays[i] === expected) workoutStreak++;
          else break;
        }
      }

      const score = periodSessions.length * 100 + periodSeries.length * 10 + dietStreak * 50 + workoutStreak * 30;

      const stats: RankingEntry = {
        user_id: user.id,
        user_name: profile?.full_name || "Usuário",
        total_workouts: periodSessions.length,
        total_series: periodSeries.length,
        diet_streak: dietStreak,
        workout_streak: workoutStreak,
        achievements_count: 0,
        ranking_score: score,
      };

      setUserStats(stats);

      // Upsert to ranking stats
      await supabase.from("user_ranking_stats").upsert({
        user_id: user.id,
        user_name: profile?.full_name || "Usuário",
        total_workouts: stats.total_workouts,
        total_series: stats.total_series,
        diet_streak: stats.diet_streak,
        workout_streak: stats.workout_streak,
        achievements_count: stats.achievements_count,
        ranking_score: stats.ranking_score,
        week_start: weekStartStr,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,week_start" });

      // Fetch all rankings
      const { data: rankData } = await supabase
        .from("user_ranking_stats")
        .select("*")
        .eq("week_start", weekStartStr)
        .order("ranking_score", { ascending: false })
        .limit(50);

      setRankings(rankData || []);
    } catch {
      // silent
    }
  };

  const fetchChallenges = async () => {
    if (!user) return;
    try {
      const { data: challengeData } = await supabase
        .from("weekly_challenges")
        .select("*")
        .order("created_at", { ascending: true });

      if (!challengeData) return;

      // Fetch user progress for these challenges
      const { data: progressData } = await supabase
        .from("user_challenge_progress")
        .select("*")
        .eq("user_id", user.id);

      const progressMap = new Map((progressData || []).map(p => [p.challenge_id, p]));

      const mapped: Challenge[] = challengeData.map(c => {
        const prog = progressMap.get(c.id);
        return {
          ...c,
          progress: prog ? prog.current_value : 0,
          completed: prog ? prog.completed : false,
        };
      });

      setChallenges(mapped);
    } catch { /* silent */ }
  };

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      await Promise.all([computeAndSaveStats(), fetchChallenges()]);
      setLoading(false);
    };
    load();
  }, [user, period]);

  const userRank = useMemo(() => {
    if (!user) return 0;
    const idx = rankings.findIndex(r => r.user_id === user.id);
    return idx >= 0 ? idx + 1 : 0;
  }, [rankings, user]);

  const getMedalIcon = (pos: number) => {
    if (pos === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (pos === 2) return <Medal className="w-5 h-5 text-gray-300" />;
    if (pos === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-xs font-bold text-muted-foreground w-5 text-center">{pos}</span>;
  };

  const handleJoinChallenge = async (challengeId: string) => {
    if (!user) return;
    try {
      await supabase.from("user_challenge_progress").upsert({
        user_id: user.id,
        challenge_id: challengeId,
        current_value: 0,
        completed: false,
      }, { onConflict: "user_id,challenge_id" });
      toast.success("Você entrou no desafio! 🎯");
      fetchChallenges();
    } catch {
      toast.error("Erro ao entrar no desafio");
    }
  };

  if (loading) {
    return (
      <div className="space-y-7 animate-slide-up">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-7 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight flex items-center gap-2">
          <Trophy className="w-7 h-7 text-yellow-500" />
          Ranking Fitness
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Compete, evolua e conquiste seu lugar no topo</p>
      </div>

      {/* Your Position Card */}
      {userStats && (
        <div className="glass-card p-5 lg:p-6 glow-border relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-yellow-500/8 to-transparent rounded-bl-full" />
          <div className="relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 flex items-center justify-center border border-yellow-500/15">
                <span className="text-2xl font-display font-bold text-yellow-400">#{userRank || '—'}</span>
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-lg">{profile?.full_name || "Você"}</h3>
                <p className="text-sm text-muted-foreground">{userStats.ranking_score} pontos</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3 mt-4">
              <div className="p-2.5 rounded-xl bg-secondary/40 border border-border/30 text-center">
                <Dumbbell className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
                <p className="text-sm font-display font-bold">{userStats.total_workouts}</p>
                <p className="text-[8px] text-muted-foreground">Treinos</p>
              </div>
              <div className="p-2.5 rounded-xl bg-secondary/40 border border-border/30 text-center">
                <Zap className="w-3.5 h-3.5 text-chart-2 mx-auto mb-1" />
                <p className="text-sm font-display font-bold">{userStats.total_series}</p>
                <p className="text-[8px] text-muted-foreground">Séries</p>
              </div>
              <div className="p-2.5 rounded-xl bg-secondary/40 border border-border/30 text-center">
                <Flame className="w-3.5 h-3.5 text-orange-400 mx-auto mb-1" />
                <p className="text-sm font-display font-bold">{userStats.diet_streak}</p>
                <p className="text-[8px] text-muted-foreground">Streak Dieta</p>
              </div>
              <div className="p-2.5 rounded-xl bg-secondary/40 border border-border/30 text-center">
                <Target className="w-3.5 h-3.5 text-chart-4 mx-auto mb-1" />
                <p className="text-sm font-display font-bold">{userStats.workout_streak}</p>
                <p className="text-[8px] text-muted-foreground">Streak Treino</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-secondary/50 w-fit">
        {([["ranking", "🏆 Ranking"], ["challenges", "⚡ Desafios"]] as [typeof tab, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 text-xs font-medium rounded-md transition-all ${tab === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "ranking" && (
        <>
          {/* Period toggle */}
          <div className="flex gap-1 p-1 rounded-lg bg-secondary/50 w-fit">
            {([["weekly", "Semanal"], ["monthly", "Mensal"]] as [typeof period, string][]).map(([key, label]) => (
              <button key={key} onClick={() => setPeriod(key)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-all ${period === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {label}
              </button>
            ))}
          </div>

          {/* Ranking List */}
          <div className="glass-card p-5 lg:p-6">
            <h3 className="font-display font-semibold text-base mb-4">
              Top {period === "weekly" ? "da Semana" : "do Mês"}
            </h3>
            {rankings.length > 0 ? (
              <div className="space-y-2">
                {rankings.map((entry, idx) => {
                  const isMe = entry.user_id === user?.id;
                  const pos = idx + 1;
                  return (
                    <div key={entry.user_id}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
                        isMe
                          ? "bg-primary/5 border-primary/15 shadow-[0_0_20px_-6px_hsl(152_69%_46%_/_0.15)]"
                          : pos <= 3
                          ? "bg-secondary/50 border-yellow-500/10"
                          : "bg-secondary/30 border-border/20"
                      }`}
                    >
                      <div className="w-8 flex justify-center">{getMedalIcon(pos)}</div>
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">
                          {entry.user_name?.charAt(0)?.toUpperCase() || "U"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isMe ? "text-primary" : ""}`}>
                          {entry.user_name}{isMe ? " (Você)" : ""}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {entry.total_workouts} treinos • {entry.diet_streak}🔥 dieta
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-display font-bold">{entry.ranking_score}</p>
                        <p className="text-[9px] text-muted-foreground">pts</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Trophy className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum participante ainda. Treine para aparecer!</p>
              </div>
            )}
          </div>
        </>
      )}

      {tab === "challenges" && (
        <div className="space-y-4">
          <h3 className="font-display font-semibold text-base">Desafios da Semana</h3>
          {challenges.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {challenges.map((ch) => {
                const pct = Math.min(100, Math.round(((ch.progress || 0) / ch.target_value) * 100));
                return (
                  <div key={ch.id} className={`glass-card p-5 relative overflow-hidden ${ch.completed ? "border-primary/20" : ""}`}>
                    {ch.completed && (
                      <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-primary/15 text-primary text-[10px] font-semibold">
                        ✅ Completo
                      </div>
                    )}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-chart-3/15 to-chart-3/5 flex items-center justify-center text-xl">
                        {ch.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-display font-semibold text-sm">{ch.title}</h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{ch.description}</p>
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] text-muted-foreground">Progresso</span>
                        <span className="text-[11px] font-semibold text-primary">{ch.progress || 0}/{ch.target_value}</span>
                      </div>
                      <div className="h-2.5 bg-secondary/60 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-chart-2 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    {(ch.progress === undefined || ch.progress === 0) && !ch.completed && (
                      <button
                        onClick={() => handleJoinChallenge(ch.id)}
                        className="w-full py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/15 transition-colors"
                      >
                        Participar do Desafio
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-card p-6 text-center">
              <Target className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum desafio disponível esta semana.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Ranking;
