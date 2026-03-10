import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  ArrowLeft, ChevronLeft, ChevronRight, Clock, Timer, Trophy, Dumbbell,
  Info, RefreshCw, Plus, Pencil, Trash2, X, Check, Play, Pause, RotateCcw,
  TrendingUp, TrendingDown, Minus, History, Heart, Zap, Home, Target, Flame
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

// Muscle group illustration mapping
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

const muscleGroupIcons: Record<string, string> = {
  peito: "💪", costas: "🔙", pernas: "🦵", ombros: "🏋️",
  biceps: "💪", triceps: "💪", abdomen: "🔥", hiit: "⚡", cardio: "🏃",
};

type SetRecord = {
  id: string;
  kg: number;
  reps: number;
};

type Exercise = {
  nome: string;
  series: string;
  reps: string;
  desc: string;
  descanso: string;
};

type WorkoutDay = {
  dia: string;
  grupo: string;
  exercicios: Exercise[];
};

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

export default function WorkoutExecution({ plan, dayIndex, userId, experienceLevel = "intermediario", trainingLocation, objective, onFinish, onBack }: Props) {
  const planData = plan.plan_data as WorkoutDay[];
  const day = planData[dayIndex];
  const [exercises, setExercises] = useState<Exercise[]>(day.exercicios);
  const [currentExIndex, setCurrentExIndex] = useState(0);
  const [sets, setSets] = useState<Record<number, SetRecord[]>>({});
  const [inputKg, setInputKg] = useState("");
  const [inputReps, setInputReps] = useState("");
  const [editingSet, setEditingSet] = useState<{ exIdx: number; setIdx: number } | null>(null);
  const [editKg, setEditKg] = useState("");
  const [editReps, setEditReps] = useState("");
  // Rest timer
  const [restTime, setRestTime] = useState(0);
  const [restActive, setRestActive] = useState(false);
  const [restPaused, setRestPaused] = useState(false);
  const [restFinished, setRestFinished] = useState(false);
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
  const [showStretching, setShowStretching] = useState(true); // Show stretching before workout
  const [showCardio, setShowCardio] = useState(false);
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
  const restSeconds = effectiveRestSeconds;
  const currentProgression = progressions[currentEx.nome];
  const REST_OPTIONS = [30, 45, 60, 90, 120];

  // Stretching & cardio data
  const stretching = useMemo(() => getStretchingForDay(day.grupo), [day.grupo]);
  const cardioRec = useMemo(() => getCardioRecommendation(objective), [objective]);

  // Load exercise history on mount
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
        grouped[name].push({
          weight: row.weight,
          reps: row.reps,
          set_number: row.set_number,
          created_at: row.created_at,
        });
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
    if (restActive && !restPaused && restTime > 0) {
      restIntervalRef.current = setInterval(() => {
        setRestTime(t => {
          if (t <= 1) {
            clearInterval(restIntervalRef.current!);
            setRestActive(false);
            setRestFinished(true);
            // Vibrate
            if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
            // Sound
            try {
              const ctx = new AudioContext();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.frequency.value = 880;
              gain.gain.value = 0.3;
              osc.start();
              osc.stop(ctx.currentTime + 0.5);
              setTimeout(() => {
                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.connect(gain2);
                gain2.connect(ctx.destination);
                osc2.frequency.value = 1100;
                gain2.gain.value = 0.3;
                osc2.start();
                osc2.stop(ctx.currentTime + 0.3);
              }, 600);
            } catch {}
            toast.info("⏰ Descanso finalizado! Hora da próxima série 💪");
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (restIntervalRef.current) clearInterval(restIntervalRef.current); };
  }, [restActive, restPaused]);

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

  // Add set
  const addSet = () => {
    const kg = parseFloat(inputKg) || 0;
    const reps = parseInt(inputReps) || 0;
    if (reps === 0) { toast.error("Informe as repetições"); return; }
    const newSet: SetRecord = { id: crypto.randomUUID(), kg, reps };
    setSets(prev => ({
      ...prev,
      [currentExIndex]: [...(prev[currentExIndex] || []), newSet],
    }));
    setInputKg("");
    setInputReps("");

    const newSetsCount = (sets[currentExIndex] || []).length + 1;
    if (newSetsCount >= targetSeries && !finishedFeedback[currentExIndex]) {
      setFinishedFeedback(prev => ({ ...prev, [currentExIndex]: true }));
      const prog = progressions[currentEx.nome];
      if (prog && prog.feedback !== "first_time") {
        toast.success(`${prog.feedbackEmoji} ${prog.feedbackLabel}`, { duration: 4000 });
      } else {
        toast.success("✅ Séries concluídas! Ótimo trabalho!", { duration: 3000 });
      }
    }

    setRestTime(restSeconds);
    setRestActive(true);
    setRestPaused(false);
    setRestFinished(false);
  };

  const startEdit = (setIdx: number) => {
    const s = currentSets[setIdx];
    setEditingSet({ exIdx: currentExIndex, setIdx });
    setEditKg(String(s.kg));
    setEditReps(String(s.reps));
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

  // Swap exercise with location-aware alternatives
  const swapExercise = (newName: string) => {
    setExercises(prev => {
      const updated = [...prev];
      updated[currentExIndex] = { ...updated[currentExIndex], nome: newName };
      return updated;
    });
    setShowAlternatives(false);
    toast.success(`Exercício trocado para ${newName}`);
  };

  const goNext = () => {
    if (currentExIndex < totalExercises - 1) {
      setCurrentExIndex(currentExIndex + 1);
      setRestActive(false);
      setRestTime(0);
      setRestFinished(false);
      setInputKg("");
      setInputReps("");
    }
  };

  const goPrev = () => {
    if (currentExIndex > 0) {
      setCurrentExIndex(currentExIndex - 1);
      setRestActive(false);
      setRestTime(0);
      setRestFinished(false);
      setInputKg("");
      setInputReps("");
    }
  };

  // Finish — save session + exercise history
  const handleFinish = async () => {
    try {
      const { data: sessionData, error: sessionError } = await supabase.from("workout_sessions").insert({
        user_id: userId,
        workout_plan_id: plan.id,
        day_index: dayIndex,
        day_name: day.dia,
        muscle_group: day.grupo,
        exercises_completed: completedCount,
        exercises_total: totalExercises,
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
            user_id: userId,
            exercise_name: ex.nome,
            muscle_group: muscleGroup,
            weight: s.kg,
            reps: s.reps,
            set_number: setIdx + 1,
            workout_session_id: sessionData?.id || null,
          });
        });
      });

      if (historyRows.length > 0) {
        const { error: histError } = await supabase
          .from("exercise_history")
          .insert(historyRows as any);
        if (histError) console.error("Error saving exercise history:", histError);
      }

      toast.success("Treino concluído! 💪🔥");
      onFinish();
    } catch {
      toast.error("Erro ao salvar sessão");
    }
  };

  // Location-aware alternatives
  const alternatives = useMemo(() => getAlternatives(currentEx.nome, trainingLocation), [currentEx.nome, trainingLocation]);

  const toggleRestPause = () => setRestPaused(p => !p);
  const resetRest = () => { setRestTime(restSeconds); setRestPaused(false); setRestActive(true); setRestFinished(false); };
  const skipRest = () => { setRestActive(false); setRestTime(0); setRestFinished(false); };
  const addRestTime = (seconds: number) => setRestTime(t => t + seconds);
  const dismissRestFinished = () => setRestFinished(false);

  // Find matching exercise from library
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
      date,
      maxWeight: Math.max(...sets.map(s => s.weight)),
      avgReps: Math.round(sets.reduce((a, s) => a + s.reps, 0) / sets.length),
      sets: sets.length,
    }));
  }, [currentExHistory]);

  const feedbackColor = currentProgression?.feedback === "increase"
    ? "text-primary bg-primary/10"
    : currentProgression?.feedback === "decrease"
    ? "text-destructive bg-destructive/10"
    : "text-muted-foreground bg-secondary/60";

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
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Alongamentos para {day.grupo}
          </h3>
          <div className="space-y-2.5">
            {stretching.map((s, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/40">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-sm">🧘</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{s.nome}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{s.desc}</p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0 px-2 py-1 rounded-md bg-secondary/60">{s.duracao}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cardio recommendation */}
        {cardioRec && (
          <div className="glass-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Cardio Sugerido
            </h3>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/40">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-sm">🏃</span>
              </div>
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
            <p className="text-[11px] text-muted-foreground">
              Treino adaptado para <span className="font-semibold text-foreground">casa</span>. Exercícios de máquina serão substituídos automaticamente.
            </p>
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-lg border-t border-border/50 z-50">
          <div className="max-w-lg mx-auto flex gap-3">
            <Button variant="outline" className="flex-1 h-11" onClick={() => setShowStretching(false)}>
              Pular Aquecimento
            </Button>
            <Button className="flex-1 h-11" onClick={() => setShowStretching(false)}>
              <Play className="w-4 h-4 mr-2" /> Iniciar Treino
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-up pb-24">
      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-primary font-display font-bold text-sm">
                {currentExIndex + 1}/{totalExercises}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-semibold">
                {day.grupo}
              </span>
              {trainingLocation === "casa" && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-medium">🏠</span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <Timer className="w-3 h-3" /> {formatTime(workoutSeconds)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground font-medium">{progress}%</span>
          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* ===== EXERCISE HERO WITH ANIMATION ===== */}
      <div className="glass-card p-5 flex flex-col items-center justify-center relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${muscleGroupColors[primaryGroup] || "from-primary/20 to-primary/5"} opacity-50`} />
        <div className="relative z-10 flex flex-col items-center w-full">
          {/* Exercise Animation */}
          {libraryExercise ? (
            <ExerciseAnimation exercise={libraryExercise} size="lg" className="mb-3" />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-3 shadow-lg">
              <Dumbbell className="w-10 h-10 text-primary" />
            </div>
          )}
          
          <h2 className="font-display font-bold text-lg text-center">{currentEx.nome}</h2>
          
          {/* Muscle tags */}
          {libraryExercise && (
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
              <span className="flex items-center gap-1 text-[10px] font-semibold text-primary px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                <Target className="w-3 h-3" /> {libraryExercise.musculos[0]}
              </span>
              {libraryExercise.musculos.slice(1).map((m, i) => (
                <span key={i} className="text-[10px] text-muted-foreground px-2 py-0.5 rounded-full bg-secondary/60">
                  {m}
                </span>
              ))}
            </div>
          )}

          {/* Progression badge */}
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
          <div className="flex items-center gap-4">
            <MuscleBodyMap highlightedMuscles={libraryExercise.musculosDestacados} className="w-28 h-40 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">Principal</span>
                <p className="text-sm font-medium mt-0.5">{libraryExercise.musculos[0]}</p>
              </div>
              {libraryExercise.musculos.length > 1 && (
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Secundários</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {libraryExercise.musculos.slice(1).map((m, i) => (
                      <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-secondary/60 text-muted-foreground">{m}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="pt-1">
                <span className="text-[10px] text-muted-foreground">{libraryExercise.equipamento}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== PROGRESSION FEEDBACK ===== */}
      {currentProgression && currentProgression.feedback !== "first_time" && (
        <div className={`glass-card p-3.5 flex items-center gap-3 ${
          currentProgression.feedback === "increase" ? "border border-primary/20" :
          currentProgression.feedback === "decrease" ? "border border-destructive/20" :
          "border border-border/50"
        }`}>
          <span className="text-lg">{currentProgression.feedbackEmoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">{currentProgression.feedbackLabel}</p>
            <p className="text-[10px] text-muted-foreground">
              Último: {currentProgression.lastWeight}kg • Melhor: {currentProgression.bestWeight}kg
            </p>
          </div>
        </div>
      )}

      {/* ===== CIRCULAR INDICATORS ===== */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-3.5 flex flex-col items-center">
          <div className="w-14 h-14 rounded-full border-[3px] border-primary/30 flex items-center justify-center mb-1.5 relative">
            <span className="font-display font-bold text-base">{targetReps}</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">Repetições</span>
        </div>
        <button onClick={() => setShowRestConfig(!showRestConfig)} className="glass-card p-3.5 flex flex-col items-center cursor-pointer hover:bg-secondary/60 transition-colors">
          <div className="w-14 h-14 rounded-full border-[3px] border-amber-500/30 flex items-center justify-center mb-1.5">
            <span className="font-display font-bold text-sm">{restSeconds}s</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">Descanso ⚙️</span>
        </button>
        <div className="glass-card p-3.5 flex flex-col items-center">
          <div className={`w-14 h-14 rounded-full border-[3px] flex items-center justify-center mb-1.5 ${currentSets.length >= targetSeries ? "border-green-500/50" : "border-muted-foreground/20"}`}>
            <span className="font-display font-bold text-base">{currentSets.length}/{targetSeries}</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">Séries</span>
        </div>
      </div>

      {/* ===== REST TIME CONFIG ===== */}
      {showRestConfig && (
        <div className="glass-card p-4 glow-border animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">⚙️ Tempo de Descanso</h3>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowRestConfig(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid grid-cols-5 gap-2 mb-3">
            {REST_OPTIONS.map(sec => (
              <button
                key={sec}
                onClick={() => { setCustomRestSeconds(sec); setShowRestConfig(false); }}
                className={`p-2.5 rounded-xl text-center text-sm font-display font-bold transition-colors ${
                  restSeconds === sec
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/50 text-foreground hover:bg-secondary"
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Personalizado (s)"
              className="h-9 bg-secondary/50 border-border/50 text-center text-sm"
              onKeyDown={e => {
                if (e.key === "Enter") {
                  const v = parseInt((e.target as HTMLInputElement).value);
                  if (v > 0) { setCustomRestSeconds(v); setShowRestConfig(false); }
                }
              }}
            />
            <span className="text-xs text-muted-foreground shrink-0">segundos</span>
          </div>
        </div>
      )}

      {/* ===== REST FINISHED ALERT ===== */}
      {restFinished && !restActive && (
        <div className="glass-card p-5 glow-border animate-slide-up border border-primary/30">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3 animate-pulse">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-display font-bold text-lg">⏰ Descanso Finalizado!</h3>
            <p className="text-sm text-muted-foreground mt-1">Hora da próxima série</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Série {currentSets.length + 1} de {targetSeries}
            </p>
            <Button onClick={dismissRestFinished} className="mt-4 h-11 px-8">
              <Play className="w-4 h-4 mr-2" /> Iniciar Próxima Série
            </Button>
          </div>
        </div>
      )}

      {/* ===== REST TIMER ===== */}
      {restActive && (
        <div className="glass-card p-5 glow-border">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">⏱ Descanso</span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={() => addRestTime(15)}>
                +15s
              </Button>
              <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={skipRest}>
                Pular
              </Button>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="relative w-36 h-36 mb-4">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
                <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--primary))" strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 54}`}
                  strokeDashoffset={`${2 * Math.PI * 54 * (1 - (restSeconds > 0 ? restTime / restSeconds : 0))}`}
                  className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display font-bold text-3xl tabular-nums text-foreground">
                  {formatTime(restTime)}
                </span>
                <span className="text-[10px] text-muted-foreground">restante</span>
              </div>
            </div>
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

      {/* ===== SET REGISTRATION ===== */}
      <div className="glass-card p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Registrar Série</h3>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="text-[10px] text-muted-foreground mb-1 block">Quilos (kg)</label>
            <Input type="number"
              placeholder={currentProgression?.recommendedWeight ? String(currentProgression.recommendedWeight) : "0"}
              value={inputKg} onChange={e => setInputKg(e.target.value)}
              className="h-11 bg-secondary/50 border-border/50 text-center font-display font-bold text-lg" />
          </div>
          <div className="flex-1">
            <label className="text-[10px] text-muted-foreground mb-1 block">Repetições</label>
            <Input type="number" placeholder="0" value={inputReps} onChange={e => setInputReps(e.target.value)}
              className="h-11 bg-secondary/50 border-border/50 text-center font-display font-bold text-lg" />
          </div>
          <Button onClick={addSet} className="h-11 w-11 shrink-0" size="icon">
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* ===== SET HISTORY ===== */}
      {currentSets.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Séries Registradas</h3>
          <div className="space-y-2">
            {currentSets.map((s, idx) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/40">
                {editingSet?.exIdx === currentExIndex && editingSet?.setIdx === idx ? (
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-xs text-muted-foreground font-medium w-6">#{idx + 1}</span>
                    <Input type="number" value={editKg} onChange={e => setEditKg(e.target.value)}
                      className="h-8 w-16 text-center text-xs bg-secondary/60" />
                    <span className="text-xs text-muted-foreground">kg ×</span>
                    <Input type="number" value={editReps} onChange={e => setEditReps(e.target.value)}
                      className="h-8 w-16 text-center text-xs bg-secondary/60" />
                    <span className="text-xs text-muted-foreground">reps</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" onClick={saveEdit}>
                      <Check className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingSet(null)}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-primary font-bold w-6">#{idx + 1}</span>
                      <span className="text-sm font-medium">{s.kg} kg × {s.reps} reps</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => startEdit(idx)}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteSet(idx)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
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
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowHistory(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          {recentSessions.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum histórico encontrado para este exercício.</p>
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
                  <span className="text-[10px] text-muted-foreground">Melhor peso registrado</span>
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
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowInfo(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {libraryExercise ? (
            <div className="space-y-4">
              {/* Instructions */}
              <div>
                <h4 className="text-[10px] uppercase tracking-wider text-primary font-semibold mb-2">Execução Passo a Passo</h4>
                <div className="space-y-2">
                  {libraryExercise.instrucoes.map((inst, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-xs text-muted-foreground leading-relaxed">{inst}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Tips */}
              <div>
                <h4 className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold mb-2">💡 Dicas Importantes</h4>
                <div className="space-y-1.5">
                  {libraryExercise.dicas.map((dica, i) => (
                    <p key={i} className="text-xs text-muted-foreground leading-relaxed pl-3 border-l-2 border-amber-500/30">
                      {dica}
                    </p>
                  ))}
                </div>
              </div>

              {/* Meta */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
                <span className="text-[10px] px-2 py-1 rounded-md bg-secondary/60 text-muted-foreground">
                  {libraryExercise.equipamento}
                </span>
                <span className="text-[10px] px-2 py-1 rounded-md bg-secondary/60 text-muted-foreground capitalize">
                  {libraryExercise.dificuldade}
                </span>
                <span className="text-[10px] px-2 py-1 rounded-md bg-secondary/60 text-muted-foreground capitalize">
                  {libraryExercise.tipo}
                </span>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground leading-relaxed">{currentEx.desc}</p>
              <div className="flex gap-3 mt-3 text-[11px]">
                <span className="flex items-center gap-1 text-primary font-medium px-2 py-1 rounded-md bg-primary/8">
                  <Clock className="w-3 h-3" />{currentEx.series}x{currentEx.reps}
                </span>
                {currentEx.descanso && currentEx.descanso !== "—" && (
                  <span className="flex items-center gap-1 text-muted-foreground px-2 py-1 rounded-md bg-secondary/50">
                    <Timer className="w-3 h-3" />{currentEx.descanso} descanso
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== ALTERNATIVES PANEL (Location-aware) ===== */}
      {showAlternatives && (
        <div className="glass-card p-4 glow-border animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold text-sm">Exercícios Alternativos</h3>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowAlternatives(false)}>
              <X className="w-4 h-4" />
            </Button>
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
                    {alt.tag && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary/80 text-muted-foreground font-medium">{alt.tag}</span>
                    )}
                  </div>
                  {alt.desc && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{alt.desc}</p>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===== NAVIGATION ===== */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-lg border-t border-border/50 z-50">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Button variant="outline" size="icon" className="h-11 w-11 shrink-0" onClick={goPrev} disabled={currentExIndex === 0}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          {currentExIndex === totalExercises - 1 && completedCount > 0 ? (
            <Button onClick={handleFinish} className="flex-1 h-11">
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
