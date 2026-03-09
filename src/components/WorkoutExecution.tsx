import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  ArrowLeft, ChevronLeft, ChevronRight, Clock, Timer, Trophy, Dumbbell,
  Info, RefreshCw, Plus, Pencil, Trash2, X, Check, Play, Pause, RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

// Muscle group illustration mapping (SVG-based visual indicators)
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

// Alternative exercises per muscle group
const alternativeExercises: Record<string, string[]> = {
  "Supino Reto": ["Supino com Halteres", "Supino Máquina", "Flexão de Braço"],
  "Supino Reto Máquina": ["Supino Reto", "Supino com Halteres", "Flexão de Braço"],
  "Supino Inclinado Halteres": ["Supino Inclinado Barra", "Supino Inclinado Máquina", "Flexão Inclinada"],
  "Crucifixo": ["Crucifixo Máquina", "Cross Over", "Peck Deck"],
  "Crucifixo Máquina": ["Crucifixo", "Cross Over", "Peck Deck"],
  "Cross Over": ["Crucifixo", "Crucifixo Máquina", "Peck Deck"],
  "Crucifixo Inclinado": ["Crucifixo", "Cross Over", "Peck Deck"],
  "Flexão de Braço": ["Supino Reto", "Supino Máquina", "Flexão Inclinada"],
  "Flexão com Peso": ["Flexão de Braço", "Supino Reto", "Supino com Halteres"],
  "Pulldown": ["Barra Fixa", "Pulldown Pegada Fechada", "Remada Alta"],
  "Barra Fixa": ["Pulldown", "Pulldown Pegada Fechada", "Barra Fixa Supinada"],
  "Barra Fixa com Peso": ["Barra Fixa", "Pulldown", "Pulldown Pegada Fechada"],
  "Remada Curvada": ["Remada Máquina", "Remada Unilateral", "Remada Baixa"],
  "Remada Máquina": ["Remada Curvada", "Remada Unilateral", "Remada Baixa"],
  "Remada Unilateral": ["Remada Curvada", "Remada Máquina", "Remada Baixa"],
  "Remada Baixa": ["Remada Curvada", "Remada Máquina", "Remada Unilateral"],
  "Remada Cavaleiro": ["Remada Curvada", "Remada Máquina", "Remada Baixa"],
  "Remada Curvada Pronada": ["Remada Curvada", "Remada Cavaleiro", "Remada Máquina"],
  "Pulldown Pegada Fechada": ["Pulldown", "Barra Fixa", "Pullover Cabo"],
  "Pullover Cabo": ["Pulldown", "Pulldown Pegada Fechada", "Remada Alta"],
  "Agachamento Livre": ["Leg Press", "Agachamento Smith", "Agachamento Búlgaro"],
  "Agachamento Búlgaro": ["Agachamento Livre", "Leg Press", "Avanço"],
  "Leg Press": ["Leg Press 45°", "Agachamento Livre", "Agachamento Smith"],
  "Leg Press 45°": ["Leg Press", "Agachamento Livre", "Agachamento Smith"],
  "Cadeira Extensora": ["Extensão de Pernas", "Agachamento Livre", "Leg Press"],
  "Mesa Flexora": ["Stiff", "Flexão de Pernas em Pé", "Boa Manhã"],
  "Stiff": ["Mesa Flexora", "Levantamento Terra", "Boa Manhã"],
  "Panturrilha em Pé": ["Panturrilha Sentado", "Panturrilha no Leg Press", "Elevação de Panturrilha"],
  "Panturrilha Sentado": ["Panturrilha em Pé", "Panturrilha no Leg Press", "Elevação de Panturrilha"],
  "Desenvolvimento Máquina": ["Desenvolvimento Militar", "Desenvolvimento Arnold", "Desenvolvimento Halteres"],
  "Desenvolvimento Militar": ["Desenvolvimento Máquina", "Desenvolvimento Arnold", "Desenvolvimento Halteres"],
  "Desenvolvimento Arnold": ["Desenvolvimento Militar", "Desenvolvimento Máquina", "Desenvolvimento Halteres"],
  "Elevação Lateral": ["Elevação Lateral Cabo", "Elevação Lateral Máquina", "Crucifixo Inverso"],
  "Elevação Frontal": ["Elevação Frontal Alternada", "Elevação Frontal com Barra", "Desenvolvimento Frontal"],
  "Elevação Frontal Alternada": ["Elevação Frontal", "Elevação Frontal com Barra", "Desenvolvimento Frontal"],
  "Face Pull": ["Crucifixo Inverso", "Remada Alta", "Elevação Lateral"],
  "Rosca Direta": ["Rosca Direta Barra", "Rosca Alternada", "Rosca Scott"],
  "Rosca Direta Barra": ["Rosca Alternada", "Rosca Scott", "Rosca Martelo"],
  "Rosca Martelo": ["Rosca Alternada", "Rosca Concentrada", "Rosca Direta"],
  "Rosca Scott": ["Rosca Direta", "Rosca Concentrada", "Rosca Alternada"],
  "Tríceps Testa": ["Tríceps Corda", "Tríceps Francês", "Tríceps Barra"],
  "Tríceps Corda": ["Tríceps Testa", "Tríceps Barra", "Tríceps Francês"],
  "Mergulho Paralelas": ["Tríceps Banco", "Tríceps Corda", "Tríceps Testa"],
  "Prancha Frontal": ["Prancha Lateral", "Prancha Dinâmica", "Abdominal Crunch"],
  "Abdominal Crunch": ["Abdominal Bicicleta", "Prancha Frontal", "Abdominal Infra"],
  "Abdominal Bicicleta": ["Abdominal Crunch", "Prancha Frontal", "Abdominal na Roldana"],
  "Elevação de Pernas": ["Abdominal Infra", "Abdominal Bicicleta", "Prancha Frontal"],
  "Abdominal na Roldana": ["Abdominal Crunch", "Abdominal Bicicleta", "Prancha Frontal"],
  "Prancha Dinâmica": ["Prancha Frontal", "Prancha Lateral", "Abdominal Bicicleta"],
  "Dragon Flag": ["Abdominal na Roldana", "Elevação de Pernas", "Prancha Dinâmica"],
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
  onFinish: () => void;
  onBack: () => void;
};

