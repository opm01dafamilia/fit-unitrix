import { useState, useEffect, useMemo } from "react";
import { Dumbbell, ChevronDown, ChevronUp, Zap, Clock, Trash2, Timer, Loader2, Flame, Trophy, CalendarDays, Play, Check, ArrowLeft, TrendingUp, BarChart3, Heart, AlertCircle } from "lucide-react";
import WorkoutExecution from "@/components/WorkoutExecution";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";
import { generateWorkoutPlan, BodyFocus } from "@/lib/workoutGenerator";
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
  // Generator state
  const [objetivo, setObjetivo] = useState("");
  const [nivel, setNivel] = useState("");
  const [dias, setDias] = useState("");
  const [foco, setFoco] = useState<BodyFocus>("completo");
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

  // Handlers
  const handleGenerate = () => {
    if (!objetivo || !nivel || !dias) { toast.error("Preencha todos os campos"); return; }
    setGenerating(true);
    setTimeout(() => {
      try {
        const plan = generateWorkoutPlan(objetivo as any, nivel as any, Number(dias), foco);
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

  const startWorkout = (plan: any, dayIndex: number) => {
    setExecutingPlan(plan);
    setExecutingDayIndex(dayIndex);
    setCompletedExercises(new Set());
    setView("execution");
  };

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
                      <p className="font-semibold text-sm">{day.dia}</p>
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
          <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight">Treinos</h1>
          <p className="text-muted-foreground text-sm mt-1">Seu painel de treinos personalizado</p>
        </div>
        <Button onClick={() => setView("generator")} size="sm">
          <Zap className="w-4 h-4 mr-1.5" /> Novo Plano
        </Button>
      </div>

      {loadingPlans || loadingSessions ? (
        <div className="space-y-4">
          <Skeleton className="h-44 rounded-2xl" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </div>
          <Skeleton className="h-64 rounded-2xl" />
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
          {/* Next Workout Card */}
          {nextWorkout && (
            <div className="glass-card p-5 lg:p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-[0.06] pointer-events-none -translate-y-8 translate-x-8"
                   style={{ background: 'radial-gradient(circle, hsl(152 69% 46%), transparent 70%)' }} />
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] uppercase tracking-wider text-primary font-semibold">Próximo Treino</span>
              </div>
              <h2 className="font-display font-bold text-xl mb-1">{nextWorkout.dia}</h2>
              <p className="text-sm text-muted-foreground mb-4">{nextWorkout.grupo}</p>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted-foreground">Progresso</span>
                  <span className="text-xs font-semibold text-primary">{todayProgress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${todayProgress}%` }} />
                </div>
              </div>

              <Button onClick={() => startWorkout(activePlan, nextDayIndex)} className="w-full sm:w-auto h-11">
                <Play className="w-4 h-4 mr-2" /> Começar Treino
              </Button>
            </div>
          )}

          {/* Streak + Stats Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Streak */}
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

            {/* Progress Stats */}
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

            {/* Weekly Evolution Card */}
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
              <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wider">Calendário de Treinos</h3>
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

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
                <div key={i} className="text-center text-[10px] text-muted-foreground font-medium py-1">{d}</div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for offset */}
              {Array.from({ length: calendarDays[0]?.getDay() || 0 }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {calendarDays.map(day => {
                const key = format(day, "yyyy-MM-dd");
                const hasSession = sessionDates.has(key);
                const today = isToday(day);
                const selected = selectedCalendarDay && isSameDay(day, selectedCalendarDay);

                return (
                  <button
                    key={key}
                    onClick={() => setSelectedCalendarDay(selected ? null : day)}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all relative
                      ${today ? "ring-1 ring-primary/40" : ""}
                      ${selected ? "bg-primary/15 ring-1 ring-primary/30" : "hover:bg-secondary/50"}
                    `}
                  >
                    <span className={`${hasSession ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                      {format(day, "d")}
                    </span>
                    {hasSession && (
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected day details */}
            {selectedCalendarDay && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <p className="text-xs font-medium mb-2 capitalize">
                  {format(selectedCalendarDay, "EEEE, d 'de' MMMM", { locale: ptBR })}
                </p>
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

          {/* All plan days quick access */}
          {activePlanData && (
            <div className="glass-card p-5 lg:p-6">
              <h3 className="font-display font-semibold text-sm mb-4 text-muted-foreground uppercase tracking-wider">Plano Ativo</h3>
              <div className="space-y-2">
                {activePlanData.map((day: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3.5 rounded-xl bg-secondary/40 hover:bg-secondary/60 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${i === nextDayIndex ? "bg-primary/15" : "bg-secondary/60"}`}>
                        <Dumbbell className={`w-4 h-4 ${i === nextDayIndex ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{day.dia} <span className="text-muted-foreground">—</span> {day.grupo}</p>
                        <p className="text-[11px] text-muted-foreground">{day.exercicios.length} exercícios</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => startWorkout(activePlan, i)}>
                      <Play className="w-3.5 h-3.5 mr-1" /> Treinar
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Treino;
