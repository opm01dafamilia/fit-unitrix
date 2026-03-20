import { useState, useMemo } from "react";
import { Play, Square, Moon, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import MuscleBodyMap from "@/components/MuscleBodyMap";
import ThemeToggle from "@/components/ThemeToggle";
import type { MuscleId } from "@/lib/exerciseLibrary";

const exerciseToMuscles: Record<string, MuscleId[]> = {
  "leg press": ["quadriceps"],
  "agachamento": ["quadriceps", "gluteos"],
  "cadeira extensora": ["quadriceps"],
  "cadeira flexora": ["isquiotibiais"],
  "hack": ["quadriceps"],
  "búlgaro": ["quadriceps", "gluteos"],
  "afundo": ["quadriceps", "gluteos"],
  "stiff": ["isquiotibiais", "gluteos"],
  "mesa flexora": ["isquiotibiais"],
  "elevação pélvica": ["gluteos", "isquiotibiais"],
  "hip thrust": ["gluteos"],
  "abdução": ["gluteos"],
  "panturrilha": ["panturrilha"],
  "gêmeos": ["panturrilha"],
  "elevação de gêmeos": ["panturrilha"],
  "supino": ["peitoral"],
  "crucifixo": ["peitoral"],
  "cross over": ["peitoral"],
  "puxada": ["dorsal"],
  "remada": ["dorsal", "trapezio"],
  "pulldown": ["dorsal"],
  "barra fixa": ["dorsal", "biceps"],
  "rosca": ["biceps"],
  "tríceps": ["triceps"],
  "desenvolvimento": ["deltoide-anterior", "deltoide-lateral"],
  "elevação lateral": ["deltoide-lateral"],
  "face pull": ["deltoide-posterior", "trapezio"],
  "abdominal": ["reto-abdominal"],
  "prancha": ["core"],
};

function getMusclesForExercise(name: string): MuscleId[] {
  const lower = name.toLowerCase();
  for (const [key, muscles] of Object.entries(exerciseToMuscles)) {
    if (lower.includes(key)) return muscles;
  }
  return [];
}

const EquipmentIcon = ({ exerciseName }: { exerciseName: string }) => {
  const lower = exerciseName.toLowerCase();
  let equipType: "machine" | "barbell" | "dumbbell" | "cable" | "bodyweight" = "machine";
  if (lower.includes("barra") || lower.includes("supino") || lower.includes("agachamento livre") || lower.includes("stiff") || lower.includes("rosca direta")) equipType = "barbell";
  else if (lower.includes("halter") || lower.includes("lateral") || lower.includes("rosca alternada") || lower.includes("búlgaro")) equipType = "dumbbell";
  else if (lower.includes("cross") || lower.includes("puxada") || lower.includes("pulldown") || lower.includes("cabo") || lower.includes("face pull") || lower.includes("tríceps corda")) equipType = "cable";
  else if (lower.includes("prancha") || lower.includes("abdominal") || lower.includes("flexão") || lower.includes("barra fixa") || lower.includes("hip thrust") || lower.includes("elevação pélvica")) equipType = "bodyweight";

  const svgColor = "hsl(var(--primary) / 0.7)";

  return (
    <div className="w-14 h-14 rounded-lg bg-secondary/60 border border-border/20 flex items-center justify-center shrink-0">
      {equipType === "barbell" && (
        <svg viewBox="0 0 48 48" className="w-9 h-9">
          <rect x="4" y="16" width="8" height="16" rx="2" fill={svgColor} opacity="0.8" />
          <rect x="36" y="16" width="8" height="16" rx="2" fill={svgColor} opacity="0.8" />
          <rect x="12" y="22" width="24" height="4" rx="1" fill={svgColor} opacity="0.5" />
          <rect x="8" y="18" width="4" height="12" rx="1" fill={svgColor} opacity="0.65" />
          <rect x="36" y="18" width="4" height="12" rx="1" fill={svgColor} opacity="0.65" />
        </svg>
      )}
      {equipType === "dumbbell" && (
        <svg viewBox="0 0 48 48" className="w-9 h-9">
          <rect x="8" y="16" width="10" height="16" rx="3" fill={svgColor} opacity="0.8" />
          <rect x="30" y="16" width="10" height="16" rx="3" fill={svgColor} opacity="0.8" />
          <rect x="18" y="21" width="12" height="6" rx="2" fill={svgColor} opacity="0.45" />
        </svg>
      )}
      {equipType === "cable" && (
        <svg viewBox="0 0 48 48" className="w-9 h-9">
          <rect x="20" y="4" width="8" height="36" rx="2" fill={svgColor} opacity="0.3" />
          <rect x="16" y="4" width="16" height="6" rx="2" fill={svgColor} opacity="0.7" />
          <circle cx="24" cy="14" r="3" fill={svgColor} opacity="0.6" />
          <path d="M24 17 L24 32 L18 38 M24 32 L30 38" stroke={svgColor} strokeWidth="2" fill="none" opacity="0.5" />
          <rect x="12" y="36" width="24" height="6" rx="2" fill={svgColor} opacity="0.5" />
        </svg>
      )}
      {equipType === "machine" && (
        <svg viewBox="0 0 48 48" className="w-9 h-9">
          <rect x="14" y="6" width="20" height="8" rx="3" fill={svgColor} opacity="0.7" />
          <rect x="20" y="14" width="8" height="20" rx="2" fill={svgColor} opacity="0.35" />
          <rect x="10" y="30" width="28" height="8" rx="3" fill={svgColor} opacity="0.6" />
          <rect x="16" y="38" width="4" height="6" rx="1" fill={svgColor} opacity="0.4" />
          <rect x="28" y="38" width="4" height="6" rx="1" fill={svgColor} opacity="0.4" />
        </svg>
      )}
      {equipType === "bodyweight" && (
        <svg viewBox="0 0 48 48" className="w-9 h-9">
          <circle cx="24" cy="10" r="5" fill={svgColor} opacity="0.7" />
          <path d="M24 15 L24 30 M24 20 L16 26 M24 20 L32 26 M24 30 L18 42 M24 30 L30 42" stroke={svgColor} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.6" />
        </svg>
      )}
    </div>
  );
};

function groupExercises(exercicios: any[]): { groupName: string; exercises: any[]; muscles: MuscleId[] }[] {
  const groups: Map<string, { exercises: any[]; muscles: Set<MuscleId> }> = new Map();

  for (const ex of exercicios) {
    const muscles = getMusclesForExercise(ex.nome);
    let groupLabel = "Exercícios";
    const lower = (ex.nome || "").toLowerCase();
    if (muscles.includes("quadriceps")) groupLabel = "Quadríceps";
    else if (muscles.includes("isquiotibiais")) groupLabel = "Posterior";
    else if (muscles.includes("gluteos")) groupLabel = "Glúteo";
    else if (muscles.includes("panturrilha")) groupLabel = "Panturrilha";
    else if (muscles.includes("peitoral")) groupLabel = "Peito";
    else if (muscles.includes("dorsal") || muscles.includes("trapezio")) groupLabel = "Costas";
    else if (muscles.includes("biceps")) groupLabel = "Bíceps";
    else if (muscles.includes("triceps")) groupLabel = "Tríceps";
    else if (muscles.includes("deltoide-anterior") || muscles.includes("deltoide-lateral")) groupLabel = "Ombros";
    else if (muscles.includes("reto-abdominal") || muscles.includes("core")) groupLabel = "Abdômen";
    else if (lower.includes("panturrilha") || lower.includes("gêmeos")) groupLabel = "Panturrilha";
    else if (lower.includes("bíceps") || lower.includes("rosca")) groupLabel = "Bíceps";
    else if (lower.includes("tríceps")) groupLabel = "Tríceps";

    if (!groups.has(groupLabel)) groups.set(groupLabel, { exercises: [], muscles: new Set() });
    const g = groups.get(groupLabel)!;
    g.exercises.push(ex);
    muscles.forEach(m => g.muscles.add(m));
  }

  return Array.from(groups.entries()).map(([name, data]) => ({
    groupName: name,
    exercises: data.exercises,
    muscles: Array.from(data.muscles),
  }));
}

interface WorkoutDayViewProps {
  day: any;
  dayIndex: number;
  gender: "masculino" | "feminino" | null;
  canStart: boolean;
  isCompleted: boolean;
  onStartWorkout: () => void;
  onFinalize?: () => void;
  onOpenCalendar?: () => void;
  hasCardio?: boolean;
}

const WorkoutDayView = ({
  day,
  canStart,
  isCompleted,
  onStartWorkout,
  onFinalize,
  onOpenCalendar,
  hasCardio,
}: WorkoutDayViewProps) => {
  const [priority, setPriority] = useState<"cardio" | "treino">("treino");

  const exerciseGroups = useMemo(() => groupExercises(day.exercicios || []), [day.exercicios]);

  const allMuscles = useMemo<MuscleId[]>(() => {
    const set = new Set<MuscleId>();
    (day.exercicios || []).forEach((ex: any) => {
      getMusclesForExercise(ex.nome).forEach(m => set.add(m));
    });
    return Array.from(set);
  }, [day.exercicios]);

  return (
    <div className="space-y-4 animate-slide-up w-full">
      {/* Top Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <ThemeToggle />
        {hasCardio && (
          <button
            onClick={() => setPriority(priority === "cardio" ? "treino" : "cardio")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all active:scale-[0.97] ${
              priority === "cardio"
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border/50 bg-secondary/60 text-muted-foreground hover:bg-secondary/80"
            }`}
          >
            <Moon className="w-4 h-4" />
            <span className="text-xs font-semibold">Cardio</span>
          </button>
        )}
        <div className="ml-auto">
          <button
            onClick={onOpenCalendar}
            className="p-2.5 rounded-xl border border-border/50 bg-secondary/60 text-muted-foreground hover:bg-secondary/80 transition-all active:scale-[0.97]"
          >
            <CalendarDays className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-xl sm:text-2xl font-display font-bold tracking-tight text-foreground">
        Treino de {day.grupo}
      </h1>

      {/* Cardio/Treino Priority Toggle */}
      {hasCardio && (
        <div>
          <p className="text-xs text-muted-foreground font-medium mb-2">Escolher Primeiro:</p>
          <div className="grid grid-cols-2 gap-2">
            {(["cardio", "treino"] as const).map(opt => (
              <button
                key={opt}
                onClick={() => setPriority(opt)}
                className={`py-3 rounded-xl text-sm font-bold tracking-wider uppercase transition-all border-2 active:scale-[0.97] ${
                  priority === opt
                    ? "border-primary bg-primary/10 text-primary shadow-[0_0_16px_-4px_hsl(var(--primary)/0.2)]"
                    : "border-border/50 bg-secondary/40 text-muted-foreground hover:border-border"
                }`}
              >
                {opt === "cardio" ? "CARDIO" : "TREINO"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Muscle Group Sections */}
      <div className="space-y-3">
        {exerciseGroups.map((group, gi) => (
          <div
            key={gi}
            className="rounded-2xl border border-border/40 overflow-hidden bg-card"
          >
            <div className="px-4 pt-4 pb-2">
              <h2 className="text-base font-display font-bold text-foreground">{group.groupName}</h2>
            </div>

            <div className="flex items-start gap-3 px-4 pb-4">
              {/* Exercise list */}
              <div className="flex-1 min-w-0 space-y-3">
                {group.exercises.map((ex: any, ei: number) => (
                  <div key={ei} className="border-b border-border/20 pb-2 last:border-0 last:pb-0">
                    <p className="text-sm font-bold text-foreground">{ex.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {ex.series} Séries • {ex.reps} Reps.
                    </p>
                  </div>
                ))}
              </div>

              {/* Equipment icons */}
              <div className="flex flex-col gap-1 items-center shrink-0">
                {group.exercises.slice(0, 3).map((ex: any, ei: number) => (
                  <EquipmentIcon key={ei} exerciseName={ex.nome} />
                ))}
              </div>

              {/* Muscle avatar */}
              <div className="shrink-0 hidden sm:block">
                <MuscleBodyMap
                  highlightedMuscles={group.muscles.length > 0 ? group.muscles : allMuscles}
                  size="sm"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-2 pb-4">
        <Button
          onClick={onStartWorkout}
          disabled={!canStart || isCompleted}
          className="h-14 text-base font-bold rounded-2xl border-0 shadow-lg active:scale-[0.97] transition-all"
          style={{
            background: canStart && !isCompleted
              ? 'linear-gradient(135deg, hsl(152 69% 46%), hsl(152 69% 38%))'
              : 'hsl(var(--muted))',
            color: canStart && !isCompleted
              ? 'hsl(152 100% 8%)'
              : 'hsl(var(--muted-foreground))',
            boxShadow: canStart && !isCompleted
              ? '0 8px 32px -8px hsl(152 69% 46% / 0.35)'
              : 'none',
          }}
        >
          <Play className="w-5 h-5 mr-2" />
          {isCompleted ? "Concluído ✓" : "Iniciar Treino"}
        </Button>

        <Button
          onClick={onFinalize}
          variant="outline"
          className="h-14 text-base font-bold rounded-2xl border-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50 shadow-lg active:scale-[0.97] transition-all"
        >
          <Square className="w-5 h-5 mr-2" />
          Finalizar
        </Button>
      </div>
    </div>
  );
};

export default WorkoutDayView;
