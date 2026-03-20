import { useState, useEffect, useMemo, useCallback, memo, useRef } from "react";
import { Dumbbell, ChevronDown, ChevronUp, Zap, Clock, Trash2, Timer, Loader2, Flame, Trophy, CalendarDays, Play, Check, ArrowLeft, TrendingUp, BarChart3, Heart, AlertCircle, Eye, CheckCircle2, Target, Activity, RotateCcw, FileText } from "lucide-react";
import { useSubscriptionGuard } from "@/components/SubscriptionGate";
import PlanSourceChoice from "@/components/PlanSourceChoice";
import PdfUploadFlow from "@/components/PdfUploadFlow";
import WorkoutExecution from "@/components/WorkoutExecution";
import CardioSession from "@/components/CardioSession";
import FocusMode from "@/components/FocusMode";
import PdfViewer from "@/components/PdfViewer";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";
import { generateWorkoutPlan, BodyFocus, DayIntensity, CardioFrequency, IntensityLevel, ExercisePreferences, UserGender } from "@/lib/workoutGenerator";
import { TreinoDashboardSkeleton, TreinoPlansSkeleton } from "@/components/skeletons/SkeletonPremium";
import { calculateWeeklyEvolution, type WeeklyEvolution } from "@/lib/progressionEngine";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { calculateAchievements, getMotivationalMessage, type UserStats } from "@/lib/achievementsEngine";
import { useNavigate } from "react-router-dom";
import { startLazyPreload } from "@/lib/exerciseGifs";
import { writeCache, readCache, CACHE_KEYS, invalidateCache } from "@/lib/smartCache";
import { getCycleStatus, buildEvolutionTimeline, checkOvertrain, type CycleStatus, type EvolutionEntry } from "@/lib/progressionCycleEngine";
import { getComebackStatus, getComebackProgress, getComebackFeedback, type ComebackStatus } from "@/lib/comebackEngine";
import { getWeeklyFatigueSummary, shouldTrainGroup, type WeeklyFatigueSummary } from "@/lib/muscleFatigueEngine";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getRecoverySummary, generateRegenerativeWorkout, acceptRecoveryToday, logRecoveryEvent, getGroupRecoveryLevel, type RecoverySummary, type RecoveryLevel } from "@/lib/smartRecoveryEngine";
import PeriodizationCycleCard from "@/components/PeriodizationCycleCard";
import MuscleVolumeCard from "@/components/MuscleVolumeCard";
import { checkAndTransition, type PerformanceInput as PeriodPerfInput } from "@/lib/advancedPeriodizationEngine";

type WorkoutSession = {
  id: string;
  user_id: string;
  workout_plan_id: string | null;
  day_index: number;
  day_name: string;
  muscle_group: string;
  completed_at: string;
  exercises_completed: number;
  exercises_total: number;
};

