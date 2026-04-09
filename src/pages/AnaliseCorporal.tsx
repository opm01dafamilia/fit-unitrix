import { useState, useEffect, useMemo } from "react";
import {
  BarChart3, TrendingUp, TrendingDown, Target, Scale, Flame,
  Dumbbell, UtensilsCrossed, Zap, ArrowRight, AlertTriangle,
  Clock, Activity, Loader2, Calendar
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AnaliseCorporalSkeleton } from "@/components/skeletons/SkeletonPremium";
import { useNavigate } from "react-router-dom";
import { format, subDays, startOfWeek, endOfWeek, differenceInDays } from "date-fns";
import { analyzeProgression, type ProgressionData } from "@/lib/bodyProgressionEngine";

const tooltipStyle = {
  background: 'var(--tooltip-bg)',
  border: '1px solid var(--tooltip-border)',
  borderRadius: '10px',
  color: 'var(--tooltip-color)',
  fontSize: '12px',
  padding: '8px 12px',
};

const AnaliseCorporal = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bodyRecords, setBodyRecords] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [dietTracking, setDietTracking] = useState<any[]>([]);
  const [exerciseHistory, setExerciseHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      try {
        const [bodyRes, goalsRes, sessionsRes, dietRes, histRes] = await Promise.all([
          supabase.from("body_tracking").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
          supabase.from("fitness_goals").select("*").eq("user_id", user.id).eq("status", "active").order("created_at", { ascending: false }),
          supabase.from("workout_sessions").select("*").eq("user_id", user.id).order("completed_at", { ascending: false }),
          supabase.from("diet_tracking").select("*").eq("user_id", user.id).order("tracked_date", { ascending: false }),
          supabase.from("exercise_history").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        ]);
        setBodyRecords(bodyRes.data || []);
        setGoals(goalsRes.data || []);
        setSessions(sessionsRes.data || []);
        setDietTracking(dietRes.data || []);
        setExerciseHistory(histRes.data || []);
      } catch { /* silently fail */ }
      finally { setLoading(false); }
    };
    fetch();
  }, [user]);

  // Derived data
  const currentWeight = bodyRecords.length > 0 ? Number(bodyRecords[bodyRecords.length - 1].weight) : profile?.weight || 0;
  const startWeight = bodyRecords.length > 0 ? Number(bodyRecords[0].weight) : profile?.weight || 0;

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  const weekSessions = sessions.filter((s: any) => {
    const d = new Date(s.completed_at);
    return d >= weekStart && d <= weekEnd;
  });

  const weekDietRecords = dietTracking.filter((d: any) => {
    const date = new Date(d.tracked_date);
    return date >= weekStart && date <= weekEnd;
  });

  const weekAdherence = weekDietRecords.length > 0
    ? Math.round(weekDietRecords.reduce((a: number, d: any) => a + Number(d.adherence_pct || 0), 0) / weekDietRecords.length)
    : 0;

  const dietStreak = useMemo(() => {
    let streak = 0;
    const sorted = [...dietTracking].sort((a, b) => new Date(b.tracked_date).getTime() - new Date(a.tracked_date).getTime());
    for (const dt of sorted) {
      if (dt.all_completed) streak++;
      else break;
    }
    return streak;
  }, [dietTracking]);

  const weekSeries = exerciseHistory.filter((h: any) => {
    const d = new Date(h.created_at);
    return d >= weekStart && d <= weekEnd;
  }).length;

  // Primary active weight goal
  const weightGoal = goals.find((g: any) => g.unit === "kg" || g.goal_type === "massa" || g.goal_type === "emagrecer");

  const analysis = useMemo(() => {
    if (!weightGoal) return null;
    const data: ProgressionData = {
      goalWeight: Number(weightGoal.target_value),
      currentWeight,
      startWeight: Number(weightGoal.current_value) || startWeight,
      targetDate: weightGoal.target_date,
      goalCreatedAt: weightGoal.created_at,
      dietAdherencePct: weekAdherence,
      dietStreak,
      weeklyWorkouts: weekSessions.length,
      totalSessions: sessions.length,
      totalSeriesCompleted: weekSeries,
      bodyRecords: bodyRecords.map(r => ({ weight: Number(r.weight), created_at: r.created_at })),
    };
    return analyzeProgression(data);
  }, [weightGoal, currentWeight, startWeight, weekAdherence, dietStreak, weekSessions.length, sessions.length, weekSeries, bodyRecords]);

  // Monthly evolution chart
  const monthlyEvolution = useMemo(() => {
    if (bodyRecords.length < 2) return [];
    const months = new Map<string, number[]>();
    bodyRecords.forEach((r: any) => {
      const key = format(new Date(r.created_at), "MM/yy");
      if (!months.has(key)) months.set(key, []);
      months.get(key)!.push(Number(r.weight));
    });
    return Array.from(months.entries()).map(([month, weights]) => ({
      month,
      peso: Number((weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1)),
    }));
  }, [bodyRecords]);

  const statusColors: Record<string, string> = {
    ahead: "text-primary",
    on_track: "text-chart-2",
    behind: "text-chart-3",
    far_behind: "text-destructive",
  };

  const statusBgs: Record<string, string> = {
    ahead: "from-primary/15 to-primary/5",
    on_track: "from-chart-2/15 to-chart-2/5",
    behind: "from-chart-3/15 to-chart-3/5",
    far_behind: "from-destructive/15 to-destructive/5",
  };

  if (loading) return <AnaliseCorporalSkeleton />;

  return (
    <div className="space-y-7 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-primary" />
          Análise Corporal Inteligente
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Progresso integrado: dieta, treino e metas</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="metric-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
              <Scale className="w-4 h-4 text-primary" />
            </div>
          </div>
          <p className="text-xl lg:text-2xl font-display font-bold">{currentWeight} <span className="text-xs text-muted-foreground">kg</span></p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Peso Atual</p>
        </div>

        <div className="metric-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-chart-2/15 to-chart-2/5 flex items-center justify-center">
              <Activity className="w-4 h-4 text-chart-2" />
            </div>
          </div>
          <p className="text-xl lg:text-2xl font-display font-bold">
            {analysis ? `${analysis.monthlyRate > 0 ? '+' : ''}${analysis.monthlyRate.toFixed(1)}` : '—'}
            <span className="text-xs text-muted-foreground"> kg/mês</span>
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Ritmo de Evolução</p>
        </div>

        <div className="metric-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-chart-3/15 to-chart-3/5 flex items-center justify-center">
              <UtensilsCrossed className="w-4 h-4 text-chart-3" />
            </div>
          </div>
          <p className="text-xl lg:text-2xl font-display font-bold">{weekAdherence}<span className="text-xs text-muted-foreground">%</span></p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Aderência Dieta</p>
        </div>

        <div className="metric-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-chart-4/15 to-chart-4/5 flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-chart-4" />
            </div>
          </div>
          <p className="text-xl lg:text-2xl font-display font-bold">{weekSessions.length}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Treinos na Semana</p>
        </div>
      </div>

      {/* Analysis Section - requires an active goal */}
      {analysis && weightGoal ? (
        <>
          {/* Status Banner */}
          <div className={`glass-card p-5 lg:p-6 glow-border relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full" />
            <div className="relative z-10">
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${statusBgs[analysis.status]} flex items-center justify-center text-2xl shrink-0`}>
                  {analysis.statusEmoji}
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-bold text-lg mb-1">{analysis.statusMessage}</h3>
                  <p className="text-sm text-muted-foreground">{analysis.caloricSuggestion}</p>
                </div>
              </div>

              {/* Dual Progress Bars */}
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground font-medium">
                    {Number(weightGoal.current_value) || startWeight}kg
                  </span>
                  <span className="font-display font-bold text-primary">{weightGoal.target_value}kg</span>
                </div>

                {/* Meta total bar */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-muted-foreground">Progresso Real</span>
                    <span className="text-[11px] font-semibold text-primary">{Math.round(analysis.progressPercentage)}%</span>
                  </div>
                  <div className="h-3 bg-secondary/60 rounded-full overflow-hidden relative">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-chart-2 transition-all duration-700"
                      style={{ width: `${analysis.progressPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Expected progress bar */}
                {analysis.expectedPercentage > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] text-muted-foreground">Progresso Esperado</span>
                      <span className="text-[11px] font-semibold text-chart-3">{Math.round(analysis.expectedPercentage)}%</span>
                    </div>
                    <div className="h-3 bg-secondary/60 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-chart-3/70 to-chart-3/40 transition-all duration-700"
                        style={{ width: `${analysis.expectedPercentage}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Key metrics */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="p-3 rounded-xl bg-secondary/40 border border-border/30 text-center">
                    <p className="text-lg font-display font-bold text-foreground">
                      {analysis.realProgress > 0 ? '+' : ''}{analysis.realProgress.toFixed(1)}
                    </p>
                    <p className="text-[9px] text-muted-foreground font-medium uppercase">Real (kg)</p>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/40 border border-border/30 text-center">
                    <p className="text-lg font-display font-bold text-chart-3">
                      {analysis.expectedProgress > 0 ? '+' : ''}{analysis.expectedProgress.toFixed(1)}
                    </p>
                    <p className="text-[9px] text-muted-foreground font-medium uppercase">Esperado (kg)</p>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/40 border border-border/30 text-center">
                    <p className={`text-lg font-display font-bold ${statusColors[analysis.status]}`}>
                      {analysis.progressDifference > 0 ? '+' : ''}{analysis.progressDifference.toFixed(1)}
                    </p>
                    <p className="text-[9px] text-muted-foreground font-medium uppercase">Diferença</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Prediction Card */}
          {analysis.daysToGoal && (
            <div className="glass-card p-5 lg:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-chart-2/15 to-chart-2/5 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-chart-2" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-base">Previsão de Meta</h3>
                  <p className="text-[11px] text-muted-foreground">Baseado no ritmo atual</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-secondary/40 border border-border/30">
                  <p className="text-2xl font-display font-bold text-chart-2">{analysis.daysToGoal}</p>
                  <p className="text-xs text-muted-foreground mt-1">dias restantes estimados</p>
                </div>
                {analysis.predictedDate && (
                  <div className="p-4 rounded-xl bg-secondary/40 border border-border/30">
                    <p className="text-lg font-display font-bold text-foreground">
                      {new Date(analysis.predictedDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">data prevista</p>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-4 p-3 rounded-lg bg-secondary/20 border border-border/20">
                💡 Você atingirá sua meta em <strong className="text-foreground">{analysis.daysToGoal} dias</strong> mantendo o ritmo de{' '}
                <strong className="text-foreground">{Math.abs(analysis.monthlyRate).toFixed(1)}kg/mês</strong>.
              </p>
            </div>
          )}

          {/* Weekly Feedback */}
          <div className="glass-card p-5 lg:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-base">Feedback Semanal</h3>
                <p className="text-[11px] text-muted-foreground">Resumo da sua semana</p>
              </div>
            </div>
            <p className="text-sm text-foreground leading-relaxed p-4 rounded-xl bg-secondary/30 border border-border/20">
              {analysis.weeklyFeedback}
            </p>

            {/* Rhythm Score */}
            <div className="mt-4 p-4 rounded-xl bg-secondary/40 border border-border/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Pontuação de Ritmo</span>
                <span className="text-sm font-display font-bold text-primary">{analysis.rhythmScore}/100</span>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${analysis.rhythmScore}%`,
                    background: analysis.rhythmScore >= 70
                      ? 'var(--gradient-primary)'
                      : analysis.rhythmScore >= 40
                      ? 'linear-gradient(90deg, hsl(45 93% 47%), hsl(36 77% 49%))'
                      : 'linear-gradient(90deg, hsl(0 84% 60%), hsl(0 72% 51%))'
                  }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[9px] text-muted-foreground">Baixo</span>
                <span className="text-[9px] text-muted-foreground">Excelente</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="glass-card p-6 text-center">
          <Target className="w-10 h-10 text-primary mx-auto mb-3 opacity-60" />
          <h3 className="font-display font-semibold mb-2">Crie uma meta de peso</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Para ativar a análise inteligente, defina uma meta de peso na página de Metas.
          </p>
          <button
            onClick={() => navigate("/app/metas")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/15 transition-colors"
          >
            Criar Meta <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Monthly Evolution Chart */}
      {monthlyEvolution.length > 1 && (
        <div className="glass-card p-5 lg:p-6">
          <h3 className="font-display font-semibold text-base mb-5 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-chart-2" />
            Evolução Mensal
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyEvolution}>
              <defs>
                <linearGradient id="monthlyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={`hsl(${getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()})`} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={`hsl(${getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()})`} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(260 12% 15%)" vertical={false} />
              <XAxis dataKey="month" stroke="hsl(240 8% 42%)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis domain={['dataMin - 1', 'dataMax + 1']} stroke="hsl(240 8% 42%)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="peso" stroke={`hsl(${getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()})`} fill="url(#monthlyGrad)" strokeWidth={2.5} dot={{ fill: `hsl(${getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()})`, r: 4, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Integration Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <button onClick={() => navigate("/app/dieta")} className="glass-card p-5 text-left hover:border-primary/20 transition-all group">
          <UtensilsCrossed className="w-5 h-5 text-chart-3 mb-3 group-hover:scale-110 transition-transform" />
          <h4 className="font-display font-semibold text-sm mb-1">Dieta</h4>
          <p className="text-[11px] text-muted-foreground">
            {weekAdherence}% aderência • {dietStreak} dias de streak
          </p>
        </button>
        <button onClick={() => navigate("/app/treino")} className="glass-card p-5 text-left hover:border-primary/20 transition-all group">
          <Dumbbell className="w-5 h-5 text-primary mb-3 group-hover:scale-110 transition-transform" />
          <h4 className="font-display font-semibold text-sm mb-1">Treino</h4>
          <p className="text-[11px] text-muted-foreground">
            {weekSessions.length} treinos • {weekSeries} séries esta semana
          </p>
        </button>
        <button onClick={() => navigate("/app/metas")} className="glass-card p-5 text-left hover:border-primary/20 transition-all group">
          <Target className="w-5 h-5 text-chart-4 mb-3 group-hover:scale-110 transition-transform" />
          <h4 className="font-display font-semibold text-sm mb-1">Metas</h4>
          <p className="text-[11px] text-muted-foreground">
            {goals.length} meta{goals.length !== 1 ? 's' : ''} ativa{goals.length !== 1 ? 's' : ''}
          </p>
        </button>
      </div>
    </div>
  );
};

export default AnaliseCorporal;
