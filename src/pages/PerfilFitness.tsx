import { useState, useEffect, useMemo } from "react";
import { User, Flame, Trophy, TrendingUp, Star, ArrowLeft, Dumbbell, UtensilsCrossed, Target, Sparkles, Crown, Users, Medal, ChevronRight, BookOpen, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PerfilFitnessSkeleton } from "@/components/skeletons/SkeletonPremium";
import {
  calculateAchievements, calculateTotalXP, getRankForXP, getNextRank,
  getCurrentPhase, getLegendaryAchievements, getNextPhaseProgress,
  type UserStats, phaseLabels,
} from "@/lib/achievementsEngine";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";
import { useNavigate } from "react-router-dom";
import { getFitnessLevel, getNextLevel, getStatusTitle } from "@/lib/fitnessLevelEngine";
import AuraAvatar from "@/components/AuraAvatar";
import FitnessProgressBar from "@/components/FitnessProgressBar";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const motivationalFeedback = (pct: number): { emoji: string; text: string } => {
  if (pct >= 90) return { emoji: "🔥", text: "Consistência excelente! Você é imparável!" };
  if (pct >= 70) return { emoji: "💪", text: "Você está evoluindo! Continue nesse ritmo!" };
  if (pct >= 50) return { emoji: "⚡", text: "Bom progresso! Mantenha o foco!" };
  if (pct >= 30) return { emoji: "🌱", text: "Cada passo conta. Continue avançando!" };
  return { emoji: "🎯", text: "O começo é o mais difícil. Você já está aqui!" };
};

const iconMapHub: Record<string, any> = {
  Trophy, Crown, Users, Target, Flame, Medal, BookOpen, Activity,
};

// Import modular routes from centralized config
import { MODULAR_ROUTES } from "@/lib/menuPreferences";

const socialHubItems = MODULAR_ROUTES.map(r => ({
  ...r,
  icon: iconMapHub[r.icon] || Target,
}));

