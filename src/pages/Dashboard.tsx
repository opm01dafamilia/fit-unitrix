import { useEffect, useState, useRef } from "react";
import { TrendingUp, TrendingDown, Flame, Dumbbell, Scale, Target, UtensilsCrossed, Activity, ArrowRight, CheckCircle2, Circle, Loader2, Trophy, Zap, BarChart3, Heart, Sparkles, Star } from "lucide-react";
import WeeklyAdjustmentCard from "@/components/WeeklyAdjustmentCard";
import type { WeeklyPerformanceData } from "@/lib/weeklyAutoAdjustEngine";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { writeCache, readCache, CACHE_KEYS } from "@/lib/smartCache";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { DashboardSkeleton } from "@/components/skeletons/SkeletonPremium";
import { format, subDays, startOfWeek, endOfWeek, differenceInCalendarDays } from "date-fns";
import { useWorkoutPrefetch } from "@/hooks/useWorkoutPrefetch";
import { useDietPrefetch } from "@/hooks/useDietPrefetch";
import { calculateAchievements, calculateTotalXP, type UserStats } from "@/lib/achievementsEngine";
import { checkLevelUp, type FitnessLevel } from "@/lib/fitnessLevelEngine";
import FitnessProgressBar from "@/components/FitnessProgressBar";
import LevelUpModal from "@/components/LevelUpModal";
import { getComebackStatus } from "@/lib/comebackEngine";
import { generateSmartNotifications, type BehavioralContext } from "@/lib/smartNotificationsEngine";
import { registerMicroVictory, getDailySummary, getDailyProgress, getMicroStreak, getTodayXP, getVictoryMessage } from "@/lib/microVictoriesEngine";
import DailyMissionsCard, { type DailyMission } from "@/components/DailyMissionsCard";
import { calculateFitnessScore, type FitnessScoreInput } from "@/lib/fitnessScoreEngine";


import { detectPlateau, type PlateauInput } from "@/lib/plateauDetectionEngine";
import PlateauAlertCard from "@/components/PlateauAlertCard";
import { analyzeReplanning } from "@/lib/smartReplanningEngine";
import ReplanningModal from "@/components/ReplanningModal";
import { generateCoachFeedback, isCoachModeActive, type CoachContext, type CoachMessage } from "@/lib/fitnessCoachEngine";
import CoachFeedbackCard from "@/components/CoachFeedbackCard";

const tooltipStyle = {
  background: 'var(--tooltip-bg)',
  border: '1px solid var(--tooltip-border)',
  borderRadius: '10px',
  color: 'var(--tooltip-color)',
  fontSize: '12px',
  padding: '8px 12px',
};

const Dashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [bodyRecords, setBodyRecords] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [workoutPlans, setWorkoutPlans] = useState<any[]>([]);
  const [dietPlans, setDietPlans] = useState<any[]>([]);
  const [dietTracking, setDietTracking] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [exerciseHistory, setExerciseHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [microProgress, setMicroProgress] = useState(getDailyProgress());
  const [microStreak, setMicroStreak] = useState(getMicroStreak());
  const [microXP, setMicroXP] = useState(getTodayXP());
  const [victoryFlash, setVictoryFlash] = useState<string | null>(null);
  const [levelUpData, setLevelUpData] = useState<FitnessLevel | null>(null);
  const [coachMessages, setCoachMessages] = useState<CoachMessage[]>([]);

  // Prefetch today's workout data + GIFs in background
  useWorkoutPrefetch(user?.id);
  useDietPrefetch(user?.id);

  // Register app_opened micro-victory on mount
  useEffect(() => {
    const v = registerMicroVictory("app_opened");
    if (v) {
      setMicroProgress(getDailyProgress());
      setMicroStreak(getMicroStreak());
      setMicroXP(getTodayXP());
      setVictoryFlash(v.icon + " " + getVictoryMessage());
      setTimeout(() => setVictoryFlash(null), 3000);
    }
  }, []);

  // Stale-while-revalidate: show cached data instantly, then refresh
  const hydratedFromCache = useRef(false);
  useEffect(() => {
    if (!user) return;

    // 1. Hydrate from cache immediately (instant render)
    if (!hydratedFromCache.current) {
      hydratedFromCache.current = true;
      const cached = readCache<any>(CACHE_KEYS.dashboardAll(user.id), { maxAge: 15 * 60 * 1000 });
      if (cached) {
        setBodyRecords(cached.bodyRecords || []);
        setGoals(cached.goals || []);
        setWorkoutPlans(cached.workoutPlans || []);
        setDietPlans(cached.dietPlans || []);
        setSessions(cached.sessions || []);
        setExerciseHistory(cached.exerciseHistory || []);
        setDietTracking(cached.dietTracking || []);
        setLoading(false);
      }
    }

    // 2. Fetch fresh data in background
    const fetchData = async () => {
      try {
        const [bodyRes, goalsRes, workoutRes, dietRes, sessionsRes, historyRes, dietTrackRes] = await Promise.all([
          supabase.from("body_tracking").select("weight,body_fat,created_at").eq("user_id", user.id).order("created_at", { ascending: true }),
          supabase.from("fitness_goals").select("id,title,current_value,target_value,unit,status,created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
          supabase.from("workout_plans").select("id,objective,experience_level,days_per_week,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
          supabase.from("diet_plans").select("id,objective,plan_data,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1),
          supabase.from("workout_sessions").select("id,completed_at,exercises_completed,exercises_total,muscle_group").eq("user_id", user.id).order("completed_at", { ascending: false }),
          supabase.from("exercise_history").select("exercise_name,weight,reps,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(200),
          supabase.from("diet_tracking").select("meals_done,meals_failed,meals_total,adherence_pct,tracked_date").eq("user_id", user.id).order("tracked_date", { ascending: false }).limit(14),
        ]);
        const fresh = {
          bodyRecords: bodyRes.data || [],
          goals: goalsRes.data || [],
          workoutPlans: workoutRes.data || [],
          dietPlans: dietRes.data || [],
          sessions: sessionsRes.data || [],
          exerciseHistory: historyRes.data || [],
          dietTracking: dietTrackRes.data || [],
        };
        setBodyRecords(fresh.bodyRecords);
        setGoals(fresh.goals);
        setWorkoutPlans(fresh.workoutPlans);
        setDietPlans(fresh.dietPlans);
        setSessions(fresh.sessions);
        setExerciseHistory(fresh.exerciseHistory);
        setDietTracking(fresh.dietTracking);
        // Cache for next visit
        writeCache(CACHE_KEYS.dashboardAll(user.id), fresh);
      } catch {
        // silently fail — cached data already shown
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const currentWeight = bodyRecords.length > 0 ? bodyRecords[bodyRecords.length - 1].weight : profile?.weight || 0;
  const previousWeight = bodyRecords.length > 1 ? bodyRecords[bodyRecords.length - 2].weight : profile?.weight || currentWeight;
  const weightChange = currentWeight - previousWeight;

  const activeGoals = goals.filter((g) => g.status === "active");
  const completedGoals = goals.filter((g) => g.status === "completed");

  const latestDiet = dietPlans[0];
  const estimatedCalories = (() => {
    if (!latestDiet) return 0;
    const pd = latestDiet.plan_data as any;
    // plan_data may be an array of meals or an object with a "plan" key
    const meals: any[] = Array.isArray(pd) ? pd : Array.isArray(pd?.plan) ? pd.plan : [];
    return meals.reduce((acc: number, m: any) => acc + (m.itens?.reduce((a: number, i: any) => a + (i.cal || 0), 0) || 0), 0);
  })();

  const weightChartData = bodyRecords.length > 0
    ? bodyRecords.map((r, i) => ({ semana: `S${i + 1}`, peso: Number(r.weight) }))
    : [];

  // === STREAK CALCULATION ===
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
    let tempStreak = 1;
    for (let i = 1; i < uniqueDays.length; i++) {
      const prev = new Date(uniqueDays[i - 1]);
      const curr = new Date(uniqueDays[i]);
      const diff = Math.round((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 1) { tempStreak++; maxStreak = Math.max(maxStreak, tempStreak); }
      else tempStreak = 1;
    }
  }

  // === WEEKLY STATS ===
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const weekSessions = sessions.filter((s: any) => {
    const d = new Date(s.completed_at);
    return d >= weekStart && d <= weekEnd;
  });
  const weekWorkouts = weekSessions.length;
  const weekExercises = weekSessions.reduce((a: number, s: any) => a + (s.exercises_completed || 0), 0);
  const weekSeries = exerciseHistory.filter((h: any) => {
    const d = new Date(h.created_at);
    return d >= weekStart && d <= weekEnd;
  }).length;

  // === ACHIEVEMENTS ===
  const exerciseWeights = new Map<string, number[]>();
  exerciseHistory.forEach((h: any) => {
    if (!exerciseWeights.has(h.exercise_name)) exerciseWeights.set(h.exercise_name, []);
    exerciseWeights.get(h.exercise_name)!.push(h.weight);
  });
  let totalProgressions = 0;
  exerciseWeights.forEach((weights) => {
    if (weights.length >= 2 && weights[0] > weights[weights.length - 1]) totalProgressions++;
  });

  const userStats: UserStats = {
    totalWorkouts: sessions.length,
    currentStreak,
    maxStreak,
    totalProgressions,
    totalExercisesCompleted: sessions.reduce((a: number, s: any) => a + (s.exercises_completed || 0), 0),
    daysActive: uniqueDays.length,
    dietStreak: 0,
    dietMaxStreak: 0,
    dietPerfectDays: 0,
    dietWeeklyAdherence: 0,
  };
  const achievements = calculateAchievements(userStats);
  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const nextAchievement = achievements.find(a => !a.unlocked);
  const totalXP = calculateTotalXP(userStats);

  // Level-up detection (runs once per data load)
  useEffect(() => {
    if (!loading && totalXP > 0) {
      const newLevel = checkLevelUp(totalXP);
      if (newLevel) setLevelUpData(newLevel);
    }
  }, [loading, totalXP]);

  // === COACH BEHAVIORAL FEEDBACK ===
  useEffect(() => {
    if (loading || !user) return;
    const today2 = format(new Date(), "yyyy-MM-dd");
    const trainedToday2 = sessions.some((s: any) => format(new Date(s.completed_at), "yyyy-MM-dd") === today2);
    const todayDiet2 = dietTracking.find((d: any) => d.tracked_date === today2);
    const weekFailedMeals2 = dietTracking.reduce((a: number, d: any) => a + (d.meals_failed || 0), 0);

    const coachCtx: CoachContext = {
      workoutsThisWeek: weekWorkouts,
      targetWorkoutsPerWeek: workoutPlans[0]?.days_per_week || 4,
      currentStreak,
      trainedToday: trainedToday2,
      lastWorkoutDate: sessions[0]?.completed_at,
      totalWorkouts: sessions.length,
      mealsCompletedToday: todayDiet2?.meals_done || 0,
      mealsTotalToday: todayDiet2?.meals_total || 0,
      mealsFailedThisWeek: weekFailedMeals2,
      dietStreak: 0,
      activeGoals: activeGoals.map((g: any) => ({ title: g.title, progress: g.current_value, target: g.target_value })),
      completedGoalsCount: completedGoals.length,
      currentWeight,
      previousWeight,
      hasRecentBodyRecord: hasRecentBody,
      fitnessScore: fitnessScoreResult.score,
      totalXP,
      currentLevel: 1,
      coachModeActive: isCoachModeActive(),
    };

    setCoachMessages(generateCoachFeedback(coachCtx));
  }, [loading]);

  const profileComplete = !!(profile?.full_name && profile?.weight && profile?.height && profile?.objective);
  const hasWorkout = workoutPlans.length > 0;
  const hasDiet = dietPlans.length > 0;
  const hasBodyRecord = bodyRecords.length > 0;
  const hasGoal = goals.length > 0;

  const checklist = [
    { label: "Complete seu perfil", done: profileComplete, path: "/perfil" },
    { label: "Crie seu primeiro treino", done: hasWorkout, path: "/treino" },
    { label: "Gere sua primeira dieta", done: hasDiet, path: "/dieta" },
    { label: "Registre seu peso inicial", done: hasBodyRecord, path: "/acompanhamento" },
    { label: "Crie uma meta fitness", done: hasGoal, path: "/metas" },
  ];
  const checklistDone = checklist.filter((c) => c.done).length;
  const checklistTotal = checklist.length;
  const checklistProgress = Math.round((checklistDone / checklistTotal) * 100);
  const showChecklist = checklistDone < checklistTotal;

  const progressItems = [
    { label: "Perfil", active: profileComplete },
    { label: "Treino", active: hasWorkout },
    { label: "Dieta", active: hasDiet },
    { label: "Meta", active: hasGoal },
  ];

  const stats = [
    { label: "Peso Atual", value: currentWeight ? `${currentWeight}` : "—", suffix: "kg", change: weightChange !== 0 ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)}kg` : null, changeColor: weightChange <= 0 ? "text-primary" : "text-destructive", icon: Scale, iconBg: "from-chart-2/20 to-chart-2/5", iconColor: "text-chart-2" },
    { label: "Treinos Salvos", value: String(workoutPlans.length), suffix: "", change: null, changeColor: "", icon: Dumbbell, iconBg: "from-primary/20 to-primary/5", iconColor: "text-primary" },
    { label: "Metas Ativas", value: String(activeGoals.length), suffix: "", change: completedGoals.length > 0 ? `${completedGoals.length} concluída(s)` : null, changeColor: "text-primary", icon: Target, iconBg: "from-chart-4/20 to-chart-4/5", iconColor: "text-chart-4" },
    { label: "Calorias/dia", value: estimatedCalories > 0 ? String(estimatedCalories) : "—", suffix: estimatedCalories > 0 ? "kcal" : "", change: null, changeColor: "", icon: Flame, iconBg: "from-chart-3/20 to-chart-3/5", iconColor: "text-chart-3" },
  ];

  const quickActions = [
    { label: "Novo Treino", icon: Dumbbell, path: "/treino", color: "text-primary" },
    { label: "Plano Alimentar", icon: UtensilsCrossed, path: "/dieta", color: "text-chart-3" },
    { label: "Registrar Peso", icon: Activity, path: "/acompanhamento", color: "text-chart-2" },
    { label: "Nova Meta", icon: Target, path: "/metas", color: "text-chart-4" },
  ];

  const hasData = bodyRecords.length > 0 || goals.length > 0 || workoutPlans.length > 0;

  // Comeback mode detection for dashboard alert
  const comebackAlert = (() => {
    if (sessions.length === 0 || workoutPlans.length === 0) return null;
    const daysPerWeek = workoutPlans[0]?.days_per_week || 4;
    const status = getComebackStatus(
      sessions.map((s: any) => ({ completed_at: s.completed_at })),
      daysPerWeek
    );
    return status.dashboardAlert ? status : null;
  })();

  // Smart Notifications — trigger behavioral analysis after data loads
  useEffect(() => {
    if (loading || !user) return;
    const today = format(new Date(), "yyyy-MM-dd");
    const trainedToday = sessions.some((s: any) => format(new Date(s.completed_at), "yyyy-MM-dd") === today);
    const todayDiet = dietTracking.find((d: any) => d.tracked_date === today);
    const weekFailedMeals = dietTracking.reduce((a: number, d: any) => a + (d.meals_failed || 0), 0);
    const daysPerWeek = workoutPlans[0]?.days_per_week || 4;

    const ctx: BehavioralContext = {
      totalWorkoutsThisWeek: weekWorkouts,
      daysPerWeek,
      trainedToday,
      workoutStreak: currentStreak,
      lastWorkoutDate: sessions[0]?.completed_at,
      mealsCompletedToday: todayDiet?.meals_done || 0,
      mealsTotalToday: todayDiet?.meals_total || 0,
      mealsFailedThisWeek: weekFailedMeals,
      dietStreak: 0,
      activeGoals: activeGoals.map((g: any) => ({ title: g.title, progress: g.current_value, target: g.target_value })),
      nearAchievementName: nextAchievement?.title,
    };

    generateSmartNotifications(ctx);
    window.dispatchEvent(new Event("fitpulse_notif_update"));
  }, [loading]);

  // === FITNESS SCORE ===
  const dietCompletedWeek = dietTracking.reduce((a: number, d: any) => a + (d.meals_done || 0), 0);
  const dietTotalWeek = dietTracking.reduce((a: number, d: any) => a + (d.meals_total || 0), 0);
  const dietFailures = dietTracking.filter((d: any) => d.meals_failed > 0).length;
  const hasRecentBody = bodyRecords.length > 0 && differenceInCalendarDays(new Date(), new Date(bodyRecords[bodyRecords.length - 1].created_at)) <= 7;
  const bodyDirection: "improving" | "stable" | "declining" | "unknown" = bodyRecords.length >= 2
    ? (weightChange < 0 && profile?.objective === "emagrecer") || (weightChange > 0 && profile?.objective === "massa")
      ? "improving"
      : weightChange === 0 ? "stable" : "declining"
    : "unknown";

  const fitnessScoreResult = calculateFitnessScore({
    workoutsThisWeek: weekWorkouts,
    targetWorkoutsPerWeek: workoutPlans[0]?.days_per_week || 4,
    workoutStreak: currentStreak,
    totalWorkouts: sessions.length,
    mealsCompletedThisWeek: dietCompletedWeek,
    mealsTotalThisWeek: dietTotalWeek,
    consecutiveDietFailures: dietFailures,
    hasRecentBodyRecord: hasRecentBody,
    bodyProgressDirection: bodyDirection,
    activeGoalsCount: activeGoals.length,
    goalsOnTrack: activeGoals.filter((g: any) => g.target_value > 0 && (g.current_value / g.target_value) >= 0.5).length,
    challengesCompletedThisWeek: 0,
    invitesSent: 0,
    daysActiveThisWeek: weekWorkouts,
    weeksConsecutivelyActive: Math.floor(currentStreak / 7),
  });

  // === PLATEAU DETECTION ===
  const weeklyMaxWeights: { week: number; avgMaxWeight: number }[] = [];
  // Group exercise history by week
  const now = new Date();
  for (let w = 0; w < 3; w++) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (w + 1) * 7);
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - w * 7);
    const weekExercises = exerciseHistory.filter((h: any) => {
      const d = new Date(h.created_at);
      return d >= weekStart && d < weekEnd;
    });
    if (weekExercises.length > 0) {
      const avgMax = weekExercises.reduce((a: number, h: any) => a + (h.weight || 0), 0) / weekExercises.length;
      weeklyMaxWeights.push({ week: w, avgMaxWeight: avgMax });
    }
  }

  const weeklyBodyWeight = bodyRecords.slice(-4).reverse().map((r: any, i: number) => ({
    week: i, weight: Number(r.weight)
  }));

  const plateauResult = detectPlateau({
    weeklyMaxWeights,
    weeklyBodyWeight,
    weeklyBodyFat: [],
    weeklyVolume: [],
    currentStreak,
    previousStreak: currentStreak,
    currentScore: fitnessScoreResult.score,
    previousScore: fitnessScoreResult.score,
    mealsFailedLast2Weeks: dietTracking.reduce((a: number, d: any) => a + (d.meals_failed || 0), 0),
    mealsTotalLast2Weeks: dietTracking.reduce((a: number, d: any) => a + (d.meals_total || 0), 0),
    workoutsLast2Weeks: sessions.filter((s: any) => {
      const d = new Date(s.completed_at);
      return (now.getTime() - d.getTime()) < 14 * 24 * 60 * 60 * 1000;
    }).length,
    targetWorkoutsPerWeek: workoutPlans[0]?.days_per_week || 4,
    exerciseFailuresLast2Weeks: 0,
    totalSetsLast2Weeks: exerciseHistory.filter((h: any) => {
      const d = new Date(h.created_at);
      return (now.getTime() - d.getTime()) < 14 * 24 * 60 * 60 * 1000;
    }).length,
  });

  // === SMART REPLANNING ===
  const lastWorkoutDate = sessions[0]?.completed_at;
  const daysInactive = lastWorkoutDate
    ? Math.floor((Date.now() - new Date(lastWorkoutDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const dietAdherancePct = dietTotalWeek > 0 ? Math.round((dietCompletedWeek / dietTotalWeek) * 100) : 100;

  const replanResult = analyzeReplanning({
    plateauDetected: plateauResult.detected,
    plateauTypes: plateauResult.types,
    plateauSeverity: plateauResult.severity,
    currentScore: fitnessScoreResult.score,
    scoreDropLast2Weeks: 0,
    workoutsLast2Weeks: sessions.filter((s: any) => {
      const d = new Date(s.completed_at);
      return (now.getTime() - d.getTime()) < 14 * 24 * 60 * 60 * 1000;
    }).length,
    targetWorkoutsPerWeek: workoutPlans[0]?.days_per_week || 4,
    currentStreak,
    daysInactive,
    exerciseFailRate: 0,
    dietAdherencePct: dietAdherancePct,
    mealsFailedLast2Weeks: dietTracking.reduce((a: number, d: any) => a + (d.meals_failed || 0), 0),
    weightStagnant: weeklyBodyWeight.length >= 3 && (Math.max(...weeklyBodyWeight.map(w => w.weight)) - Math.min(...weeklyBodyWeight.map(w => w.weight))) < 0.3,
    bodyProgressDirection: bodyDirection,
    fatigueLevel: "low",
    currentCycle: "progressao",
    objective: profile?.objective || "manter",
    experienceLevel: profile?.experience_level || "intermediario",
    daysPerWeek: workoutPlans[0]?.days_per_week || 4,
  });

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-7 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight">
          Olá, {profile?.full_name?.split(" ")[0] || "Usuário"} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Visão geral do seu progresso fitness</p>
      </div>

      {/* Fitness Level Progress Bar */}
      <FitnessProgressBar totalXP={totalXP} />

      {/* Level Up Modal */}
      <LevelUpModal level={levelUpData} onClose={() => setLevelUpData(null)} />

      {/* Comeback Alert */}
      {comebackAlert && comebackAlert.dashboardAlert && (
        <div className="glass-card p-4 lg:p-5 border border-primary/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-chart-2/5 opacity-50" />
          <div className="relative z-10 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-chart-2/10 flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">⚠️ {comebackAlert.dashboardAlert}</p>
              <p className="text-[10px] text-muted-foreground mt-1 italic">💡 Consistência é mais importante que intensidade.</p>
            </div>
            <button onClick={() => navigate("/treino")} className="text-xs text-primary font-medium shrink-0 hover:underline">
              Ir para treino →
            </button>
          </div>
        </div>
      )}

      {/* Plateau Alert */}
      <PlateauAlertCard plateau={plateauResult} />

      {/* Smart Replanning */}
      <ReplanningModal replan={replanResult} />

      {/* Coach Feedback */}
      <CoachFeedbackCard messages={coachMessages} />

      {/* ✨ Micro-Victories Daily Progress */}
      <div className="glass-card p-5 lg:p-6 relative overflow-hidden">
        {victoryFlash && (
          <div className="absolute inset-0 bg-primary/5 animate-fade-in z-0" />
        )}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Progresso do Dia
            </h3>
            <div className="flex items-center gap-2">
              {microStreak > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-400 font-bold flex items-center gap-1">
                  🔥 {microStreak} dias
                </span>
              )}
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold">
                +{microXP} XP
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-muted-foreground">{microProgress.completed}/{microProgress.total} ações</span>
              <span className="text-xs font-bold text-primary">{microProgress.progress}%</span>
            </div>
            <div className="h-2.5 bg-secondary/50 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-chart-2 transition-all duration-700 ease-out"
                style={{ width: `${microProgress.progress}%` }}
              />
            </div>
          </div>

          {/* Completion message */}
          {microProgress.isComplete ? (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/8 border border-primary/15">
              <Trophy className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-semibold text-primary">🏆 Dia produtivo concluído!</p>
                <p className="text-[10px] text-muted-foreground">Você completou todas as ações do dia. Parabéns!</p>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground italic">
              ✨ Cada pequena ação conta na sua evolução.
            </p>
          )}

          {/* Victory flash message */}
          {victoryFlash && (
            <div className="mt-2 flex items-center gap-2 animate-fade-in">
              <span className="text-xs text-primary font-medium">{victoryFlash}</span>
            </div>
          )}
        </div>
      </div>



      <div className="glass-card p-4 lg:p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-semibold text-sm">Status do Perfil</h3>
          <span className="text-xs font-medium text-primary">{progressItems.filter(p => p.active).length}/{progressItems.length} ativos</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {progressItems.map((item) => (
            <div key={item.label} className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg transition-all ${item.active ? "bg-primary/8 border border-primary/15" : "bg-secondary/30 border border-border/30"}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${item.active ? "bg-primary/15" : "bg-secondary/50"}`}>
                {item.active ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Circle className="w-3.5 h-3.5 text-muted-foreground" />}
              </div>
              <span className={`text-[10px] font-medium ${item.active ? "text-primary" : "text-muted-foreground"}`}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Onboarding Checklist */}
      {showChecklist && (
        <div className="glass-card p-5 lg:p-6 glow-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold text-base">Primeiros Passos</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">{checklistDone} de {checklistTotal} concluídos</p>
            </div>
            <span className="text-sm font-bold text-primary">{checklistProgress}%</span>
          </div>
          <div className="progress-bar !h-2 mb-4">
            <div className="progress-fill" style={{ width: `${checklistProgress}%` }} />
          </div>
          <div className="space-y-2">
            {checklist.map((item) => (
              <button key={item.label} onClick={() => !item.done && navigate(item.path)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${item.done ? "bg-primary/5 border border-primary/10" : "bg-secondary/30 border border-border/30 hover:bg-secondary/50 hover:border-primary/15 cursor-pointer"}`}>
                {item.done ? <CheckCircle2 className="w-4.5 h-4.5 text-primary shrink-0" /> : <Circle className="w-4.5 h-4.5 text-muted-foreground shrink-0" />}
                <span className={`text-sm font-medium ${item.done ? "text-primary line-through opacity-70" : "text-foreground"}`}>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="metric-card p-4 lg:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.iconBg} flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
              </div>
              {stat.change && <span className={`text-[11px] font-medium ${stat.changeColor}`}>{stat.change}</span>}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl lg:text-3xl font-display font-bold text-foreground">{stat.value}</span>
              {stat.suffix && <span className="text-xs text-muted-foreground font-medium">{stat.suffix}</span>}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* 🔥 Streak & Weekly Summary */}
      {sessions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Streak Card */}
          <div className="glass-card p-5 lg:p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-500/8 to-transparent rounded-bl-full" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-base flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-400" />
                  Sequência de Treinos
                </h3>
                <span className="text-[11px] px-2 py-1 rounded-lg bg-orange-500/10 text-orange-400 font-medium">
                  Recorde: {maxStreak} dias
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-500/5 flex flex-col items-center justify-center border border-orange-500/15">
                  <span className="text-3xl font-display font-bold text-orange-400">{currentStreak}</span>
                  <span className="text-[9px] text-orange-400/70 font-medium uppercase tracking-wider">dias</span>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex gap-1">
                    {Array.from({ length: 7 }).map((_, i) => {
                      const day = subDays(new Date(), 6 - i);
                      const dayStr = format(day, "yyyy-MM-dd");
                      const trained = uniqueDays.includes(dayStr);
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div className={`w-full h-8 rounded-lg transition-all ${trained ? "bg-gradient-to-t from-orange-500/30 to-orange-400/50 border border-orange-400/30" : "bg-secondary/40 border border-border/20"}`} />
                          <span className="text-[8px] text-muted-foreground">{format(day, "EEE", { locale: undefined }).charAt(0).toUpperCase()}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {currentStreak > 0 ? "Continue treinando para manter! 💪" : "Treine hoje para começar uma sequência!"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Summary Card */}
          <div className="glass-card p-5 lg:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-base flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Resumo Semanal
              </h3>
              <span className="text-[11px] text-muted-foreground font-medium">Esta semana</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 flex flex-col items-center">
                <Dumbbell className="w-4 h-4 text-primary mb-1.5" />
                <span className="text-xl font-display font-bold text-foreground">{weekWorkouts}</span>
                <span className="text-[9px] text-muted-foreground font-medium">Treinos</span>
              </div>
              <div className="p-3 rounded-xl bg-chart-2/5 border border-chart-2/10 flex flex-col items-center">
                <Zap className="w-4 h-4 text-chart-2 mb-1.5" />
                <span className="text-xl font-display font-bold text-foreground">{weekExercises}</span>
                <span className="text-[9px] text-muted-foreground font-medium">Exercícios</span>
              </div>
              <div className="p-3 rounded-xl bg-chart-4/5 border border-chart-4/10 flex flex-col items-center">
                <Target className="w-4 h-4 text-chart-4 mb-1.5" />
                <span className="text-xl font-display font-bold text-foreground">{weekSeries}</span>
                <span className="text-[9px] text-muted-foreground font-medium">Séries</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🧠 Weekly Smart Adjustments */}
      {sessions.length >= 3 && (() => {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);
        const weekSess = sessions.filter((s: any) => new Date(s.completed_at) >= weekStart);
        const totalSeriesWeek = exerciseHistory.filter((h: any) => new Date(h.created_at) >= weekStart).length;
        const completedSeries = weekSess.reduce((a: number, s: any) => a + (s.exercises_completed || 0), 0);
        const failedSeries = Math.max(0, totalSeriesWeek - completedSeries);
        const abandonedWorkouts = weekSess.filter((s: any) => s.exercises_completed < s.exercises_total * 0.5).length;

        // Diet tracking this week
        const weekDietTracking = dietTracking.filter((d: any) => new Date(d.tracked_date) >= weekStart);
        const totalMealsDone = weekDietTracking.reduce((a: number, d: any) => a + (d.meals_done || 0), 0);
        const totalMealsFailed = weekDietTracking.reduce((a: number, d: any) => a + (d.meals_failed || 0), 0);
        const totalMealsAll = weekDietTracking.reduce((a: number, d: any) => a + (d.meals_total || 0), 0);
        const avgAdherence = weekDietTracking.length > 0
          ? Math.round(weekDietTracking.reduce((a: number, d: any) => a + (d.adherence_pct || 0), 0) / weekDietTracking.length) : 0;

        // Weight
        const cw = bodyRecords.length > 0 ? bodyRecords[bodyRecords.length - 1].weight : profile?.weight || 0;
        const pw = bodyRecords.length > 1 ? bodyRecords[bodyRecords.length - 2].weight : cw;
        const activePlan = workoutPlans[0];

        const adjustData: WeeklyPerformanceData = {
          workoutsCompleted: weekSess.length,
          workoutsTarget: activePlan?.days_per_week || 4,
          totalSeries: totalSeriesWeek,
          seriesCompleted: completedSeries,
          seriesFailed: failedSeries,
          avgRestTimeUsed: 70,
          targetRestTime: 60,
          abandonedWorkouts,
          streak: currentStreak,
          mealsDone: totalMealsDone,
          mealsFailed: totalMealsFailed,
          mealsTotal: totalMealsAll,
          dietAdherencePct: avgAdherence,
          currentWeight: Number(cw),
          previousWeight: Number(pw),
          goalWeight: null,
          objective: profile?.objective || "manter",
          sessions: weekSess.map((s: any) => ({
            completed_at: s.completed_at,
            muscle_group: s.muscle_group,
            intensity: undefined,
          })),
        };

        return <WeeklyAdjustmentCard data={adjustData} />;
      })()}

      {/* 🏆 Achievements Summary */}
      {(unlockedAchievements.length > 0 || nextAchievement) && (
        <div className="glass-card p-5 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-base flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Conquistas
            </h3>
            <button onClick={() => navigate("/conquistas")} className="text-[11px] text-primary font-medium flex items-center gap-1 hover:underline">
              Ver todas <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Unlocked badges */}
          {unlockedAchievements.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {unlockedAchievements.map((a) => (
                <div key={a.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/5 border border-primary/15">
                  <span className="text-sm">{a.icon}</span>
                  <span className="text-[11px] font-medium text-foreground">{a.title}</span>
                </div>
              ))}
            </div>
          )}

          {/* Next achievement progress */}
          {nextAchievement && (
            <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/80 flex items-center justify-center text-lg">
                  🔒
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">Próxima: {nextAchievement.title}</p>
                    <span className="text-[10px] font-semibold text-primary">{nextAchievement.progress}%</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-2">{nextAchievement.description}</p>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-primary/50 transition-all duration-500" style={{ width: `${nextAchievement.progress}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {nextAchievement.currentValue}/{nextAchievement.requirement}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {weightChartData.length > 1 && (
        <div className="glass-card p-5 lg:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display font-semibold text-base">Evolução de Peso</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">{bodyRecords.length} registros</p>
            </div>
            {bodyRecords.length > 1 && (
              <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg ${weightChange <= 0 ? "text-primary bg-primary/10" : "text-destructive bg-destructive/10"}`}>
                {weightChange <= 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                <span>{weightChange > 0 ? "+" : ""}{weightChange.toFixed(1)}kg</span>
              </div>
            )}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weightChartData}>
              <defs>
                <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={`hsl(${getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()})`} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={`hsl(${getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()})`} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(260 12% 15%)" vertical={false} />
              <XAxis dataKey="semana" stroke="hsl(240 8% 42%)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis domain={['dataMin - 1', 'dataMax + 1']} stroke="hsl(240 8% 42%)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="peso" stroke={`hsl(${getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()})`} fill="url(#weightGrad)" strokeWidth={2.5} dot={{ fill: `hsl(${getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()})`, r: 3, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 2, stroke: 'hsl(260 14% 9%)' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className={`grid ${activeGoals.length > 0 ? "lg:grid-cols-2" : ""} gap-4`}>
        {/* Active Goals */}
        {activeGoals.length > 0 && (
          <div className="glass-card p-5 lg:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-base">Metas Ativas</h3>
              <button onClick={() => navigate("/metas")} className="text-[11px] text-primary font-medium flex items-center gap-1 hover:underline">
                Ver todas <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-3">
              {activeGoals.slice(0, 3).map((goal) => {
                const progress = Math.min(100, (goal.current_value / goal.target_value) * 100);
                return (
                  <div key={goal.id} className="p-3.5 rounded-xl bg-secondary/40 border border-border/30">
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2.5">
                        <Target className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">{goal.title}</span>
                      </div>
                      <span className="text-xs font-semibold text-primary">{Math.round(progress)}%</span>
                    </div>
                    <div className="progress-bar !h-1.5">
                      <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-2">
                      {goal.current_value} / {goal.target_value} {goal.unit || ""}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="glass-card p-5 lg:p-6">
          <h3 className="font-display font-semibold text-base mb-4">Ações Rápidas</h3>
          <div className={`grid ${activeGoals.length > 0 ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-4"} gap-3`}>
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-2.5 p-4 rounded-xl bg-secondary/40 border border-border/30 hover:border-primary/20 hover:bg-secondary/60 transition-all duration-200 group"
              >
                <action.icon className={`w-5 h-5 ${action.color} group-hover:scale-110 transition-transform`} />
                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {workoutPlans.length > 0 && (
        <div className="glass-card p-5 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-base">Atividade Recente</h3>
            <button onClick={() => navigate("/historico")} className="text-[11px] text-primary font-medium flex items-center gap-1 hover:underline">
              Ver histórico <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {workoutPlans.slice(0, 3).map((wp) => (
              <div key={wp.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border/20">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Dumbbell className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium capitalize truncate">{wp.objective} — {wp.experience_level}</p>
                  <p className="text-[11px] text-muted-foreground">{new Date(wp.created_at).toLocaleDateString("pt-BR")} • {wp.days_per_week} dias/sem</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 📊 Daily Summary Card */}
      {(sessions.length > 0 || dietPlans.length > 0) && (
        <div className="glass-card p-5 lg:p-6">
          <h3 className="font-display font-semibold text-base flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-chart-4" />
            Seu Resumo Hoje
          </h3>
          {(() => {
            const todayStr = format(new Date(), "yyyy-MM-dd");
            const todayWorkouts = sessions.filter((s: any) => format(new Date(s.completed_at), "yyyy-MM-dd") === todayStr).length;
            const todayDietData = dietTracking.find((d: any) => d.tracked_date === todayStr);
            const todayMealsDone = todayDietData?.meals_done || 0;
            const todayMealsTotal = todayDietData?.meals_total || 0;
            const todayAdherence = todayDietData ? Math.round(todayDietData.adherence_pct || 0) : null;
            return (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 flex flex-col items-center">
                  <span className="text-lg mb-1">🏋️</span>
                  <span className="text-lg font-display font-bold">{todayWorkouts}</span>
                  <span className="text-[9px] text-muted-foreground">Treinos hoje</span>
                </div>
                <div className="p-3 rounded-xl bg-chart-3/5 border border-chart-3/10 flex flex-col items-center">
                  <span className="text-lg mb-1">🍽️</span>
                  <span className="text-lg font-display font-bold">{todayMealsTotal > 0 ? `${todayMealsDone}/${todayMealsTotal}` : "—"}</span>
                  <span className="text-[9px] text-muted-foreground">Refeições</span>
                </div>
                <div className="p-3 rounded-xl bg-chart-2/5 border border-chart-2/10 flex flex-col items-center">
                  <span className="text-lg mb-1">📊</span>
                  <span className="text-lg font-display font-bold">{todayAdherence !== null ? `${todayAdherence}%` : "—"}</span>
                  <span className="text-[9px] text-muted-foreground">Aderência</span>
                </div>
                <div className="p-3 rounded-xl bg-chart-4/5 border border-chart-4/10 flex flex-col items-center">
                  <span className="text-lg mb-1">✨</span>
                  <span className="text-lg font-display font-bold">{microProgress.completed}</span>
                  <span className="text-[9px] text-muted-foreground">Micro-vitórias</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {!hasData && !showChecklist && (
        <div className="empty-state">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.08))' }}>
            <Flame className="w-7 h-7 text-primary" />
          </div>
          <h3 className="font-display font-semibold text-lg mb-2">Comece sua jornada!</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Explore os módulos de Treino, Dieta, Acompanhamento e Metas para começar a registrar seu progresso.
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
