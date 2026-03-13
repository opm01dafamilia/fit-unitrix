import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { Dumbbell, ChevronDown, ChevronUp, Zap, Clock, Trash2, Timer, Loader2, Flame, Trophy, CalendarDays, Play, Check, ArrowLeft, TrendingUp, BarChart3, Heart, AlertCircle, Eye, CheckCircle2, Target } from "lucide-react";
import WorkoutExecution from "@/components/WorkoutExecution";
import FocusMode from "@/components/FocusMode";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";
import { generateWorkoutPlan, BodyFocus, DayIntensity, CardioFrequency, IntensityLevel } from "@/lib/workoutGenerator";
import { Skeleton } from "@/components/ui/skeleton";
import { calculateWeeklyEvolution, type WeeklyEvolution } from "@/lib/progressionEngine";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, subDays, differenceInCalendarDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getInactivitySuggestion, type InactivitySuggestion } from "@/lib/workoutRecommendations";
import { calculateAchievements, getMotivationalMessage, type UserStats } from "@/lib/achievementsEngine";
import { useNavigate } from "react-router-dom";

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
  // View state
  const [view, setView] = useState<"dashboard" | "generator" | "execution">("dashboard");
  const [executionKey, setExecutionKey] = useState(0);
  // Generator state
  const [objetivo, setObjetivo] = useState("");
  const [nivel, setNivel] = useState("");
  const [dias, setDias] = useState("");
  const [foco, setFoco] = useState<BodyFocus>("completo");
  const [cardioFreq, setCardioFreq] = useState<CardioFrequency>("0");
  const [intensityLevel, setIntensityLevel] = useState<IntensityLevel>("intenso");
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

  // Pre-fill from profile
  useEffect(() => {
    if (profile?.objective) setObjetivo(profile.objective === "manter" ? "condicionamento" : profile.objective);
    if (profile?.experience_level) setNivel(profile.experience_level);
    if (profile?.experience_level) {
      const autoSuggest = profile.experience_level === "iniciante" ? "3" : profile.experience_level === "intermediario" ? "4" : "5";
      setDias(autoSuggest);
    }
  }, [profile]);

  // Fetch plans & sessions
  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      setLoadingPlans(true);
      setLoadingSessions(true);
      const [plansRes, sessionsRes] = await Promise.all([
        supabase.from("workout_plans").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("workout_sessions").select("*").eq("user_id", user.id).order("completed_at", { ascending: false }),
      ]);
      if (plansRes.error) toast.error("Erro ao carregar planos");
      setSavedPlans(plansRes.data || []);
      setSessions((sessionsRes.data as WorkoutSession[]) || []);
      setLoadingPlans(false);
      setLoadingSessions(false);
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

  // Inactivity suggestion
  const inactivitySuggestion = useMemo((): InactivitySuggestion | null => {
    if (sessions.length === 0) return getInactivitySuggestion(999);
    const lastSessionDate = new Date(sessions[0].completed_at);
    const daysSince = differenceInCalendarDays(new Date(), lastSessionDate);
    return getInactivitySuggestion(daysSince);
  }, [sessions]);

  // Active plan (most recent)
  const activePlan = savedPlans[0];
  const activePlanData = activePlan ? (activePlan.plan_data as any[]) : null;

  // Next workout day
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

  const nextWorkout = activePlanData?.[nextDayIndex];

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
    setGenerating(true);
    setTimeout(() => {
      try {
        const plan = generateWorkoutPlan(objetivo as any, nivel as any, Number(dias), foco, cardioFreq, intensityLevel);
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
      const { data } = await supabase.from("workout_plans").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setSavedPlans(data || []);
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
    // Set all execution state synchronously, then switch view
    setExecutingPlan(plan);
    setExecutingDayIndex(dayIndex);
    setCompletedExercises(new Set());
    setExecutionKey(k => k + 1);
    setView("execution");
  }, [todayCompleted]);

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
      toast.success("Treino concluído! 💪");
      setView("dashboard");
    } catch { toast.error("Erro ao salvar sessão"); }
  };

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
        onFinish={async () => {
          const { data } = await supabase.from("workout_sessions").select("*").eq("user_id", user!.id).order("completed_at", { ascending: false });
          const newSessions = (data as WorkoutSession[]) || [];
          setSessions(newSessions);
          
          // Motivational message with streak info
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
          
          setView("dashboard");
        }}
        onBack={() => setView("dashboard")}
      />
    );
  }

  // ==================== GENERATOR VIEW ====================
  if (view === "generator") {
    const displayPlan = viewingSaved ? (viewingSaved.plan_data as any[]) : generatedPlan;
    const showDisplay = (showPlan && generatedPlan.length > 0) || viewingSaved;

    return (
      <div className="space-y-7 animate-slide-up">
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

          <div className="grid sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Frequência de Cardio</label>
              <Select value={cardioFreq} onValueChange={(v) => setCardioFreq(v as CardioFrequency)}>
                <SelectTrigger className="bg-secondary/50 border-border/50"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sem cardio</SelectItem>
                  <SelectItem value="1-2">1–2x por semana</SelectItem>
                  <SelectItem value="3-4">3–4x por semana</SelectItem>
                  <SelectItem value="daily">Todos os dias</SelectItem>
                </SelectContent>
              </Select>
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

          <Button onClick={handleGenerate} disabled={!objetivo || !nivel || !dias || generating} className="w-full sm:w-auto">
            {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
            {generating ? "Gerando..." : "Gerar Plano de Treino"}
          </Button>
        </div>

        {/* Saved Plans */}
        {loadingPlans ? (
          <div className="glass-card p-5 lg:p-6 space-y-2">
            {[1,2].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
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
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight">Plano Ativo</h1>
          <p className="text-muted-foreground text-sm mt-1">Acesso rápido ao seu treino</p>
        </div>
        <Button onClick={() => setView("generator")} size="sm">
          <Zap className="w-4 h-4 mr-1.5" /> Novo Plano
        </Button>
      </div>

      {loadingPlans || loadingSessions ? (
        <div className="space-y-4">
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-14 h-14 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-40 rounded-lg" />
                <Skeleton className="h-3 w-24 rounded-lg" />
              </div>
              <Skeleton className="h-10 w-28 rounded-xl" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-5 space-y-3">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <Skeleton className="h-7 w-16 rounded-lg" />
              <Skeleton className="h-3 w-24 rounded-lg" />
            </div>
            <div className="glass-card p-5 space-y-3">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <Skeleton className="h-7 w-16 rounded-lg" />
              <Skeleton className="h-3 w-24 rounded-lg" />
            </div>
          </div>
          <div className="glass-card p-5 space-y-3">
            <Skeleton className="h-4 w-32 rounded-lg" />
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        </div>
      ) : !activePlan ? (
        <div className="empty-state py-16">
          <Dumbbell className="w-12 h-12 text-primary mx-auto mb-4 opacity-60" />
          <h3 className="font-display font-semibold text-lg mb-2">Nenhum plano ativo</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">Crie seu primeiro plano de treino personalizado para começar a acompanhar seu progresso.</p>
          <Button onClick={() => setView("generator")}>
            <Zap className="w-4 h-4 mr-2" /> Criar Plano de Treino
          </Button>
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

          {/* Next Workout Hero Card */}
          {nextWorkout && (
            <div className="glass-card p-6 lg:p-7 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-[0.08] pointer-events-none -translate-y-10 translate-x-10"
                   style={{ background: 'radial-gradient(circle, hsl(152 69% 46%), transparent 70%)' }} />
              <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full opacity-[0.04] pointer-events-none translate-y-6 -translate-x-6"
                   style={{ background: 'radial-gradient(circle, hsl(152 69% 46%), transparent 70%)' }} />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getGradient(nextWorkout.grupo)} flex items-center justify-center shadow-lg border border-primary/10`}>
                      <span className="text-2xl">{getMuscleIcon(nextWorkout.grupo)}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] uppercase tracking-wider text-primary font-bold px-2 py-0.5 rounded-md bg-primary/10 border border-primary/15">Próximo Treino</span>
                        {getIntensityBadge(nextWorkout.intensidade)}
                      </div>
                      <h2 className="font-display font-bold text-xl">{nextWorkout.dia}</h2>
                      <p className="text-sm text-muted-foreground">{nextWorkout.grupo} • {nextWorkout.exercicios.length} exercícios</p>
                    </div>
                  </div>
                </div>

                <div className="mb-5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-muted-foreground">Progresso de hoje</span>
                    <span className="text-xs font-bold text-primary">{todayProgress}%</span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-chart-2 rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_hsl(var(--primary)/0.3)]" style={{ width: `${todayProgress}%` }} />
                  </div>
                </div>

                <Button 
                  onClick={() => startWorkout(activePlan, nextDayIndex)} 
                  className="w-full sm:w-auto h-12 text-base font-semibold bg-gradient-to-r from-primary to-chart-2 hover:opacity-90 shadow-lg shadow-primary/20"
                  disabled={todayCompleted}
                >
                  {todayCompleted ? (
                    <><CheckCircle2 className="w-5 h-5 mr-2" /> Treino Concluído</>
                  ) : (
                    <><Play className="w-5 h-5 mr-2" /> Iniciar Treino</>
                  )}
                </Button>
                {todayCompleted && (
                  <p className="text-xs text-primary mt-3 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Treino de hoje concluído. Continue amanhã! 🔥
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Streak + Stats Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-4 lg:p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500/15 to-orange-500/5 flex items-center justify-center">
                  <Flame className="w-4.5 h-4.5 text-orange-400" />
                </div>
              </div>
              <p className="font-display font-bold text-2xl">{streak} <span className="text-sm font-normal text-muted-foreground">dias</span></p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {streak > 0 ? "Sequência ativa! 🔥" : "Treine hoje para iniciar sua sequência!"}
              </p>
            </div>
            <div className="glass-card p-4 lg:p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                  <Trophy className="w-4.5 h-4.5 text-primary" />
                </div>
              </div>
              <p className="font-display font-bold text-2xl">{totalCompleted}</p>
              <p className="text-[11px] text-muted-foreground mt-1">Treinos concluídos</p>
            </div>
          </div>

          {/* Weekly Consistency Counter */}
          <div className="glass-card p-4 lg:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-chart-2/15 to-chart-2/5 flex items-center justify-center">
                  <Target className="w-4.5 h-4.5 text-chart-2" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Consistência Semanal</p>
                  <p className="text-[10px] text-muted-foreground">Treinos esta semana</p>
                </div>
              </div>
              <span className={`text-sm font-bold ${consistencyFeedback.color}`}>
                {consistencyFeedback.emoji} {weeklyConsistency.done}/{weeklyConsistency.target}
              </span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-gradient-to-r from-chart-2 to-primary rounded-full transition-all duration-700 ease-out" 
                style={{ width: `${Math.min(100, (weeklyConsistency.done / weeklyConsistency.target) * 100)}%` }} 
              />
            </div>
            <p className={`text-[11px] font-medium ${consistencyFeedback.color}`}>
              {consistencyFeedback.text}
            </p>
          </div>

          {/* Inactivity Suggestion */}
          {inactivitySuggestion && (
            <div className="glass-card p-4 lg:p-5 border border-amber-500/20">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/15 to-amber-500/5 flex items-center justify-center shrink-0">
                  <span className="text-lg">{inactivitySuggestion.icone}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{inactivitySuggestion.titulo}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{inactivitySuggestion.desc}</p>
                </div>
                {activePlan && (
                  <Button size="sm" variant="outline" className="shrink-0 text-xs" onClick={() => startWorkout(activePlan, nextDayIndex)}>
                    <Play className="w-3 h-3 mr-1" /> Treinar
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* ===== PREMIUM PLAN DAYS CARDS ===== */}
          {activePlanData && (
            <div>
              <h3 className="font-display font-semibold text-sm mb-4 text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-primary" /> Dias do Plano
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activePlanData.map((day: any, i: number) => {
                  const isNext = i === nextDayIndex;
                  const isCompleted = sessions.some(s =>
                    s.workout_plan_id === activePlan.id &&
                    s.day_index === i &&
                    format(new Date(s.completed_at), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
                  );
                  return (
                    <div
                      key={i}
                      className={`relative overflow-hidden transition-all duration-300 hover:scale-[1.02] cursor-pointer group rounded-xl ${
                        isNext
                          ? "border-2 border-primary/30 shadow-[0_0_24px_-6px_hsl(var(--primary)/0.2)]"
                          : isCompleted
                          ? "border-2 border-green-500/25"
                          : "border border-border/50"
                      }`}
                      style={{
                        background: isNext
                          ? 'linear-gradient(145deg, hsl(225 16% 13% / 0.98), hsl(225 16% 9% / 0.98))'
                          : 'linear-gradient(145deg, hsl(225 16% 11% / 0.95), hsl(225 16% 7% / 0.95))',
                        boxShadow: isNext
                          ? '0 4px 24px -4px hsl(152 69% 46% / 0.12), 0 0 0 1px hsl(152 69% 46% / 0.08)'
                          : '0 4px 16px -4px hsl(225 18% 3% / 0.4)',
                        opacity: todayCompleted && !isCompleted ? 0.6 : 1,
                        cursor: todayCompleted ? 'default' : 'pointer',
                      }}
                      onClick={() => !todayCompleted && startWorkout(activePlan, i)}
                    >
                      {isNext && (
                        <div className="absolute top-0 right-0 w-28 h-28 rounded-full opacity-[0.08] pointer-events-none -translate-y-8 translate-x-8"
                             style={{ background: 'radial-gradient(circle, hsl(152 69% 46%), transparent 70%)' }} />
                      )}
                      <div className="relative z-10 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getGradient(day.grupo)} flex items-center justify-center shadow-lg border ${
                              isNext ? "border-primary/20 shadow-primary/10" : "border-border/30"
                            }`}>
                              <span className="text-xl">{getMuscleIcon(day.grupo)}</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-foreground">{day.dia}</p>
                                {getIntensityBadge(day.intensidade)}
                                {isNext && !todayCompleted && (
                                  <span className="text-[9px] uppercase tracking-wider text-primary font-bold px-2 py-0.5 rounded-md bg-primary/15 border border-primary/20">Próximo</span>
                                )}
                                {isCompleted && (
                                  <span className="text-[9px] uppercase tracking-wider text-green-400 font-bold px-2 py-0.5 rounded-md bg-green-500/15 border border-green-500/20 flex items-center gap-0.5">
                                    <Check className="w-2.5 h-2.5" /> Feito
                                  </span>
                                )}
                                {todayCompleted && !isCompleted && (
                                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold px-2 py-0.5 rounded-md bg-muted/50 border border-border/30">
                                    Amanhã
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-foreground/70 font-medium mt-0.5">{day.grupo}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-[11px] text-foreground/60 font-medium">
                            <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary/60 border border-border/30">
                              <Dumbbell className="w-3 h-3 text-primary/70" /> {day.exercicios.length} exercícios
                            </span>
                            <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary/60 border border-border/30">
                              <Clock className="w-3 h-3 text-primary/70" /> ~{day.exercicios.length * 5}min
                            </span>
                          </div>
                          <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm" className="text-xs text-foreground/60 hover:text-foreground h-8 px-2" onClick={(e) => { e.stopPropagation(); setFocusDay(day); }}>
                              <Eye className="w-3.5 h-3.5 mr-1" /> Ver
                            </Button>
                            {!todayCompleted && (
                              <Button variant="ghost" size="sm" className={`text-xs h-8 px-2 ${isNext ? "text-primary" : "text-foreground/60 hover:text-foreground"}`}>
                                <Play className="w-3.5 h-3.5 mr-1" /> Treinar
                              </Button>
                            )}
                          </div>
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
              <div className="glass-card p-4 lg:p-5 cursor-pointer hover:bg-secondary/20 transition-colors" onClick={() => navigate("/conquistas")}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/15 to-amber-500/5 flex items-center justify-center">
                      <Trophy className="w-4.5 h-4.5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Conquistas</p>
                      <p className="text-[10px] text-muted-foreground">{unlocked}/{achievements.length} desbloqueadas</p>
                    </div>
                  </div>
                  <span className="text-xs text-primary font-medium">Ver todas →</span>
                </div>
                {nextAchievement && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40">
                    <span className="text-lg">{nextAchievement.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{nextAchievement.title}</p>
                      <div className="h-1 bg-muted rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-primary/50 rounded-full" style={{ width: `${nextAchievement.progress}%` }} />
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{nextAchievement.progress}%</span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Avg exercises + Weekly Evolution */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-card p-4 lg:p-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                  <TrendingUp className="w-4.5 h-4.5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Média por sessão</p>
                  <p className="text-xs text-muted-foreground">{avgExercises} exercícios</p>
                </div>
              </div>
            </div>
            {weeklyEvolution && (
              <div className="glass-card p-4 lg:p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-chart-2/15 to-chart-2/5 flex items-center justify-center">
                    <BarChart3 className="w-4.5 h-4.5 text-chart-2" />
                  </div>
                  <p className="text-sm font-medium">Evolução Semanal</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">Exercícios melhorados</span>
                    <span className="text-xs font-semibold text-primary">{weeklyEvolution.exercisesImproved}/{weeklyEvolution.exercisesTotal}</span>
                  </div>
                  {weeklyEvolution.avgWeightIncrease > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">Aumento médio de carga</span>
                      <span className="text-xs font-semibold text-primary">+{weeklyEvolution.avgWeightIncrease} kg</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">Consistência</span>
                    <span className="text-xs font-semibold">{weeklyEvolution.consistency}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-chart-2 rounded-full transition-all duration-500" style={{ width: `${weeklyEvolution.consistency}%` }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Calendar */}
          <div className="glass-card p-5 lg:p-6">
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

      {/* Focus Mode for Workout Day */}
      <FocusMode open={!!focusDay} onClose={() => setFocusDay(null)}>
        {focusDay && (
          <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(145deg, hsl(225 16% 10%), hsl(225 16% 6%))' }}>
            {/* Header */}
            <div className="relative p-6 pb-5">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/8 to-transparent" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase tracking-[0.15em] text-primary font-bold px-2 py-0.5 rounded-md bg-primary/10 border border-primary/15">FitPulse</span>
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getGradient(focusDay.grupo)} flex items-center justify-center border border-primary/10 shadow-lg`}>
                    <span className="text-2xl">{getMuscleIcon(focusDay.grupo)}</span>
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-xl text-foreground">{focusDay.dia}</h2>
                    <p className="text-sm text-muted-foreground">{focusDay.grupo}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-0 border-y border-border/30">
              <div className="p-3 text-center border-r border-border/20">
                <p className="text-base font-display font-bold text-primary">{focusDay.exercicios.length}</p>
                <p className="text-[10px] text-muted-foreground">Exercícios</p>
              </div>
              <div className="p-3 text-center border-r border-border/20">
                <p className="text-base font-display font-bold text-chart-2">~{focusDay.exercicios.length * 5}min</p>
                <p className="text-[10px] text-muted-foreground">Duração</p>
              </div>
              <div className="p-3 text-center">
                <p className="text-base font-display font-bold text-chart-3">{focusDay.exercicios.reduce((a: number, ex: any) => a + (ex.series || 3), 0)}</p>
                <p className="text-[10px] text-muted-foreground">Séries</p>
              </div>
            </div>

            {/* Exercise list */}
            <div className="p-5 space-y-2.5">
              {focusDay.exercicios.map((ex: any, j: number) => (
                <div key={j} className="flex items-center gap-3 py-3 px-4 rounded-xl bg-secondary/30 border border-border/20">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Dumbbell className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{ex.nome}</p>
                    <p className="text-[11px] text-muted-foreground">{ex.series}x{ex.reps} {ex.descanso && ex.descanso !== "—" ? `• ${ex.descanso}` : ""}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Start button */}
            <div className="px-5 pb-5 space-y-3">
              <Button
                onClick={() => { setFocusDay(null); if (activePlan && activePlanData) { const idx = activePlanData.findIndex((d: any) => d.dia === focusDay.dia); startWorkout(activePlan, idx >= 0 ? idx : 0); } }}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-chart-2 hover:opacity-90 shadow-lg shadow-primary/20"
              >
                <Play className="w-5 h-5 mr-2" /> Iniciar Treino
              </Button>
              <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-secondary/20 border border-border/15">
                <span className="text-[10px] text-muted-foreground tracking-wider uppercase">Plano gerado por</span>
                <span className="text-[10px] font-bold text-primary tracking-wider uppercase">FitPulse</span>
              </div>
            </div>
          </div>
        )}
      </FocusMode>
    </div>
    
  );
};

export default Treino;
