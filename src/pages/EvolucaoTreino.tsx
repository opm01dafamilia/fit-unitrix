import { useState, useEffect, useMemo } from "react";
import {
  TrendingUp, TrendingDown, Zap, Brain, ArrowUp, ArrowDown,
  Minus, RefreshCw, Dumbbell, Clock, Target, Activity,
  ChevronRight, Flame, Shield, Weight, Gauge, Heart,
  Plus, BarChart3
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, subDays } from "date-fns";
import {
  getEvolutionSnapshot,
  getIntensityInfo,
  getLevelLabel,
  getLevelProgress,
  getActionLabel,
  type EvolutionSnapshot,
  type AdjustmentEntry,
} from "@/lib/aiPersonalTrainerEngine";
import { getExercisesWithHistory, getForceEvolution, type ForceEvolutionPoint } from "@/lib/smartLoadEngine";

const EvolucaoTreino = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState<EvolutionSnapshot | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      const weekAgo = subDays(new Date(), 14).toISOString();

      const [sessionsRes, historyRes, plansRes] = await Promise.all([
        supabase
          .from("workout_sessions")
          .select("completed_at, exercises_completed, exercises_total")
          .eq("user_id", user.id)
          .gte("completed_at", weekAgo)
          .order("completed_at", { ascending: false }),
        supabase
          .from("exercise_history")
          .select("weight, reps, set_number, created_at")
          .eq("user_id", user.id)
          .gte("created_at", weekAgo)
          .order("created_at", { ascending: false }),
        supabase
          .from("workout_plans")
          .select("days_per_week")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1),
      ]);

      const sessions = (sessionsRes.data || []).map((s: any) => ({
        completed_at: s.completed_at,
        exercises_completed: s.exercises_completed,
        exercises_total: s.exercises_total,
      }));

      const history = (historyRes.data || []).map((h: any) => ({
        weight: h.weight,
        reps: h.reps,
        set_number: h.set_number,
        created_at: h.created_at,
      }));

      const targetDays = plansRes.data?.[0]?.days_per_week || 4;

      // Calculate streak
      const allSessionsRes = await supabase
        .from("workout_sessions")
        .select("completed_at")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false })
        .limit(30);

      let streak = 0;
      if (allSessionsRes.data && allSessionsRes.data.length > 0) {
        const uniqueDays = [...new Set(allSessionsRes.data.map((s: any) =>
          format(new Date(s.completed_at), "yyyy-MM-dd")
        ))].sort().reverse();
        const today = format(new Date(), "yyyy-MM-dd");
        const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
        if (uniqueDays[0] === today || uniqueDays[0] === yesterday) {
          for (let i = 0; i < uniqueDays.length; i++) {
            const expected = format(subDays(new Date(), i + (uniqueDays[0] === today ? 0 : 1)), "yyyy-MM-dd");
            if (uniqueDays[i] === expected) streak++;
            else break;
          }
        }
      }

      const snap = getEvolutionSnapshot(sessions, history, targetDays, streak);
      setSnapshot(snap);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const levelProgress = useMemo(() => {
    if (!snapshot) return { current: 0, next: 100, pct: 0 };
    return getLevelProgress(snapshot.level);
  }, [snapshot]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-56 bg-secondary/60 rounded-lg" />
        <div className="h-40 bg-secondary/40 rounded-2xl" />
        <div className="h-64 bg-secondary/30 rounded-2xl" />
      </div>
    );
  }

  if (!snapshot) return null;

  const intensityInfo = getIntensityInfo(snapshot.intensity);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="w-6 h-6 text-primary" />
          Evolução do Treino
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          IA Personal Trainer — seu treino evolui automaticamente
        </p>
      </div>

      {/* Coach Message */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            Mensagem do Coach
          </p>
          <p className="text-sm leading-relaxed">{snapshot.coachMessage}</p>
        </div>
      </div>

      {/* Level + Intensity Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Nível</span>
            <span className="text-2xl font-bold text-primary">{snapshot.level}</span>
          </div>
          <p className="text-sm font-semibold">{getLevelLabel(snapshot.level)}</p>
          <Progress value={levelProgress.pct} className="h-2" />
          <p className="text-[10px] text-muted-foreground">{levelProgress.pct}% para o próximo nível</p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Intensidade</span>
            <span className="text-2xl">{intensityInfo.emoji}</span>
          </div>
          <p className={`text-sm font-semibold ${intensityInfo.color}`}>{intensityInfo.label}</p>
          <div className="flex gap-1 mt-1">
            {["leve", "moderado", "intenso", "avancado"].map((tier) => (
              <div
                key={tier}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  tier === snapshot.intensity
                    ? "bg-primary"
                    : ["leve", "moderado", "intenso", "avancado"].indexOf(tier) <=
                      ["leve", "moderado", "intenso", "avancado"].indexOf(snapshot.intensity)
                    ? "bg-primary/40"
                    : "bg-secondary"
                }`}
              />
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground">Ajuste automático semanal</p>
        </div>
      </div>

      {/* Load, Volume & Cardio Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-xl border border-border/50 bg-card/50 p-3 text-center">
          <Weight className="w-4 h-4 mx-auto mb-1 text-primary" />
          <p className={`text-lg font-bold ${snapshot.suggestedLoadPct > 0 ? "text-primary" : snapshot.suggestedLoadPct < 0 ? "text-orange-400" : "text-muted-foreground"}`}>
            {snapshot.suggestedLoadPct > 0 ? "+" : ""}{snapshot.suggestedLoadPct}%
          </p>
          <p className="text-[10px] text-muted-foreground">Carga Sugerida</p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card/50 p-3 text-center">
          <BarChart3 className="w-4 h-4 mx-auto mb-1 text-primary" />
          <p className="text-lg font-bold text-foreground">
            {snapshot.weeklyVolume > 0 ? `${(snapshot.weeklyVolume / 1000).toFixed(1)}k` : "0"}
          </p>
          <p className="text-[10px] text-muted-foreground">Volume Semanal</p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card/50 p-3 text-center">
          <Heart className={`w-4 h-4 mx-auto mb-1 ${
            snapshot.cardioStatus === "adding" ? "text-primary" :
            snapshot.cardioStatus === "reducing" ? "text-orange-400" :
            "text-muted-foreground"
          }`} />
          <p className={`text-sm font-bold ${
            snapshot.cardioStatus === "adding" ? "text-primary" :
            snapshot.cardioStatus === "reducing" ? "text-orange-400" :
            "text-foreground"
          }`}>
            {snapshot.cardioStatus === "adding" ? "Adicionar" :
             snapshot.cardioStatus === "reducing" ? "Reduzir" : "OK"}
          </p>
          <p className="text-[10px] text-muted-foreground">Cardio</p>
        </div>
      </div>

      {/* Weekly Analysis Summary */}
      {snapshot.weeklyAnalysis && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            {
              label: "Treinos",
              value: `${snapshot.weeklyAnalysis.workoutsDone}/${snapshot.weeklyAnalysis.workoutsTarget}`,
              icon: Dumbbell,
              accent: snapshot.weeklyAnalysis.workoutsDone >= snapshot.weeklyAnalysis.workoutsTarget,
            },
            {
              label: "Séries",
              value: snapshot.weeklyAnalysis.totalSeries.toString(),
              icon: Activity,
              accent: snapshot.weeklyAnalysis.totalSeries > 20,
            },
            {
              label: "Conclusão",
              value: `${snapshot.weeklyAnalysis.completionRate}%`,
              icon: Target,
              accent: snapshot.weeklyAnalysis.completionRate >= 80,
            },
            {
              label: "Streak",
              value: `${snapshot.weeklyAnalysis.streak} 🔥`,
              icon: Flame,
              accent: snapshot.weeklyAnalysis.streak >= 3,
            },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border/50 bg-card/50 p-3 text-center">
              <stat.icon className={`w-4 h-4 mx-auto mb-1 ${stat.accent ? "text-primary" : "text-muted-foreground"}`} />
              <p className={`text-lg font-bold ${stat.accent ? "text-foreground" : "text-muted-foreground"}`}>{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Adaptations summary */}
      {snapshot.weeklyAnalysis && (snapshot.weeklyAnalysis.skippedExercises > 0 || snapshot.weeklyAnalysis.swappedExercises > 0) && (
        <div className="rounded-xl border border-border/40 bg-card/30 p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5" />
            Adaptações Detectadas
          </p>
          <div className="flex gap-3">
            {snapshot.weeklyAnalysis.skippedExercises > 0 && (
              <span className="text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-1 rounded-md">
                ⏭️ {snapshot.weeklyAnalysis.skippedExercises} exercícios pulados
              </span>
            )}
            {snapshot.weeklyAnalysis.swappedExercises > 0 && (
              <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded-md">
                🔄 {snapshot.weeklyAnalysis.swappedExercises} exercícios trocados
              </span>
            )}
          </div>
        </div>
      )}

      {/* Protection Badge */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/40 rounded-xl px-4 py-2.5 border border-border/30">
        <Shield className="w-4 h-4 text-primary flex-shrink-0" />
        <span>
          Proteção ativa: carga só aumenta após {3} treinos. Nunca 2 semanas seguidas. Intensidade respeita divisão muscular.
        </span>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="force" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="force" className="flex-1 text-xs">Evolução de Força</TabsTrigger>
          <TabsTrigger value="history" className="flex-1 text-xs">Ajustes</TabsTrigger>
          <TabsTrigger value="swaps" className="flex-1 text-xs">Trocas</TabsTrigger>
        </TabsList>

        <TabsContent value="force" className="space-y-3 mt-4">
          <ForceEvolutionTab />
        </TabsContent>

        <TabsContent value="history" className="space-y-3 mt-4">
          {snapshot.adjustments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Brain className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">Nenhum ajuste ainda</p>
              <p className="text-xs mt-1">O sistema analisará seus treinos semanalmente</p>
            </div>
          ) : (
            snapshot.adjustments.slice(0, 10).map((entry, idx) => (
              <AdjustmentCard key={idx} entry={entry} />
            ))
          )}
        </TabsContent>

        <TabsContent value="swaps" className="space-y-3 mt-4">
          {snapshot.swapSuggestions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <RefreshCw className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">Sem trocas sugeridas</p>
              <p className="text-xs mt-1">Exercícios com falhas, pulos ou trocas repetidas aparecerão aqui</p>
            </div>
          ) : (
            snapshot.swapSuggestions.map((swap, idx) => (
              <div key={idx} className="rounded-xl border border-border/60 bg-card p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium line-through text-muted-foreground">{swap.original}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <ChevronRight className="w-3.5 h-3.5 text-primary" />
                      <p className="text-sm font-semibold text-primary">{swap.suggested}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground bg-secondary/60 px-2 py-1 rounded-md">
                    {swap.muscleGroup}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{swap.reason}</p>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Total workouts analyzed */}
      {snapshot.totalWorkoutsAnalyzed > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          {snapshot.totalWorkoutsAnalyzed} treinos analisados pela IA Personal
        </p>
      )}
    </div>
  );
};

// ===== Force Evolution Tab Component =====

const ForceEvolutionTab = () => {
  const exerciseNames = useMemo(() => getExercisesWithHistory(), []);
  const [selectedEx, setSelectedEx] = useState<string | null>(null);
  const evolutionData = useMemo(() => {
    if (!selectedEx) return [];
    return getForceEvolution(selectedEx);
  }, [selectedEx]);

  if (exerciseNames.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Weight className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm font-medium">Nenhum dado de força registrado</p>
        <p className="text-xs mt-1">Complete treinos com registro de carga para ver a evolução</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Exercise selector */}
      <div className="flex flex-wrap gap-1.5">
        {exerciseNames.slice(0, 12).map((name) => (
          <button
            key={name}
            onClick={() => setSelectedEx(selectedEx === name ? null : name)}
            className={`text-[10px] font-medium px-2.5 py-1.5 rounded-lg border transition-all ${
              selectedEx === name
                ? "bg-primary/10 text-primary border-primary/30"
                : "bg-secondary/40 text-muted-foreground border-border/30 hover:border-border/60"
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Chart */}
      {selectedEx && evolutionData.length > 1 && (
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-primary" /> {selectedEx}
          </h3>
          <div className="flex items-end gap-1.5 h-32">
            {(() => {
              const maxW = Math.max(...evolutionData.map(d => d.weight));
              const minW = Math.min(...evolutionData.map(d => d.weight));
              const range = maxW - minW || 1;
              return evolutionData.map((point, i) => {
                const height = 15 + ((point.weight - minW) / range) * 85;
                const isLast = i === evolutionData.length - 1;
                const effortColor = point.effort === "leve" ? "bg-green-500" :
                  point.effort === "moderado" ? "bg-amber-500" :
                  point.effort === "extremo" ? "bg-purple-500" : "bg-red-500";
                return (
                  <TooltipProvider key={i}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex flex-col items-center flex-1 gap-1 h-full justify-end">
                          <div
                            className={`w-full rounded-t-md transition-all ${isLast ? effortColor : effortColor + "/50"}`}
                            style={{ height: `${height}%` }}
                          />
                          <span className="text-[7px] text-muted-foreground">{point.date.slice(5)}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-[10px]">
                        {point.weight}kg • {point.reps} reps • {point.effort}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              });
            })()}
          </div>
          {/* Summary */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
            <span className="text-[10px] text-muted-foreground">
              {evolutionData[0].weight}kg → {evolutionData[evolutionData.length - 1].weight}kg
            </span>
            <span className={`text-xs font-bold ${
              evolutionData[evolutionData.length - 1].weight > evolutionData[0].weight ? "text-primary" :
              evolutionData[evolutionData.length - 1].weight < evolutionData[0].weight ? "text-destructive" :
              "text-muted-foreground"
            }`}>
              {evolutionData[evolutionData.length - 1].weight > evolutionData[0].weight ? "📈 +" : 
               evolutionData[evolutionData.length - 1].weight < evolutionData[0].weight ? "📉 " : "➡️ "}
              {(evolutionData[evolutionData.length - 1].weight - evolutionData[0].weight).toFixed(1)}kg
            </span>
          </div>
        </div>
      )}

      {selectedEx && evolutionData.length <= 1 && (
        <div className="rounded-xl border border-border/60 bg-card p-6 text-center">
          <Dumbbell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Gráfico disponível após 2+ treinos registrados</p>
        </div>
      )}

      {!selectedEx && (
        <div className="rounded-xl border border-border/40 bg-card/50 p-6 text-center">
          <Weight className="w-8 h-8 text-primary/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Selecione um exercício para ver a evolução de força</p>
        </div>
      )}
    </div>
  );
};

// ===== Adjustment Card Component =====

const AdjustmentCard = ({ entry }: { entry: AdjustmentEntry }) => {
  const levelChanged = entry.levelBefore !== entry.levelAfter;
  const intensityChanged = entry.intensityBefore !== entry.intensityAfter;

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {format(new Date(entry.date), "dd/MM/yyyy")}
        </span>
        {levelChanged && (
          <span className={`text-xs font-bold flex items-center gap-1 ${
            entry.levelAfter > entry.levelBefore ? "text-primary" : "text-orange-400"
          }`}>
            {entry.levelAfter > entry.levelBefore ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            Nível {entry.levelBefore} → {entry.levelAfter}
          </span>
        )}
      </div>

      <p className="text-sm leading-relaxed">{entry.coachMessage}</p>

      <div className="flex flex-wrap gap-1.5">
        {entry.actions.map((action, i) => {
          const info = getActionLabel(action);
          return (
            <span
              key={i}
              className={`text-[10px] font-medium px-2 py-1 rounded-md border ${
                info.type === "up"
                  ? "bg-primary/10 text-primary border-primary/20"
                  : info.type === "down"
                  ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                  : "bg-secondary text-muted-foreground border-border/50"
              }`}
            >
              {info.emoji} {info.label}
            </span>
          );
        })}
      </div>

      {intensityChanged && (
        <p className="text-xs text-muted-foreground">
          Intensidade: {entry.intensityBefore} → <span className="font-semibold text-foreground">{entry.intensityAfter}</span>
        </p>
      )}
    </div>
  );
};

export default EvolucaoTreino;