export default function WorkoutExecution({ plan, dayIndex, userId, onFinish, onBack }: Props) {
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
  const restIntervalRef = useRef<NodeJS.Timeout | null>(null);
  // Workout timer
  const [workoutSeconds, setWorkoutSeconds] = useState(0);
  const workoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  // UI
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const currentEx = exercises[currentExIndex];
  const totalExercises = exercises.length;
  const currentSets = sets[currentExIndex] || [];
  const targetSeries = parseInt(currentEx.series) || 4;
  const targetReps = currentEx.reps;
  const restSeconds = parseRestTime(currentEx.descanso);

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
            toast.info("Descanso finalizado! Hora da próxima série 💪");
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

  // Detect primary muscle group for styling
  const primaryGroup = useMemo(() => {
    const grupo = day.grupo.toLowerCase();
    for (const key of Object.keys(muscleGroupColors)) {
      if (grupo.includes(key)) return key;
    }
    return "peito";
  }, [day.grupo]);

  // Completed exercises count
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
    // Start rest timer
    setRestTime(restSeconds);
    setRestActive(true);
    setRestPaused(false);
  };

  // Edit set
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

  // Delete set
  const deleteSet = (setIdx: number) => {
    setSets(prev => {
      const arr = [...(prev[currentExIndex] || [])];
      arr.splice(setIdx, 1);
      return { ...prev, [currentExIndex]: arr };
    });
    toast.success("Série removida");
  };

  // Swap exercise
  const swapExercise = (newName: string) => {
    setExercises(prev => {
      const updated = [...prev];
      updated[currentExIndex] = { ...updated[currentExIndex], nome: newName };
      return updated;
    });
    setShowAlternatives(false);
    toast.success(`Exercício trocado para ${newName}`);
  };

  // Navigate exercises
  const goNext = () => {
    if (currentExIndex < totalExercises - 1) {
      setCurrentExIndex(currentExIndex + 1);
      setRestActive(false);
      setRestTime(0);
    }
  };

  const goPrev = () => {
    if (currentExIndex > 0) {
      setCurrentExIndex(currentExIndex - 1);
      setRestActive(false);
      setRestTime(0);
    }
  };

  // Finish
  const handleFinish = async () => {
    try {
      const { error } = await supabase.from("workout_sessions").insert({
        user_id: userId,
        workout_plan_id: plan.id,
        day_index: dayIndex,
        day_name: day.dia,
        muscle_group: day.grupo,
        exercises_completed: completedCount,
        exercises_total: totalExercises,
      } as any);
      if (error) throw error;
      toast.success("Treino concluído! 💪🔥");
      onFinish();
    } catch {
      toast.error("Erro ao salvar sessão");
    }
  };

  const alternatives = alternativeExercises[currentEx.nome] || [
    "Exercício alternativo 1",
    "Exercício alternativo 2",
    "Exercício alternativo 3",
  ];

  // Rest timer controls
  const toggleRestPause = () => setRestPaused(p => !p);
  const resetRest = () => {
    setRestTime(restSeconds);
    setRestPaused(false);
    setRestActive(true);
  };
  const skipRest = () => {
    setRestActive(false);
    setRestTime(0);
  };

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
              <span className="text-muted-foreground text-sm">{day.grupo}</span>
            </div>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
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

      {/* ===== EXERCISE ILLUSTRATION ===== */}
      <div className={`glass-card p-6 flex flex-col items-center justify-center relative overflow-hidden`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${muscleGroupColors[primaryGroup] || "from-primary/20 to-primary/5"} opacity-50`} />
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-3 shadow-lg">
            <Dumbbell className="w-10 h-10 text-primary" />
          </div>
          <p className="text-[11px] uppercase tracking-wider text-primary font-semibold mb-1">
            {muscleGroupIcons[primaryGroup] || "💪"} Músculos ativados
          </p>
          <h2 className="font-display font-bold text-lg text-center">{currentEx.nome}</h2>
        </div>
      </div>

      {/* ===== CIRCULAR INDICATORS ===== */}
      <div className="grid grid-cols-3 gap-3">
        {/* Reps */}
        <div className="glass-card p-3.5 flex flex-col items-center">
          <div className="w-14 h-14 rounded-full border-[3px] border-primary/30 flex items-center justify-center mb-1.5 relative">
            <span className="font-display font-bold text-base">{targetReps}</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">Repetições</span>
        </div>
        {/* Rest */}
        <div className="glass-card p-3.5 flex flex-col items-center">
          <div className="w-14 h-14 rounded-full border-[3px] border-amber-500/30 flex items-center justify-center mb-1.5">
            <span className="font-display font-bold text-base">{currentEx.descanso !== "—" ? currentEx.descanso : "—"}</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">Descanso</span>
        </div>
        {/* Sets done */}
        <div className="glass-card p-3.5 flex flex-col items-center">
          <div className={`w-14 h-14 rounded-full border-[3px] flex items-center justify-center mb-1.5 ${currentSets.length >= targetSeries ? "border-green-500/50" : "border-muted-foreground/20"}`}>
            <span className="font-display font-bold text-base">{currentSets.length}/{targetSeries}</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">Séries</span>
        </div>
      </div>

      {/* ===== REST TIMER (when active) ===== */}
      {restActive && (
        <div className="glass-card p-4 glow-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">⏱ Descanso</span>
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={skipRest}>
              Pular
            </Button>
          </div>
          <div className="flex items-center justify-center gap-4">
            <Button variant="ghost" size="icon" className="h-10 w-10" onClick={toggleRestPause}>
              {restPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            </Button>
            <span className="font-display font-bold text-4xl text-amber-400 tabular-nums min-w-[100px] text-center">
              {formatTime(restTime)}
            </span>
            <Button variant="ghost" size="icon" className="h-10 w-10" onClick={resetRest}>
              <RotateCcw className="w-5 h-5" />
            </Button>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-3">
            <div
              className="h-full rounded-full transition-all duration-1000 bg-amber-400/70"
              style={{ width: `${restSeconds > 0 ? (restTime / restSeconds) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* ===== SET REGISTRATION ===== */}
      <div className="glass-card p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Registrar Série</h3>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="text-[10px] text-muted-foreground mb-1 block">Quilos (kg)</label>
            <Input
              type="number"
              placeholder="0"
              value={inputKg}
              onChange={e => setInputKg(e.target.value)}
              className="h-11 bg-secondary/50 border-border/50 text-center font-display font-bold text-lg"
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] text-muted-foreground mb-1 block">Repetições</label>
            <Input
              type="number"
              placeholder="0"
              value={inputReps}
              onChange={e => setInputReps(e.target.value)}
              className="h-11 bg-secondary/50 border-border/50 text-center font-display font-bold text-lg"
            />
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

      {/* ===== SIDE BUTTONS (swap + info) ===== */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="h-11" onClick={() => setShowAlternatives(true)}>
          <RefreshCw className="w-4 h-4 mr-2" /> Trocar exercício
        </Button>
        <Button variant="outline" className="h-11" onClick={() => setShowInfo(!showInfo)}>
          <Info className="w-4 h-4 mr-2" /> Informações
        </Button>
      </div>

      {/* ===== EXERCISE INFO PANEL ===== */}
      {showInfo && (
        <div className="glass-card p-4 glow-border animate-slide-up">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display font-semibold text-sm">Sobre o exercício</h3>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowInfo(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
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

      {/* ===== ALTERNATIVES PANEL ===== */}
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
              <button
                key={i}
                onClick={() => swapExercise(alt)}
                className="w-full text-left p-3 rounded-xl bg-secondary/40 hover:bg-secondary/60 transition-colors flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Dumbbell className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-sm font-medium">{alt}</span>
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
