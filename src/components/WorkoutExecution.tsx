import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  ArrowLeft, ChevronLeft, ChevronRight, Clock, Timer, Trophy, Dumbbell,
  Info, RefreshCw, Plus, Pencil, Trash2, X, Check, Play, Pause, RotateCcw,
  TrendingUp, TrendingDown, Minus, History, Heart, Zap, Home, Target, Flame,
  CheckCircle2, ChevronDown, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { calculateProgression, type ProgressionResult, type ExerciseHistoryEntry } from "@/lib/progressionEngine";
import { validateWorkout, markWorkoutValidatedToday, logValidation, getHonestyMode, checkXPThrottle, recordAchievementUnlock } from "@/lib/antiFakeEngine";
import { fetchExerciseGifByName, preloadAlternativeGifs, preloadWorkoutDayGifs } from "@/lib/exerciseGifs";
import { getAlternatives, getStretchingForDay, getCardioRecommendation, getSmartCardio, type CardioRecommendation, type SmartCardioSession } from "@/lib/workoutRecommendations";
import { exerciseLibrary, type ExerciseDetail, type MuscleId } from "@/lib/exerciseLibrary";
import { type CycleStatus, applyProgressionToExercise } from "@/lib/progressionCycleEngine";
import { assignIntensityTechniques, TECHNIQUES, getPyramidScheme, type ExerciseTechniqueAssignment, type IntensityTechnique } from "@/lib/intensityTechniques";
import { type ComebackStatus, applyComebackAdjustments } from "@/lib/comebackEngine";
import { savePerformance, getProgressionDecision, getExerciseEvolution, getSessionSummary, type RPE, type ProgressionDecision, type WeightEvolutionPoint, type SessionProgressionSummary } from "@/lib/smartProgressionEngine";
import { shouldTrainGroup, type FatigueAdjustment, type MuscleFatigueStatus } from "@/lib/muscleFatigueEngine";
import { registerMicroVictory, getVictoryMessage } from "@/lib/microVictoriesEngine";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ExerciseAnimation from "@/components/ExerciseAnimation";
import MuscleBodyMap from "@/components/MuscleBodyMap";

// Muscle group fallback map: when exercise not in library, use group to determine active muscles
const muscleGroupFallback: Record<string, MuscleId[]> = {
  peito: ["peitoral", "triceps", "deltoide-anterior"],
  costas: ["dorsal", "biceps", "trapezio"],
  pernas: ["quadriceps", "isquiotibiais", "gluteos"],
  ombros: ["deltoide-anterior", "deltoide-lateral", "trapezio"],
  biceps: ["biceps", "antebraco"],
  triceps: ["triceps"],
  abdomen: ["reto-abdominal", "obliquos", "core"],
  hiit: ["quadriceps", "gluteos", "core"],
  cardio: ["quadriceps", "isquiotibiais", "panturrilha"],
};

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
  cycleStatus?: CycleStatus;
  comebackStatus?: ComebackStatus;
  onFinish: () => void;
  onBack: () => void;
};

// === Phase enum for auto-flow ===
type WorkoutPhase = "input" | "resting" | "rest-done" | "exercise-done";

