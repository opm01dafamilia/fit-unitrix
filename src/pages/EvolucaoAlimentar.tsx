import { useState, useEffect, useMemo } from "react";
import { UtensilsCrossed, TrendingUp, TrendingDown, Minus, Clock, Flame, ArrowUp, ArrowDown, RefreshCw, AlertTriangle, Check, History, Zap, Scale } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { analyzeNutrition, type NutritionistAnalysis, type NutritionHistoryEntry, type NutritionistInput } from "@/lib/aiNutritionistEngine";
import { readCache, writeCache } from "@/lib/smartCache";

const STORAGE_KEY = "fitpulse_nutrition_history";
const LAST_ADJUST_KEY = "fitpulse_nutrition_last_adjust";

const statusConfig = {
  stagnant: { label: "Estagnado", icon: Minus, color: "text-chart-4", bg: "bg-chart-4/10", border: "border-chart-4/20" },
  too_fast: { label: "Muito Rápido", icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20" },
  too_slow: { label: "Lento", icon: TrendingDown, color: "text-chart-4", bg: "bg-chart-4/10", border: "border-chart-4/20" },
  on_track: { label: "No Ritmo", icon: Check, color: "text-chart-2", bg: "bg-chart-2/10", border: "border-chart-2/20" },
};

const adherenceConfig = {
  excelente: { emoji: "🏆", color: "text-chart-2" },
  boa: { emoji: "💪", color: "text-primary" },
  moderada: { emoji: "⚠️", color: "text-chart-4" },
  baixa: { emoji: "🔄", color: "text-destructive" },
};

export default function EvolucaoAlimentar() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<NutritionistAnalysis | null>(null);
  const [history, setHistory] = useState<NutritionHistoryEntry[]>([]);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Load history from localStorage
      const savedHistory = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
      if (savedHistory) setHistory(JSON.parse(savedHistory));

      const lastAdjust = localStorage.getItem(`${LAST_ADJUST_KEY}_${user.id}`);

      // Fetch all needed data in parallel
      const [profileRes, dietTrackingRes, bodyTrackingRes, dietPlanRes, goalsRes, sessionsRes] = await Promise.all([
        supabase.from("profiles").select("objective, weight").eq("user_id", user.id).single(),
        supabase.from("diet_tracking").select("*").eq("user_id", user.id).gte("tracked_date", format(subDays(new Date(), 7), "yyyy-MM-dd")).order("tracked_date", { ascending: false }),
        supabase.from("body_tracking").select("weight, created_at").eq("user_id", user.id).order("created_at", { ascending: true }).limit(20),
        supabase.from("diet_plans").select("plan_data").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1),
        supabase.from("fitness_goals").select("*").eq("user_id", user.id).eq("status", "active").eq("goal_type", "peso"),
        supabase.from("workout_sessions").select("id").eq("user_id", user.id).gte("completed_at", subDays(new Date(), 7).toISOString()),
      ]);

      const profile = profileRes.data;
      const dietTracking = dietTrackingRes.data || [];
      const bodyRecords = (bodyTrackingRes.data || []) as { weight: number; created_at: string }[];
      const dietPlan = dietPlanRes.data?.[0];
      const weightGoal = goalsRes.data?.[0];
      const weekSessions = sessionsRes.data?.length || 0;

      if (!profile?.objective || !profile?.weight) {
        setLoading(false);
        return;
      }

      // Calculate weekly adherence
      const totalDone = dietTracking.reduce((a, d) => a + (d.meals_done || 0), 0);
      const totalFailed = dietTracking.reduce((a, d) => a + (d.meals_failed || 0), 0);
      const totalMeals = dietTracking.reduce((a, d) => a + (d.meals_total || 0), 0);
      const adherencePct = totalMeals > 0 ? Math.round((totalDone / totalMeals) * 100) : 0;

      // Diet streak
      let streak = 0;
      const sorted = [...dietTracking].sort((a, b) => b.tracked_date.localeCompare(a.tracked_date));
      for (const d of sorted) {
        if (d.adherence_pct >= 70) streak++;
        else break;
      }

      // Days without diet
      const daysWithoutDiet = dietTracking.filter(d => d.adherence_pct < 30).length;

      // Current macros from plan
      let currentCal = 2000, currentProt = 150, currentCarbs = 200, currentFat = 70;
      if (dietPlan?.plan_data) {
        const pd = dietPlan.plan_data as any;
        if (pd.meta) {
          // Try extract from plan meta
          const meta = pd.meta;
          if (meta.weeklyTargets?.length) {
            currentCal = meta.weeklyTargets[meta.weeklyTargets.length - 1]?.calories || currentCal;
          }
        }
        // Or calculate from meals
        if (pd.weeks?.[0]?.days?.[0]?.refeicoes) {
          const dayMeals = pd.weeks[0].days[0].refeicoes;
          const total = dayMeals.reduce((a: number, m: any) =>
            a + (m.itens?.reduce((s: number, i: any) => s + (i.cal || 0), 0) || 0), 0);
          if (total > 0) currentCal = total;
          currentProt = dayMeals.reduce((a: number, m: any) =>
            a + (m.itens?.reduce((s: number, i: any) => s + (i.prot || 0), 0) || 0), 0);
          currentCarbs = dayMeals.reduce((a: number, m: any) =>
            a + (m.itens?.reduce((s: number, i: any) => s + (i.carb || 0), 0) || 0), 0);
          currentFat = dayMeals.reduce((a: number, m: any) =>
            a + (m.itens?.reduce((s: number, i: any) => s + (i.gord || 0), 0) || 0), 0);
        } else if (pd.meals) {
          const total = pd.meals.reduce((a: number, m: any) =>
            a + (m.itens?.reduce((s: number, i: any) => s + (i.cal || 0), 0) || 0), 0);
          if (total > 0) currentCal = total;
        }
      }

      // Use last history entry macros if available (represents the adjusted state)
      const savedHist = savedHistory ? JSON.parse(savedHistory) as NutritionHistoryEntry[] : [];
      if (savedHist.length > 0) {
        const last = savedHist[savedHist.length - 1];
        currentCal = last.caloriesAfter;
        currentProt = last.proteinAfter;
        currentCarbs = last.carbsAfter;
        currentFat = last.fatAfter;
      }

      const input: NutritionistInput = {
        objective: profile.objective as any,
        currentWeight: bodyRecords.length > 0 ? bodyRecords[bodyRecords.length - 1].weight : profile.weight,
        goalWeight: weightGoal ? weightGoal.target_value : null,
        weeklyAdherencePct: adherencePct,
        mealsDone: totalDone,
        mealsFailed: totalFailed,
        mealsTotal: totalMeals,
        dietStreak: streak,
        daysWithoutDiet,
        trainingIntensity: Math.min(10, weekSessions * 2),
        bodyRecords,
        currentCalories: currentCal,
        currentProtein: currentProt,
        currentCarbs: currentCarbs,
        currentFat: currentFat,
        deadlineMonths: weightGoal?.target_date
          ? Math.max(1, Math.ceil((new Date(weightGoal.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)))
          : null,
        lastAdjustmentDate: lastAdjust,
      };

      const result = analyzeNutrition(input);
      setAnalysis(result);
    } catch (err) {
      console.error("Erro ao carregar dados nutricionais:", err);
    } finally {
      setLoading(false);
    }
  };

  const applyAdjustments = () => {
    if (!analysis || !user || analysis.adjustments.length === 0) return;
    setApplying(true);

    const entry: NutritionHistoryEntry = {
      date: new Date().toISOString(),
      adjustments: analysis.adjustments,
      caloriesBefore: analysis.newCalories - analysis.adjustments.filter(a => a.type === "calories").reduce((s, a) => s + (a.direction === "increase" ? a.amount : -a.amount), 0),
      caloriesAfter: analysis.newCalories,
      proteinBefore: analysis.newProtein - analysis.adjustments.filter(a => a.type === "protein").reduce((s, a) => s + (a.direction === "increase" ? a.amount : -a.amount), 0),
      proteinAfter: analysis.newProtein,
      carbsBefore: analysis.newCarbs - analysis.adjustments.filter(a => a.type === "carbs").reduce((s, a) => s + (a.direction === "increase" ? a.amount : -a.amount), 0),
      carbsAfter: analysis.newCarbs,
      fatBefore: analysis.newFat,
      fatAfter: analysis.newFat,
      progressStatus: analysis.progressStatus,
      adherenceLevel: analysis.adherenceLevel,
      coachMessage: analysis.coachMessage,
      weeklyWeightChange: analysis.weeklyWeightChange,
    };

    const newHistory = [...history, entry];
    setHistory(newHistory);
    localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(newHistory));
    localStorage.setItem(`${LAST_ADJUST_KEY}_${user.id}`, new Date().toISOString());

    toast.success("Plano alimentar ajustado pela IA Nutricionista!");
    setApplying(false);

    // Re-analyze with updated last adjustment date
    setTimeout(() => loadData(), 500);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-secondary/60 rounded-lg" />
        <div className="h-4 w-40 bg-secondary/40 rounded" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-secondary/40 rounded-2xl" />)}
        </div>
        <div className="h-64 bg-secondary/30 rounded-2xl" />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="text-center py-20">
        <UtensilsCrossed className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="font-display text-xl font-bold mb-2">Nenhum dado encontrado</h2>
        <p className="text-sm text-muted-foreground">Crie um plano de dieta e registre suas refeições para ativar a IA Nutricionista.</p>
      </div>
    );
  }

  const sc = statusConfig[analysis.progressStatus];
  const ac = adherenceConfig[analysis.adherenceLevel];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] uppercase tracking-[0.15em] text-primary font-bold px-2 py-0.5 rounded-md bg-primary/10 border border-primary/15">IA Nutricionista</span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold">🥗 Evolução Alimentar</h1>
        <p className="text-sm text-muted-foreground mt-1">Ajustes inteligentes automáticos no seu plano de dieta</p>
      </div>

      {/* Coach Message */}
      <div className="glass-card p-5 border-primary/10">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/15 shrink-0">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-primary mb-1 uppercase tracking-wider">Mensagem do Nutricionista</p>
            <p className="text-sm text-foreground leading-relaxed">{analysis.coachMessage}</p>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={`glass-card p-4 ${sc.border} border`}>
          <div className={`w-9 h-9 rounded-xl ${sc.bg} flex items-center justify-center mb-2`}>
            <sc.icon className={`w-4.5 h-4.5 ${sc.color}`} />
          </div>
          <p className="text-[11px] text-muted-foreground">Progresso</p>
          <p className={`text-sm font-bold ${sc.color}`}>{sc.label}</p>
        </div>

        <div className="glass-card p-4">
          <div className="w-9 h-9 rounded-xl bg-chart-3/10 flex items-center justify-center mb-2">
            <Flame className="w-4.5 h-4.5 text-chart-3" />
          </div>
          <p className="text-[11px] text-muted-foreground">Calorias Atuais</p>
          <p className="text-sm font-bold text-chart-3">{analysis.newCalories} kcal</p>
        </div>

        <div className="glass-card p-4">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
            <Scale className="w-4.5 h-4.5 text-primary" />
          </div>
          <p className="text-[11px] text-muted-foreground">Variação/Semana</p>
          <p className={`text-sm font-bold ${analysis.weeklyWeightChange > 0 ? "text-chart-2" : analysis.weeklyWeightChange < 0 ? "text-chart-4" : "text-muted-foreground"}`}>
            {analysis.weeklyWeightChange > 0 ? "+" : ""}{analysis.weeklyWeightChange}kg
          </p>
        </div>

        <div className="glass-card p-4">
          <div className="w-9 h-9 rounded-xl bg-chart-2/10 flex items-center justify-center mb-2">
            <span className="text-lg">{ac.emoji}</span>
          </div>
          <p className="text-[11px] text-muted-foreground">Aderência</p>
          <p className={`text-sm font-bold capitalize ${ac.color}`}>{analysis.adherenceLevel}</p>
        </div>
      </div>

      {/* Macros Atuais */}
      <div className="glass-card p-5">
        <h3 className="font-display font-bold text-sm mb-4">Macros Atuais</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Proteína", value: `${analysis.newProtein}g`, color: "text-chart-2", pct: Math.round((analysis.newProtein * 4 / analysis.newCalories) * 100) },
            { label: "Carboidratos", value: `${analysis.newCarbs}g`, color: "text-primary", pct: Math.round((analysis.newCarbs * 4 / analysis.newCalories) * 100) },
            { label: "Gordura", value: `${analysis.newFat}g`, color: "text-chart-4", pct: Math.round((analysis.newFat * 9 / analysis.newCalories) * 100) },
          ].map(m => (
            <div key={m.label} className="text-center">
              <p className={`text-lg font-display font-bold ${m.color}`}>{m.value}</p>
              <p className="text-[11px] text-muted-foreground">{m.label}</p>
              <p className="text-[10px] text-muted-foreground/70">{m.pct}% das calorias</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Adjustments */}
      {analysis.adjustments.length > 0 && analysis.canAdjust && (
        <div className="glass-card p-5 border-primary/15">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-sm">⚡ Ajustes Sugeridos</h3>
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
              {analysis.adjustments.length} ajuste{analysis.adjustments.length > 1 ? "s" : ""}
            </span>
          </div>

          <div className="space-y-2.5 mb-5">
            {analysis.adjustments.map((adj, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30 border border-border/20">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  adj.direction === "increase" ? "bg-chart-2/10" :
                  adj.direction === "decrease" ? "bg-chart-4/10" : "bg-primary/10"
                }`}>
                  {adj.direction === "increase" ? <ArrowUp className="w-4 h-4 text-chart-2" /> :
                   adj.direction === "decrease" ? <ArrowDown className="w-4 h-4 text-chart-4" /> :
                   <RefreshCw className="w-4 h-4 text-primary" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {adj.type === "calories" && `${adj.direction === "increase" ? "+" : "-"}${adj.amount} kcal`}
                    {adj.type === "protein" && `+${adj.amount}g proteína`}
                    {adj.type === "carbs" && `${adj.direction === "increase" ? "+" : "-"}${adj.amount}g carboidratos`}
                    {adj.type === "fat" && `${adj.direction === "increase" ? "+" : "-"}${adj.amount}g gordura`}
                    {adj.type === "add_snack" && "Adicionar lanche"}
                    {adj.type === "remove_snack" && "Remover/simplificar lanche"}
                    {adj.type === "swap_food" && "Trocar alimento"}
                    {adj.type === "recalculate_deadline" && `Novo prazo: ${adj.amount} meses`}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{adj.reason}</p>
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={applyAdjustments}
            disabled={applying}
            className="w-full bg-gradient-to-r from-primary to-chart-2 text-primary-foreground font-semibold"
          >
            {applying ? "Aplicando..." : "✅ Aplicar Ajustes"}
          </Button>
        </div>
      )}

      {/* Protection info */}
      {!analysis.canAdjust && (
        <div className="glass-card p-4 border-chart-4/15">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-chart-4 shrink-0" />
            <div>
              <p className="text-sm font-medium">Aguardando período mínimo</p>
              <p className="text-[11px] text-muted-foreground">
                Último ajuste há {analysis.daysSinceLastAdjust} dia{analysis.daysSinceLastAdjust !== 1 ? "s" : ""}. 
                Próximo ajuste disponível em {Math.max(0, 5 - analysis.daysSinceLastAdjust)} dia{Math.max(0, 5 - analysis.daysSinceLastAdjust) !== 1 ? "s" : ""}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-4 h-4 text-primary" />
          <h3 className="font-display font-bold text-sm">Histórico de Ajustes</h3>
        </div>

        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum ajuste realizado ainda.</p>
        ) : (
          <div className="space-y-3">
            {[...history].reverse().map((entry, i) => {
              const entryStatus = statusConfig[entry.progressStatus];
              const calDiff = entry.caloriesAfter - entry.caloriesBefore;
              return (
                <div key={i} className="p-3.5 rounded-xl bg-secondary/30 border border-border/20">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-foreground">
                      {format(new Date(entry.date), "dd MMM yyyy", { locale: ptBR })}
                    </p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${entryStatus.bg} ${entryStatus.color} ${entryStatus.border} border`}>
                      {entryStatus.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-[11px]">
                    <span className="text-muted-foreground">
                      Calorias: {entry.caloriesBefore} → <span className="text-foreground font-medium">{entry.caloriesAfter}</span>
                      <span className={calDiff > 0 ? "text-chart-2 ml-1" : calDiff < 0 ? "text-chart-4 ml-1" : "ml-1"}>
                        ({calDiff > 0 ? "+" : ""}{calDiff})
                      </span>
                    </span>
                    <span className="text-muted-foreground">
                      Peso: {entry.weeklyWeightChange > 0 ? "+" : ""}{entry.weeklyWeightChange}kg/sem
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">{entry.coachMessage}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