const PerfilFitness = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [rankingPosition, setRankingPosition] = useState<number | null>(null);
  const [weeklyWorkouts, setWeeklyWorkouts] = useState(0);
  const [weeklyGoal, setWeeklyGoal] = useState(5);
  const [weeklyMealsDone, setWeeklyMealsDone] = useState(0);
  const [weeklyMealsTotal, setWeeklyMealsTotal] = useState(0);
  const [weightData, setWeightData] = useState<{ date: string; weight: number }[]>([]);
  const [goalWeight, setGoalWeight] = useState<number | null>(null);
  const [lastAchievement, setLastAchievement] = useState<{ title: string; icon: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);

      const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
      const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

      const [sessionsRes, historyRes, dietRes, bodyRes, rankRes, goalsRes, planRes] = await Promise.all([
        supabase.from("workout_sessions").select("id, completed_at, exercises_completed")
          .eq("user_id", user.id).order("completed_at", { ascending: false }),
        supabase.from("exercise_history").select("exercise_name, weight, created_at")
          .eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("diet_tracking").select("*")
          .eq("user_id", user.id).order("tracked_date", { ascending: false }),
        supabase.from("body_tracking").select("weight, created_at")
          .eq("user_id", user.id).order("created_at", { ascending: true }),
        supabase.from("user_ranking_stats").select("user_id, total_xp")
          .order("total_xp", { ascending: false }).limit(100),
        supabase.from("fitness_goals").select("target_value, goal_type")
          .eq("user_id", user.id).eq("status", "active").limit(1),
        supabase.from("workout_plans").select("days_per_week")
          .eq("user_id", user.id).order("created_at", { ascending: false }).limit(1),
      ]);

      const sessions = sessionsRes.data || [];
      const history = historyRes.data || [];
      const dietDays = dietRes.data || [];
      const bodyEntries = bodyRes.data || [];

      if (planRes.data?.[0]) setWeeklyGoal(planRes.data[0].days_per_week);

      if (goalsRes.data?.[0]?.goal_type === "weight") {
        setGoalWeight(Number(goalsRes.data[0].target_value));
      }

      const wData = bodyEntries.map((b: any) => ({
        date: format(new Date(b.created_at), "dd/MM"),
        weight: Number(b.weight),
      }));
      if (profile?.weight && wData.length === 0) {
        wData.push({ date: "Início", weight: Number(profile.weight) });
      }
      setWeightData(wData);

      const weekSessions = sessions.filter((s: any) => {
        const d = format(new Date(s.completed_at), "yyyy-MM-dd");
        return d >= weekStart && d <= weekEnd;
      });
      setWeeklyWorkouts(weekSessions.length);

      const weekDiet = (dietDays as any[]).filter(d => d.tracked_date >= weekStart && d.tracked_date <= weekEnd);
      setWeeklyMealsDone(weekDiet.reduce((a: number, d: any) => a + (d.meals_done || 0), 0));
      setWeeklyMealsTotal(weekDiet.reduce((a: number, d: any) => a + (d.meals_total || 0), 0));

      const rankings = rankRes.data || [];
      const pos = rankings.findIndex((r: any) => r.user_id === user.id);
      setRankingPosition(pos >= 0 ? pos + 1 : null);

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
          const prev = new Date(uniqueDays[i - 1]);
          const curr = new Date(uniqueDays[i]);
          const diff = Math.round((prev.getTime() - curr.getTime()) / 86400000);
          if (diff === 1) { ts++; maxStreak = Math.max(maxStreak, ts); } else ts = 1;
        }
      }

      const exerciseWeights = new Map<string, number[]>();
      (history as any[]).forEach((h: any) => {
        if (!exerciseWeights.has(h.exercise_name)) exerciseWeights.set(h.exercise_name, []);
        exerciseWeights.get(h.exercise_name)!.push(h.weight);
      });
      let totalProgressions = 0;
      exerciseWeights.forEach(w => { if (w.length >= 2 && w[0] > w[w.length - 1]) totalProgressions++; });

      const totalExercisesCompleted = sessions.reduce((a: number, s: any) => a + s.exercises_completed, 0);

      const dietDates = (dietDays as any[]).filter(d => d.all_completed).map(d => d.tracked_date).sort().reverse();
      let dietCurrentStreak = 0;
      if (dietDates.length > 0 && (dietDates[0] === today || dietDates[0] === yesterday)) {
        for (let i = 0; i < dietDates.length; i++) {
          const expected = format(subDays(new Date(), i + (dietDates[0] === today ? 0 : 1)), "yyyy-MM-dd");
          if (dietDates[i] === expected) dietCurrentStreak++; else break;
        }
      }
      let dietMaxStreak = dietCurrentStreak;
      if (dietDates.length > 1) {
        let ts = 1;
        for (let i = 1; i < dietDates.length; i++) {
          const diff = Math.round((new Date(dietDates[i-1]).getTime() - new Date(dietDates[i]).getTime()) / 86400000);
          if (diff === 1) { ts++; dietMaxStreak = Math.max(dietMaxStreak, ts); } else ts = 1;
        }
      }

      const weekAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");
      const recentDiet = (dietDays as any[]).filter(d => d.tracked_date >= weekAgo);
      const weeklyAdherence = recentDiet.length > 0
        ? Math.round(recentDiet.reduce((a: number, d: any) => a + (d.adherence_pct || 0), 0) / recentDiet.length)
        : 0;

      const perfectDietDays = (dietDays as any[]).filter(d => d.all_completed).length;

      const computedStats: UserStats = {
        totalWorkouts: sessions.length,
        currentStreak, maxStreak, totalProgressions, totalExercisesCompleted,
        daysActive: uniqueDays.length,
        dietStreak: dietCurrentStreak, dietMaxStreak,
        dietPerfectDays: perfectDietDays, dietWeeklyAdherence: weeklyAdherence,
      };
      setStats(computedStats);

      const achs = calculateAchievements(computedStats).filter(a => a.unlocked);
      if (achs.length > 0) {
        const last = achs[achs.length - 1];
        setLastAchievement({ title: last.title, icon: last.icon });
      }

      setLoading(false);
    };
    fetch();
  }, [user, profile]);

  const totalXP = useMemo(() => stats ? calculateTotalXP(stats) : 0, [stats]);
  const rank = getRankForXP(totalXP);
  const nextRankInfo = getNextRank(totalXP);
  const achievements = useMemo(() => stats ? calculateAchievements(stats) : [], [stats]);
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const legendaryCount = useMemo(() => stats ? getLegendaryAchievements(stats).length : 0, [stats]);
  const phase = useMemo(() => stats ? getCurrentPhase(stats) : 1, [stats]);
  const phaseInfo = phaseLabels[phase as 1 | 2 | 3 | 4];
  const fitnessLevel = getFitnessLevel(totalXP);
  const statusTitle = useMemo(() => getStatusTitle({
    streak: stats?.currentStreak || 0,
    totalWorkouts: stats?.totalWorkouts || 0,
    goalsCompleted: 0,
    totalXP,
    dietStreak: stats?.dietStreak || 0,
  }), [stats, totalXP]);

  const dietAdherence = weeklyMealsTotal > 0 ? Math.round((weeklyMealsDone / weeklyMealsTotal) * 100) : 0;
  const weeklyPct = Math.round((weeklyWorkouts / weeklyGoal) * 100);
  const overallPct = Math.round((weeklyPct + dietAdherence) / 2);
  const feedback = motivationalFeedback(overallPct);

  const initialWeight = weightData.length > 0 ? weightData[0].weight : (profile?.weight || 0);
  const currentWeight = weightData.length > 0 ? weightData[weightData.length - 1].weight : (profile?.weight || 0);
  const weightProgress = goalWeight && initialWeight !== goalWeight
    ? Math.min(100, Math.max(0, Math.round(Math.abs(initialWeight - currentWeight) / Math.abs(initialWeight - goalWeight) * 100)))
    : 0;

  if (loading) return <PerfilFitnessSkeleton />;

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight">Perfil Fitness</h1>
      </div>

      {/* Premium Hero Card */}
      <div className="glass-card p-6 lg:p-8 relative overflow-hidden">
        {/* Decorative background with level aura */}
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ background: fitnessLevel.auraGradient }} />
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: `radial-gradient(circle, hsl(${fitnessLevel.auraColor}), transparent)` }} />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Aura Avatar */}
          <AuraAvatar avatarUrl={profile?.avatar_url} totalXP={totalXP} size="lg" />

          <div className="flex-1 min-w-0 text-center sm:text-left">
            <h2 className="text-xl font-display font-bold truncate">{profile?.full_name || "Usuário"}</h2>
            
            {/* Status Title */}
            <p className="text-sm font-medium mt-0.5" style={{ color: `hsl(${fitnessLevel.auraColor})` }}>
              {statusTitle.emoji} {statusTitle.title}
            </p>

            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap mt-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-md" 
                style={{ 
                  color: `hsl(${fitnessLevel.auraColor})`,
                  background: `hsl(${fitnessLevel.auraColor} / 0.1)`,
                  border: `1px solid hsl(${fitnessLevel.auraColor} / 0.2)`,
                }}>
                Nv. {fitnessLevel.level} — {fitnessLevel.title}
              </span>
              <span className={`text-xs font-bold ${rank.color}`}>{rank.icon} {rank.label}</span>
              <span className="text-xs font-display font-bold text-muted-foreground">{totalXP} XP</span>
              {rankingPosition && (
                <span className="text-[11px] font-medium text-muted-foreground">#{rankingPosition}</span>
              )}
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-1.5">
              <span className={`text-[11px] px-2 py-0.5 rounded-md ${phaseInfo.color} bg-secondary/60 font-semibold`}>
                {phaseInfo.icon} Fase {phase}: {phaseInfo.label}
              </span>
              {lastAchievement && (
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-chart-3/10 text-chart-3 font-medium">
                  {lastAchievement.icon} {lastAchievement.title}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fitness Level Progress Bar */}
      <FitnessProgressBar totalXP={totalXP} />

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="glass-card p-3 flex flex-col items-center">
          <Star className="w-4 h-4 text-chart-3 mb-1" />
          <p className="font-display font-bold text-base">{totalXP}</p>
          <p className="text-[9px] text-muted-foreground">XP Total</p>
        </div>
        <div className="glass-card p-3 flex flex-col items-center">
          <Flame className="w-4 h-4 text-orange-400 mb-1" />
          <p className="font-display font-bold text-base">{stats?.currentStreak || 0}</p>
          <p className="text-[9px] text-muted-foreground">Sequência</p>
        </div>
        <div className="glass-card p-3 flex flex-col items-center">
          <Dumbbell className="w-4 h-4 text-primary mb-1" />
          <p className="font-display font-bold text-base">{stats?.totalWorkouts || 0}</p>
          <p className="text-[9px] text-muted-foreground">Treinos</p>
        </div>
        <div className="glass-card p-3 flex flex-col items-center">
          <TrendingUp className="w-4 h-4 text-chart-2 mb-1" />
          <p className="font-display font-bold text-base">{stats?.totalProgressions || 0}</p>
          <p className="text-[9px] text-muted-foreground">Progressões</p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* MINHA JORNADA FITNESS — Social Hub */}
      {/* ═══════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-base font-display font-bold">Minha Jornada Fitness</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {socialHubItems.map((item) => (
            <button
              key={item.to}
              onClick={() => navigate(item.to)}
              className={`glass-card p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98] border ${item.borderColor} group`}
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-3 border ${item.borderColor}`}>
                <item.icon className={`w-5 h-5 ${item.iconColor}`} />
              </div>
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{item.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0 ml-2" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Motivational feedback */}
      <div className="glass-card p-4 border border-primary/10 flex items-center gap-3">
        <span className="text-2xl">{feedback.emoji}</span>
        <p className="text-sm font-medium">{feedback.text}</p>
      </div>

      {/* Consistency Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Workout consistency */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Dumbbell className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold">Consistência de Treino</h3>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Semana: {weeklyWorkouts}/{weeklyGoal}</span>
                <span className="text-xs font-bold text-primary">{Math.min(100, weeklyPct)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${Math.min(100, weeklyPct)}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 rounded-lg bg-secondary/40 text-center">
                <p className="text-lg font-display font-bold">{stats?.currentStreak || 0}</p>
                <p className="text-[9px] text-muted-foreground">🔥 Streak Atual</p>
              </div>
              <div className="p-2.5 rounded-lg bg-secondary/40 text-center">
                <p className="text-lg font-display font-bold">{stats?.maxStreak || 0}</p>
                <p className="text-[9px] text-muted-foreground">⭐ Melhor Streak</p>
              </div>
            </div>
          </div>
        </div>

        {/* Diet consistency */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <UtensilsCrossed className="w-4 h-4 text-chart-3" />
            <h3 className="text-sm font-bold">Consistência Alimentar</h3>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Refeições: {weeklyMealsDone}/{weeklyMealsTotal || "—"}</span>
                <span className="text-xs font-bold text-chart-3">{dietAdherence}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-chart-3 rounded-full transition-all duration-500" style={{ width: `${dietAdherence}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 rounded-lg bg-secondary/40 text-center">
                <p className="text-lg font-display font-bold">{stats?.dietStreak || 0}</p>
                <p className="text-[9px] text-muted-foreground">🥗 Streak Dieta</p>
              </div>
              <div className="p-2.5 rounded-lg bg-secondary/40 text-center">
                <p className="text-lg font-display font-bold">{stats?.dietPerfectDays || 0}</p>
                <p className="text-[9px] text-muted-foreground">💯 Dias Perfeitos</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body evolution */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-chart-2" />
          <h3 className="text-sm font-bold">Evolução Corporal</h3>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-secondary/40 text-center">
            <p className="text-[9px] text-muted-foreground mb-0.5">Peso Inicial</p>
            <p className="text-sm font-display font-bold">{initialWeight ? `${initialWeight} kg` : "—"}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-secondary/40 text-center">
            <p className="text-[9px] text-muted-foreground mb-0.5">Peso Atual</p>
            <p className="text-sm font-display font-bold">{currentWeight ? `${currentWeight} kg` : "—"}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-secondary/40 text-center">
            <p className="text-[9px] text-muted-foreground mb-0.5">Meta</p>
            <p className="text-sm font-display font-bold">{goalWeight ? `${goalWeight} kg` : "—"}</p>
          </div>
        </div>
        {goalWeight && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground">Progresso</span>
              <span className="text-[10px] font-bold text-chart-2">{weightProgress}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-chart-2 rounded-full transition-all duration-500" style={{ width: `${weightProgress}%` }} />
            </div>
          </div>
        )}
        {weightData.length > 1 && (
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightData}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={35} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="weight" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 3, fill: 'hsl(var(--chart-2))' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Achievements summary */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-chart-3" />
            <h3 className="text-sm font-bold">Conquistas</h3>
          </div>
          <button onClick={() => navigate("/conquistas")} className="text-[11px] text-primary font-medium hover:underline">
            Ver todas →
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-secondary/40 text-center">
            <p className="text-lg font-display font-bold">{unlockedCount}</p>
            <p className="text-[9px] text-muted-foreground">Desbloqueadas</p>
          </div>
          <div className="p-3 rounded-lg bg-secondary/40 text-center">
            <p className="text-lg font-display font-bold">{legendaryCount}</p>
            <p className="text-[9px] text-muted-foreground">🏛️ Lendárias</p>
          </div>
          <div className="p-3 rounded-lg bg-secondary/40 text-center flex flex-col items-center justify-center">
            {lastAchievement ? (
              <>
                <span className="text-lg">{lastAchievement.icon}</span>
                <p className="text-[9px] text-muted-foreground truncate w-full">{lastAchievement.title}</p>
              </>
            ) : (
              <>
                <span className="text-lg">🔒</span>
                <p className="text-[9px] text-muted-foreground">Nenhuma ainda</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerfilFitness;