// Mini component for alternative exercise GIF preview (by name)
const AltGifPreview = ({ name, isHome }: { name: string; isHome: boolean }) => {
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    setError(false);
    setGifUrl(null);
    fetchExerciseGifByName(name).then(url => {
      if (!cancelled) {
        if (url) setGifUrl(url);
        else setError(true);
      }
    });
    return () => { cancelled = true; };
  }, [name]);

  if (gifUrl && !error) {
    return (
      <div className="relative w-full h-full" style={{ aspectRatio: "1/1" }}>
        <img
          src={gifUrl}
          alt={name}
          className={`w-full h-full transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ objectFit: "contain", padding: "2px" }}
          onLoad={() => setLoaded(true)}
          onError={() => { setGifUrl(null); setError(true); }}
          loading="lazy"
          decoding="async"
        />
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {isHome ? <Home className="w-5 h-5 text-amber-500" /> : <Dumbbell className="w-5 h-5 text-primary" />}
    </div>
  );
};

export default function WorkoutExecution({ plan, dayIndex, userId, experienceLevel = "intermediario", trainingLocation, objective, cycleStatus, comebackStatus, onFinish, onBack }: Props) {
  const planData = useMemo(() => plan.plan_data as WorkoutDay[], [plan]);
  const day = useMemo(() => planData[dayIndex], [planData, dayIndex]);
  const [isReady, setIsReady] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>(day?.exercicios || []);
  const [currentExIndex, setCurrentExIndex] = useState(0);

  // Preload GIFs for all exercises in this day
  useEffect(() => {
    if (day?.exercicios) {
      preloadWorkoutDayGifs(day.exercicios.map(ex => ({ nome: ex.nome })));
    }
  }, [day]);
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
  
  // Intensity techniques
  const [techniqueAssignments, setTechniqueAssignments] = useState<ExerciseTechniqueAssignment[]>([]);
  const [showTechniqueInfo, setShowTechniqueInfo] = useState(false);

  // RPE / Smart Progression
  const [selectedRPE, setSelectedRPE] = useState<RPE | null>(null);
  const [progressionDecisions, setProgressionDecisions] = useState<Record<number, ProgressionDecision>>({});
  const [sessionSummary, setSessionSummary] = useState<SessionProgressionSummary | null>(null);
  const [showEvolutionChart, setShowEvolutionChart] = useState(false);
  const [evolutionData, setEvolutionData] = useState<WeightEvolutionPoint[]>([]);
  const [fatigueStatus, setFatigueStatus] = useState<{ fatigue: MuscleFatigueStatus; adjustment: FatigueAdjustment | null } | null>(null);

  // Anti-fake tracking
  const totalRestsStartedRef = useRef(0);
  const totalRestsPossibleRef = useRef(0);

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

  // Smart cardio for this specific day
  const isLegDay = useMemo(() => {
    const g = day?.grupo?.toLowerCase() || "";
    return g.includes("perna") || g.includes("quadríceps") || g.includes("posterior") || g.includes("glúteo");
  }, [day?.grupo]);
  
  const smartCardio = useMemo(() => {
    return getSmartCardio(objective, experienceLevel, (day as any)?.intensidade, isLegDay, "daily");
  }, [objective, experienceLevel, day, isLegDay]);

  // Assign intensity techniques once when exercises are ready
  useEffect(() => {
    if (exercises.length > 0) {
      const assignments = assignIntensityTechniques(
        exercises,
        experienceLevel,
        (day as any)?.intensidade,
        day?.grupo,
      );
      setTechniqueAssignments(assignments);
    }
  }, [exercises, experienceLevel, day]);

  // Fatigue detection for current muscle group
  useEffect(() => {
    const grupo = day?.grupo?.toLowerCase() || "";
    let muscleGroup = "geral";
    for (const key of Object.keys(muscleGroupColors)) {
      if (grupo.includes(key)) { muscleGroup = key; break; }
    }
    const result = shouldTrainGroup(muscleGroup);
    if (result.fatigue.level === "high" || result.fatigue.level === "extreme") {
      setFatigueStatus({ fatigue: result.fatigue, adjustment: result.adjustment });
    }
  }, [day]);

  // Current exercise technique
  const currentTechnique = useMemo(() => {
    return techniqueAssignments.find(a => a.exerciseIndex === currentExIndex) || null;
  }, [techniqueAssignments, currentExIndex]);

  // Pyramid scheme for current exercise if applicable
  const pyramidScheme = useMemo(() => {
    if (!currentTechnique) return null;
    if (currentTechnique.technique.type !== "piramide_crescente" && currentTechnique.technique.type !== "piramide_regressiva") return null;
    return getPyramidScheme(currentTechnique.technique.type, targetReps, targetSeries);
  }, [currentTechnique, targetReps, targetSeries]);

  // Initialize component - mark as ready after first render
  useEffect(() => {
    if (day && exercises.length > 0) {
      setIsReady(true);
      // Register workout_started micro-victory
      const v = registerMicroVictory("workout_started");
      if (v) toast.success(`✨ ${getVictoryMessage()}`, { duration: 2000 });
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

  // Pre-fill recommended weight with cycle adjustments
  useEffect(() => {
    const prog = progressions[currentEx.nome];
    if (prog && prog.feedback !== "first_time" && !inputKg) {
      let weight = prog.recommendedWeight;
      // Apply cycle multiplier if available
      if (cycleStatus && weight > 0) {
        weight = Math.round(weight * cycleStatus.loadMultiplier * 2) / 2;
      }
      setInputKg(String(weight));
    }
  }, [currentExIndex, progressions, currentEx.nome, cycleStatus]);

  // Workout timer - wall-clock based to prevent drift
  const workoutStartRef = useRef(Date.now());
  useEffect(() => {
    workoutStartRef.current = Date.now();
    const tick = () => {
      setWorkoutSeconds(Math.floor((Date.now() - workoutStartRef.current) / 1000));
    };
    workoutTimerRef.current = setInterval(tick, 1000);
    return () => { if (workoutTimerRef.current) clearInterval(workoutTimerRef.current); };
  }, []);

  // Rest timer - wall-clock based to prevent drift, works in background
  const restEndTimeRef = useRef<number | null>(null);
  const restPausedAtRef = useRef<number>(0);
  const restDoneTriggered = useRef(false);
  const [restDoneFlash, setRestDoneFlash] = useState(false);

  // Premium alert system
  const playRestDoneAlert = useCallback(() => {
    // 1. Strong vibration pattern: long-short-long-short-long
    try {
      if (navigator.vibrate) {
        navigator.vibrate([300, 150, 300, 150, 400]);
      }
    } catch {}

    // 2. Multi-tone ascending alert sound (louder, longer, more distinct)
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playTone = (freq: number, startTime: number, duration: number, vol: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = "sine";
        gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
        gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + startTime + 0.05);
        gain.gain.setValueAtTime(vol, ctx.currentTime + startTime + duration - 0.1);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + startTime + duration);
        osc.start(ctx.currentTime + startTime);
        osc.stop(ctx.currentTime + startTime + duration);
      };
      // 3-note ascending chime: C5 → E5 → G5, then repeat higher
      playTone(523, 0, 0.25, 0.5);       // C5
      playTone(659, 0.3, 0.25, 0.5);     // E5
      playTone(784, 0.6, 0.35, 0.6);     // G5
      // Second phrase - higher, more urgent
      playTone(784, 1.1, 0.2, 0.5);      // G5
      playTone(988, 1.35, 0.2, 0.5);     // B5
      playTone(1047, 1.6, 0.5, 0.65);    // C6 (sustained)
    } catch {}

    // 3. Visual flash effect
    setRestDoneFlash(true);
    setTimeout(() => setRestDoneFlash(false), 2000);
  }, []);

  useEffect(() => {
    if (phase === "resting" && !restPaused && restTime > 0) {
      restDoneTriggered.current = false;
      if (!restEndTimeRef.current) {
        restEndTimeRef.current = Date.now() + restTime * 1000;
      }
      restIntervalRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((restEndTimeRef.current! - Date.now()) / 1000));
        setRestTime(remaining);
        if (remaining <= 0 && !restDoneTriggered.current) {
          restDoneTriggered.current = true;
          clearInterval(restIntervalRef.current!);
          restEndTimeRef.current = null;
          setPhase("rest-done");
          playRestDoneAlert();
        }
      }, 250);
    } else if (phase === "resting" && restPaused) {
      restPausedAtRef.current = restTime;
      restEndTimeRef.current = null;
    }
    return () => { if (restIntervalRef.current) clearInterval(restIntervalRef.current); };
  }, [phase, restPaused, playRestDoneAlert]);

  // Keep timer alive when navigating within app (visibility change handler)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && restEndTimeRef.current && phase === "resting" && !restPaused) {
        const remaining = Math.max(0, Math.ceil((restEndTimeRef.current - Date.now()) / 1000));
        setRestTime(remaining);
        if (remaining <= 0 && !restDoneTriggered.current) {
          restDoneTriggered.current = true;
          if (restIntervalRef.current) clearInterval(restIntervalRef.current);
          restEndTimeRef.current = null;
          setPhase("rest-done");
          playRestDoneAlert();
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [phase, restPaused, playRestDoneAlert]);

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
      // Track rest start for anti-fake
      totalRestsPossibleRef.current += 1;
      totalRestsStartedRef.current += 1;
      // Auto-start rest with wall-clock
      restEndTimeRef.current = Date.now() + effectiveRestSeconds * 1000;
      setRestTime(effectiveRestSeconds);
      setRestPaused(false);
      setPhase("resting");
    }
  };

  const startManualRest = () => {
    restEndTimeRef.current = Date.now() + effectiveRestSeconds * 1000;
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

  // Track swap key to force remount of visual components
  const [swapKey, setSwapKey] = useState(0);
  const [swapFading, setSwapFading] = useState(false);

  const swapExercise = useCallback((newName: string) => {
    // Preload GIF for new exercise immediately
    fetchExerciseGifByName(newName);
    
    // Fade-out animation
    setSwapFading(true);
    
    // Short delay for fade-out then swap
    setTimeout(() => {
      setExercises(prev => {
        const updated = [...prev];
        updated[currentExIndex] = { ...updated[currentExIndex], nome: newName };
        return updated;
      });
      setSwapKey(k => k + 1);
      setShowAlternatives(false);
      setSwapFading(false);
      
      // Haptic feedback
      try { if (navigator.vibrate) navigator.vibrate([30, 50, 30]); } catch {}
      
      toast.success("Exercício atualizado com sucesso", {
        icon: <Sparkles className="w-4 h-4 text-primary" />,
        duration: 2500,
      });
    }, 200);
  }, [currentExIndex]);

  // Save exercise performance with RPE
  const saveExercisePerformance = useCallback((exIdx: number, rpe: RPE) => {
    const ex = exercises[exIdx];
    const exSets = sets[exIdx] || [];
    if (exSets.length === 0) return;
    const grupo = day.grupo.toLowerCase();
    let muscleGroup = "geral";
    for (const key of Object.keys(muscleGroupColors)) {
      if (grupo.includes(key)) { muscleGroup = key; break; }
    }
    const avgReps = exSets.reduce((a, s) => a + s.reps, 0) / exSets.length;
    const maxWeight = Math.max(...exSets.map(s => s.kg));
    const targetRepNum = parseInt(ex.reps) || 10;

    savePerformance({
      exercise_name: ex.nome,
      muscle_group: muscleGroup,
      sets_completed: exSets.length,
      sets_target: parseInt(ex.series) || 4,
      avg_reps: Math.round(avgReps),
      target_reps: targetRepNum,
      max_weight: maxWeight,
      rpe,
      date: new Date().toISOString().slice(0, 10),
    });

    // Get progression decision after saving
    const decision = getProgressionDecision(ex.nome);
    setProgressionDecisions(prev => ({ ...prev, [exIdx]: decision }));
  }, [exercises, sets, day]);

  const goToExercise = (idx: number) => {
    // Save RPE performance if we had one selected for current exercise
    if (selectedRPE && currentSets.length > 0) {
      saveExercisePerformance(currentExIndex, selectedRPE);
    }
    // Register exercise_completed micro-victory if sets were recorded
    if (currentSets.length > 0) {
      registerMicroVictory("exercise_completed");
    }
    setCurrentExIndex(idx);
    setPhase("input");
    setRestTime(0);
    setInputKg("");
    setInputReps("");
    setSelectedRPE(null);
  };

  const goNext = () => {
    if (currentExIndex < totalExercises - 1) goToExercise(currentExIndex + 1);
  };

  const goPrev = () => {
    if (currentExIndex > 0) goToExercise(currentExIndex - 1);
  };

  const MIN_SETS_REQUIRED = 3; // At least 3 sets total

  // Anti-fake validation result state
  const [validationResult, setValidationResult] = useState<ReturnType<typeof validateWorkout> | null>(null);

  const handleFinish = async () => {
    // Basic minimum sets check
    const totalSets = Object.values(sets).reduce((a, exSets) => a + exSets.length, 0);
    if (totalSets < MIN_SETS_REQUIRED) {
      toast.error(`💪 Registre pelo menos ${MIN_SETS_REQUIRED} séries para concluir o treino.`, { duration: 4000 });
      return;
    }

    // Calculate total series target
    const totalSeriesTarget = exercises.reduce((a, ex) => a + (parseInt(ex.series) || 4), 0);

    // Run anti-fake validation
    const validation = validateWorkout({
      totalSeconds: workoutSeconds,
      totalRestsStarted: totalRestsStartedRef.current,
      totalRestsPossible: totalRestsPossibleRef.current,
      seriesCompleted: totalSets,
      totalSeriesTarget,
    });

    setValidationResult(validation);

    // Log validation result
    if (validation.isExtra) {
      logValidation({ type: "treino_extra", details: `Treino extra do dia — salvo no histórico sem XP` });
    } else if (validation.isValid) {
      logValidation({ type: "treino_validado", details: `Tempo: ${Math.floor(workoutSeconds / 60)}min, Séries: ${Math.round(validation.seriesCompletedPct)}%, Descansos: ${Math.round(validation.restStartsPct)}%` });
      markWorkoutValidatedToday();
    } else {
      logValidation({ type: "treino_nao_validado", details: validation.reasons.join("; ") });
    }

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
      // Generate session summary for completion screen
      const exerciseNames = exercises.filter((_, i) => (sets[i] || []).length > 0).map(e => e.nome);
      const summary = getSessionSummary(exerciseNames, day.grupo.toLowerCase());
      setSessionSummary(summary);
      setShowCompletion(true);

      // Only register micro-victories if validated
      if (validation.isValid) {
        registerMicroVictory("workout_completed");
        registerMicroVictory("exercise_completed");
      }
    } catch {
      toast.error("Erro ao salvar sessão");
    }
  };

  const alternatives = useMemo(() => getAlternatives(currentEx.nome, trainingLocation), [currentEx.nome, trainingLocation]);
  
  // Preload alternative GIFs when alternatives change
  useEffect(() => {
    if (alternatives.length > 0) {
      preloadAlternativeGifs(alternatives.map(a => a.nome));
    }
  }, [alternatives]);

  const toggleRestPause = useCallback(() => {
    setRestPaused(p => {
      if (p) {
        // Resuming: set new end time based on remaining
        restEndTimeRef.current = Date.now() + restPausedAtRef.current * 1000;
      }
      return !p;
    });
  }, []);

  const resetRest = useCallback(() => {
    restEndTimeRef.current = Date.now() + effectiveRestSeconds * 1000;
    setRestTime(effectiveRestSeconds);
    setRestPaused(false);
    setPhase("resting");
  }, [effectiveRestSeconds]);

  const skipRest = useCallback(() => {
    restEndTimeRef.current = null;
    setPhase("input");
    setRestTime(0);
  }, []);

  const addRestTime = useCallback((seconds: number) => {
    setRestTime(t => {
      const newTime = Math.max(5, t + seconds);
      if (restEndTimeRef.current) {
        restEndTimeRef.current += seconds * 1000;
      }
      return newTime;
    });
  }, []);

  const libraryExercise = useMemo(() => {
    const name = currentEx.nome.toLowerCase();
    return exerciseLibrary.find(e =>
      name.includes(e.nome.toLowerCase()) || e.nome.toLowerCase().includes(name)
    ) || null;
  }, [currentEx.nome]);

  // Muscle highlights: use library data or fallback to group
  const activeMusclesToShow = useMemo<MuscleId[]>(() => {
    if (libraryExercise) return libraryExercise.musculosDestacados;
    // Fallback based on workout group
    const grupo = day.grupo.toLowerCase();
    for (const [key, muscles] of Object.entries(muscleGroupFallback)) {
      if (grupo.includes(key)) return muscles;
    }
    return ["peitoral"];
  }, [libraryExercise, day.grupo]);

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
          {/* Progression Summary */}
          {sessionSummary && (sessionSummary.totalEvolutions > 0 || sessionSummary.totalOverloads > 0) && (
            <div className="glass-card p-4 w-full mb-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">📊 Análise de Progressão</h3>
              <div className="space-y-2">
                {sessionSummary.totalEvolutions > 0 && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-primary/5 border border-primary/15">
                    <TrendingUp className="w-4 h-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-primary">📈 Evolução detectada</p>
                      <p className="text-[10px] text-muted-foreground">
                        {sessionSummary.totalEvolutions} exercício(s) prontos para subir de nível
                      </p>
                    </div>
                  </div>
                )}
                {sessionSummary.totalOverloads > 0 && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-destructive/5 border border-destructive/15">
                    <TrendingDown className="w-4 h-4 text-destructive shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-destructive">⚠️ Ajuste recomendado</p>
                      <p className="text-[10px] text-muted-foreground">
                        {sessionSummary.totalOverloads} exercício(s) precisam de ajuste de carga
                      </p>
                    </div>
                  </div>
                )}
                {sessionSummary.topEvolution && (
                  <div className="p-2.5 rounded-xl bg-secondary/40">
                    <p className="text-[10px] text-muted-foreground">Próximo passo para <span className="font-semibold text-foreground">{sessionSummary.topEvolution.exercise}</span>:</p>
                    <p className="text-xs font-medium mt-0.5">{sessionSummary.topEvolution.decision.emoji} {sessionSummary.topEvolution.decision.detail}</p>
                  </div>
                )}
              </div>
              <div className="mt-2.5 p-2 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-[10px] text-muted-foreground italic">💡 Consistência é mais importante que intensidade.</p>
              </div>
            </div>
          )}
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
      <div className="space-y-4 animate-slide-up pb-4">
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
        {/* Smart Cardio Card */}
        {smartCardio && (
          <div className="glass-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              🔥 Cardio do Dia
            </h3>
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/5 border border-orange-500/15">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center shrink-0">
                  <span className="text-lg">{smartCardio.emoji}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{smartCardio.titulo}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{smartCardio.desc}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-orange-500/15 text-orange-400 border border-orange-500/20 flex items-center gap-1">
                      ⏱️ {smartCardio.duracao}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${
                      smartCardio.intensidade === "Alta" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                      smartCardio.intensidade === "Moderada" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                      "bg-green-500/10 text-green-400 border-green-500/20"
                    }`}>
                      {smartCardio.intensidade}
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded-md bg-secondary/60 text-muted-foreground border border-border/30">
                      {smartCardio.tipo}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-2.5 p-2 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                  💡 {smartCardio.objetivo} • {smartCardio.momento === "pos-treino" ? "Realizar após o treino" : smartCardio.momento === "dia-descanso" ? "Ideal em dia de descanso" : "Qualquer momento"}
                </p>
              </div>
              {isLegDay && (
                <div className="mt-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                  <p className="text-[10px] text-amber-400 font-medium">⚠️ Dia de perna — cardio reduzido automaticamente para não comprometer recuperação.</p>
                </div>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 italic">💡 Cardio acelera resultados quando feito com estratégia.</p>
          </div>
        )}
        {!smartCardio && cardioRec && (
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
        {/* Fatigue Alert on Preparation Screen */}
        {fatigueStatus && (
          <div className={`glass-card p-4 border ${
            fatigueStatus.fatigue.level === "extreme" ? "border-destructive/20" : "border-amber-500/15"
          }`}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/5 flex items-center justify-center shrink-0">
                <span className="text-lg">{fatigueStatus.fatigue.emoji}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">{fatigueStatus.fatigue.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{fatigueStatus.fatigue.message}</p>
                {fatigueStatus.adjustment && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {fatigueStatus.adjustment.setsReduction > 0 && (
                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-chart-2/10 text-chart-2">
                        ↓ Séries -{Math.round(fatigueStatus.adjustment.setsReduction * 100)}%
                      </span>
                    )}
                    {fatigueStatus.adjustment.restIncrease > 0 && (
                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-chart-2/10 text-chart-2">
                        ↑ Descanso +{fatigueStatus.adjustment.restIncrease}s
                      </span>
                    )}
                    {fatigueStatus.adjustment.blockHeavy && (
                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">
                        🚫 Pesado bloqueado
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
              <p className="text-[10px] text-muted-foreground italic">💡 Consistência é mais importante que intensidade.</p>
            </div>
          </div>
        )}
        {/* Inline buttons - no fixed positioning issues */}
        <div className="mt-2 space-y-3">
          <Button className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-chart-2 hover:opacity-90 shadow-lg shadow-primary/20" onClick={() => setShowStretching(false)}>
            <Play className="w-5 h-5 mr-2" /> Iniciar Treino
          </Button>
          <Button variant="outline" className="w-full h-11" onClick={() => setShowStretching(false)}>
            Pular Aquecimento
          </Button>
        </div>
        <div className="h-4" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-up pb-24 sm:pb-28 max-w-2xl mx-auto">
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
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary">{progress}%</span>
            {comebackStatus?.isInComebackMode && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-chart-2/10 text-chart-2 border border-chart-2/15">
                🔥 Retomada
              </span>
            )}
            {cycleStatus && !comebackStatus?.isInComebackMode && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/15">
                {cycleStatus.phaseEmoji} {cycleStatus.phaseLabel}
              </span>
            )}
            {fatigueStatus && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border cursor-help ${
                      fatigueStatus.fatigue.level === "extreme"
                        ? "bg-destructive/10 text-destructive border-destructive/15"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/15"
                    }`}>
                      {fatigueStatus.fatigue.emoji} Fadiga
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-[200px]">{fatigueStatus.fatigue.message}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
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
      <div className={`glass-card p-5 flex flex-col items-center justify-center relative overflow-hidden transition-opacity duration-200 ${swapFading ? 'opacity-30 scale-[0.98]' : 'opacity-100 scale-100'}`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${muscleGroupColors[primaryGroup] || "from-primary/20 to-primary/5"} opacity-50`} />
        <div className="relative z-10 flex flex-col items-center w-full">
          {libraryExercise ? (
            <ExerciseAnimation key={`anim-${currentExIndex}-${swapKey}`} exercise={libraryExercise} size="lg" className="mb-3" />
          ) : (
            <ExerciseAnimation 
              key={`anim-fallback-${currentExIndex}-${swapKey}`} 
              exercise={{ 
                id: `custom-${currentExIndex}`, nome: currentEx.nome, grupo: (day.grupo.toLowerCase() as any) || "peito",
                grupoLabel: day.grupo, musculos: [day.grupo], musculosDestacados: activeMusclesToShow,
                instrucoes: [], dicas: [], equipamento: "Variado", dificuldade: "intermediário",
                tipo: "composto", tipoExercicio: "musculação", alternativas: [],
                animacao: { frames: ["🏋️ ↑", "🏋️ ↓"], cor: "hsl(152 69% 46%)" },
              }} 
              size="lg" className="mb-3" 
            />
          )}
          <h2 className="font-display font-bold text-lg text-center">{currentEx.nome}</h2>
          {/* Intensity technique badge */}
          {currentTechnique && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setShowTechniqueInfo(!showTechniqueInfo)}
                    className={`mt-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 border transition-all hover:scale-105 active:scale-95 ${currentTechnique.technique.badgeClass}`}
                  >
                    {currentTechnique.technique.emoji} {currentTechnique.technique.shortLabel}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[250px] text-xs">
                  {currentTechnique.technique.tooltip}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
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
              Peso recomendado: {cycleStatus && currentProgression.recommendedWeight > 0
                ? Math.round(currentProgression.recommendedWeight * cycleStatus.loadMultiplier * 2) / 2
                : currentProgression.recommendedWeight
              } kg
              {cycleStatus && cycleStatus.phase !== "adaptacao" && currentProgression.recommendedWeight > 0 && (
                <span className="text-[9px] opacity-70 ml-1">({cycleStatus.phaseEmoji} {cycleStatus.phaseLabel})</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ===== MUSCLE BODY MAP ===== */}
      <div className={`glass-card p-4 transition-opacity duration-200 ${swapFading ? 'opacity-30' : 'opacity-100'}`}>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-primary" /> Músculos Ativados
        </h3>
        <div className="flex flex-row items-center gap-4">
          <MuscleBodyMap key={`muscles-${currentExIndex}-${swapKey}`} highlightedMuscles={activeMusclesToShow} />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="p-2 rounded-lg bg-primary/8 border border-primary/15">
              <span className="text-[10px] uppercase tracking-wider text-primary font-semibold flex items-center gap-1">
                <Target className="w-3 h-3" /> Principal
              </span>
              <p className="text-sm font-semibold mt-0.5">{libraryExercise?.musculos[0] || day.grupo}</p>
            </div>
            {(libraryExercise?.musculos?.length ?? 0) > 1 && (
              <div className="p-2 rounded-lg bg-secondary/40 border border-border/30">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Secundários</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {libraryExercise!.musculos.slice(1).map((m, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-secondary/80 text-foreground/80 border border-border/30 font-medium">{m}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-secondary/60 text-muted-foreground border border-border/30 flex items-center gap-1">
                <Dumbbell className="w-2.5 h-2.5" /> {libraryExercise?.equipamento || "Variado"}
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-secondary/60 text-muted-foreground border border-border/30">
                {libraryExercise?.dificuldade || "intermediário"}
              </span>
            </div>
          </div>
        </div>
      </div>

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

      {/* ===== INTENSITY TECHNIQUE INFO CARD ===== */}
      {currentTechnique && showTechniqueInfo && (
        <div className={`glass-card p-4 animate-slide-up border ${currentTechnique.technique.badgeClass.replace('text-', 'border-').split(' ')[2]}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <span>{currentTechnique.technique.emoji}</span>
              <span className={currentTechnique.technique.badgeClass.split(' ')[0]}>{currentTechnique.technique.label}</span>
            </h3>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowTechniqueInfo(false)}><X className="w-4 h-4" /></Button>
          </div>
          <p className="text-sm text-muted-foreground mb-3">{currentTechnique.technique.description}</p>
          <div className="space-y-1.5">
            {currentTechnique.technique.instructions.map((inst, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                <p className="text-xs text-foreground/80 leading-relaxed">{inst}</p>
              </div>
            ))}
          </div>
          {currentTechnique.pairedWith && (
            <div className="mt-3 p-2.5 rounded-lg bg-secondary/40 border border-border/30 flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-400 shrink-0" />
              <p className="text-xs text-muted-foreground">Combinar com: <span className="font-semibold text-foreground">{currentTechnique.pairedWith}</span></p>
            </div>
          )}
          <div className="mt-3 p-2 rounded-lg bg-primary/5 border border-primary/10">
            <p className="text-[10px] text-muted-foreground italic">💡 {currentTechnique.technique.tooltip}</p>
          </div>
        </div>
      )}

      {/* ===== PYRAMID SCHEME GUIDE ===== */}
      {pyramidScheme && (
        <div className="glass-card p-4 animate-slide-up">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
            {currentTechnique?.technique.emoji} Guia de Pirâmide
          </h3>
          <div className="space-y-2">
            {pyramidScheme.map((step, i) => {
              const isCurrentSet = i === currentSets.length;
              const isDone = i < currentSets.length;
              return (
                <div key={i} className={`flex items-center justify-between p-2.5 rounded-xl transition-all ${
                  isCurrentSet ? "bg-primary/10 border border-primary/20 shadow-[0_0_8px_hsl(var(--primary)/0.15)]" :
                  isDone ? "bg-secondary/30 opacity-60" : "bg-secondary/40"
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center ${
                      isDone ? "bg-primary text-primary-foreground" : isCurrentSet ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                    }`}>{isDone ? "✓" : i + 1}</span>
                    <span className="text-xs font-medium">{step.label}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-muted-foreground">{step.reps} reps</span>
                    <span className="font-semibold text-foreground">{step.loadPct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* ===== SERIES DOTS + INDICATORS ===== */}
      <div className="glass-card p-4">
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-full border-[3px] border-primary/30 flex items-center justify-center mb-1">
              <span className="font-display font-bold text-sm">{targetReps}</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">Reps</span>
          </div>
          {/* REST CIRCLE - functional button */}
          {phase === "resting" ? (
            <div className="flex flex-col items-center">
              <div className="relative w-14 h-14 mb-1">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="24" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                  <circle cx="28" cy="28" r="24" fill="none" stroke="hsl(45 93% 47%)" strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 24}`}
                    strokeDashoffset={`${2 * Math.PI * 24 * (1 - (effectiveRestSeconds > 0 ? restTime / effectiveRestSeconds : 0))}`}
                    className="transition-all duration-1000" />
                </svg>
                <button onClick={toggleRestPause}
                  className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display font-bold text-xs tabular-nums">{formatTime(restTime)}</span>
                </button>
              </div>
              <span className="text-[10px] text-amber-400 font-medium">Descansando</span>
            </div>
          ) : (
            <button
              onClick={() => {
                if (currentSets.length >= targetSeries) {
                  setShowRestConfig(!showRestConfig);
                  return;
                }
                // Starting rest = completed a series (if no set registered yet for this rest)
                if (currentSets.length < targetSeries) {
                  // Auto-register a set with last known weight/reps or defaults
                  const lastSet = currentSets[currentSets.length - 1];
                  const autoKg = lastSet ? lastSet.kg : (parseFloat(inputKg) || (currentProgression?.recommendedWeight ?? 0));
                  const autoReps = lastSet ? lastSet.reps : (parseInt(inputReps) || parseInt(targetReps) || 12);
                  const newSet: SetRecord = { id: crypto.randomUUID(), kg: autoKg, reps: autoReps };
                  setSets(prev => ({
                    ...prev,
                    [currentExIndex]: [...(prev[currentExIndex] || []), newSet],
                  }));
                  if (navigator.vibrate) navigator.vibrate(50);

                  const newCount = currentSets.length + 1;
                  if (newCount >= targetSeries) {
                    if (!finishedFeedback[currentExIndex]) {
                      setFinishedFeedback(prev => ({ ...prev, [currentExIndex]: true }));
                      const prog = progressions[currentEx.nome];
                      if (prog && prog.feedback !== "first_time") {
                        toast.success(`${prog.feedbackEmoji} ${prog.feedbackLabel}`, { duration: 4000 });
                      }
                    }
                    setPhase("exercise-done");
                    return;
                  }
                }
                // Start rest timer with wall-clock
                restEndTimeRef.current = Date.now() + effectiveRestSeconds * 1000;
                setRestTime(effectiveRestSeconds);
                setRestPaused(false);
                setPhase("resting");
                toast.success(`Série ${currentSets.length + 1} registrada! Descansando...`, { duration: 2000 });
              }}
              className="flex flex-col items-center group"
            >
              <div className={`w-14 h-14 rounded-full border-[3px] border-amber-500/40 flex items-center justify-center mb-1 transition-all group-hover:border-amber-500 group-hover:shadow-[0_0_12px_hsl(45_93%_47%/0.3)] group-active:scale-95 ${
                currentSets.length > 0 ? "bg-amber-500/10" : ""
              }`}>
                <div className="flex flex-col items-center">
                  <Timer className="w-4 h-4 text-amber-500 mb-0.5" />
                  <span className="font-display font-bold text-[10px]">{effectiveRestSeconds}s</span>
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">
                {currentSets.length > 0 ? "Descansar" : "Iniciar"}
              </span>
            </button>
          )}
          <div className="flex flex-col items-center">
            <div className={`w-14 h-14 rounded-full border-[3px] flex items-center justify-center mb-1 transition-all ${
              currentSets.length >= targetSeries ? "border-green-500/50 bg-green-500/10 shadow-[0_0_12px_hsl(152_69%_46%/0.3)]" : "border-muted-foreground/20"
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

      {/* ===== REST CONFIG TOGGLE (small link) ===== */}
      {!showRestConfig && phase !== "resting" && (
        <div className="flex justify-center -mt-2">
          <button onClick={() => setShowRestConfig(true)} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            ⚙️ Configurar descanso
          </button>
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

            {/* RPE Selector */}
            <div className="w-full mt-4 p-3.5 rounded-xl bg-secondary/40 border border-border/30">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Como foi a dificuldade?</p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: "leve" as RPE, emoji: "😊", label: "Leve", color: "border-green-500/40 bg-green-500/10 text-green-400" },
                  { value: "moderado" as RPE, emoji: "😤", label: "Moderado", color: "border-amber-500/40 bg-amber-500/10 text-amber-400" },
                  { value: "pesado" as RPE, emoji: "🥵", label: "Pesado", color: "border-red-500/40 bg-red-500/10 text-red-400" },
                ]).map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSelectedRPE(option.value);
                      saveExercisePerformance(currentExIndex, option.value);
                    }}
                    className={`p-3 rounded-xl border-2 transition-all text-center ${
                      selectedRPE === option.value
                        ? `${option.color} scale-105 shadow-md`
                        : "border-border/30 bg-secondary/30 hover:border-border/60"
                    }`}
                  >
                    <span className="text-xl block mb-1">{option.emoji}</span>
                    <span className="text-[11px] font-semibold block">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Progression Decision Feedback */}
            {selectedRPE && progressionDecisions[currentExIndex] && (
              <div className={`w-full mt-3 p-3.5 rounded-xl animate-fade-in border ${
                progressionDecisions[currentExIndex].type === "evolution" ? "border-primary/20 bg-primary/5" :
                progressionDecisions[currentExIndex].type === "overload" ? "border-destructive/20 bg-destructive/5" :
                "border-border/30 bg-secondary/30"
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{progressionDecisions[currentExIndex].emoji}</span>
                  <span className="text-sm font-semibold">
                    {progressionDecisions[currentExIndex].type === "evolution" ? "Evolução detectada" :
                     progressionDecisions[currentExIndex].type === "overload" ? "Treino muito pesado" :
                     "Manter ritmo"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{progressionDecisions[currentExIndex].label}</p>
                <p className="text-[10px] text-muted-foreground mt-1 italic">{progressionDecisions[currentExIndex].detail}</p>
              </div>
            )}

            <div className="flex gap-3 mt-5 w-full">
              {currentExIndex < totalExercises - 1 ? (
                <Button onClick={goNext} className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-primary to-chart-2 hover:opacity-90" disabled={!selectedRPE}>
                  Próximo Exercício <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleFinish} className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-primary to-chart-2 hover:opacity-90" disabled={!selectedRPE}>
                  <Trophy className="w-5 h-5 mr-2" /> Finalizar Treino
                </Button>
              )}
            </div>
            {!selectedRPE && (
              <p className="text-[10px] text-muted-foreground mt-2 italic">Selecione a dificuldade para continuar</p>
            )}
            {currentSets.length < targetSeries && (
              <button onClick={() => { setPhase("input"); setSelectedRPE(null); }} className="text-xs text-muted-foreground mt-3 hover:text-foreground transition-colors">
                + Adicionar mais séries
              </button>
            )}
          </div>
        </div>
      )}

      {/* ===== REST DONE ALERT (enhanced) ===== */}
      {phase === "rest-done" && (
        <div className={`glass-card p-6 animate-scale-in border-2 border-primary/40 relative overflow-hidden ${restDoneFlash ? 'shadow-[0_0_40px_hsl(var(--primary)/0.3)]' : ''}`}>
          {/* Animated glow background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent animate-pulse" />
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center mb-4 shadow-[0_0_30px_hsl(var(--primary)/0.25)] animate-bounce" style={{ animationDuration: '1.5s' }}>
              <Zap className="w-10 h-10 text-primary" />
            </div>
            <h3 className="font-display font-bold text-xl">Descanso Finalizado!</h3>
            <p className="text-base text-primary font-semibold mt-1">Hora da próxima série 💪</p>
            <p className="text-sm text-muted-foreground mt-1">Série {currentSets.length + 1} de {targetSeries}</p>
            <Button onClick={() => { setPhase("input"); setRestDoneFlash(false); }} className="mt-5 h-14 px-10 text-lg font-bold bg-gradient-to-r from-primary to-chart-2 hover:opacity-90 shadow-lg shadow-primary/20">
              <Play className="w-5 h-5 mr-2" /> Registrar Série
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
              <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={() => addRestTime(-15)}>-15s</Button>
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
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  const data = getExerciseEvolution(currentEx.nome);
                  setEvolutionData(data);
                  setShowEvolutionChart(!showEvolutionChart);
                }}
                className={`text-[10px] px-2 py-1 rounded-md transition-colors ${showEvolutionChart ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                📊 Gráfico
              </button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowHistory(false)}><X className="w-4 h-4" /></Button>
            </div>
          </div>

          {/* Mini Evolution Chart */}
          {showEvolutionChart && evolutionData.length > 1 && (
            <div className="mb-3 p-3 rounded-xl bg-secondary/30 border border-border/30">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">Evolução de Carga</p>
              <div className="flex items-end gap-1 h-20">
                {(() => {
                  const maxW = Math.max(...evolutionData.map(d => d.weight));
                  const minW = Math.min(...evolutionData.map(d => d.weight));
                  const range = maxW - minW || 1;
                  return evolutionData.map((point, i) => {
                    const height = 20 + ((point.weight - minW) / range) * 60;
                    const isLast = i === evolutionData.length - 1;
                    return (
                      <TooltipProvider key={i}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex flex-col items-center flex-1 gap-1">
                              <div
                                className={`w-full rounded-t-md transition-all ${isLast ? "bg-primary" : "bg-primary/40"}`}
                                style={{ height: `${height}%` }}
                              />
                              <span className="text-[8px] text-muted-foreground">{point.date.slice(5)}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-[10px]">
                            {point.weight}kg • {point.reps} reps{point.rpe ? ` • ${point.rpe}` : ""}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  });
                })()}
              </div>
              {evolutionData.length >= 2 && (
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
                  <span className="text-[10px] text-muted-foreground">
                    {evolutionData[0].weight}kg → {evolutionData[evolutionData.length - 1].weight}kg
                  </span>
                  <span className={`text-[10px] font-semibold ${
                    evolutionData[evolutionData.length - 1].weight > evolutionData[0].weight ? "text-primary" :
                    evolutionData[evolutionData.length - 1].weight < evolutionData[0].weight ? "text-destructive" :
                    "text-muted-foreground"
                  }`}>
                    {evolutionData[evolutionData.length - 1].weight > evolutionData[0].weight ? "📈" : evolutionData[evolutionData.length - 1].weight < evolutionData[0].weight ? "📉" : "➡️"}
                    {" "}{(evolutionData[evolutionData.length - 1].weight - evolutionData[0].weight).toFixed(1)}kg
                  </span>
                </div>
              )}
            </div>
          )}
          {showEvolutionChart && evolutionData.length <= 1 && (
            <div className="mb-3 p-3 rounded-xl bg-secondary/30 border border-border/30 text-center">
              <p className="text-xs text-muted-foreground">Gráfico disponível após 2+ treinos registrados.</p>
            </div>
          )}

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

      {/* ===== ALTERNATIVES SHEET MODAL ===== */}
      <Sheet open={showAlternatives} onOpenChange={setShowAlternatives}>
        <SheetContent side="bottom" className="max-h-[85vh] rounded-t-2xl px-4 pb-8 overflow-y-auto">
          <SheetHeader className="pb-3">
            <SheetTitle className="font-display text-base flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-primary" /> Trocar Exercício
            </SheetTitle>
            <p className="text-xs text-muted-foreground">Selecione uma alternativa para <span className="font-semibold text-foreground">{currentEx.nome}</span></p>
          </SheetHeader>
          <div className="space-y-2.5 mt-2">
            {alternatives.map((alt, i) => {
              const altLibrary = exerciseLibrary.find(e => 
                alt.nome.toLowerCase().includes(e.nome.toLowerCase()) || e.nome.toLowerCase().includes(alt.nome.toLowerCase())
              );
              const difficultyColor = altLibrary?.dificuldade === "iniciante" 
                ? "text-green-400 bg-green-500/10 border-green-500/20" 
                : altLibrary?.dificuldade === "avançado" 
                ? "text-red-400 bg-red-500/10 border-red-500/20" 
                : "text-amber-400 bg-amber-500/10 border-amber-500/20";
              return (
                <button key={i} onClick={() => swapExercise(alt.nome)}
                  className="w-full text-left p-3.5 rounded-xl bg-secondary/40 hover:bg-secondary/60 border border-border/30 hover:border-primary/20 transition-all active:scale-[0.98] flex items-start gap-3 group">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-secondary/80 to-muted/50 flex items-center justify-center shrink-0 overflow-hidden border border-border/30">
                    {altLibrary ? (
                      <ExerciseAnimation exercise={altLibrary} size="sm" className="scale-90" />
                    ) : (
                      <AltGifPreview name={alt.nome} isHome={!!alt.tag?.includes("Casa")} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{alt.nome}</span>
                    </div>
                    {altLibrary && (
                      <p className="text-[10px] text-muted-foreground mb-1">
                        <Dumbbell className="w-3 h-3 inline mr-0.5 -mt-0.5" />
                        {altLibrary.equipamento} • {altLibrary.musculos.slice(0, 2).join(", ")}
                      </p>
                    )}
                    {!altLibrary && alt.desc && <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed mb-1">{alt.desc}</p>}
                    <div className="flex flex-wrap items-center gap-1">
                      {alt.tag && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20">{alt.tag}</span>
                      )}
                      {altLibrary && (
                        <>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-medium border border-primary/15">
                            {altLibrary.grupoLabel}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-medium border capitalize ${difficultyColor}`}>
                            {altLibrary.dificuldade}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-secondary/80 text-muted-foreground border border-border/30 capitalize">
                            {altLibrary.tipo}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 mt-4">
                    <ChevronRight className="w-4 h-4 text-primary opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              );
            })}
            {alternatives.length === 0 && (
              <div className="text-center py-8">
                <Dumbbell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhuma alternativa disponível</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ===== BOTTOM NAVIGATION ===== */}
      <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-background/95 backdrop-blur-lg border-t border-border/50 z-50 safe-area-inset-bottom">
        <div className="max-w-2xl mx-auto flex items-center gap-2 sm:gap-3">
          <Button variant="outline" size="icon" className="h-10 w-10 sm:h-11 sm:w-11 shrink-0 rounded-xl" onClick={goPrev} disabled={currentExIndex === 0}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          {currentExIndex === totalExercises - 1 && completedCount > 0 ? (
            <Button onClick={handleFinish} className="flex-1 h-10 sm:h-11 font-semibold text-sm sm:text-base">
              <Trophy className="w-4 h-4 mr-2" /> Finalizar Treino
            </Button>
          ) : (
            <Button onClick={goNext} className="flex-1 h-10 sm:h-11 text-sm sm:text-base" disabled={currentExIndex >= totalExercises - 1}>
              Próximo Exercício <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
          <Button variant="outline" size="icon" className="h-10 w-10 sm:h-11 sm:w-11 shrink-0 rounded-xl" onClick={goNext} disabled={currentExIndex >= totalExercises - 1}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