const Treino = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { guardAction, GateModal } = useSubscriptionGuard();
  // View state
  const [view, setView] = useState<"dashboard" | "chooser" | "generator" | "pdf-upload" | "execution" | "pre-cardio">("dashboard");
  const [executionKey, setExecutionKey] = useState(0);
  // Pre-cardio state — store pending plan/day to start after cardio finishes
  const [pendingCardio, setPendingCardio] = useState<{ plan: any; dayIndex: number } | null>(null);
  // Generator state
  const [objetivo, setObjetivo] = useState("");
  const [nivel, setNivel] = useState("");
  const [dias, setDias] = useState("");
  const [foco, setFoco] = useState<BodyFocus>("completo");
  const [cardioFreq, setCardioFreq] = useState<CardioFrequency>("0");
  const [intensityLevel, setIntensityLevel] = useState<IntensityLevel>("intenso");
  
  const [preferredExercises, setPreferredExercises] = useState<string[]>([]);
  const [preferenceText, setPreferenceText] = useState("");
  const [showPreferences, setShowPreferences] = useState(false);
  const [showPlan, setShowPlan] = useState(false);
  const [expandedDay, setExpandedDay] = useState<number | null>(0);
  const [savedPlans, setSavedPlans] = useState<any[]>([]);
  const [viewingSaved, setViewingSaved] = useState<any | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [saving, setSaving] = useState(false);
  // Sessions state
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  // Execution state
  const [executingPlan, setExecutingPlan] = useState<any>(null);
  const [executingDayIndex, setExecutingDayIndex] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<Set<number>>(new Set());
  // Calendar
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<Date | null>(null);
  // Weekly evolution
  const [weeklyEvolution, setWeeklyEvolution] = useState<WeeklyEvolution | null>(null);
  const [focusDay, setFocusDay] = useState<any | null>(null);
  const [cycleStatus, setCycleStatus] = useState<CycleStatus | null>(null);
  const [evolutionTimeline, setEvolutionTimeline] = useState<EvolutionEntry[]>([]);
  const [comebackStatus, setComebackStatus] = useState<ComebackStatus | null>(null);
  const [comebackWorkouts, setComebackWorkouts] = useState(0);
  const [fatigueSummary, setFatigueSummary] = useState<WeeklyFatigueSummary | null>(null);
  const [recoverySummary, setRecoverySummary] = useState<RecoverySummary | null>(null);
  const [showRegenerativeWorkout, setShowRegenerativeWorkout] = useState(false);
  const [viewingPdf, setViewingPdf] = useState<{ url: string; name: string } | null>(null);
  const [treinoPdfs, setTreinoPdfs] = useState<any[]>([]);

  // Pre-fill from profile & start lazy preload
  useEffect(() => {
    startLazyPreload();
    if (profile?.objective) setObjetivo(profile.objective === "manter" ? "condicionamento" : profile.objective);
    if (profile?.experience_level) setNivel(profile.experience_level);
    
    if (profile?.experience_level) {
      const autoSuggest = profile.experience_level === "iniciante" ? "3" : profile.experience_level === "intermediario" ? "4" : "5";
      setDias(autoSuggest);
    }
  }, [profile]);

  // Fetch plans & sessions with smart cache
  useEffect(() => {
    if (!user) return;

    // 1. Show cached data instantly
    const cachedPlans = readCache<any[]>(CACHE_KEYS.workoutPlans(user.id), { maxAge: 30 * 60 * 1000 });
    const cachedSessions = readCache<WorkoutSession[]>(CACHE_KEYS.workoutSessions(user.id), { maxAge: 10 * 60 * 1000 });
    if (cachedPlans) { setSavedPlans(cachedPlans); setLoadingPlans(false); }
    if (cachedSessions) { setSessions(cachedSessions); setLoadingSessions(false); }

    // 2. Fetch fresh in background
    const fetchAll = async () => {
      if (!cachedPlans) setLoadingPlans(true);
      if (!cachedSessions) setLoadingSessions(true);
      const [plansRes, sessionsRes] = await Promise.all([
        supabase.from("workout_plans").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("workout_sessions").select("*").eq("user_id", user.id).order("completed_at", { ascending: false }),
      ]);
      if (plansRes.error) { if (!cachedPlans) toast.error("Erro ao carregar planos"); }
      else { setSavedPlans(plansRes.data || []); writeCache(CACHE_KEYS.workoutPlans(user.id), plansRes.data || []); }
      if (!sessionsRes.error) { setSessions((sessionsRes.data as WorkoutSession[]) || []); writeCache(CACHE_KEYS.workoutSessions(user.id), sessionsRes.data || []); }
      setLoadingPlans(false);
      setLoadingSessions(false);

      // Fetch treino PDFs
      const { data: pdfData } = await supabase
        .from("user_files")
        .select("*")
        .eq("user_id", user.id)
        .eq("file_type", "treino")
        .order("created_at", { ascending: false })
        .limit(5);
      if (pdfData) setTreinoPdfs(pdfData);
    };
    fetchAll();
  }, [user]);

  // Fetch weekly evolution data
  useEffect(() => {
    if (!user || loadingSessions) return;
    const fetchWeeklyEvolution = async () => {
      const now = new Date();
      const startOfThisWeek = new Date(now);
      startOfThisWeek.setDate(now.getDate() - now.getDay());
      startOfThisWeek.setHours(0, 0, 0, 0);
      const startOfLastWeek = new Date(startOfThisWeek);
      startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

      const [thisWeekRes, lastWeekRes] = await Promise.all([
        supabase.from("exercise_history").select("exercise_name, weight, reps, set_number, created_at")
          .eq("user_id", user.id).gte("created_at", startOfThisWeek.toISOString()).order("created_at", { ascending: false }),
        supabase.from("exercise_history").select("exercise_name, weight, reps, set_number, created_at")
          .eq("user_id", user.id).gte("created_at", startOfLastWeek.toISOString()).lt("created_at", startOfThisWeek.toISOString()).order("created_at", { ascending: false }),
      ]);

      const sessionsThisWeek = sessions.filter(s => new Date(s.completed_at) >= startOfThisWeek).length;
      const targetDays = activePlan?.days_per_week || 4;

      const evolution = calculateWeeklyEvolution(
        (thisWeekRes.data as any[]) || [],
        (lastWeekRes.data as any[]) || [],
        sessionsThisWeek,
        targetDays
      );
      setWeeklyEvolution(evolution);
    };
    fetchWeeklyEvolution();
  }, [user, loadingSessions, sessions]);




  // Streak calculation
  const streak = useMemo(() => {
    if (sessions.length === 0) return 0;
    const uniqueDays = [...new Set(sessions.map(s => format(new Date(s.completed_at), "yyyy-MM-dd")))].sort().reverse();
    let count = 0;
    const today = format(new Date(), "yyyy-MM-dd");
    const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
    if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) return 0;
    for (let i = 0; i < uniqueDays.length; i++) {
      const expected = format(subDays(new Date(), i + (uniqueDays[0] === today ? 0 : 1)), "yyyy-MM-dd");
      if (uniqueDays[i] === expected) count++;
      else break;
    }
    return count;
  }, [sessions]);

  // Check if user already completed a workout today
  const todayCompleted = useMemo(() => {
    const todayKey = format(new Date(), "yyyy-MM-dd");
    return sessions.some(s => 
      format(new Date(s.completed_at), "yyyy-MM-dd") === todayKey &&
      s.exercises_completed >= s.exercises_total &&
      s.exercises_total > 0
    );
  }, [sessions]);

  // Weekly consistency counter
  const weeklyConsistency = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const weekDays = new Set(
      sessions
        .filter(s => new Date(s.completed_at) >= startOfWeek)
        .map(s => format(new Date(s.completed_at), "yyyy-MM-dd"))
    );
    return { done: weekDays.size, target: 5 };
  }, [sessions]);

  // Consistency feedback
  const consistencyFeedback = useMemo(() => {
    const pct = weeklyConsistency.target > 0 ? (weeklyConsistency.done / weeklyConsistency.target) * 100 : 0;
    if (pct >= 100) return { emoji: "🏆", text: "Excelente consistência!", color: "text-primary" };
    if (pct >= 60) return { emoji: "💪", text: "Você está evoluindo!", color: "text-chart-2" };
    if (pct >= 30) return { emoji: "🔥", text: "Continue firme!", color: "text-amber-400" };
    return { emoji: "🚀", text: "Continue amanhã!", color: "text-muted-foreground" };
  }, [weeklyConsistency]);



  // Active plan (most recent)
  const activePlan = savedPlans[0];
  const activePlanData = activePlan ? (activePlan.plan_data as any[]) : null;

  // Comeback mode detection
  useEffect(() => {
    if (!activePlan || loadingSessions) return;
    const status = getComebackStatus(
      sessions.map(s => ({ completed_at: s.completed_at })),
      activePlan.days_per_week,
      comebackWorkouts
    );
    setComebackStatus(status);
  }, [sessions, activePlan, loadingSessions, comebackWorkouts]);

  // Fatigue detection
  useEffect(() => {
    if (loadingSessions) return;
    const summary = getWeeklyFatigueSummary();
    setFatigueSummary(summary);

    // Recovery summary
    const sessionData = sessions.map(s => ({
      completed_at: s.completed_at,
      muscle_group: s.muscle_group,
      intensity: undefined as string | undefined,
    }));
    const recovery = getRecoverySummary(sessionData);
    setRecoverySummary(recovery);

    // Periodization auto-transition check
    const completionRate = activePlan?.days_per_week
      ? sessions.filter(s => {
          const d = new Date(s.completed_at);
          const weekAgo = new Date(Date.now() - 7 * 86400000);
          return d >= weekAgo;
        }).length / activePlan.days_per_week
      : 0;
    const perfInput: PeriodPerfInput = {
      workoutsCompleted: sessions.filter(s => new Date(s.completed_at) >= new Date(Date.now() - 7 * 86400000)).length,
      workoutsTarget: activePlan?.days_per_week || 4,
      seriesFailRate: 0.1,
      streak: streak,
      dietAdherencePct: 70,
      weightChange: 0,
      fatigueLevel: summary.overallLevel,
      avgRestOveruse: 0,
      abandonedWorkouts: 0,
    };
    checkAndTransition(perfInput);
  }, [sessions, loadingSessions]);

  // Cycle status + evolution timeline
  useEffect(() => {
    if (!activePlan || !user || loadingSessions) return;
    const status = getCycleStatus(activePlan.created_at);
    setCycleStatus(status);

    const fetchTimeline = async () => {
      const { data: histData } = await supabase
        .from("exercise_history")
        .select("weight, reps, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1000);
      const timeline = buildEvolutionTimeline(
        sessions.map(s => ({ completed_at: s.completed_at, exercises_completed: s.exercises_completed, exercises_total: s.exercises_total })),
        (histData || []).map((h: any) => ({ weight: h.weight, reps: h.reps, created_at: h.created_at })),
        activePlan.created_at,
        6
      );
      setEvolutionTimeline(timeline);
    };
    fetchTimeline();
  }, [activePlan, user, loadingSessions, sessions]);

  const nextDayIndex = useMemo(() => {
    if (!activePlanData) return 0;
    const todaySessions = sessions.filter(s => 
      s.workout_plan_id === activePlan?.id && 
      format(new Date(s.completed_at), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
    );
    if (todaySessions.length > 0) {
      const lastDone = Math.max(...todaySessions.map(s => s.day_index));
      return Math.min(lastDone + 1, activePlanData.length - 1);
    }
    // Find the last completed day index overall for this plan
    const planSessions = sessions.filter(s => s.workout_plan_id === activePlan?.id);
    if (planSessions.length === 0) return 0;
    const lastIndex = planSessions[0].day_index;
    return (lastIndex + 1) % activePlanData.length;
  }, [activePlanData, activePlan, sessions]);
  // Map current weekday to plan day index — only this day can be started
  const todayDayIndex = useMemo(() => {
    if (!activePlanData) return -1;
    const weekdays = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
    const todayWeekday = weekdays[new Date().getDay()];
    const idx = activePlanData.findIndex((day: any) => {
      const dayName = (day.dia || "").toLowerCase();
      return dayName.includes(todayWeekday) || dayName.includes(todayWeekday.replace("ç", "c"));
    });
    return idx >= 0 ? idx : nextDayIndex;
  }, [activePlanData, nextDayIndex]);

  const canStartDay = useCallback((dayIndex: number) => {
    return dayIndex === todayDayIndex && !todayCompleted;
  }, [todayDayIndex, todayCompleted]);

  const nextWorkout = activePlanData?.[todayDayIndex >= 0 ? todayDayIndex : nextDayIndex];

  // Progress for next workout
  const todayProgress = useMemo(() => {
    if (!activePlan) return 0;
    const todaySess = sessions.find(s =>
      s.workout_plan_id === activePlan.id &&
      s.day_index === nextDayIndex &&
      format(new Date(s.completed_at), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
    );
    if (!todaySess) return 0;
    return todaySess.exercises_total > 0 ? Math.round((todaySess.exercises_completed / todaySess.exercises_total) * 100) : 0;
  }, [activePlan, nextDayIndex, sessions]);

  // Calendar data
  const calendarDays = useMemo(() => {
    const start = startOfMonth(calendarMonth);
    const end = endOfMonth(calendarMonth);
    return eachDayOfInterval({ start, end });
  }, [calendarMonth]);

  const sessionDates = useMemo(() => {
    return new Set(sessions.map(s => format(new Date(s.completed_at), "yyyy-MM-dd")));
  }, [sessions]);

  const selectedDaySessions = useMemo(() => {
    if (!selectedCalendarDay) return [];
    const key = format(selectedCalendarDay, "yyyy-MM-dd");
    return sessions.filter(s => format(new Date(s.completed_at), "yyyy-MM-dd") === key);
  }, [selectedCalendarDay, sessions]);

  // Stats
  const totalCompleted = sessions.length;
  const avgExercises = sessions.length > 0 ? Math.round(sessions.reduce((a, s) => a + s.exercises_completed, 0) / sessions.length) : 0;

  // Check if a workout is "in progress" (started today but not finished all exercises)
  const inProgressDay = useMemo(() => {
    if (!activePlan || !activePlanData) return null;
    const todayKey = format(new Date(), "yyyy-MM-dd");
    const todaySess = sessions.find(s =>
      s.workout_plan_id === activePlan.id &&
      format(new Date(s.completed_at), "yyyy-MM-dd") === todayKey &&
      s.exercises_completed < s.exercises_total
    );
    if (todaySess) return todaySess.day_index;
    return null;
  }, [activePlan, activePlanData, sessions]);

  // Muscle group icons & gradients
  const muscleGroupIcons: Record<string, string> = {
    peito: "💪", costas: "🏋️", pernas: "🦵", ombros: "🎯",
    biceps: "💪", triceps: "💪", abdomen: "🔥", hiit: "⚡",
    cardio: "🏃", corpo: "🏆", full: "🏆",
  };
  const getMuscleIcon = (grupo: string) => {
    const g = grupo.toLowerCase();
    for (const [key, icon] of Object.entries(muscleGroupIcons)) {
      if (g.includes(key)) return icon;
    }
    return "💪";
  };
  const muscleGradients: Record<string, string> = {
    peito: "from-red-500/20 to-red-600/5",
    costas: "from-blue-500/20 to-blue-600/5",
    pernas: "from-purple-500/20 to-purple-600/5",
    ombros: "from-amber-500/20 to-amber-600/5",
    biceps: "from-pink-500/20 to-pink-600/5",
    triceps: "from-cyan-500/20 to-cyan-600/5",
    abdomen: "from-green-500/20 to-green-600/5",
  };
  const getGradient = (grupo: string) => {
    const g = grupo.toLowerCase();
    for (const [key, grad] of Object.entries(muscleGradients)) {
      if (g.includes(key)) return grad;
    }
    return "from-primary/20 to-primary/5";
  };

  // Intensity badge helper
  const getIntensityBadge = (intensidade?: DayIntensity) => {
    if (!intensidade) return null;
    const config = {
      pesado: { icon: "🔥", label: "Pesado", className: "text-orange-400 bg-orange-500/15 border-orange-500/20" },
      moderado: { icon: "⚡", label: "Moderado", className: "text-amber-400 bg-amber-500/15 border-amber-500/20" },
      leve: { icon: "🌿", label: "Leve", className: "text-emerald-400 bg-emerald-500/15 border-emerald-500/20" },
    };
    const c = config[intensidade];
    return (
      <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${c.className}`}>
        {c.icon} {c.label}
      </span>
    );
  };


  const handleGenerate = () => {
    if (!objetivo || !nivel || !dias) { toast.error("Preencha todos os campos"); return; }
    if (!profile?.gender) {
      toast.error("Defina seu sexo no Perfil Fitness para gerar um treino personalizado.", { duration: 5000 });
      return;
    }
    setGenerating(true);
    setTimeout(() => {
      try {
        const prefs: ExercisePreferences | undefined = (preferredExercises.length > 0 || preferenceText.trim())
          ? { preferred: preferredExercises, freeText: preferenceText.trim() || undefined }
          : undefined;
        const genderToUse = profile.gender as UserGender;
        const plan = generateWorkoutPlan(objetivo as any, nivel as any, Number(dias), foco, cardioFreq, intensityLevel, prefs, genderToUse);
        setGeneratedPlan(plan);
        setShowPlan(true);
        setViewingSaved(null);
        setExpandedDay(0);
        toast.success("Plano gerado com sucesso!");
      } catch { toast.error("Erro ao gerar plano."); }
      finally { setGenerating(false); }
    }, 800);
  };

  const handleSave = async () => {
    if (!user || generatedPlan.length === 0) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("workout_plans").insert({
        user_id: user.id, objective: objetivo, experience_level: nivel,
        days_per_week: Number(dias), body_focus: foco, plan_data: generatedPlan,
      } as any);
      if (error) throw error;
      toast.success("Plano salvo!");
      invalidateCache(CACHE_KEYS.workoutPlans(user.id));
      const { data } = await supabase.from("workout_plans").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setSavedPlans(data || []);
      writeCache(CACHE_KEYS.workoutPlans(user.id), data || []);
      setView("dashboard");
      setShowPlan(false);
    } catch { toast.error("Erro ao salvar plano."); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("workout_plans").delete().eq("id", id);
      if (error) throw error;
      setSavedPlans(savedPlans.filter(p => p.id !== id));
      if (viewingSaved?.id === id) setViewingSaved(null);
      toast.success("Plano excluído");
    } catch { toast.error("Erro ao excluir plano"); }
  };

  const startWorkout = useCallback((plan: any, dayIndex: number) => {
    if (todayCompleted) {
      toast.info("✅ Treino de hoje concluído. Continue amanhã!", { duration: 4000 });
      return;
    }
    // Overtraining check
    const planData = plan.plan_data as any[];
    const targetGroup = planData[dayIndex]?.grupo || "";
    const overtrainCheck = checkOvertrain(
      targetGroup,
      sessions.map(s => ({ muscle_group: s.muscle_group, completed_at: s.completed_at }))
    );
    if (!overtrainCheck.safe) {
      toast.warning(`⚠️ ${overtrainCheck.warning}`, { duration: 5000 });
      // Allow but warn — don't block
    }
    // Fatigue check
    const grupo = targetGroup.toLowerCase();
    let muscleKey = "geral";
    const muscleGroupIcons2: Record<string, string> = { peito: "peito", costas: "costas", pernas: "pernas", ombros: "ombros", biceps: "biceps", triceps: "triceps", abdomen: "abdomen" };
    for (const [key] of Object.entries(muscleGroupIcons2)) {
      if (grupo.includes(key)) { muscleKey = key; break; }
    }
    const fatigueCheck = shouldTrainGroup(muscleKey);
    if (fatigueCheck.fatigue.level === "extreme") {
      toast.warning(`${fatigueCheck.fatigue.emoji} Fadiga extrema em ${muscleKey}. ${fatigueCheck.alternativeMessage}`, { duration: 6000 });
    } else if (fatigueCheck.fatigue.level === "high") {
      toast.info(`${fatigueCheck.fatigue.emoji} Fadiga alta em ${muscleKey}. O treino será ajustado automaticamente.`, { duration: 4000 });
    }
    setExecutingPlan(plan);
    setExecutingDayIndex(dayIndex);
    setCompletedExercises(new Set());
    setExecutionKey(k => k + 1);
    setView("execution");
  }, [todayCompleted, sessions]);

  const toggleExercise = (index: number) => {
    setCompletedExercises(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const finishWorkout = async () => {
    if (!user || !executingPlan) return;
    const planData = executingPlan.plan_data as any[];
    const day = planData[executingDayIndex];
    try {
      const { error } = await supabase.from("workout_sessions").insert({
        user_id: user.id,
        workout_plan_id: executingPlan.id,
        day_index: executingDayIndex,
        day_name: day.dia,
        muscle_group: day.grupo,
        exercises_completed: completedExercises.size,
        exercises_total: day.exercicios.length,
      } as any);
      if (error) throw error;
      // Refresh sessions
      const { data } = await supabase.from("workout_sessions").select("*").eq("user_id", user.id).order("completed_at", { ascending: false });
      setSessions((data as WorkoutSession[]) || []);
      writeCache(CACHE_KEYS.workoutSessions(user.id), data || []);
      toast.success("Treino concluído! 💪");
      setView("dashboard");
    } catch { toast.error("Erro ao salvar sessão"); }
  };

  // ==================== PRE-CARDIO VIEW ====================
  if (view === "pre-cardio" && pendingCardio) {
    return (
      <CardioSession
        onFinish={() => {
          toast.success("🔥 Cardio concluído! Iniciando treino...", { duration: 3000 });
          const { plan, dayIndex } = pendingCardio;
          setPendingCardio(null);
          setExecutingPlan(plan);
          setExecutingDayIndex(dayIndex);
          setCompletedExercises(new Set());
          setExecutionKey(k => k + 1);
          setView("execution");
        }}
        onBack={() => {
          setPendingCardio(null);
          setView("dashboard");
        }}
      />
    );
  }

  // ==================== EXECUTION VIEW ====================
  if (view === "execution" && executingPlan) {
    return (
      <WorkoutExecution
        key={`workout-${executionKey}-${executingDayIndex}`}
        plan={executingPlan}
        dayIndex={executingDayIndex}
        userId={user!.id}
        experienceLevel={profile?.experience_level || "intermediario"}
        trainingLocation={profile?.training_location || undefined}
        objective={profile?.objective || undefined}
        cycleStatus={cycleStatus || undefined}
        comebackStatus={comebackStatus || undefined}
        onFinish={async () => {
          const { data } = await supabase.from("workout_sessions").select("*").eq("user_id", user!.id).order("completed_at", { ascending: false });
          const newSessions = (data as WorkoutSession[]) || [];
          setSessions(newSessions);
          
          // Track comeback progress
          if (comebackStatus?.isInComebackMode) {
            const newCount = comebackWorkouts + 1;
            setComebackWorkouts(newCount);
            const feedback = getComebackFeedback(comebackStatus.daysSinceLastWorkout, newCount);
            toast.success(`${feedback.emoji} ${feedback.title}`, { description: feedback.description, duration: 5000 });
          } else {
            // Normal motivational message with streak info
            const uniqueDays = [...new Set(newSessions.map(s => format(new Date(s.completed_at), "yyyy-MM-dd")))].sort().reverse();
            let newStreak = 0;
            const today = format(new Date(), "yyyy-MM-dd");
            const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
            if (uniqueDays[0] === today || uniqueDays[0] === yesterday) {
              for (let i = 0; i < uniqueDays.length; i++) {
                const expected = format(subDays(new Date(), i + (uniqueDays[0] === today ? 0 : 1)), "yyyy-MM-dd");
                if (uniqueDays[i] === expected) newStreak++;
                else break;
              }
            }
            const msg = getMotivationalMessage(newStreak);
            toast.success(`${msg.emoji} ${msg.text}`, { description: msg.streakText, duration: 5000 });
          }
          
          setView("dashboard");
        }}
        onBack={() => setView("dashboard")}
      />
    );
  }

  // ==================== CHOOSER VIEW ====================
  if (view === "chooser") {
    return (
      <PlanSourceChoice
        type="treino"
        onChooseAI={() => setView("generator")}
        onChoosePDF={() => setView("pdf-upload")}
        onBack={() => setView("dashboard")}
      />
    );
  }

  // ==================== PDF UPLOAD VIEW ====================
  if (view === "pdf-upload") {
    return (
      <PdfUploadFlow
        type="treino"
        onBack={() => setView("chooser")}
        onComplete={() => setView("dashboard")}
      />
    );
  }

  // ==================== GENERATOR VIEW ====================
  if (view === "generator") {
    const displayPlan = viewingSaved ? (viewingSaved.plan_data as any[]) : generatedPlan;
    const showDisplay = (showPlan && generatedPlan.length > 0) || viewingSaved;

    return (
      <div className="space-y-7 animate-slide-up w-full">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => { setView("dashboard"); setShowPlan(false); setViewingSaved(null); }}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight">Criar Treino</h1>
            <p className="text-muted-foreground text-sm mt-1">Monte seu plano personalizado</p>
          </div>
        </div>

        <div className="glass-card p-5 lg:p-6">
          <h3 className="font-display font-semibold text-sm mb-4 text-muted-foreground uppercase tracking-wider">Configurar Treino</h3>
          <div className="grid sm:grid-cols-3 gap-4 mb-5">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Objetivo</label>
              <Select value={objetivo} onValueChange={setObjetivo}>
                <SelectTrigger className="bg-secondary/50 border-border/50"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="emagrecer">Emagrecer</SelectItem>
                  <SelectItem value="massa">Ganhar Massa</SelectItem>
                  <SelectItem value="condicionamento">Condicionamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Nível</label>
              <Select value={nivel} onValueChange={setNivel}>
                <SelectTrigger className="bg-secondary/50 border-border/50"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="iniciante">Iniciante</SelectItem>
                  <SelectItem value="intermediario">Intermediário</SelectItem>
                  <SelectItem value="avancado">Avançado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Dias/Semana</label>
              <Select value={dias} onValueChange={setDias}>
                <SelectTrigger className="bg-secondary/50 border-border/50"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 dias</SelectItem>
                  <SelectItem value="4">4 dias</SelectItem>
                  <SelectItem value="5">5 dias</SelectItem>
                  <SelectItem value="6">6 dias</SelectItem>
                  <SelectItem value="7">7 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mb-5">
            <label className="text-xs font-medium text-muted-foreground mb-3 block">Foco do Treino</label>
            <RadioGroup value={foco} onValueChange={(v) => setFoco(v as BodyFocus)} className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="completo" id="foco-completo" />
                <Label htmlFor="foco-completo" className="text-sm cursor-pointer">Corpo Completo</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="superior" id="foco-superior" />
                <Label htmlFor="foco-superior" className="text-sm cursor-pointer">Corpo Superior</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="inferior" id="foco-inferior" />
                <Label htmlFor="foco-inferior" className="text-sm cursor-pointer">Corpo Inferior</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Gender notice */}
          {!profile?.gender && (
            <div className="mb-5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-amber-300">Sexo não definido</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Defina seu sexo no <button onClick={() => navigate("/perfil-fitness")} className="text-primary underline">Perfil Fitness</button> para gerar um treino personalizado.</p>
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block flex items-center gap-1.5">
                Frequência de Cardio
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">Inteligente</span>
              </label>
              <Select value={cardioFreq} onValueChange={(v) => setCardioFreq(v as CardioFrequency)}>
                <SelectTrigger className="bg-secondary/50 border-border/50"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Não faço cardio</SelectItem>
                  <SelectItem value="1-2">1–2x por semana</SelectItem>
                  <SelectItem value="3-4">3–4x por semana</SelectItem>
                  <SelectItem value="daily">Todos os dias</SelectItem>
                </SelectContent>
              </Select>
              {cardioFreq !== "0" && (
                <p className="text-[10px] text-muted-foreground mt-1.5 italic">
                  💡 O cardio será adaptado ao seu objetivo e nível. Dias de perna recebem cardio leve automaticamente.
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Intensidade Geral</label>
              <Select value={intensityLevel} onValueChange={(v) => setIntensityLevel(v as IntensityLevel)}>
                <SelectTrigger className="bg-secondary/50 border-border/50"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="moderado">Moderado — volume equilibrado, recuperação facilitada</SelectItem>
                  <SelectItem value="intenso">Intenso — maior volume, descanso menor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Exercise Preferences (optional) */}
          <div className="mb-5">
            <button
              type="button"
              onClick={() => setShowPreferences(!showPreferences)}
              className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Preferências de exercícios (opcional)</span>
              {showPreferences ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            
            {showPreferences && (
              <div className="mt-3 space-y-3 animate-slide-up">
                <p className="text-[11px] text-muted-foreground">
                  Selecione máquinas ou exercícios que você prefere. Eles terão prioridade parcial na montagem do treino, sem comprometer a qualidade.
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Supino com Barra", "Supino com Halteres", "Leg Press", "Cadeira Extensora",
                    "Cadeira Flexora", "Puxada Alta", "Remada Baixa", "Elevação Lateral",
                    "Desenvolvimento com Halteres", "Esteira", "Bicicleta", "Peso Corporal",
                    "Cross Over", "Smith Machine", "Agachamento Livre", "Stiff",
                    "Hip Thrust", "Rosca Direta", "Tríceps Corda", "Face Pull"
                  ].map((exercise) => {
                    const isSelected = preferredExercises.includes(exercise);
                    return (
                      <button
                        key={exercise}
                        type="button"
                        onClick={() => {
                          setPreferredExercises(prev =>
                            isSelected ? prev.filter(e => e !== exercise) : [...prev, exercise]
                          );
                        }}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                          isSelected
                            ? "bg-primary/15 border-primary/30 text-primary font-medium"
                            : "bg-secondary/40 border-border/50 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                        }`}
                      >
                        {isSelected && <span className="mr-1">✓</span>}
                        {exercise}
                      </button>
                    );
                  })}
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">Outras preferências (opcional)</label>
                  <input
                    type="text"
                    value={preferenceText}
                    onChange={(e) => setPreferenceText(e.target.value)}
                    placeholder="Ex: prefiro cabos, evitar exercícios no chão..."
                    maxLength={200}
                    className="flex h-9 w-full rounded-md border border-input bg-secondary/50 px-3 py-1 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
                {preferredExercises.length > 0 && (
                  <p className="text-[10px] text-primary font-medium">
                    {preferredExercises.length} preferência{preferredExercises.length > 1 ? "s" : ""} selecionada{preferredExercises.length > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            )}
          </div>

          <Button onClick={handleGenerate} disabled={!objetivo || !nivel || !dias || generating} className="w-full sm:w-auto">
            {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
            {generating ? "Gerando..." : "Gerar Plano de Treino"}
          </Button>
        </div>

        {/* Saved Plans */}
        {loadingPlans ? (
          <TreinoPlansSkeleton />
        ) : savedPlans.length > 0 && (
          <div className="glass-card p-5 lg:p-6">
            <h3 className="font-display font-semibold text-sm mb-4 text-muted-foreground uppercase tracking-wider">Planos Salvos</h3>
            <div className="space-y-2">
              {savedPlans.map((sp) => (
                <div key={sp.id} className={`flex items-center justify-between p-3.5 rounded-xl transition-all cursor-pointer ${viewingSaved?.id === sp.id ? "bg-primary/8 border border-primary/20" : "bg-secondary/40 hover:bg-secondary/60 border border-transparent"}`}
                  onClick={() => { setViewingSaved(sp); setShowPlan(false); setExpandedDay(0); }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Dumbbell className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium capitalize">{sp.objective} — {sp.experience_level} • {sp.body_focus === "superior" ? "Superior" : sp.body_focus === "inferior" ? "Inferior" : "Completo"}</p>
                      <p className="text-[11px] text-muted-foreground">{new Date(sp.created_at).toLocaleDateString("pt-BR")} • {sp.days_per_week} dias/sem</p>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(sp.id); }} className="text-muted-foreground hover:text-destructive p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Plan Display */}
        {showDisplay && displayPlan.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display font-semibold text-lg">{viewingSaved ? "Plano Salvo" : "Seu Plano Semanal"}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Foco: {(viewingSaved?.body_focus || foco) === "superior" ? "Corpo Superior" : (viewingSaved?.body_focus || foco) === "inferior" ? "Corpo Inferior" : "Corpo Completo"}
                </p>
                {profile?.gender && (
                  <p className="text-[10px] mt-1 font-medium text-primary flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    Plano personalizado para seu perfil corporal e objetivo
                  </p>
                )}
              </div>
              {!viewingSaved && showPlan && (
                <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {saving ? "Salvando..." : "Salvar Plano"}
                </Button>
              )}
            </div>
            {displayPlan.map((day: any, i: number) => (
              <div key={i} className="glass-card overflow-hidden">
                <button onClick={() => setExpandedDay(expandedDay === i ? null : i)} className="w-full flex items-center justify-between p-4 lg:p-5 hover:bg-secondary/20 transition-colors">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                      <Dumbbell className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{day.dia}</p>
                        {getIntensityBadge(day.intensidade)}
                      </div>
                      <p className="text-xs text-muted-foreground">{day.grupo}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-muted-foreground hidden sm:block px-2 py-1 rounded-md bg-secondary/50">{day.exercicios.length} exercícios</span>
                    {expandedDay === i ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>
                {expandedDay === i && (
                  <div className="px-4 lg:px-5 pb-4 lg:pb-5 space-y-2.5 border-t border-border/50">
                    {day.exercicios.map((ex: any, j: number) => (
                      <div key={j} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 rounded-xl bg-secondary/30 mt-2.5 first:mt-3">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{ex.nome}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{ex.desc}</p>
                        </div>
                        <div className="flex gap-3 text-[11px] shrink-0">
                          <div className="flex items-center gap-1 text-primary font-medium px-2 py-1 rounded-md bg-primary/8">
                            <Clock className="w-3 h-3" /><span>{ex.series}x{ex.reps}</span>
                          </div>
                          {ex.descanso && ex.descanso !== "—" && (
                            <div className="flex items-center gap-1 text-muted-foreground px-2 py-1 rounded-md bg-secondary/50">
                              <Timer className="w-3 h-3" /><span>{ex.descanso}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }


  // ==================== DASHBOARD VIEW ====================
  return (
    <>
    <GateModal />
    <div className="space-y-6 animate-slide-up w-full">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6" style={{ background: 'linear-gradient(135deg, hsl(var(--card)), hsl(var(--card) / 0.7))' }}>
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, hsl(var(--primary)), transparent 50%)' }} />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold mb-1">FitPulse</p>
            <h1 className="text-3xl lg:text-4xl font-display font-black tracking-tight leading-none">Treino</h1>
            <p className="text-muted-foreground text-sm mt-1.5">Sua jornada fitness começa aqui</p>
          </div>
          <Button
            onClick={() => guardAction(() => setView("chooser"))}
            className="h-12 w-full sm:w-auto px-6 rounded-2xl font-bold text-sm shadow-xl active:scale-[0.97] transition-all border-0"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))',
              boxShadow: '0 8px 32px -8px hsl(var(--primary) / 0.35)',
            }}
          >
            <Zap className="w-4 h-4 mr-1.5" /> Novo Plano
          </Button>
        </div>
      </div>

      {loadingPlans || loadingSessions ? (
        <TreinoDashboardSkeleton />
      ) : !activePlan ? (
        <div className="rounded-2xl border border-border/30 p-10 flex flex-col items-center text-center" style={{ background: 'linear-gradient(145deg, hsl(var(--card)), hsl(var(--card) / 0.6))' }}>
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5 shadow-xl border border-primary/10" style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.05))' }}>
            <Dumbbell className="w-10 h-10 text-primary" />
          </div>
          <h3 className="font-display font-black text-2xl mb-2">Crie seu primeiro plano</h3>
          <p className="text-muted-foreground text-sm mb-8 max-w-xs">Nosso gerador inteligente monta um treino personalizado para seu objetivo e nível.</p>
          <button onClick={() => guardAction(() => setView("chooser"))} className="btn-premium flex items-center justify-center gap-2">
            <Zap className="w-5 h-5" /> Criar Plano de Treino
          </button>
        </div>
      ) : (
        <>
          {/* Continue Workout Banner */}
          {inProgressDay !== null && activePlanData && (
            <div className="glass-card p-5 relative overflow-hidden border border-amber-500/20 animate-fade-in">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-orange-500/5" />
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center shadow-lg">
                    <Play className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Treino em andamento</p>
                    <p className="text-xs text-muted-foreground">{activePlanData[inProgressDay].dia} — {activePlanData[inProgressDay].grupo}</p>
                  </div>
                </div>
                <Button onClick={() => startWorkout(activePlan, inProgressDay)} className="h-11 px-6 font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0">
                  <Play className="w-4 h-4 mr-2" /> Continuar
                </Button>
              </div>
            </div>
          )}

          {/* Comeback Mode Banner */}
          {comebackStatus && comebackStatus.level === "comeback" && comebackStatus.isInComebackMode && (
            <div className="glass-card p-5 relative overflow-hidden border border-primary/20 animate-fade-in">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-chart-2/5" />
              <div className="relative z-10">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-chart-2/10 flex items-center justify-center shadow-lg shrink-0">
                    <span className="text-2xl">🔥</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold flex items-center gap-2">
                      Modo Retomada
                      <span className="text-[9px] uppercase tracking-wider text-primary font-bold px-2 py-0.5 rounded-md bg-primary/10 border border-primary/15">Ativo</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {comebackStatus.message}
                    </p>
                  </div>
                </div>
                {/* Comeback progress */}
                {(() => {
                  const progress = getComebackProgress(comebackWorkouts, comebackStatus.comebackDaysRemaining + comebackWorkouts);
                  return (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] text-muted-foreground">Progresso de retomada</span>
                        <span className="text-[11px] font-bold text-primary">{progress.workoutsCompleted}/{progress.workoutsNeeded} treinos</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-chart-2 rounded-full transition-all duration-700" style={{ width: `${progress.progressPct}%` }} />
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-muted-foreground italic">💡 Consistência é mais importante que intensidade.</span>
                      </div>
                    </div>
                  );
                })()}
                {/* Adjustments summary */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-chart-2/10 text-chart-2">
                    ↓ Volume -{Math.round(comebackStatus.volumeReduction * 100)}%
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-chart-2/10 text-chart-2">
                    ↓ Intensidade reduzida
                  </span>
                  {comebackStatus.cardioReduction && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-chart-2/10 text-chart-2">
                      🚶 Cardio leve apenas
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Alert Level (light warning, not comeback) */}
          {comebackStatus && comebackStatus.level === "alert" && (
            <div className="glass-card p-4 border border-amber-500/15">
              <div className="flex items-center gap-3">
                <span className="text-lg">{comebackStatus.messageEmoji}</span>
                <div>
                  <p className="text-sm font-medium">{comebackStatus.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 italic">{comebackStatus.tooltip}</p>
                </div>
              </div>
            </div>
          )}

          {/* Muscle Fatigue Alert */}
          {fatigueSummary && fatigueSummary.fatigued.length > 0 && (
            <TooltipProvider>
              <div className="glass-card p-4 lg:p-5 border border-amber-500/15 animate-fade-in">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/5 flex items-center justify-center shrink-0">
                    <span className="text-lg">⚠️</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold flex items-center gap-2">
                      Fadiga Muscular Detectada
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-[9px] uppercase tracking-wider text-amber-400 font-bold px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/15 cursor-help">
                            Proteção
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs max-w-[200px]">Consistência é mais importante que intensidade. O sistema protege seus músculos automaticamente.</p>
                        </TooltipContent>
                      </Tooltip>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Seus músculos precisam recuperar. Vamos ajustar o treino para manter evolução sem risco.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {fatigueSummary.fatigued.map(f => (
                    <span key={f.group} className={`text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 ${
                      f.level === "extreme"
                        ? "bg-destructive/10 text-destructive border border-destructive/15"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/15"
                    }`}>
                      {f.emoji} {f.group} — {f.label}
                      <span className="text-muted-foreground">({f.weeklysets}/{f.maxWeeklySets} séries)</span>
                    </span>
                  ))}
                </div>
                {fatigueSummary.adjustment && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {fatigueSummary.adjustment.setsReduction > 0 && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-chart-2/10 text-chart-2">
                        ↓ Séries -{Math.round(fatigueSummary.adjustment.setsReduction * 100)}%
                      </span>
                    )}
                    {fatigueSummary.adjustment.loadReduction > 0 && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-chart-2/10 text-chart-2">
                        ↓ Carga -{Math.round(fatigueSummary.adjustment.loadReduction * 100)}%
                      </span>
                    )}
                    {fatigueSummary.adjustment.restIncrease > 0 && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-chart-2/10 text-chart-2">
                        ↑ Descanso +{fatigueSummary.adjustment.restIncrease}s
                      </span>
                    )}
                    {fatigueSummary.adjustment.blockHeavy && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-destructive/10 text-destructive">
                        🚫 Treino pesado bloqueado
                      </span>
                    )}
                  </div>
                )}
                <div className="mt-2.5 p-2 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-[10px] text-muted-foreground italic">💡 Consistência é mais importante que intensidade.</p>
                </div>
              </div>
            </TooltipProvider>
          )}

          {/* Smart Recovery Alert */}
          {recoverySummary && (recoverySummary.showAlert || recoverySummary.showConsecutiveWarning) && (
            <div className="glass-card p-4 lg:p-5 border border-primary/15 animate-fade-in relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-chart-2/3 opacity-60" />
              <div className="relative z-10">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-chart-2/10 flex items-center justify-center shrink-0">
                    <Heart className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold">{recoverySummary.alertTitle}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{recoverySummary.alertMessage}</p>
                  </div>
                </div>

                {/* Load indicator bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-muted-foreground">Carga semanal</span>
                    <span className={`text-[10px] font-bold ${
                      recoverySummary.load.level === "overload" ? "text-destructive" :
                      recoverySummary.load.level === "attention" ? "text-amber-400" : "text-primary"
                    }`}>
                      {recoverySummary.load.emoji} {recoverySummary.load.totalPoints}/{recoverySummary.load.maxPoints} pts
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${
                      recoverySummary.load.level === "overload" ? "bg-gradient-to-r from-destructive to-orange-500" :
                      recoverySummary.load.level === "attention" ? "bg-gradient-to-r from-amber-500 to-orange-400" :
                      "bg-gradient-to-r from-primary to-chart-2"
                    }`} style={{ width: `${Math.min(100, (recoverySummary.load.totalPoints / recoverySummary.load.maxPoints) * 100)}%` }} />
                  </div>
                </div>

                {recoverySummary.consecutiveXPReduction && (
                  <div className="mt-2 p-2 rounded-lg bg-destructive/5 border border-destructive/10">
                    <p className="text-[10px] text-destructive font-medium">⚠️ XP reduzido em 20% — treinar sem descanso reduz seus ganhos.</p>
                  </div>
                )}

                {/* Recovery action buttons */}
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {recoverySummary.actions.map(action => (
                    <button
                      key={action.id}
                      onClick={() => {
                        if (action.id === "regenerative") {
                          setShowRegenerativeWorkout(true);
                        }
                        acceptRecoveryToday();
                        toast.success(`+${10} XP bônus por recuperação inteligente! 🧘`, { duration: 4000 });
                        // Refresh recovery summary
                        const sessionData = sessions.map(s => ({ completed_at: s.completed_at, muscle_group: s.muscle_group, intensity: undefined as string | undefined }));
                        setRecoverySummary(getRecoverySummary(sessionData));
                      }}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary/40 border border-border/30 hover:bg-secondary/60 hover:border-primary/20 transition-all"
                    >
                      <span className="text-lg">{action.emoji}</span>
                      <span className="text-[10px] font-medium text-foreground">{action.label}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-2.5 p-2 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-[10px] text-muted-foreground italic">💚 Recuperar faz parte da evolução. +10 XP bônus ao aceitar.</p>
                </div>
              </div>
            </div>
          )}

          {/* Regenerative Workout Modal */}
          {showRegenerativeWorkout && (() => {
            const regen = generateRegenerativeWorkout();
            return (
              <div className="glass-card p-4 lg:p-5 border-2 border-primary/20 animate-fade-in relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-chart-2/3" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-chart-2/10 flex items-center justify-center">
                        <span className="text-lg">🧘</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold">Treino Regenerativo</p>
                        <p className="text-[10px] text-muted-foreground">~20 min • Mobilidade + Core + Respiração</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => setShowRegenerativeWorkout(false)}>
                      ✕
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {regen.exercicios.map((ex, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border/20">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-[10px] font-bold text-primary">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{ex.nome}</p>
                          <p className="text-[10px] text-muted-foreground">{ex.series}x{ex.reps} {ex.descanso !== "—" ? `• ${ex.descanso}` : ""}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Periodization Cycle Card */}
          {activePlan && <PeriodizationCycleCard />}

          {/* Muscle Volume Card */}
          {activePlan && (
            <MuscleVolumeCard
              level={profile?.experience_level || "intermediario"}
              objective={profile?.objective || "hipertrofia"}
              bodyFocus={activePlan?.body_focus || "completo"}
            />
          )}

          {/* ===== AI HERO CARD — Next Workout ===== */}
          {nextWorkout && (
            <div className="hero-card">
              <div className="relative z-10 p-6">
                {/* AI Badge */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                    <Zap className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] uppercase tracking-[0.15em] text-primary font-bold">IA Recomenda</span>
                  </div>
                  {getIntensityBadge(nextWorkout.intensidade)}
                </div>

                {/* Workout Info */}
                <div className="flex items-start gap-4 mb-5">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getGradient(nextWorkout.grupo)} flex items-center justify-center border border-primary/10 shadow-xl shrink-0`}>
                    <span className="text-3xl">{getMuscleIcon(nextWorkout.grupo)}</span>
                  </div>
                  <div className="flex-1">
                    <h2 className="font-display font-bold text-2xl leading-tight">{nextWorkout.dia}</h2>
                    <p className="text-base text-muted-foreground mt-0.5">{nextWorkout.grupo}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-xs text-foreground/60 font-medium px-2.5 py-1 rounded-lg bg-secondary/60 border border-border/30">
                        <Dumbbell className="w-3.5 h-3.5 text-primary/70" /> {nextWorkout.exercicios.length} exercícios
                      </span>
                      <span className="flex items-center gap-1 text-xs text-foreground/60 font-medium px-2.5 py-1 rounded-lg bg-secondary/60 border border-border/30">
                        <Clock className="w-3.5 h-3.5 text-primary/70" /> ~{nextWorkout.exercicios.length * 5}min
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground font-medium">Progresso de hoje</span>
                    <span className="text-xs font-bold text-primary">{todayProgress}%</span>
                  </div>
                  <div className="h-3 bg-muted/60 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-700 ease-out shadow-[0_0_12px_hsl(var(--primary)/0.35)]" style={{ width: `${todayProgress}%` }} />
                  </div>
                </div>

                {/* Premium CTA */}
                <button 
                  onClick={() => startWorkout(activePlan, todayDayIndex >= 0 ? todayDayIndex : nextDayIndex)} 
                  className={`btn-premium flex items-center justify-center gap-2 ${todayCompleted ? 'opacity-60 cursor-not-allowed' : ''}`}
                  disabled={todayCompleted}
                  style={todayCompleted ? { background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', boxShadow: 'none' } : {}}
                >
                  {todayCompleted ? (
                    <><CheckCircle2 className="w-5 h-5" /> Treino Concluído Hoje</>
                  ) : (
                    <><Play className="w-5 h-5" /> Iniciar Treino</>
                  )}
                </button>
                
                {/* Warmup & Cardio */}
                {!todayCompleted && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button variant="outline" size="sm" className="text-xs rounded-xl border-border/50 hover:border-primary/30 hover:bg-primary/5"
                      onClick={() => toast.info("🔥 Aquecimento iniciado! Faça 5-10 min de mobilidade e cardio leve.", { duration: 5000 })}>
                      <Flame className="w-3.5 h-3.5 mr-1.5 text-primary" /> Iniciar Aquecimento
                    </Button>
                    {nextWorkout.grupo?.toLowerCase().includes("cardio") && (
                      <Button variant="outline" size="sm" className="text-xs rounded-xl border-border/50 hover:border-primary/30 hover:bg-primary/5"
                        onClick={() => {
                          const cardioInfo = nextWorkout.exercicios?.find((ex: any) => ["cardio","corrida","caminhada","hiit","bicicleta"].some(k => ex.nome?.toLowerCase().includes(k)));
                          toast.info(cardioInfo ? `🏃 Cardio: ${cardioInfo.nome} — ${cardioInfo.reps || "20min"}` : "🏃 Cardio do dia iniciado!", { duration: 5000 });
                        }}>
                        <Heart className="w-3.5 h-3.5 mr-1.5 text-primary" /> Iniciar Cardio
                      </Button>
                    )}
                    {!nextWorkout.grupo?.toLowerCase().includes("cardio") && nextWorkout.grupo?.toLowerCase().includes("+ cardio") && (
                      <Button variant="outline" size="sm" className="text-xs rounded-xl border-border/50 hover:border-primary/30 hover:bg-primary/5"
                        onClick={() => {
                          const cardioEx = nextWorkout.exercicios?.find((ex: any) => ["cardio","corrida","caminhada","hiit","bicicleta"].some(k => ex.nome?.toLowerCase().includes(k)));
                          toast.info(cardioEx ? `🏃 Cardio: ${cardioEx.nome} — ${cardioEx.reps || "15min"}` : "🏃 Cardio leve pós-treino — 15min", { duration: 5000 });
                        }}>
                        <Heart className="w-3.5 h-3.5 mr-1.5 text-primary" /> Iniciar Cardio
                      </Button>
                    )}
                  </div>
                )}

                {/* Ver treino em PDF */}
                {treinoPdfs.length > 0 && (
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs rounded-xl border-border/50 hover:border-primary/30 hover:bg-primary/5 w-full"
                      onClick={async () => {
                        const pdf = treinoPdfs[0];
                        const { data } = await supabase.storage.from("user-pdfs").createSignedUrl(pdf.file_path, 3600);
                        if (data?.signedUrl) setViewingPdf({ url: data.signedUrl, name: pdf.file_name });
                        else toast.error("Erro ao abrir PDF");
                      }}
                    >
                      <FileText className="w-3.5 h-3.5 mr-1.5 text-primary" /> Ver treino em PDF
                    </Button>
                  </div>
                )}

                {todayCompleted && (
                  <p className="text-xs text-primary mt-3 font-medium flex items-center gap-1.5 justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Treino de hoje concluído. Continue amanhã! 🔥
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Cycle Progression Status */}
          {cycleStatus && (
            <div className="glass-card p-4 lg:p-5 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-chart-2/5 opacity-50" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-chart-2/10 flex items-center justify-center">
                      <span className="text-lg">{cycleStatus.phaseEmoji}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold">{cycleStatus.phaseLabel}</p>
                        <span className="text-[9px] uppercase tracking-wider text-primary font-bold px-2 py-0.5 rounded-md bg-primary/10 border border-primary/15">
                          Semana {cycleStatus.currentWeek}/5
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{cycleStatus.phaseDescription}</p>
                    </div>
                  </div>
                  {cycleStatus.totalCycles > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <RotateCcw className="w-3 h-3" />
                      <span>{cycleStatus.totalCycles}º ciclo</span>
                    </div>
                  )}
                </div>
                {/* Cycle progress dots */}
                <div className="flex items-center gap-2 mt-3">
                  {(["adaptacao", "aumento", "moderado", "intenso", "deload"] as const).map((phase, i) => {
                    const isActive = i + 1 === cycleStatus.currentWeek;
                    const isPast = i + 1 < cycleStatus.currentWeek;
                    const labels = ["🌱", "📈", "⚡", "🔥", "🧘"];
                    return (
                      <div key={phase} className="flex-1 flex flex-col items-center gap-1">
                        <div className={`w-full h-2 rounded-full transition-all ${
                          isActive ? "bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.4)]" :
                          isPast ? "bg-primary/40" : "bg-muted"
                        }`} />
                        <span className={`text-[9px] ${isActive ? "font-bold text-foreground" : "text-muted-foreground"}`}>
                          {labels[i]}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {/* Adjustments summary */}
                {cycleStatus.phase !== "adaptacao" && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {cycleStatus.loadMultiplier !== 1.0 && (
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                        cycleStatus.loadMultiplier > 1 ? "bg-primary/10 text-primary" : "bg-chart-2/10 text-chart-2"
                      }`}>
                        {cycleStatus.loadMultiplier > 1 ? "↑" : "↓"} Carga {Math.round((cycleStatus.loadMultiplier - 1) * 100)}%
                      </span>
                    )}
                    {cycleStatus.volumeAdjust !== 0 && (
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                        cycleStatus.volumeAdjust > 0 ? "bg-primary/10 text-primary" : "bg-chart-2/10 text-chart-2"
                      }`}>
                        {cycleStatus.volumeAdjust > 0 ? "+" : ""}{cycleStatus.volumeAdjust} série
                      </span>
                    )}
                    {cycleStatus.restAdjust !== 0 && (
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                        cycleStatus.restAdjust < 0 ? "bg-orange-500/10 text-orange-400" : "bg-chart-2/10 text-chart-2"
                      }`}>
                        Descanso {cycleStatus.restAdjust > 0 ? "+" : ""}{cycleStatus.restAdjust}s
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Streak + Stats Row — Premium */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-border/30 p-4 relative overflow-hidden" style={{ background: 'linear-gradient(145deg, hsl(var(--card)), hsl(var(--card) / 0.6))' }}>
              <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-[0.06] -translate-y-4 translate-x-4 pointer-events-none" style={{ background: 'radial-gradient(circle, hsl(var(--primary)), transparent)' }} />
              <Flame className="w-5 h-5 text-primary mb-2" />
              <p className="text-3xl font-display font-black tracking-tight leading-none text-foreground">{streak}</p>
              <p className="text-[10px] text-muted-foreground mt-1.5 font-semibold uppercase tracking-wider">
                {streak > 0 ? "Sequência" : "Comece!"}
              </p>
            </div>
            <div className="rounded-2xl border border-border/30 p-4 relative overflow-hidden" style={{ background: 'linear-gradient(145deg, hsl(var(--card)), hsl(var(--card) / 0.6))' }}>
              <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-[0.06] -translate-y-4 translate-x-4 pointer-events-none" style={{ background: 'radial-gradient(circle, hsl(var(--primary)), transparent)' }} />
              <Trophy className="w-5 h-5 text-primary mb-2" />
              <p className="text-3xl font-display font-black tracking-tight leading-none text-foreground">{totalCompleted}</p>
              <p className="text-[10px] text-muted-foreground mt-1.5 font-semibold uppercase tracking-wider">Treinos</p>
            </div>
            <div className="rounded-2xl border border-border/30 p-4 relative overflow-hidden" style={{ background: 'linear-gradient(145deg, hsl(var(--card)), hsl(var(--card) / 0.6))' }}>
              <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-[0.06] -translate-y-4 translate-x-4 pointer-events-none" style={{ background: 'radial-gradient(circle, hsl(var(--primary)), transparent)' }} />
              <Dumbbell className="w-5 h-5 text-primary mb-2" />
              <p className="text-3xl font-display font-black tracking-tight leading-none text-foreground">{avgExercises}</p>
              <p className="text-[10px] text-muted-foreground mt-1.5 font-semibold uppercase tracking-wider">Média/Sessão</p>
            </div>
          </div>

          {/* Weekly Consistency — Premium */}
          <div className="rounded-2xl border border-border/30 p-5 relative overflow-hidden" style={{ background: 'linear-gradient(145deg, hsl(var(--card)), hsl(var(--card) / 0.6))' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-primary/10" style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.12), hsl(var(--primary) / 0.04))' }}>
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-display font-bold">Consistência Semanal</p>
                  <p className="text-[10px] text-muted-foreground">Meta semanal de treinos</p>
                </div>
              </div>
              <span className={`text-lg font-display font-black ${consistencyFeedback.color}`}>
                {weeklyConsistency.done}/{weeklyConsistency.target}
              </span>
            </div>
            <div className="h-2.5 bg-muted/40 rounded-full overflow-hidden mb-2.5">
              <div 
                className="h-full rounded-full transition-all duration-700 ease-out" 
                style={{ 
                  width: `${Math.min(100, (weeklyConsistency.done / weeklyConsistency.target) * 100)}%`,
                  background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.6))',
                  boxShadow: '0 0 12px hsl(var(--primary) / 0.3)',
                }} 
              />
            </div>
            <p className={`text-xs font-semibold ${consistencyFeedback.color}`}>
              {consistencyFeedback.emoji} {consistencyFeedback.text}
            </p>
          </div>


          {/* ===== PREMIUM PLAN DAYS CARDS ===== */}
          {activePlanData && (
            <div>
              <h3 className="font-display font-bold text-xs mb-4 text-muted-foreground uppercase tracking-[0.15em] flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-primary" /> Dias do Plano
              </h3>
              <div className="space-y-3">
                {activePlanData.map((day: any, i: number) => {
                  const isTodays = i === todayDayIndex;
                  const isCompleted = sessions.some(s =>
                    s.workout_plan_id === activePlan.id &&
                    s.day_index === i &&
                    format(new Date(s.completed_at), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
                  );
                  const canStart = canStartDay(i);
                  return (
                    <div
                      key={i}
                      className={`relative overflow-hidden rounded-2xl transition-all duration-300 active:scale-[0.98] ${
                        isTodays
                          ? "border-2 border-primary/30"
                          : isCompleted
                          ? "border border-green-500/25"
                          : "border border-border/30"
                      }`}
                      style={{
                        background: isTodays
                          ? 'linear-gradient(145deg, hsl(var(--card)), hsl(var(--card) / 0.8))'
                          : 'linear-gradient(145deg, hsl(var(--card) / 0.8), hsl(var(--card) / 0.5))',
                        boxShadow: isTodays
                          ? '0 4px 24px -4px hsl(var(--primary) / 0.12)'
                          : '0 2px 8px -2px hsl(var(--background) / 0.4)',
                        opacity: !isTodays && !isCompleted ? 0.65 : 1,
                        cursor: canStart ? 'pointer' : 'default',
                      }}
                      onClick={() => canStart && startWorkout(activePlan, i)}
                    >
                      {isTodays && (
                        <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-[0.06] pointer-events-none -translate-y-10 translate-x-10"
                             style={{ background: 'radial-gradient(circle, hsl(var(--primary)), transparent 70%)' }} />
                      )}
                      <div className="relative z-10 p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getGradient(day.grupo)} flex items-center justify-center border shrink-0 ${
                            isTodays ? "border-primary/20 shadow-lg" : "border-border/20"
                          }`}>
                            <span className="text-xl">{getMuscleIcon(day.grupo)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-display font-bold text-foreground">{day.dia}</p>
                              {getIntensityBadge(day.intensidade)}
                              {isTodays && !todayCompleted && (
                                <span className="text-[8px] uppercase tracking-[0.15em] text-primary font-black px-2 py-0.5 rounded-md bg-primary/10 border border-primary/15">Hoje</span>
                              )}
                              {isCompleted && (
                                <span className="text-[8px] uppercase tracking-[0.15em] text-green-400 font-black px-2 py-0.5 rounded-md bg-green-500/10 border border-green-500/15 flex items-center gap-0.5">
                                  <Check className="w-2.5 h-2.5" /> Feito
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground font-medium mt-0.5 flex items-center gap-1.5">
                              {day.grupo}
                              {(() => {
                                const sessionData = sessions.map(s => ({ completed_at: s.completed_at, muscle_group: s.muscle_group, intensity: undefined as string | undefined }));
                                const rl = getGroupRecoveryLevel(day.grupo, sessionData);
                                if (rl === "recovered") return <span className="text-[8px] px-1 py-0.5 rounded bg-primary/10 text-primary border border-primary/10">🟢</span>;
                                if (rl === "attention") return <span className="text-[8px] px-1 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/10">🟡</span>;
                                return <span className="text-[8px] px-1 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/10">🔴</span>;
                              })()}
                            </p>
                          </div>
                          {/* Right side: quick stats + action */}
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right hidden sm:block">
                              <p className="text-xs font-display font-bold text-foreground">{day.exercicios.length}</p>
                              <p className="text-[8px] text-muted-foreground">exerc.</p>
                            </div>
                            {canStart ? (
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-primary/20" style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.05))' }}>
                                <Play className="w-4 h-4 text-primary" />
                              </div>
                            ) : (
                              <Button variant="ghost" size="sm" className="h-10 w-10 rounded-xl p-0 text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); setFocusDay(day); }}>
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        {/* Bottom row: exercise count + time */}
                        <div className="flex items-center gap-2 mt-3 text-[10px] text-muted-foreground font-medium">
                          <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary/40 border border-border/20">
                            <Dumbbell className="w-3 h-3 text-primary/60" /> {day.exercicios.length} exercícios
                          </span>
                          <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary/40 border border-border/20">
                            <Clock className="w-3 h-3 text-primary/60" /> ~{day.exercicios.length * 5}min
                          </span>
                          {!isTodays && !isCompleted && (
                            <span className="ml-auto text-[9px] text-muted-foreground/60 font-medium">
                              Apenas visualizar
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Achievements Quick Card */}
          {(() => {
            const totalExCompleted = sessions.reduce((a, s) => a + s.exercises_completed, 0);
            const quickStats: UserStats = {
              totalWorkouts: sessions.length,
              currentStreak: streak,
              maxStreak: streak,
              totalProgressions: 0,
              totalExercisesCompleted: totalExCompleted,
              daysActive: new Set(sessions.map(s => format(new Date(s.completed_at), "yyyy-MM-dd"))).size,
              dietStreak: 0,
              dietMaxStreak: 0,
              dietPerfectDays: 0,
              dietWeeklyAdherence: 0,
            };
            const achievements = calculateAchievements(quickStats);
            const unlocked = achievements.filter(a => a.unlocked).length;
            const nextAchievement = achievements.find(a => !a.unlocked);
            return (
              <div className="rounded-2xl border border-border/30 p-4 cursor-pointer hover:border-primary/20 transition-all active:scale-[0.98]" style={{ background: 'linear-gradient(145deg, hsl(var(--card)), hsl(var(--card) / 0.6))' }} onClick={() => navigate("/conquistas")}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(45 93% 47% / 0.12), hsl(45 93% 47% / 0.04))' }}>
                      <Trophy className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-display font-bold">Conquistas</p>
                      <p className="text-[10px] text-muted-foreground">{unlocked}/{achievements.length} desbloqueadas</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-primary font-bold uppercase tracking-wider">Ver →</span>
                </div>
                {nextAchievement && (
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/30 border border-border/20">
                    <span className="text-lg">{nextAchievement.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{nextAchievement.title}</p>
                      <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden mt-1.5">
                        <div className="h-full rounded-full transition-all" style={{ width: `${nextAchievement.progress}%`, background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.5))' }} />
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-primary">{nextAchievement.progress}%</span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Weekly Evolution */}
          {weeklyEvolution && (
            <div className="rounded-2xl border border-border/30 p-4" style={{ background: 'linear-gradient(145deg, hsl(var(--card)), hsl(var(--card) / 0.6))' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(var(--chart-2) / 0.12), hsl(var(--chart-2) / 0.04))' }}>
                  <BarChart3 className="w-4 h-4 text-chart-2" />
                </div>
                <p className="text-sm font-display font-bold">Evolução Semanal</p>
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">Exercícios melhorados</span>
                  <span className="text-xs font-bold text-primary">{weeklyEvolution.exercisesImproved}/{weeklyEvolution.exercisesTotal}</span>
                </div>
                {weeklyEvolution.avgWeightIncrease > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">Aumento médio de carga</span>
                    <span className="text-xs font-bold text-primary">+{weeklyEvolution.avgWeightIncrease} kg</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">Consistência</span>
                  <span className="text-xs font-bold text-foreground">{weeklyEvolution.consistency}%</span>
                </div>
                <div className="h-2 bg-muted/40 rounded-full overflow-hidden mt-1">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${weeklyEvolution.consistency}%`, background: 'linear-gradient(90deg, hsl(var(--chart-2)), hsl(var(--chart-2) / 0.5))' }} />
                </div>
              </div>
            </div>
          )}

          {/* Evolution Timeline */}
          {evolutionTimeline.length > 0 && evolutionTimeline.some(e => e.sessionsCount > 0) && (
            <div className="rounded-2xl border border-border/30 p-4" style={{ background: 'linear-gradient(145deg, hsl(var(--card)), hsl(var(--card) / 0.6))' }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/15 to-chart-2/10 flex items-center justify-center">
                  <Activity className="w-4.5 h-4.5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Histórico de Evolução</p>
                  <p className="text-[10px] text-muted-foreground">Últimas {evolutionTimeline.length} semanas</p>
                </div>
              </div>
              <div className="space-y-2">
                {evolutionTimeline.map((entry, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-16 shrink-0">
                      <p className="text-[10px] text-muted-foreground font-medium">{entry.weekLabel}</p>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-primary to-chart-2 rounded-full transition-all duration-500" 
                               style={{ width: `${entry.consistency}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-foreground w-8 text-right">{entry.consistency}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px]">{entry.phaseEmoji}</span>
                        <span className="text-[9px] text-muted-foreground">{entry.phaseLabel}</span>
                        {entry.avgLoad > 0 && (
                          <span className="text-[9px] text-primary font-medium">~{entry.avgLoad}kg</span>
                        )}
                        <span className="text-[9px] text-muted-foreground">{entry.sessionsCount} treinos</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Calendar */}
          <div className="rounded-2xl border border-border/30 p-5" style={{ background: 'linear-gradient(145deg, hsl(var(--card)), hsl(var(--card) / 0.6))' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" /> Calendário de Treinos
              </h3>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}>
                  <ChevronDown className="w-4 h-4 rotate-90" />
                </Button>
                <span className="text-xs font-medium capitalize min-w-[100px] text-center">
                  {format(calendarMonth, "MMMM yyyy", { locale: ptBR })}
                </span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}>
                  <ChevronDown className="w-4 h-4 -rotate-90" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
                <div key={i} className="text-center text-[10px] text-muted-foreground font-medium py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: calendarDays[0]?.getDay() || 0 }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {calendarDays.map(day => {
                const key = format(day, "yyyy-MM-dd");
                const hasSession = sessionDates.has(key);
                const today = isToday(day);
                const selected = selectedCalendarDay && isSameDay(day, selectedCalendarDay);
                return (
                  <button key={key} onClick={() => setSelectedCalendarDay(selected ? null : day)}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all relative
                      ${today ? "ring-1 ring-primary/40" : ""}
                      ${selected ? "bg-primary/15 ring-1 ring-primary/30" : "hover:bg-secondary/50"}
                    `}>
                    <span className={`${hasSession ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{format(day, "d")}</span>
                    {hasSession && <div className="w-1.5 h-1.5 rounded-full bg-primary mt-0.5" />}
                  </button>
                );
              })}
            </div>
            {selectedCalendarDay && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <p className="text-xs font-medium mb-2 capitalize">{format(selectedCalendarDay, "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
                {selectedDaySessions.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground">Nenhum treino neste dia.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedDaySessions.map(s => (
                      <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Dumbbell className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{s.day_name} — {s.muscle_group}</p>
                          <p className="text-[11px] text-muted-foreground">{s.exercises_completed}/{s.exercises_total} exercícios</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Focus Mode for Workout Day — Print-ready modal */}
      <FocusMode open={!!focusDay} onClose={() => setFocusDay(null)}>
        {focusDay && (() => {
          const maxExercises = Math.min(focusDay.exercicios.length, 8);
          const visibleExercises = focusDay.exercicios
            .filter((ex: any) => !ex.nome?.toLowerCase().includes("aquecimento"))
            .slice(0, maxExercises);
          const hiddenCount = focusDay.exercicios.length - visibleExercises.length;
          const totalTime = focusDay.exercicios.length * 5;
          const focusIdx = activePlanData ? activePlanData.findIndex((d: any) => d.dia === focusDay.dia) : -1;
          const canStartThis = focusIdx >= 0 && canStartDay(focusIdx);

          return (
            <div
              className="rounded-2xl overflow-hidden border border-border/30"
              style={{
                background: "linear-gradient(145deg, hsl(225 16% 10%), hsl(225 16% 6%))",
                boxShadow: "0 25px 80px -20px hsl(152 69% 46% / 0.08), 0 0 60px -15px hsl(225 18% 3% / 0.8)",
                maxHeight: "calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 56px)",
              }}
            >
              {/* Header */}
              <div className="relative px-5 pt-5 pb-3">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/8 to-transparent rounded-t-2xl" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full blur-3xl opacity-15" style={{ background: "hsl(152 69% 46%)" }} />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[9px] uppercase tracking-[0.15em] text-primary font-bold px-2 py-0.5 rounded-md bg-primary/10 border border-primary/15">FitPulse</span>
                    {focusDay.intensidade && (() => {
                      const cfg: Record<string, { icon: string; label: string; cls: string }> = {
                        pesado: { icon: "🔥", label: "Pesado", cls: "text-orange-400 bg-orange-500/15 border-orange-500/20" },
                        moderado: { icon: "⚡", label: "Moderado", cls: "text-amber-400 bg-amber-500/15 border-amber-500/20" },
                        leve: { icon: "🌿", label: "Leve", cls: "text-emerald-400 bg-emerald-500/15 border-emerald-500/20" },
                      };
                      const c = cfg[focusDay.intensidade] || cfg.moderado;
                      return <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md border ${c.cls}`}>{c.icon} {c.label}</span>;
                    })()}
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getGradient(focusDay.grupo)} flex items-center justify-center border border-primary/10 shadow-lg shrink-0`}>
                      <span className="text-xl">{getMuscleIcon(focusDay.grupo)}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-display font-bold text-lg text-foreground leading-tight">{focusDay.dia}</h2>
                      <p className="text-xs text-muted-foreground truncate">{focusDay.grupo}</p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-center">
                        <p className="text-sm font-display font-bold text-primary">{focusDay.exercicios.length}</p>
                        <p className="text-[8px] text-muted-foreground leading-none">exerc.</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-display font-bold text-chart-2">~{totalTime}'</p>
                        <p className="text-[8px] text-muted-foreground leading-none">min</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Exercise list — compact, no scroll */}
              <div className="px-4 pb-2 space-y-1.5">
                {visibleExercises.map((ex: any, j: number) => (
                  <div key={j} className="flex items-center gap-2.5 py-2 px-3 rounded-lg border border-border/15" style={{ background: "hsl(225 14% 11% / 0.5)" }}>
                    <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-primary">{j + 1}</span>
                    </div>
                    <p className="text-[13px] font-medium text-foreground flex-1 min-w-0 truncate">{ex.nome}</p>
                    <span className="text-[11px] text-primary/80 font-medium shrink-0">{ex.series}×{ex.reps}</span>
                  </div>
                ))}
                {hiddenCount > 0 && (
                  <p className="text-[10px] text-muted-foreground text-center py-1">+{hiddenCount} exercício(s)</p>
                )}
              </div>

              {/* Bottom */}
              <div className="px-4 pb-4 pt-1 space-y-2">
                {canStartThis ? (
                  <Button
                    onClick={() => { setFocusDay(null); if (activePlan && activePlanData) { startWorkout(activePlan, focusIdx); } }}
                    className="w-full h-11 text-sm font-semibold bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 shadow-lg shadow-primary/20"
                  >
                    <Play className="w-4 h-4 mr-2" /> Iniciar Treino
                  </Button>
                ) : (
                  <div className="w-full h-10 flex items-center justify-center text-xs text-muted-foreground font-medium rounded-lg bg-muted/30 border border-border/30">
                    🔒 Disponível apenas no dia correspondente
                  </div>
                )}
                <div className="flex items-center justify-center gap-2 py-2 rounded-lg bg-secondary/15 border border-border/10">
                  <span className="text-[9px] text-muted-foreground tracking-wider uppercase">Plano gerado por</span>
                  <span className="text-[9px] font-bold text-primary tracking-wider uppercase">FitPulse</span>
                </div>
              </div>
            </div>
          );
        })()}
      </FocusMode>

      {/* PDF Viewer */}
      {viewingPdf && (
        <PdfViewer
          url={viewingPdf.url}
          fileName={viewingPdf.name}
          onClose={() => setViewingPdf(null)}
        />
      )}
    </div>
    </>
  );
};

export default Treino;
