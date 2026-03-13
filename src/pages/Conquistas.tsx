import { useState, useEffect, useMemo } from "react";
import { Trophy, Lock, Flame, TrendingUp, Dumbbell, ArrowLeft, Star, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ConquistasSkeleton } from "@/components/skeletons/SkeletonPremium";
import {
  calculateAchievements, calculateTotalXP, getRankForXP, getNextRank,
  getNextPhaseProgress, getCurrentPhase, getLegendaryAchievements,
  type Achievement,
  type UserStats,
  type AchievementPhase,
  categoryLabels,
  categoryIcons,
  tierLabels,
  XP_PER_TIER,
  phaseLabels,
} from "@/lib/achievementsEngine";
import { format, subDays } from "date-fns";
import { useNavigate } from "react-router-dom";

type WorkoutSession = {
  id: string;
  completed_at: string;
  exercises_completed: number;
};

const Conquistas = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [showLegendary, setShowLegendary] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      setLoading(true);

      const [sessionsRes, historyRes] = await Promise.all([
        supabase.from("workout_sessions").select("id, completed_at, exercises_completed")
          .eq("user_id", user.id).order("completed_at", { ascending: false }),
        supabase.from("exercise_history").select("exercise_name, weight, created_at")
          .eq("user_id", user.id).order("created_at", { ascending: false }).limit(300),
      ]);

      const sessions = (sessionsRes.data as WorkoutSession[]) || [];
      const history = historyRes.data || [];

      const uniqueDays = [...new Set(sessions.map(s => format(new Date(s.completed_at), "yyyy-MM-dd")))].sort().reverse();

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
        let tempStreak = 1;
        for (let i = 1; i < uniqueDays.length; i++) {
          const prev = new Date(uniqueDays[i - 1]);
          const curr = new Date(uniqueDays[i]);
          const diff = Math.round((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
          if (diff === 1) {
            tempStreak++;
            maxStreak = Math.max(maxStreak, tempStreak);
          } else {
            tempStreak = 1;
          }
        }
      }

      const exerciseWeights = new Map<string, number[]>();
      (history as any[]).forEach((h: any) => {
        if (!exerciseWeights.has(h.exercise_name)) exerciseWeights.set(h.exercise_name, []);
        exerciseWeights.get(h.exercise_name)!.push(h.weight);
      });
      let totalProgressions = 0;
      exerciseWeights.forEach((weights) => {
        if (weights.length >= 2) {
          const oldest = weights[weights.length - 1];
          const newest = weights[0];
          if (newest > oldest) totalProgressions++;
        }
      });

      const totalExercisesCompleted = sessions.reduce((a, s) => a + s.exercises_completed, 0);

      const dietRes = await supabase.from("diet_tracking").select("*")
        .eq("user_id", user.id).order("tracked_date", { ascending: false });
      const dietDays = (dietRes.data || []) as any[];
      const perfectDietDays = dietDays.filter(d => d.all_completed).length;

      let dietCurrentStreak = 0;
      const dietDates = dietDays.filter(d => d.all_completed).map(d => d.tracked_date).sort().reverse();
      if (dietDates.length > 0) {
        const todayStr = format(new Date(), "yyyy-MM-dd");
        const yesterdayStr = format(subDays(new Date(), 1), "yyyy-MM-dd");
        if (dietDates[0] === todayStr || dietDates[0] === yesterdayStr) {
          for (let i = 0; i < dietDates.length; i++) {
            const expected = format(subDays(new Date(), i + (dietDates[0] === todayStr ? 0 : 1)), "yyyy-MM-dd");
            if (dietDates[i] === expected) dietCurrentStreak++;
            else break;
          }
        }
      }
      let dietMaxStreak = dietCurrentStreak;
      if (dietDates.length > 1) {
        let ts = 1;
        for (let i = 1; i < dietDates.length; i++) {
          const diff = Math.round((new Date(dietDates[i-1]).getTime() - new Date(dietDates[i]).getTime()) / 86400000);
          if (diff === 1) { ts++; dietMaxStreak = Math.max(dietMaxStreak, ts); }
          else ts = 1;
        }
      }

      const weekAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");
      const weekDays = dietDays.filter(d => d.tracked_date >= weekAgo);
      const weeklyAdherence = weekDays.length > 0
        ? Math.round(weekDays.reduce((a: number, d: any) => a + (d.adherence_pct || 0), 0) / weekDays.length)
        : 0;

      setStats({
        totalWorkouts: sessions.length,
        currentStreak,
        maxStreak,
        totalProgressions,
        totalExercisesCompleted,
        daysActive: uniqueDays.length,
        dietStreak: dietCurrentStreak,
        dietMaxStreak,
        dietPerfectDays: perfectDietDays,
        dietWeeklyAdherence: weeklyAdherence,
      });
      setLoading(false);
    };
    fetchStats();
  }, [user]);

  const achievements = useMemo(() => {
    if (!stats) return [];
    return calculateAchievements(stats);
  }, [stats]);

  const legendaryAchievements = useMemo(() => {
    if (!stats) return [];
    return getLegendaryAchievements(stats);
  }, [stats]);

  const phaseProgress = useMemo(() => {
    if (!stats) return null;
    return getNextPhaseProgress(stats);
  }, [stats]);

  const currentPhase = useMemo(() => {
    if (!stats) return 1 as AchievementPhase;
    return getCurrentPhase(stats);
  }, [stats]);

  const filtered = useMemo(() => {
    if (filter === "all") return achievements;
    if (filter === "unlocked") return achievements.filter(a => a.unlocked);
    if (filter === "locked") return achievements.filter(a => !a.unlocked);
    return achievements.filter(a => a.category === filter);
  }, [achievements, filter]);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalXP = useMemo(() => stats ? calculateTotalXP(stats) : 0, [stats]);
  const currentRank = getRankForXP(totalXP);
  const nextRankInfo = getNextRank(totalXP);

  if (loading) return <ConquistasSkeleton />;

  const phaseInfo = phaseLabels[currentPhase];

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight">Conquistas</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {unlockedCount}/{achievements.length} desbloqueadas
          </p>
        </div>
      </div>

      {/* Phase indicator */}
      <div className="glass-card p-4 border border-primary/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center text-lg">
            {phaseInfo.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${phaseInfo.color}`}>Fase {currentPhase}: {phaseInfo.label}</span>
              {currentPhase > 1 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-chart-3/15 text-chart-3 font-bold animate-pulse">
                  DESBLOQUEADO
                </span>
              )}
            </div>
            {phaseProgress && phaseProgress.nextPhase && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {phaseProgress.unlocked}/{phaseProgress.total} para desbloquear Fase {phaseProgress.nextPhase}
              </p>
            )}
          </div>
        </div>
        {phaseProgress && phaseProgress.nextPhase && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground">
                Próxima fase: {phaseLabels[phaseProgress.nextPhase].icon} {phaseLabels[phaseProgress.nextPhase].label}
              </span>
              <span className="text-[10px] font-semibold text-primary">{phaseProgress.progress}% / 65%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden relative">
              {/* 65% threshold marker */}
              <div className="absolute top-0 bottom-0 w-px bg-foreground/30" style={{ left: "65%" }} />
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  phaseProgress.progress >= 65
                    ? "bg-gradient-to-r from-chart-3 to-primary"
                    : "bg-gradient-to-r from-primary/60 to-primary"
                }`}
                style={{ width: `${phaseProgress.progress}%` }}
              />
            </div>
          </div>
        )}
        {phaseProgress && !phaseProgress.nextPhase && (
          <p className="text-[10px] text-chart-3 font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Fase máxima atingida! Você é Elite!
          </p>
        )}
      </div>

      {/* Rank + XP Card */}
      <div className="glass-card p-4 lg:p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-chart-3/20 to-chart-3/5 flex items-center justify-center border border-chart-3/15">
          <span className="text-2xl">{currentRank.icon}</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold ${currentRank.color}`}>{currentRank.label}</span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-sm font-display font-bold">{totalXP} XP</span>
          </div>
          {nextRankInfo && (
            <div className="mt-1.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground">
                  {nextRankInfo.nextRank.icon} {nextRankInfo.nextRank.label} em {nextRankInfo.xpNeeded} XP
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-chart-2 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, ((totalXP - currentRank.minXP) / (nextRankInfo.nextRank.minXP - currentRank.minXP)) * 100)}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats summary */}
      {stats && (
        <div className="grid grid-cols-4 gap-3">
          <div className="glass-card p-3 flex flex-col items-center">
            <Star className="w-4 h-4 text-chart-3 mb-1" />
            <p className="font-display font-bold text-base">{totalXP}</p>
            <p className="text-[9px] text-muted-foreground">XP Total</p>
          </div>
          <div className="glass-card p-3 flex flex-col items-center">
            <Flame className="w-4 h-4 text-orange-400 mb-1" />
            <p className="font-display font-bold text-base">{stats.currentStreak}</p>
            <p className="text-[9px] text-muted-foreground">Sequência</p>
          </div>
          <div className="glass-card p-3 flex flex-col items-center">
            <Trophy className="w-4 h-4 text-primary mb-1" />
            <p className="font-display font-bold text-base">{stats.totalWorkouts}</p>
            <p className="text-[9px] text-muted-foreground">Treinos</p>
          </div>
          <div className="glass-card p-3 flex flex-col items-center">
            <TrendingUp className="w-4 h-4 text-chart-2 mb-1" />
            <p className="font-display font-bold text-base">{stats.totalProgressions}</p>
            <p className="text-[9px] text-muted-foreground">Progressões</p>
          </div>
        </div>
      )}

      {/* Legendary achievements section */}
      {legendaryAchievements.length > 0 && (
        <div>
          <button
            onClick={() => setShowLegendary(!showLegendary)}
            className="w-full glass-card p-3 flex items-center justify-between hover:bg-secondary/40 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">🏛️</span>
              <span className="text-sm font-bold">Conquistas Lendárias</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-chart-3/15 text-chart-3 font-bold">
                {legendaryAchievements.length}
              </span>
            </div>
            {showLegendary ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          {showLegendary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 animate-slide-up">
              {legendaryAchievements.map((a) => (
                <div key={a.id} className="glass-card p-3 border border-chart-3/20 bg-chart-3/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-chart-3/20 to-chart-3/5 flex items-center justify-center text-lg">
                      {a.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate">{a.title}</p>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-chart-3/15 text-chart-3 font-bold shrink-0">
                          +{a.xp} XP
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{a.description}</p>
                      <p className="text-[9px] text-chart-3 mt-0.5">
                        {phaseLabels[a.phase].icon} Fase {a.phase} • Completada ✓
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { key: "all", label: "Todas" },
          { key: "unlocked", label: "✅ Conquistadas" },
          { key: "locked", label: "🔒 Bloqueadas" },
          { key: "milestone", label: "🎯 Marcos" },
          { key: "streak", label: "🔥 Sequência" },
          { key: "progression", label: "📈 Progressão" },
          { key: "volume", label: "🏋️ Volume" },
          { key: "diet", label: "🍽️ Dieta" },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              filter === tab.key
                ? "bg-primary/10 text-primary border border-primary/20"
                : "bg-secondary/40 text-muted-foreground hover:bg-secondary/60 border border-transparent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Achievements grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <Lock className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma conquista nesta categoria ainda.</p>
        </div>
      )}
    </div>
  );
};

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const phaseInfo = phaseLabels[achievement.phase];

  return (
    <div className={`glass-card p-4 transition-all ${
      achievement.unlocked
        ? "border border-primary/20 shadow-[0_0_20px_-8px_hsl(152_69%_46%_/_0.15)]"
        : "opacity-60"
    }`}>
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-xl ${
          achievement.unlocked
            ? "bg-gradient-to-br from-primary/15 to-primary/5"
            : "bg-secondary/60"
        }`}>
          {achievement.unlocked ? achievement.icon : <Lock className="w-5 h-5 text-muted-foreground/50" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold truncate">{achievement.title}</p>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary/80 text-muted-foreground font-medium shrink-0">
              {categoryIcons[achievement.category]} {categoryLabels[achievement.category]}
            </span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
              achievement.unlocked ? "bg-chart-3/15 text-chart-3" : "bg-secondary/60 text-muted-foreground"
            }`}>
              +{achievement.xp} XP
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">{achievement.description}</p>
          {achievement.phase > 1 && (
            <p className={`text-[9px] mt-0.5 ${phaseInfo.color}`}>
              {phaseInfo.icon} Fase {achievement.phase}
            </p>
          )}

          {/* Progress bar */}
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground">
                {achievement.currentValue}/{achievement.requirement}
              </span>
              <span className="text-[10px] font-semibold text-primary">{achievement.progress}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  achievement.unlocked ? "bg-primary" : "bg-muted-foreground/30"
                }`}
                style={{ width: `${achievement.progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Conquistas;
