import { useState, useEffect, useMemo } from "react";
import {
  Trophy, Flame, Dumbbell, Target, Medal, Crown,
  TrendingUp, Zap, Loader2, Star, ChevronUp
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { RankingSkeleton } from "@/components/skeletons/SkeletonPremium";
import { toast } from "@/components/ui/sonner";
import { format, startOfWeek, endOfWeek, subDays } from "date-fns";
import { Progress } from "@/components/ui/progress";
import {
  calculateAchievements, calculateTotalXP, getRankForXP, getNextRank,
  RANK_THRESHOLDS, XP_PER_TIER, type UserStats
} from "@/lib/achievementsEngine";

type RankingEntry = {
  user_id: string;
  user_name: string;
  total_xp: number;
  weekly_xp: number;
  rank_tier: string;
  ranking_score: number;
  total_workouts: number;
  total_series: number;
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
  const [tab, setTab] = useState<"ranking" | "weekly" | "challenges">("ranking");
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [weeklyRankings, setWeeklyRankings] = useState<RankingEntry[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userXP, setUserXP] = useState(0);
  const [previousRank, setPreviousRank] = useState(0);

  const computeAndSaveStats = async () => {
    if (!user) return;
    try {
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekStartStr = format(weekStart, "yyyy-MM-dd");

      const [sessionsRes, historyRes, dietRes] = await Promise.all([
        supabase.from("workout_sessions").select("id,completed_at,exercises_completed").eq("user_id", user.id),
        supabase.from("exercise_history").select("exercise_name, weight, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("diet_tracking").select("tracked_date,all_completed,adherence_pct").eq("user_id", user.id).order("tracked_date", { ascending: false }),
      ]);

      const sessions = sessionsRes.data || [];
      const history = historyRes.data || [];
      const diet = dietRes.data || [];

      // Calculate stats for achievements
      const uniqueDays = [...new Set(sessions.map((s: any) => format(new Date(s.completed_at), "yyyy-MM-dd")))].sort().reverse();
      let currentStreak = 0;
      const today = format(new Date(), "yyyy-MM-dd");
      const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
      if (uniqueDays[0] === today || uniqueDays[0] === yesterday) {
        for (let i = 0; i < uniqueDays.length; i++) {
          const expected = format(subDays(new Date(), i + (uniqueDays[0] === today ? 0 : 1)), "yyyy-MM-dd");
          if (uniqueDays[i] === expected) currentStreak++;
          else break;
        }
      }
      let maxStreak = currentStreak;
      if (uniqueDays.length > 1) {
        let ts = 1;
        for (let i = 1; i < uniqueDays.length; i++) {
          const diff = Math.round((new Date(uniqueDays[i - 1]).getTime() - new Date(uniqueDays[i]).getTime()) / 86400000);
          if (diff === 1) { ts++; maxStreak = Math.max(maxStreak, ts); } else ts = 1;
        }
      }

      const exerciseWeights = new Map<string, number[]>();
      (history as any[]).forEach((h: any) => {
        if (!exerciseWeights.has(h.exercise_name)) exerciseWeights.set(h.exercise_name, []);
        exerciseWeights.get(h.exercise_name)!.push(h.weight);
      });
      let totalProgressions = 0;
      exerciseWeights.forEach((weights) => {
        if (weights.length >= 2 && weights[0] > weights[weights.length - 1]) totalProgressions++;
      });

      const totalExCompleted = sessions.reduce((a: number, s: any) => a + s.exercises_completed, 0);
      const perfectDietDays = diet.filter((d: any) => d.all_completed).length;
      const dietDates = diet.filter((d: any) => d.all_completed).map((d: any) => d.tracked_date).sort().reverse();
      let dietMaxStreak = 0;
      if (dietDates.length > 0) {
        let ds = 1;
        dietMaxStreak = 1;
        for (let i = 1; i < dietDates.length; i++) {
          const diff = Math.round((new Date(dietDates[i - 1]).getTime() - new Date(dietDates[i]).getTime()) / 86400000);
          if (diff === 1) { ds++; dietMaxStreak = Math.max(dietMaxStreak, ds); } else ds = 1;
        }
      }
      const weekAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");
      const weekDietDays = diet.filter((d: any) => d.tracked_date >= weekAgo);
      const weeklyAdherence = weekDietDays.length > 0
        ? Math.round(weekDietDays.reduce((a: number, d: any) => a + (d.adherence_pct || 0), 0) / weekDietDays.length) : 0;

      const stats: UserStats = {
        totalWorkouts: sessions.length, currentStreak, maxStreak, totalProgressions,
        totalExercisesCompleted: totalExCompleted, daysActive: uniqueDays.length,
        dietStreak: 0, dietMaxStreak, dietPerfectDays: perfectDietDays, dietWeeklyAdherence: weeklyAdherence,
      };

      const totalXP = calculateTotalXP(stats);
      setUserXP(totalXP);
      const rank = getRankForXP(totalXP);
      const achievements = calculateAchievements(stats);
      const unlockedCount = achievements.filter(a => a.unlocked).length;

      // Weekly XP: only achievements unlocked this week (simplified: use total for now)
      const weekSessions = sessions.filter((s: any) => new Date(s.completed_at) >= weekStart);
      const weeklyXP = weekSessions.length * 10 + totalProgressions * 5; // activity-based weekly

      // Weekly ranking score (existing formula)
      const periodSeries = (history as any[]).filter((h: any) => new Date(h.created_at) >= weekStart);
      const score = weekSessions.length * 100 + periodSeries.length * 10 + currentStreak * 30;

      await supabase.from("user_ranking_stats").upsert({
        user_id: user.id,
        user_name: profile?.full_name || "Usuário",
        total_workouts: weekSessions.length,
        total_series: periodSeries.length,
        diet_streak: 0,
        workout_streak: currentStreak,
        achievements_count: unlockedCount,
        ranking_score: score,
        total_xp: totalXP,
        weekly_xp: weeklyXP,
        rank_tier: rank.tier,
        week_start: weekStartStr,
        updated_at: new Date().toISOString(),
      } as any, { onConflict: "user_id,week_start" });

      // Fetch all rankings (global by XP)
      const { data: globalData } = await supabase
        .from("user_ranking_stats")
        .select("*")
        .order("total_xp" as any, { ascending: false })
        .limit(100);

      // Deduplicate by user_id (keep highest XP)
      const seenUsers = new Set<string>();
      const dedupedGlobal: any[] = [];
      (globalData || []).forEach((r: any) => {
        if (!seenUsers.has(r.user_id)) {
          seenUsers.add(r.user_id);
          dedupedGlobal.push(r);
        }
      });
      setRankings(dedupedGlobal);

      // Fetch weekly rankings
      const { data: weekData } = await supabase
        .from("user_ranking_stats")
        .select("*")
        .eq("week_start", weekStartStr)
        .order("weekly_xp" as any, { ascending: false })
        .limit(100);
      setWeeklyRankings(weekData || []);

      // Check position change
      const myGlobalPos = dedupedGlobal.findIndex((r: any) => r.user_id === user.id) + 1;
      if (previousRank > 0 && myGlobalPos > 0 && myGlobalPos < previousRank) {
        toast.success(`🎉 Você subiu ${previousRank - myGlobalPos} posições no ranking!`, { duration: 4000 });
      }
      setPreviousRank(myGlobalPos);
    } catch {
      // silent
    }
  };

  const fetchChallenges = async () => {
    if (!user) return;
    try {
      const { data: challengeData } = await supabase.from("weekly_challenges").select("*").order("created_at", { ascending: true });
      if (!challengeData) return;
      const { data: progressData } = await supabase.from("user_challenge_progress").select("*").eq("user_id", user.id);
      const progressMap = new Map((progressData || []).map(p => [p.challenge_id, p]));
      setChallenges(challengeData.map(c => {
        const prog = progressMap.get(c.id);
        return { ...c, progress: prog ? prog.current_value : 0, completed: prog ? prog.completed : false };
      }));
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
  }, [user]);

  const userGlobalRank = useMemo(() => {
    if (!user) return 0;
    const idx = rankings.findIndex((r: any) => r.user_id === user.id);
    return idx >= 0 ? idx + 1 : 0;
  }, [rankings, user]);

  const userWeeklyRank = useMemo(() => {
    if (!user) return 0;
    const idx = weeklyRankings.findIndex((r: any) => r.user_id === user.id);
    return idx >= 0 ? idx + 1 : 0;
  }, [weeklyRankings, user]);

  const currentRank = getRankForXP(userXP);
  const nextRankInfo = getNextRank(userXP);

  const getMedalIcon = (pos: number) => {
    if (pos === 1) return <Crown className="w-5 h-5 text-chart-3" />;
    if (pos === 2) return <Medal className="w-5 h-5 text-muted-foreground" />;
    if (pos === 3) return <Medal className="w-5 h-5 text-chart-4" />;
    return <span className="text-xs font-bold text-muted-foreground w-5 text-center">{pos}</span>;
  };

  const handleJoinChallenge = async (challengeId: string) => {
    if (!user) return;
    try {
      await supabase.from("user_challenge_progress").upsert({
        user_id: user.id, challenge_id: challengeId, current_value: 0, completed: false,
      }, { onConflict: "user_id,challenge_id" });
      toast.success("Você entrou no desafio! 🎯");
      fetchChallenges();
    } catch { toast.error("Erro ao entrar no desafio"); }
  };

  const renderRankingList = (data: RankingEntry[], xpField: "total_xp" | "weekly_xp", title: string) => (
    <div className="glass-card p-5 lg:p-6">
      <h3 className="font-display font-semibold text-base mb-4">{title}</h3>
      {data.length > 0 ? (
        <div className="space-y-2">
          {data.map((entry: any, idx: number) => {
            const isMe = entry.user_id === user?.id;
            const pos = idx + 1;
            const entryRank = getRankForXP(entry.total_xp || 0);
            return (
              <div key={`${entry.user_id}-${idx}`}
                className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
                  isMe
                    ? "bg-primary/5 border-primary/15 shadow-[0_0_20px_-6px_hsl(var(--primary)/0.15)]"
                    : pos <= 3
                    ? "bg-secondary/50 border-yellow-500/10"
                    : "bg-secondary/30 border-border/20"
                }`}>
                <div className="w-8 flex justify-center">{getMedalIcon(pos)}</div>
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">
                    {entry.user_name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium truncate ${isMe ? "text-primary" : ""}`}>
                      {entry.user_name}{isMe ? " (Você)" : ""}
                    </p>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold ${entryRank.color} bg-secondary/60 border border-border/30`}>
                      {entryRank.icon} {entryRank.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {entry.achievements_count || 0} conquistas
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-display font-bold">{entry[xpField] || 0}</p>
                  <p className="text-[9px] text-muted-foreground">XP</p>
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
  );

  if (loading) return <RankingSkeleton />;

  return (
    <div className="space-y-7 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight flex items-center gap-2">
          <Trophy className="w-7 h-7 text-chart-3" />
          Ranking Fitness
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Compete, evolua e conquiste seu lugar no topo</p>
      </div>

      {/* Your Rank Card */}
      <div className="glass-card p-5 lg:p-6 glow-border relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-chart-3/8 to-transparent rounded-bl-full" />
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-chart-3/20 to-chart-3/5 flex items-center justify-center border border-chart-3/15">
              <span className="text-3xl">{currentRank.icon}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-lg">{profile?.full_name || "Você"}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-md font-bold ${currentRank.color} bg-secondary/60 border border-border/30`}>
                  {currentRank.label}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{userXP} XP Total</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-display font-bold text-chart-3">#{userGlobalRank || '—'}</p>
              <p className="text-[10px] text-muted-foreground">Global</p>
            </div>
          </div>

          {/* XP Progress to next rank */}
          {nextRankInfo && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-muted-foreground">
                  Próximo rank: {nextRankInfo.nextRank.icon} {nextRankInfo.nextRank.label}
                </span>
                <span className="text-[11px] font-bold text-primary">
                  {nextRankInfo.xpNeeded} XP restantes
                </span>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-chart-2 rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, ((userXP - currentRank.minXP) / (nextRankInfo.nextRank.minXP - currentRank.minXP)) * 100)}%`
                  }}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="p-2.5 rounded-xl bg-secondary/40 border border-border/30 text-center">
              <Star className="w-3.5 h-3.5 text-chart-3 mx-auto mb-1" />
              <p className="text-sm font-display font-bold">{userXP}</p>
              <p className="text-[8px] text-muted-foreground">XP Total</p>
            </div>
            <div className="p-2.5 rounded-xl bg-secondary/40 border border-border/30 text-center">
              <TrendingUp className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
              <p className="text-sm font-display font-bold">#{userGlobalRank || '—'}</p>
              <p className="text-[8px] text-muted-foreground">Posição</p>
            </div>
            <div className="p-2.5 rounded-xl bg-secondary/40 border border-border/30 text-center">
              <Zap className="w-3.5 h-3.5 text-chart-2 mx-auto mb-1" />
              <p className="text-sm font-display font-bold">#{userWeeklyRank || '—'}</p>
              <p className="text-[8px] text-muted-foreground">Semanal</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rank Tiers Info */}
      <div className="glass-card p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Ranks</h3>
        <div className="grid grid-cols-4 gap-2">
          {RANK_THRESHOLDS.slice().reverse().map(r => (
            <div key={r.tier} className={`p-2.5 rounded-xl text-center border ${
              currentRank.tier === r.tier ? "border-primary/30 bg-primary/5" : "border-border/20 bg-secondary/20"
            }`}>
              <span className="text-xl">{r.icon}</span>
              <p className={`text-[10px] font-bold mt-1 ${r.color}`}>{r.label}</p>
              <p className="text-[8px] text-muted-foreground">{r.minXP}+ XP</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-secondary/50 w-fit">
        {([["ranking", "🏆 Global"], ["weekly", "📅 Semanal"], ["challenges", "⚡ Desafios"]] as [typeof tab, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 text-xs font-medium rounded-md transition-all ${tab === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "ranking" && renderRankingList(rankings, "total_xp", "Top 100 — Ranking Global")}
      {tab === "weekly" && renderRankingList(weeklyRankings, "weekly_xp", "Ranking da Semana")}

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
                        <div className="h-full rounded-full bg-gradient-to-r from-primary to-chart-2 transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    {(ch.progress === undefined || ch.progress === 0) && !ch.completed && (
                      <button onClick={() => handleJoinChallenge(ch.id)}
                        className="w-full py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/15 transition-colors">
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
