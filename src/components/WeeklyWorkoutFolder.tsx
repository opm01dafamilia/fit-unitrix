import { useState } from "react";
import { ArrowLeft, Play, Check, Dumbbell, Clock, Flame, ChevronRight, X, CalendarDays } from "lucide-react";
import Fit-UnitrixLogo from "@/components/Fit-UnitrixLogo";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import type { DayIntensity } from "@/lib/workoutGenerator";
import { getGroupRecoveryLevel } from "@/lib/smartRecoveryEngine";

interface WeeklyWorkoutFolderProps {
  planData: any[];
  activePlan: any;
  sessions: any[];
  todayDayIndex: number;
  todayCompleted: boolean;
  canStartDay: (dayIndex: number) => boolean;
  onStartWorkout: (plan: any, dayIndex: number) => void;
  onStartCardio: (plan: any, dayIndex: number) => void;
}

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

const WeeklyWorkoutFolder = ({
  planData,
  activePlan,
  sessions,
  todayDayIndex,
  todayCompleted,
  canStartDay,
  onStartWorkout,
  onStartCardio,
}: WeeklyWorkoutFolderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewingDay, setViewingDay] = useState<number | null>(null);

  const todayCount = planData.filter((_, i) =>
    sessions.some(s =>
      s.workout_plan_id === activePlan.id &&
      s.day_index === i &&
      format(new Date(s.completed_at), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
    )
  ).length;

  // ===== FULLSCREEN DAY VIEW =====
  if (viewingDay !== null) {
    const day = planData[viewingDay];
    const isTodays = viewingDay === todayDayIndex;
    const isCompleted = sessions.some(s =>
      s.workout_plan_id === activePlan.id &&
      s.day_index === viewingDay &&
      format(new Date(s.completed_at), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
    );
    const canStart = canStartDay(viewingDay);

    return (
      <div className="fixed inset-0 z-50 bg-background overflow-y-auto animate-fade-in">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border/30 px-4 py-3 flex items-center gap-3"
          style={{ background: 'hsl(var(--background) / 0.95)', backdropFilter: 'blur(12px)' }}>
          <button
            onClick={() => setViewingDay(null)}
            className="p-2 rounded-xl hover:bg-secondary/60 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <Fit-UnitrixLogo size="xs" showText />
            <p className="text-sm font-display font-bold text-foreground truncate">{day.dia}</p>
          </div>
          {isTodays && !isCompleted && (
            <span className="text-[8px] uppercase tracking-[0.15em] text-primary font-black px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/15">
              Hoje
            </span>
          )}
          {isCompleted && (
            <span className="text-[8px] uppercase tracking-[0.15em] text-green-400 font-black px-2.5 py-1 rounded-lg bg-green-500/10 border border-green-500/15 flex items-center gap-1">
              <Check className="w-3 h-3" /> Feito
            </span>
          )}
        </div>

        <div className="p-4 pb-32 space-y-5">
          {/* Day Info */}
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getGradient(day.grupo)} flex items-center justify-center border border-primary/10 shadow-xl shrink-0`}>
              <span className="text-3xl">{getMuscleIcon(day.grupo)}</span>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-display font-black leading-tight">{day.grupo}</h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {getIntensityBadge(day.intensidade)}
                <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium px-2 py-1 rounded-lg bg-secondary/60 border border-border/30">
                  <Dumbbell className="w-3.5 h-3.5 text-primary/70" /> {day.exercicios.length} exercícios
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium px-2 py-1 rounded-lg bg-secondary/60 border border-border/30">
                  <Clock className="w-3.5 h-3.5 text-primary/70" /> ~{day.exercicios.length * 5}min
                </span>
              </div>
            </div>
          </div>

          {/* Exercises */}
          <div>
            <h3 className="text-xs font-display font-bold text-muted-foreground uppercase tracking-[0.15em] mb-3">
              Exercícios
            </h3>
            <div className="space-y-2.5">
              {day.exercicios.map((ex: any, j: number) => (
                <div key={j} className="rounded-2xl border border-border/30 p-4"
                  style={{ background: 'linear-gradient(145deg, hsl(var(--card)), hsl(var(--card) / 0.6))' }}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary mt-0.5">
                      {j + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">{ex.nome}</p>
                      {ex.desc && (
                        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{ex.desc}</p>
                      )}
                      <div className="flex items-center gap-2.5 mt-2">
                        <span className="flex items-center gap-1 text-[11px] text-primary font-semibold px-2 py-1 rounded-lg bg-primary/8 border border-primary/10">
                          {ex.series}x{ex.reps}
                        </span>
                        {ex.descanso && ex.descanso !== "—" && (
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground px-2 py-1 rounded-lg bg-secondary/50 border border-border/20">
                            ⏱ {ex.descanso}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Not today notice */}
          {!isTodays && !isCompleted && (
            <div className="rounded-2xl border border-amber-500/20 p-4 flex items-center gap-3"
              style={{ background: 'linear-gradient(145deg, hsl(var(--card)), hsl(var(--card) / 0.6))' }}>
              <CalendarDays className="w-5 h-5 text-amber-400 shrink-0" />
              <p className="text-xs text-muted-foreground">
                Este treino não é o de hoje. Você pode visualizar, mas só pode iniciar no dia correto.
              </p>
            </div>
          )}
        </div>

        {/* Bottom Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-4 border-t border-border/30 z-20"
          style={{ background: 'hsl(var(--background) / 0.95)', backdropFilter: 'blur(12px)' }}>
          {canStart ? (
            <div className="flex gap-3">
              <button
                onClick={() => onStartWorkout(activePlan, viewingDay)}
                className="flex-1 h-14 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-xl active:scale-[0.97] transition-all"
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))',
                  color: 'hsl(var(--primary-foreground))',
                  boxShadow: '0 8px 32px -8px hsl(var(--primary) / 0.35)',
                }}
              >
                <Play className="w-5 h-5" /> Iniciar Treino
              </button>
              <button
                onClick={() => onStartCardio(activePlan, viewingDay)}
                className="h-14 px-5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border-2 border-orange-500/30 text-orange-400 hover:bg-orange-500/10 active:scale-[0.97] transition-all"
              >
                <Flame className="w-5 h-5" /> Cardio
              </button>
            </div>
          ) : isCompleted ? (
            <div className="h-14 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-green-400 bg-green-500/10 border border-green-500/20">
              <Check className="w-5 h-5" /> Treino Concluído
            </div>
          ) : (
            <div className="h-14 rounded-2xl flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground bg-muted/40 border border-border/30">
              <CalendarDays className="w-4 h-4" /> Disponível apenas no dia correto
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== FOLDER CLOSED — Card Summary =====
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full rounded-2xl border-2 border-border/30 hover:border-primary/20 p-5 text-left transition-all active:scale-[0.98]"
        style={{ background: 'linear-gradient(145deg, hsl(var(--card)), hsl(var(--card) / 0.6))' }}
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center border border-primary/10 shadow-lg shrink-0"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.05))' }}>
            <CalendarDays className="w-7 h-7 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-display font-black text-foreground">Treino da Semana</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {planData.length} dias • {todayCount > 0 ? `${todayCount} concluído hoje` : "Toque para ver"}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
        </div>
      </button>
    );
  }

  // ===== FOLDER OPEN — Day List =====
  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsOpen(false)}
          className="p-2 rounded-xl hover:bg-secondary/60 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h3 className="text-lg font-display font-black text-foreground">Treino da Semana</h3>
          <p className="text-xs text-muted-foreground">{planData.length} dias de treino</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {planData.map((day: any, i: number) => {
          const isTodays = i === todayDayIndex;
          const isCompleted = sessions.some(s =>
            s.workout_plan_id === activePlan.id &&
            s.day_index === i &&
            format(new Date(s.completed_at), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
          );
          const sessionData = sessions.map((s: any) => ({
            completed_at: s.completed_at,
            muscle_group: s.muscle_group,
            intensity: undefined as string | undefined,
          }));
          const recoveryLevel = getGroupRecoveryLevel(day.grupo, sessionData);

          return (
            <button
              key={i}
              onClick={() => setViewingDay(i)}
              className={`w-full relative overflow-hidden rounded-2xl text-left transition-all active:scale-[0.98] ${
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
              }}
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
                      {recoveryLevel === "recovered" && <span className="text-[8px] px-1 py-0.5 rounded bg-primary/10 text-primary border border-primary/10">🟢</span>}
                      {recoveryLevel === "attention" && <span className="text-[8px] px-1 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/10">🟡</span>}
                      {recoveryLevel === "overload" && <span className="text-[8px] px-1 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/10">🔴</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <p className="text-xs font-display font-bold text-foreground">{day.exercicios.length}</p>
                      <p className="text-[8px] text-muted-foreground">exerc.</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2.5 text-[10px] text-muted-foreground font-medium">
                  <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary/40 border border-border/20">
                    <Dumbbell className="w-3 h-3 text-primary/60" /> {day.exercicios.length} exercícios
                  </span>
                  <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary/40 border border-border/20">
                    <Clock className="w-3 h-3 text-primary/60" /> ~{day.exercicios.length * 5}min
                  </span>
                  {!isTodays && !isCompleted && (
                    <span className="ml-auto text-[9px] text-muted-foreground/60 font-medium">
                      Visualizar
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyWorkoutFolder;
