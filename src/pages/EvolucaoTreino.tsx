import { useState, useEffect, useMemo } from "react";
import {
  TrendingUp, TrendingDown, Zap, Brain, ArrowUp, ArrowDown,
  Minus, RefreshCw, Dumbbell, Clock, Target, Activity,
  Loader2, ChevronRight, Flame, Shield, AlertTriangle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, subDays } from "date-fns";
import {
  getEvolutionSnapshot,
  loadTrainerState,
  getIntensityInfo,
  getLevelLabel,
  getLevelProgress,
  getActionLabel,
  type EvolutionSnapshot,
  type AdjustmentEntry,
} from "@/lib/aiPersonalTrainerEngine";

const EvolucaoTreino = () => {
  const { user, profile } = useAuth();
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
        {/* Level Card */}
        <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Nível</span>
            <span className="text-2xl font-bold text-primary">{snapshot.level}</span>
          </div>
          <p className="text-sm font-semibold">{getLevelLabel(snapshot.level)}</p>
          <Progress value={levelProgress.pct} className="h-2" />
          <p className="text-[10px] text-muted-foreground">{levelProgress.pct}% para o próximo nível</p>
        </div>

        {/* Intensity Card */}
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

      {/* Protection Badge */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/40 rounded-xl px-4 py-2.5 border border-border/30">
        <Shield className="w-4 h-4 text-primary flex-shrink-0" />
        <span>
          Proteção ativa: carga nunca aumenta 2 semanas seguidas. Intensidade só reduz com motivo real.
        </span>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="history" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="history" className="flex-1 text-xs">Últimos Ajustes</TabsTrigger>
          <TabsTrigger value="swaps" className="flex-1 text-xs">Trocas Sugeridas</TabsTrigger>
        </TabsList>

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
              <p className="text-xs mt-1">Exercícios com falhas repetidas aparecerão aqui</p>
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
    </div>
  );
};

// ===== Adjustment Card Component =====

const AdjustmentCard = ({ entry }: { entry: AdjustmentEntry }) => {
  const levelChanged = entry.levelBefore !== entry.levelAfter;
  const intensityChanged = entry.intensityBefore !== entry.intensityAfter;

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
      {/* Date + Reason */}
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

      {/* Coach message */}
      <p className="text-sm leading-relaxed">{entry.coachMessage}</p>

      {/* Actions */}
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

      {/* Intensity change */}
      {intensityChanged && (
        <p className="text-xs text-muted-foreground">
          Intensidade: {entry.intensityBefore} → <span className="font-semibold text-foreground">{entry.intensityAfter}</span>
        </p>
      )}
    </div>
  );
};

export default EvolucaoTreino;
