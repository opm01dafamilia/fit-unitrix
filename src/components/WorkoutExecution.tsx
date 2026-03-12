import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  ArrowLeft, ChevronLeft, ChevronRight, Clock, Timer, Trophy, Dumbbell,
  Info, RefreshCw, Plus, Pencil, Trash2, X, Check, Play, Pause, RotateCcw,
  TrendingUp, TrendingDown, Minus, History, Heart, Zap, Home, Target, Flame,
  CheckCircle2, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { calculateProgression, type ProgressionResult, type ExerciseHistoryEntry } from "@/lib/progressionEngine";
import { getAlternatives, getStretchingForDay, getCardioRecommendation, type CardioRecommendation } from "@/lib/workoutRecommendations";
import { exerciseLibrary, type ExerciseDetail } from "@/lib/exerciseLibrary";
import ExerciseAnimation from "@/components/ExerciseAnimation";
import MuscleBodyMap from "@/components/MuscleBodyMap";

const muscleGroupColors: Record<string, string> = {
  peito: "from-red-500/20 to-red-600/10",
  costas: "from-blue-500/20 to-blue-600/10",
  pernas: "from-purple-500/20 to-purple-600/10",
  ombros: "from-amber-500/20 to-amber-600/10",
  biceps: "from-pink-500/20 to-pink-600/10",
  triceps: "from-cyan-500/20 to-cyan-600/10",
  abdomen: "from-green-500/20 to-green-600/10",
  hiit: "from-orange-500/20 to-orange-600/10",
  cardio: "from-teal-500/20 to-teal-600/10",
};

type SetRecord = { id: string; kg: number; reps: number };
type Exercise = { nome: string; series: string; reps: string; desc: string; descanso: string };
type WorkoutDay = { dia: string; grupo: string; exercicios: Exercise[] };

type Props = {
  plan: any;
  dayIndex: number;
  userId: string;
  experienceLevel?: string;
  trainingLocation?: string;
  objective?: string;
  onFinish: () => void;
  onBack: () => void;
};

// === Phase enum for auto-flow ===
type WorkoutPhase = "input" | "resting" | "rest-done" | "exercise-done";

export default function WorkoutExecution({ plan, dayIndex, userId, experienceLevel = "intermediario", trainingLocation, objective, onFinish, onBack }: Props) {
  const planData = useMemo(() => plan.plan_data as WorkoutDay[], [plan]);
  const day = useMemo(() => planData[dayIndex], [planData, dayIndex]);
  const [isReady, setIsReady] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>(day?.exercicios || []);
  const [currentExIndex, setCurrentExIndex] = useState(0);
  const [sets, setSets] = useState<Record<number, SetRecord[]>>({});
  const [inputKg, setInputKg] = useState("");
  const [inputReps, setInputReps] = useState("");
  const [editingSet, setEditingSet] = useState<{ exIdx: number; setIdx: number } | null>(null);
  const [editKg, setEditKg] = useState("");
  const [editReps, setEditReps] = useState("");

  // Phase-based flow
  const [phase, setPhase] = useState<WorkoutPhase>("input");

  // Rest timer
  const [restTime, setRestTime] = useState(0);
  const [restPaused, setRestPaused] = useState(false);
  const [customRestSeconds, setCustomRestSeconds] = useState<number | null>(null);
  const [showRestConfig, setShowRestConfig] = useState(false);
  const restIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Workout timer
  const [workoutSeconds, setWorkoutSeconds] = useState(0);
  const workoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  // UI
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showStretching, setShowStretching] = useState(true);
  const [showCompletion, setShowCompletion] = useState(false);

  // Progression
  const [exerciseHistories, setExerciseHistories] = useState<Record<string, ExerciseHistoryEntry[]>>({});
  const [progressions, setProgressions] = useState<Record<string, ProgressionResult>>({});
  const [finishedFeedback, setFinishedFeedback] = useState<Record<number, boolean>>({});

  const currentEx = exercises[currentExIndex];
  const totalExercises = exercises.length;
  const currentSets = sets[currentExIndex] || [];
  const targetSeries = parseInt(currentEx.series) || 4;
  const targetReps = currentEx.reps;
  const effectiveRestSeconds = customRestSeconds ?? parseRestTime(currentEx.descanso);
  const currentProgression = progressions[currentEx.nome];
  const REST_OPTIONS = [30, 45, 60, 90, 120];

  const stretching = useMemo(() => getStretchingForDay(day?.grupo || ""), [day?.grupo]);
  const cardioRec = useMemo(() => getCardioRecommendation(objective), [objective]);

  // Initialize component - mark as ready after first render
  useEffect(() => {
    if (day && exercises.length > 0) {
      setIsReady(true);
    } else if (day) {
      setExercises(day.exercicios);
      setIsReady(true);
    }
  }, [day]);

  // Load exercise history
  useEffect(() => {
    const loadHistory = async () => {
      const exerciseNames = exercises.map(e => e.nome);
      const { data } = await supabase
        .from("exercise_history")
        .select("exercise_name, weight, reps, set_number, created_at")
        .eq("user_id", userId)
        .in("exercise_name", exerciseNames)
        .order("created_at", { ascending: false })
        .limit(500);
      if (!data) return;
      const grouped: Record<string, ExerciseHistoryEntry[]> = {};
      data.forEach((row: any) => {
        const name = row.exercise_name;
        if (!grouped[name]) grouped[name] = [];
        grouped[name].push({ weight: row.weight, reps: row.reps, set_number: row.set_number, created_at: row.created_at });
      });
      setExerciseHistories(grouped);
      const progs: Record<string, ProgressionResult> = {};
      exercises.forEach(ex => {
        const hist = grouped[ex.nome] || [];
        progs[ex.nome] = calculateProgression(hist, parseInt(ex.series) || 4, ex.reps, experienceLevel, ex.nome);
      });
      setProgressions(progs);
    };
    loadHistory();
  }, [userId, exercises, experienceLevel]);

  // Pre-fill recommended weight
  useEffect(() => {
    const prog = progressions[currentEx.nome];
    if (prog && prog.feedback !== "first_time" && !inputKg) {
      setInputKg(String(prog.recommendedWeight));
    }
  }, [currentExIndex, progressions, currentEx.nome]);

  // Workout timer
  useEffect(() => {
    workoutTimerRef.current = setInterval(() => setWorkoutSeconds(s => s + 1), 1000);
    return () => { if (workoutTimerRef.current) clearInterval(workoutTimerRef.current); };
  }, []);

  // Rest timer
  useEffect(() => {
    if (phase === "resting" && !restPaused && restTime > 0) {
      restIntervalRef.current = setInterval(() => {
        setRestTime(t => {
          if (t <= 1) {
            clearInterval(restIntervalRef.current!);
            setPhase("rest-done");
            if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
            try {
              const ctx = new AudioContext();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain); gain.connect(ctx.destination);
              osc.frequency.value = 880; gain.gain.value = 0.3;
              osc.start(); osc.stop(ctx.currentTime + 0.5);
              setTimeout(() => {
                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.connect(gain2); gain2.connect(ctx.destination);
                osc2.frequency.value = 1100; gain2.gain.value = 0.3;
                osc2.start(); osc2.stop(ctx.currentTime + 0.3);
              }, 600);
            } catch {}
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (restIntervalRef.current) clearInterval(restIntervalRef.current); };
  }, [phase, restPaused]);

  function parseRestTime(descanso: string): number {
    if (!descanso || descanso === "—") return 60;
    const match = descanso.match(/(\d+)/);
    return match ? parseInt(match[1]) : 60;
  }

  function formatTime(s: number): string {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  const primaryGroup = useMemo(() => {
    const grupo = day.grupo.toLowerCase();
    for (const key of Object.keys(muscleGroupColors)) {
      if (grupo.includes(key)) return key;
    }
    return "peito";
  }, [day.grupo]);

  const completedCount = useMemo(() => {
    return Object.entries(sets).filter(([_, s]) => s.length > 0).length;
  }, [sets]);

  const progress = totalExercises > 0 ? Math.round((completedCount / totalExercises) * 100) : 0;

  // === Add set & auto-flow ===
  const addSet = () => {
    const kg = parseFloat(inputKg) || 0;
    const reps = parseInt(inputReps) || 0;
    if (reps === 0) { toast.error("Informe as repetições"); return; }
    const newSet: SetRecord = { id: crypto.randomUUID(), kg, reps };
    setSets(prev => ({
      ...prev,
      [currentExIndex]: [...(prev[currentExIndex] || []), newSet],
    }));

    // Vibrate lightly on set completion
    if (navigator.vibrate) navigator.vibrate(50);

    setInputKg("");
    setInputReps("");

    const newSetsCount = (sets[currentExIndex] || []).length + 1;
    if (newSetsCount >= targetSeries) {
      // Exercise complete
      if (!finishedFeedback[currentExIndex]) {
        setFinishedFeedback(prev => ({ ...prev, [currentExIndex]: true }));
        const prog = progressions[currentEx.nome];
        if (prog && prog.feedback !== "first_time") {
          toast.success(`${prog.feedbackEmoji} ${prog.feedbackLabel}`, { duration: 4000 });
        }
      }
      setPhase("exercise-done");
    } else {
      // Auto-start rest
      setRestTime(effectiveRestSeconds);
      setRestPaused(false);
      setPhase("resting");
    }
  };

  const startManualRest = () => {
    setRestTime(effectiveRestSeconds);
    setRestPaused(false);
    setPhase("resting");
  };

  const startEdit = (setIdx: number) => {
    const s = currentSets[setIdx];
    setEditingSet({ exIdx: currentExIndex, setIdx });
    setEditKg(String(s.kg)); setEditReps(String(s.reps));
  };

  const saveEdit = () => {
    if (!editingSet) return;
    const kg = parseFloat(editKg) || 0;
    const reps = parseInt(editReps) || 0;
    setSets(prev => {
      const arr = [...(prev[editingSet.exIdx] || [])];
      arr[editingSet.setIdx] = { ...arr[editingSet.setIdx], kg, reps };
      return { ...prev, [editingSet.exIdx]: arr };
    });
    setEditingSet(null);
    toast.success("Série atualizada");
  };

  const deleteSet = (setIdx: number) => {
    setSets(prev => {
      const arr = [...(prev[currentExIndex] || [])];
      arr.splice(setIdx, 1);
      return { ...prev, [currentExIndex]: arr };
    });
    toast.success("Série removida");
  };

  const swapExercise = (newName: string) => {
    setExercises(prev => {
      const updated = [...prev];
      updated[currentExIndex] = { ...updated[currentExIndex], nome: newName };
      return updated;
    });
    setShowAlternatives(false);
    toast.success(`Exercício trocado para ${newName}`);
  };

  const goToExercise = (idx: number) => {
    setCurrentExIndex(idx);
    setPhase("input");
    setRestTime(0);
    setInputKg("");
    setInputReps("");
  };

  const goNext = () => {
    if (currentExIndex < totalExercises - 1) goToExercise(currentExIndex + 1);
  };

  const goPrev = () => {
    if (currentExIndex > 0) goToExercise(currentExIndex - 1);
  };

  const handleFinish = async () => {
    try {
      const { data: sessionData, error: sessionError } = await supabase.from("workout_sessions").insert({
        user_id: userId, workout_plan_id: plan.id, day_index: dayIndex,
        day_name: day.dia, muscle_group: day.grupo,
        exercises_completed: completedCount, exercises_total: totalExercises,
      } as any).select("id").single();
      if (sessionError) throw sessionError;

      const historyRows: any[] = [];
      Object.entries(sets).forEach(([exIdxStr, exSets]) => {
        const exIdx = parseInt(exIdxStr);
        const ex = exercises[exIdx];
        if (!ex) return;
        const grupo = day.grupo.toLowerCase();
        let muscleGroup = "geral";
        for (const key of Object.keys(muscleGroupColors)) {
          if (grupo.includes(key)) { muscleGroup = key; break; }
        }
        exSets.forEach((s, setIdx) => {
          historyRows.push({
            user_id: userId, exercise_name: ex.nome, muscle_group: muscleGroup,
            weight: s.kg, reps: s.reps, set_number: setIdx + 1,
            workout_session_id: sessionData?.id || null,
          });
        });
      });

      if (historyRows.length > 0) {
        const { error: histError } = await supabase.from("exercise_history").insert(historyRows as any);
        if (histError) console.error("Error saving exercise history:", histError);
      }
      setShowCompletion(true);
    } catch {
      toast.error("Erro ao salvar sessão");
    }
  };

  const alternatives = useMemo(() => getAlternatives(currentEx.nome, trainingLocation), [currentEx.nome, trainingLocation]);
  const toggleRestPause = () => setRestPaused(p => !p);
  const resetRest = () => { setRestTime(effectiveRestSeconds); setRestPaused(false); setPhase("resting"); };
  const skipRest = () => { setPhase("input"); setRestTime(0); };
  const addRestTime = (seconds: number) => setRestTime(t => t + seconds);

  const libraryExercise = useMemo(() => {
    const name = currentEx.nome.toLowerCase();
    return exerciseLibrary.find(e =>
      name.includes(e.nome.toLowerCase()) || e.nome.toLowerCase().includes(name)
    ) || null;
  }, [currentEx.nome]);

  const currentExHistory = exerciseHistories[currentEx.nome] || [];
  const recentSessions = useMemo(() => {
    if (currentExHistory.length === 0) return [];
    const byDate = new Map<string, ExerciseHistoryEntry[]>();
    currentExHistory.forEach(h => {
      const date = h.created_at.slice(0, 10);
      if (!byDate.has(date)) byDate.set(date, []);
      byDate.get(date)!.push(h);
    });
    return Array.from(byDate.entries()).slice(0, 3).map(([date, sets]) => ({
      date, maxWeight: Math.max(...sets.map(s => s.weight)),
      avgReps: Math.round(sets.reduce((a, s) => a + s.reps, 0) / sets.length),
      sets: sets.length,
    }));
  }, [currentExHistory]);

  const feedbackColor = currentProgression?.feedback === "increase"
    ? "text-primary bg-primary/10"
    : currentProgression?.feedback === "decrease"
    ? "text-destructive bg-destructive/10"
    : "text-muted-foreground bg-secondary/60";

  // Completion stats
  const totalSetsCompleted = Object.values(sets).reduce((a, exSets) => a + exSets.length, 0);
  const totalVolume = Object.values(sets).reduce((a, exSets) => a + exSets.reduce((b, s) => b + s.kg * s.reps, 0), 0);

  // ===== SERIES DOTS COMPONENT =====
  const SeriesDots = () => (
    <div className="flex items-center justify-center gap-2 py-2">
      {Array.from({ length: targetSeries }).map((_, i) => {
        const done = i < currentSets.length;
        return (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
              done
                ? "bg-primary border-primary scale-110 shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
                : "border-muted-foreground/30 bg-transparent"
            }`}
            style={done ? { animationDelay: `${i * 100}ms` } : {}}
          />
        );
      })}
      <span className="text-[11px] text-muted-foreground ml-2 font-medium">
        {currentSets.length}/{targetSeries}
      </span>
    </div>
  );

  // ===== LOADING / INITIALIZATION =====
  if (!isReady || !day) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4 shadow-lg">
          <Dumbbell className="w-8 h-8 text-primary animate-pulse" />
        </div>
        <p className="text-sm font-semibold text-foreground">Preparando treino...</p>
        <p className="text-xs text-muted-foreground mt-1">Carregando exercícios</p>
      </div>
    );
  }

  // ===== COMPLETION CELEBRATION SCREEN =====
  if (showCompletion) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center animate-scale-in px-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/5 blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-chart-4/5 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        </div>
        <div className="relative z-10 flex flex-col items-center max-w-sm w-full">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-yellow-500/20 to-orange-500/10 flex items-center justify-center mb-4 shadow-2xl border border-yellow-500/20">
            <Trophy className="w-12 h-12 text-yellow-500" />
          </div>
          <h1 className="font-display font-bold text-2xl text-center mb-1">Treino Concluído! 🎉</h1>
          <p className="text-muted-foreground text-sm text-center mb-6">Ótimo trabalho! Cada treino te deixa mais forte.</p>
          <div className="grid grid-cols-2 gap-3 w-full mb-6">
            <div className="glass-card p-4 flex flex-col items-center">
              <Dumbbell className="w-5 h-5 text-primary mb-2" />
              <span className="text-2xl font-display font-bold">{completedCount}</span>
              <span className="text-[10px] text-muted-foreground">Exercícios</span>
            </div>
            <div className="glass-card p-4 flex flex-col items-center">
              <Target className="w-5 h-5 text-chart-4 mb-2" />
              <span className="text-2xl font-display font-bold">{totalSetsCompleted}</span>
              <span className="text-[10px] text-muted-foreground">Séries</span>
            </div>
            <div className="glass-card p-4 flex flex-col items-center">
              <Clock className="w-5 h-5 text-chart-2 mb-2" />
              <span className="text-2xl font-display font-bold">{formatTime(workoutSeconds)}</span>
              <span className="text-[10px] text-muted-foreground">Duração</span>
            </div>
            <div className="glass-card p-4 flex flex-col items-center">
              <Flame className="w-5 h-5 text-orange-400 mb-2" />
              <span className="text-2xl font-display font-bold">{Math.round(totalVolume)}</span>
              <span className="text-[10px] text-muted-foreground">Volume (kg)</span>
            </div>
          </div>
          <div className="glass-card p-4 w-full mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">{day.dia}</span>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium">{day.grupo}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-chart-2 rounded-full" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">{completedCount} de {totalExercises} exercícios completados</p>
          </div>
          <Button className="w-full h-12 text-base font-semibold" onClick={onFinish}>
            <Home className="w-5 h-5 mr-2" /> Voltar ao Painel
          </Button>
        </div>
      </div>
    );
  }

  // ===== STRETCHING PRE-WORKOUT SCREEN =====
  if (showStretching && stretching.length > 0) {
    return (
      <div className="space-y-4 animate-slide-up pb-24">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <span className="text-primary font-display font-bold text-sm">Preparação</span>
              <p className="text-[11px] text-muted-foreground">{day.grupo}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-6 flex flex-col items-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/5 opacity-50" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-500/5 flex items-center justify-center mb-3 shadow-lg">
              <Heart className="w-9 h-9 text-green-500" />
            </div>
            <h2 className="font-display font-bold text-lg text-center">Alongamento Recomendado</h2>
            <p className="text-xs text-muted-foreground text-center mt-1">3–5 minutos para preparar seus músculos</p>
          </div>
        </div>
        <div className="glass-card p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Alongamentos para {day.grupo}</h3>
          <div className="space-y-2.5">
            {stretching.map((s, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/40">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0 mt-0.5"><span className="text-sm">🧘</span></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{s.nome}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{s.desc}</p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0 px-2 py-1 rounded-md bg-secondary/60">{s.duracao}</span>
              </div>
            ))}
          </div>
        </div>
        {cardioRec && (
          <div className="glass-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Cardio Sugerido</h3>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/40">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5"><span className="text-sm">🏃</span></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{cardioRec.titulo}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{cardioRec.desc}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] text-muted-foreground px-2 py-1 rounded-md bg-secondary/60 block">{cardioRec.duracao}</span>
                <span className="text-[9px] text-muted-foreground mt-1 block">{cardioRec.intensidade}</span>
              </div>
            </div>
          </div>
        )}
        {trainingLocation === "casa" && (
          <div className="glass-card p-3.5 flex items-center gap-3 border border-amber-500/20">
            <Home className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-[11px] text-muted-foreground">Treino adaptado para <span className="font-semibold text-foreground">casa</span>.</p>
          </div>
        )}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-lg border-t border-border/50 z-50">
          <div className="max-w-lg mx-auto flex gap-3">
            <Button variant="outline" className="flex-1 h-11" onClick={() => setShowStretching(false)}>Pular Aquecimento</Button>
            <Button className="flex-1 h-11" onClick={() => setShowStretching(false)}>
              <Play className="w-4 h-4 mr-2" /> Iniciar Treino
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-up pb-28">
      {/* ===== TOP PROGRESS BAR ===== */}
      <div className="glass-card p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <p className="text-xs font-display font-bold text-primary">
                Exercício {currentExIndex + 1} de {totalExercises}
              </p>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Timer className="w-3 h-3" /> {formatTime(workoutSeconds)}
                <span className="mx-1">•</span>
                {day.grupo}
                {trainingLocation === "casa" && <span className="ml-1">🏠</span>}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-primary">{progress}%</span>
        </div>
        {/* Full-width progress bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-chart-2 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Mini exercise dots */}
        <div className="flex gap-1 mt-2 justify-center">
          {exercises.map((_, i) => {
            const hasSets = (sets[i] || []).length > 0;
            const isCurrent = i === currentExIndex;
            return (
              <button
                key={i}
                onClick={() => goToExercise(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  isCurrent ? "bg-primary scale-125 shadow-[0_0_6px_hsl(var(--primary)/0.5)]" :
                  hasSets ? "bg-primary/50" : "bg-muted-foreground/20"
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* ===== EXERCISE HERO ===== */}
      <div className="glass-card p-5 flex flex-col items-center justify-center relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${muscleGroupColors[primaryGroup] || "from-primary/20 to-primary/5"} opacity-50`} />
        <div className="relative z-10 flex flex-col items-center w-full">
          {libraryExercise ? (
            <ExerciseAnimation exercise={libraryExercise} size="lg" className="mb-3" />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-3 shadow-lg">
              <Dumbbell className="w-10 h-10 text-primary" />
            </div>
          )}
          <h2 className="font-display font-bold text-lg text-center">{currentEx.nome}</h2>
          {libraryExercise && (
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
              <span className="flex items-center gap-1 text-[10px] font-semibold text-primary px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                <Target className="w-3 h-3" /> {libraryExercise.musculos[0]}
              </span>
              {libraryExercise.musculos.slice(1).map((m, i) => (
                <span key={i} className="text-[10px] text-muted-foreground px-2 py-0.5 rounded-full bg-secondary/60">{m}</span>
              ))}
            </div>
          )}
          {currentProgression && currentProgression.feedback !== "first_time" && (
            <div className={`mt-2.5 px-3 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 ${feedbackColor}`}>
              {currentProgression.feedback === "increase" && <TrendingUp className="w-3 h-3" />}
              {currentProgression.feedback === "decrease" && <TrendingDown className="w-3 h-3" />}
              {currentProgression.feedback === "maintain" && <Minus className="w-3 h-3" />}
              Peso recomendado: {currentProgression.recommendedWeight} kg
            </div>
          )}
        </div>
      </div>

      {/* ===== MUSCLE BODY MAP ===== */}
      {libraryExercise && (
        <div className="glass-card p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-primary" /> Músculos Ativados
          </h3>
          <div className="flex flex-row items-center gap-4">
            <MuscleBodyMap highlightedMuscles={libraryExercise.musculosDestacados} />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="p-2 rounded-lg bg-primary/8 border border-primary/15">
                <span className="text-[10px] uppercase tracking-wider text-primary font-semibold flex items-center gap-1">
                  <Target className="w-3 h-3" /> Principal
                </span>
                <p className="text-sm font-semibold mt-0.5">{libraryExercise.musculos[0]}</p>
              </div>
              {libraryExercise.musculos.length > 1 && (
                <div className="p-2 rounded-lg bg-secondary/40 border border-border/30">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Secundários</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {libraryExercise.musculos.slice(1).map((m, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-secondary/80 text-foreground/80 border border-border/30 font-medium">{m}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-secondary/60 text-muted-foreground border border-border/30 flex items-center gap-1">
                  <Dumbbell className="w-2.5 h-2.5" /> {libraryExercise.equipamento}
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-secondary/60 text-muted-foreground border border-border/30">
                  {libraryExercise.dificuldade}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== PROGRESSION FEEDBACK ===== */}
      {currentProgression && currentProgression.feedback !== "first_time" && (
        <div className={`glass-card p-3.5 flex items-center gap-3 ${
          currentProgression.feedback === "increase" ? "border border-primary/20" :
          currentProgression.feedback === "decrease" ? "border border-destructive/20" : "border border-border/50"
        }`}>
          <span className="text-lg">{currentProgression.feedbackEmoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">{currentProgression.feedbackLabel}</p>
            <p className="text-[10px] text-muted-foreground">Último: {currentProgression.lastWeight}kg • Melhor: {currentProgression.bestWeight}kg</p>
          </div>
        </div>
      )}

      {/* ===== SERIES DOTS + INDICATORS ===== */}
      <div className="glass-card p-4">
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-[3px] border-primary/30 flex items-center justify-center mb-1">
              <span className="font-display font-bold text-sm">{targetReps}</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">Reps</span>
          </div>
          <button onClick={() => setShowRestConfig(!showRestConfig)} className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 rounded-full border-[3px] border-amber-500/30 flex items-center justify-center mb-1">
              <span className="font-display font-bold text-sm">{effectiveRestSeconds}s</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">Descanso ⚙️</span>
          </button>
          <div className="flex flex-col items-center">
            <div className={`w-12 h-12 rounded-full border-[3px] flex items-center justify-center mb-1 ${
              currentSets.length >= targetSeries ? "border-green-500/50 shadow-[0_0_10px_hsl(152_69%_46%/0.3)]" : "border-muted-foreground/20"
            }`}>
              <span className="font-display font-bold text-sm">{currentSets.length}/{targetSeries}</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">Séries</span>
          </div>
        </div>
        {/* Series dots */}
        <SeriesDots />
      </div>

      {/* ===== REST CONFIG ===== */}
      {showRestConfig && (
        <div className="glass-card p-4 glow-border animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">⚙️ Tempo de Descanso</h3>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowRestConfig(false)}><X className="w-4 h-4" /></Button>
          </div>
          <div className="grid grid-cols-5 gap-2 mb-3">
            {REST_OPTIONS.map(sec => (
              <button key={sec} onClick={() => { setCustomRestSeconds(sec); setShowRestConfig(false); toast.success(`Descanso: ${sec}s`); }}
                className={`p-2.5 rounded-xl text-center text-sm font-display font-bold transition-colors ${
                  effectiveRestSeconds === sec ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-foreground hover:bg-secondary"
                }`}>{sec}s</button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Input type="number" placeholder="Personalizado (s)" className="h-9 bg-secondary/50 border-border/50 text-center text-sm"
              onKeyDown={e => {
                if (e.key === "Enter") {
                  const v = parseInt((e.target as HTMLInputElement).value);
                  if (v > 0) { setCustomRestSeconds(v); setShowRestConfig(false); toast.success(`Descanso: ${v}s`); }
                }
              }} />
            <span className="text-xs text-muted-foreground shrink-0">segundos</span>
          </div>
        </div>
      )}

      {/* ===== EXERCISE DONE CARD ===== */}
      {phase === "exercise-done" && (
        <div className="glass-card p-6 glow-border animate-scale-in border border-primary/20">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-chart-2/10 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-display font-bold text-lg">Exercício Concluído! ✅</h3>
            <p className="text-sm text-muted-foreground mt-1">{currentEx.nome}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {currentSets.length} séries • {currentSets.reduce((a, s) => a + s.kg * s.reps, 0).toFixed(0)}kg volume
            </p>
            <div className="flex gap-3 mt-5 w-full">
              {currentExIndex < totalExercises - 1 ? (
                <Button onClick={goNext} className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-primary to-chart-2 hover:opacity-90">
                  Próximo Exercício <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleFinish} className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-primary to-chart-2 hover:opacity-90">
                  <Trophy className="w-5 h-5 mr-2" /> Finalizar Treino
                </Button>
              )}
            </div>
            {currentSets.length < targetSeries && (
              <button onClick={() => setPhase("input")} className="text-xs text-muted-foreground mt-3 hover:text-foreground transition-colors">
                + Adicionar mais séries
              </button>
            )}
          </div>
        </div>
      )}

      {/* ===== REST DONE ALERT ===== */}
      {phase === "rest-done" && (
        <div className="glass-card p-5 glow-border animate-scale-in border border-primary/30">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3 animate-pulse">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-display font-bold text-lg">⏰ Descanso Finalizado!</h3>
            <p className="text-sm text-muted-foreground mt-1">Prepare-se para a próxima série 💪</p>
            <p className="text-xs text-muted-foreground mt-0.5">Série {currentSets.length + 1} de {targetSeries}</p>
            <Button onClick={() => setPhase("input")} className="mt-4 h-12 px-8 text-base font-semibold">
              <Play className="w-4 h-4 mr-2" /> Registrar Série
            </Button>
          </div>
        </div>
      )}

      {/* ===== REST TIMER ===== */}
      {phase === "resting" && (
        <div className="glass-card p-5 glow-border">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">⏱ Descanso</span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={() => addRestTime(15)}>+15s</Button>
              <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={skipRest}>Pular</Button>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="relative w-36 h-36 mb-4">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
                <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--primary))" strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 54}`}
                  strokeDashoffset={`${2 * Math.PI * 54 * (1 - (effectiveRestSeconds > 0 ? restTime / effectiveRestSeconds : 0))}`}
                  className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display font-bold text-3xl tabular-nums text-foreground">{formatTime(restTime)}</span>
                <span className="text-[10px] text-muted-foreground">restante</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Prepare-se para a próxima série</p>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-full" onClick={toggleRestPause}>
                {restPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </Button>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-full" onClick={resetRest}>
                <RotateCcw className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===== SET REGISTRATION (only in input phase) ===== */}
      {(phase === "input" || phase === "rest-done") && (
        <div className="glass-card p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            {currentSets.length === 0 ? "Registrar Primeira Série" : `Registrar Série ${currentSets.length + 1}`}
          </h3>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-muted-foreground mb-1 block">Quilos (kg)</label>
              <Input type="number"
                placeholder={currentProgression?.recommendedWeight ? String(currentProgression.recommendedWeight) : "0"}
                value={inputKg} onChange={e => setInputKg(e.target.value)}
                className="h-12 bg-secondary/50 border-border/50 text-center font-display font-bold text-lg" />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-muted-foreground mb-1 block">Repetições</label>
              <Input type="number" placeholder="0" value={inputReps} onChange={e => setInputReps(e.target.value)}
                className="h-12 bg-secondary/50 border-border/50 text-center font-display font-bold text-lg" />
            </div>
            <Button onClick={addSet} className="h-12 w-12 shrink-0" size="icon">
              <Plus className="w-5 h-5" />
            </Button>
          </div>
          {/* Manual rest button */}
          {currentSets.length > 0 && phase === "input" && currentSets.length < targetSeries && (
            <Button variant="outline" onClick={startManualRest} className="w-full mt-3 h-10 text-sm">
              <Timer className="w-4 h-4 mr-2" /> Iniciar Descanso ({effectiveRestSeconds}s)
            </Button>
          )}
        </div>
      )}

      {/* ===== SET HISTORY ===== */}
      {currentSets.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Séries Registradas</h3>
          <div className="space-y-2">
            {currentSets.map((s, idx) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 animate-fade-in">
                {editingSet?.exIdx === currentExIndex && editingSet?.setIdx === idx ? (
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-xs text-muted-foreground font-medium w-6">#{idx + 1}</span>
                    <Input type="number" value={editKg} onChange={e => setEditKg(e.target.value)} className="h-8 w-16 text-center text-xs bg-secondary/60" />
                    <span className="text-xs text-muted-foreground">kg ×</span>
                    <Input type="number" value={editReps} onChange={e => setEditReps(e.target.value)} className="h-8 w-16 text-center text-xs bg-secondary/60" />
                    <span className="text-xs text-muted-foreground">reps</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" onClick={saveEdit}><Check className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingSet(null)}><X className="w-3.5 h-3.5" /></Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-primary font-bold w-6">#{idx + 1}</span>
                      <span className="text-sm font-medium">{s.kg} kg × {s.reps} reps</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => startEdit(idx)}><Pencil className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteSet(idx)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== ACTION BUTTONS ===== */}
      <div className="grid grid-cols-3 gap-2">
        <Button variant="outline" className="h-11 text-xs" onClick={() => setShowAlternatives(true)}>
          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Trocar
        </Button>
        <Button variant="outline" className="h-11 text-xs" onClick={() => setShowInfo(!showInfo)}>
          <Info className="w-3.5 h-3.5 mr-1" /> Info
        </Button>
        <Button variant="outline" className="h-11 text-xs" onClick={() => setShowHistory(!showHistory)}>
          <History className="w-3.5 h-3.5 mr-1" /> Histórico
        </Button>
      </div>

      {/* ===== EXERCISE HISTORY PANEL ===== */}
      {showHistory && (
        <div className="glass-card p-4 glow-border animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold text-sm">Histórico do Exercício</h3>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowHistory(false)}><X className="w-4 h-4" /></Button>
          </div>
          {recentSessions.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum histórico encontrado.</p>
          ) : (
            <div className="space-y-2">
              {recentSessions.map((session, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-secondary/40">
                  <div>
                    <p className="text-xs font-medium">{new Date(session.date).toLocaleDateString("pt-BR")}</p>
                    <p className="text-[10px] text-muted-foreground">{session.sets} séries</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-display font-bold">{session.maxWeight} kg</p>
                    <p className="text-[10px] text-muted-foreground">~{session.avgReps} reps</p>
                  </div>
                </div>
              ))}
              {currentProgression && currentProgression.feedback !== "first_time" && (
                <div className="pt-2 border-t border-border/50 mt-2 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">Melhor peso</span>
                  <span className="text-sm font-display font-bold text-primary">{currentProgression.bestWeight} kg</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===== EXERCISE INFO PANEL ===== */}
      {showInfo && (
        <div className="glass-card p-4 glow-border animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold text-sm">Sobre o exercício</h3>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowInfo(false)}><X className="w-4 h-4" /></Button>
          </div>
          {libraryExercise ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-[10px] uppercase tracking-wider text-primary font-semibold mb-2">Execução Passo a Passo</h4>
                <div className="space-y-2">
                  {libraryExercise.instrucoes.map((inst, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                      <p className="text-xs text-muted-foreground leading-relaxed">{inst}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold mb-2">💡 Dicas</h4>
                <div className="space-y-1.5">
                  {libraryExercise.dicas.map((dica, i) => (
                    <p key={i} className="text-xs text-muted-foreground leading-relaxed pl-3 border-l-2 border-amber-500/30">{dica}</p>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
                <span className="text-[10px] px-2 py-1 rounded-md bg-secondary/60 text-muted-foreground">{libraryExercise.equipamento}</span>
                <span className="text-[10px] px-2 py-1 rounded-md bg-secondary/60 text-muted-foreground capitalize">{libraryExercise.dificuldade}</span>
                <span className="text-[10px] px-2 py-1 rounded-md bg-secondary/60 text-muted-foreground capitalize">{libraryExercise.tipo}</span>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground leading-relaxed">{currentEx.desc}</p>
              <div className="flex gap-3 mt-3 text-[11px]">
                <span className="flex items-center gap-1 text-primary font-medium px-2 py-1 rounded-md bg-primary/8">
                  <Clock className="w-3 h-3" />{currentEx.series}x{currentEx.reps}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== ALTERNATIVES PANEL ===== */}
      {showAlternatives && (
        <div className="glass-card p-4 glow-border animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold text-sm">Exercícios Alternativos</h3>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowAlternatives(false)}><X className="w-4 h-4" /></Button>
          </div>
          <div className="space-y-2">
            {alternatives.map((alt, i) => (
              <button key={i} onClick={() => swapExercise(alt.nome)}
                className="w-full text-left p-3 rounded-xl bg-secondary/40 hover:bg-secondary/60 transition-colors flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  {alt.tag?.includes("Casa") ? <Home className="w-3.5 h-3.5 text-amber-500" /> : <Dumbbell className="w-3.5 h-3.5 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{alt.nome}</span>
                    {alt.tag && <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary/80 text-muted-foreground font-medium">{alt.tag}</span>}
                  </div>
                  {alt.desc && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{alt.desc}</p>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===== BOTTOM NAVIGATION ===== */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-lg border-t border-border/50 z-50">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Button variant="outline" size="icon" className="h-11 w-11 shrink-0" onClick={goPrev} disabled={currentExIndex === 0}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          {currentExIndex === totalExercises - 1 && completedCount > 0 ? (
            <Button onClick={handleFinish} className="flex-1 h-11 font-semibold">
              <Trophy className="w-4 h-4 mr-2" /> Finalizar Treino
            </Button>
          ) : (
            <Button onClick={goNext} className="flex-1 h-11" disabled={currentExIndex >= totalExercises - 1}>
              Próximo Exercício <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
          <Button variant="outline" size="icon" className="h-11 w-11 shrink-0" onClick={goNext} disabled={currentExIndex >= totalExercises - 1}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
