import { useState, useEffect, useCallback, useMemo } from "react";
import { UtensilsCrossed, Zap, Coffee, Sun, Moon, Apple, Trash2, Loader2, Target, Calendar, CalendarDays, CalendarRange, ChevronDown, ChevronRight, Clock, Check, X as XIcon, TrendingUp, TrendingDown, Scale, Flame, Trophy, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";
import { generateDietPlan, type MealPlan, type DayPlan, type PlanPeriod, type WeekBlock, type DietMeta } from "@/lib/dietGenerator";
import { getDietMotivationalMessage, getDietFailMessage } from "@/lib/achievementsEngine";
import { Skeleton } from "@/components/ui/skeleton";
import DietFocusMode from "@/components/DietFocusMode";
import { format, subDays } from "date-fns";

const iconMap: Record<string, typeof Coffee> = { Coffee, Sun, Moon, Apple };

const periodIcons: Record<PlanPeriod, typeof Calendar> = {
  hoje: Calendar,
  semana: CalendarDays,
  mes: CalendarRange,
};

type MealStatus = "done" | "failed" | null;

const MealFocusCard = ({ meal, onClose }: { meal: MealPlan; onClose: () => void }) => {
  const MealIcon = iconMap[meal.iconName] || Coffee;
  const mealCal = meal.itens.reduce((a, item) => a + item.cal, 0);
  const mealProt = meal.itens.reduce((a, i) => a + i.prot, 0);
  const mealCarb = meal.itens.reduce((a, i) => a + i.carb, 0);
  const mealGord = meal.itens.reduce((a, i) => a + i.gord, 0);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(145deg, hsl(225 16% 10%), hsl(225 16% 6%))' }}>
      <div className="relative p-6 pb-5">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 to-transparent" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-[0.15em] text-primary font-bold px-2 py-0.5 rounded-md bg-primary/10 border border-primary/15">FitPulse</span>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10">
              <MealIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-foreground">{meal.refeicao}</h2>
              <p className="text-sm text-muted-foreground">{meal.horario}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-0 border-y border-border/30">
        {[
          { label: "Cal", value: mealCal, unit: "kcal", color: "text-chart-3" },
          { label: "Prot", value: mealProt, unit: "g", color: "text-chart-2" },
          { label: "Carb", value: mealCarb, unit: "g", color: "text-primary" },
          { label: "Gord", value: mealGord, unit: "g", color: "text-chart-4" },
        ].map((m) => (
          <div key={m.label} className="p-3 text-center border-r border-border/20 last:border-0">
            <p className={`text-base font-display font-bold ${m.color}`}>{m.value}</p>
            <p className="text-[10px] text-muted-foreground">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="p-5 space-y-2.5">
        {meal.itens.map((item, j) => (
          <div key={j} className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-secondary/30 border border-border/20">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{item.alimento}</p>
              <p className="text-[11px] text-muted-foreground">{item.qtd}</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] shrink-0">
              <span className="text-chart-3 font-medium">{item.cal}</span>
              <span className="text-chart-2">{item.prot}g</span>
              <span className="text-primary">{item.carb}g</span>
              <span className="text-chart-4">{item.gord}g</span>
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 pb-5 pt-1">
        <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-secondary/20 border border-border/15">
          <span className="text-[10px] text-muted-foreground tracking-wider uppercase">Plano gerado por</span>
          <span className="text-[10px] font-bold text-primary tracking-wider uppercase">FitPulse</span>
        </div>
      </div>
    </div>
  );
};

const MealStatusButtons = ({ status, onSetStatus }: { status: MealStatus; onSetStatus: (s: MealStatus) => void }) => {
  if (status === "done") {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); onSetStatus(null); }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-chart-2/15 border border-chart-2/25 text-chart-2 text-xs font-semibold transition-all hover:bg-chart-2/20"
      >
        <Check className="w-3.5 h-3.5" />
        Feito
      </button>
    );
  }
  if (status === "failed") {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); onSetStatus(null); }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/15 border border-destructive/25 text-destructive text-xs font-semibold transition-all hover:bg-destructive/20"
      >
        <XIcon className="w-3.5 h-3.5" />
        Falhou
      </button>
    );
  }
  return (
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => onSetStatus("done")}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-chart-2/8 border border-chart-2/15 text-chart-2/70 text-[11px] font-medium transition-all hover:bg-chart-2/15 hover:text-chart-2 hover:border-chart-2/25"
      >
        <Check className="w-3 h-3" />
        Feito
      </button>
      <button
        onClick={() => onSetStatus("failed")}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-destructive/8 border border-destructive/15 text-destructive/70 text-[11px] font-medium transition-all hover:bg-destructive/15 hover:text-destructive hover:border-destructive/25"
      >
        <XIcon className="w-3 h-3" />
        Falhou
      </button>
    </div>
  );
};

const MealCard = ({ meal, index, onFocus, status, onSetStatus }: { meal: MealPlan; index: number; onFocus?: () => void; status?: MealStatus; onSetStatus?: (s: MealStatus) => void }) => {
  const MealIcon = iconMap[meal.iconName] || Coffee;
  const mealCal = meal.itens.reduce((a, item) => a + item.cal, 0);

  const borderClass = status === "done"
    ? "border-chart-2/20 bg-chart-2/3"
    : status === "failed"
      ? "border-destructive/20 bg-destructive/3"
      : "hover:border-primary/15";

  return (
    <div className={`glass-card p-4 lg:p-5 cursor-pointer transition-all ${borderClass}`} onClick={onFocus}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          status === "done"
            ? "bg-gradient-to-br from-chart-2/20 to-chart-2/5"
            : status === "failed"
              ? "bg-gradient-to-br from-destructive/20 to-destructive/5"
              : "bg-gradient-to-br from-primary/15 to-primary/5"
        }`}>
          {status === "done" ? (
            <Check className="w-4.5 h-4.5 text-chart-2" />
          ) : status === "failed" ? (
            <XIcon className="w-4.5 h-4.5 text-destructive" />
          ) : (
            <MealIcon className="w-4.5 h-4.5 text-primary" />
          )}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">{meal.refeicao}</p>
          <p className="text-[11px] text-muted-foreground">{meal.horario}</p>
        </div>
        <div className="flex items-center gap-3">
          {onSetStatus && <MealStatusButtons status={status || null} onSetStatus={onSetStatus} />}
          <div className="text-right">
            <p className="text-sm font-semibold text-chart-3">{mealCal}</p>
            <p className="text-[10px] text-muted-foreground">kcal</p>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] text-muted-foreground border-b border-border/50">
              <th className="text-left pb-2.5 font-medium">Alimento</th>
              <th className="text-left pb-2.5 font-medium">Qtd</th>
              <th className="text-right pb-2.5 font-medium">Cal</th>
              <th className="text-right pb-2.5 font-medium">P</th>
              <th className="text-right pb-2.5 font-medium">C</th>
              <th className="text-right pb-2.5 font-medium">G</th>
            </tr>
          </thead>
          <tbody>
            {meal.itens.map((item, j) => (
              <tr key={j} className="border-b border-border/30 last:border-0">
                <td className="py-2 text-[13px]">{item.alimento}</td>
                <td className="py-2 text-[13px] text-muted-foreground">{item.qtd}</td>
                <td className="py-2 text-right text-[13px]">{item.cal}</td>
                <td className="py-2 text-right text-[13px] text-chart-2">{item.prot}g</td>
                <td className="py-2 text-right text-[13px] text-primary">{item.carb}g</td>
                <td className="py-2 text-right text-[13px] text-chart-4">{item.gord}g</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const DayAccordion = ({ dayPlan, defaultOpen, onMealFocus, mealStatuses, onSetMealStatus }: { dayPlan: DayPlan; defaultOpen?: boolean; onMealFocus?: (meal: MealPlan) => void; mealStatuses?: Record<string, MealStatus>; onSetMealStatus?: (key: string, s: MealStatus) => void }) => {
  const [open, setOpen] = useState(defaultOpen || false);
  const dayCal = dayPlan.refeicoes.reduce((acc, m) => acc + m.itens.reduce((a, i) => a + i.cal, 0), 0);
  const doneCount = dayPlan.refeicoes.filter((_, i) => mealStatuses?.[`${dayPlan.dia}-${i}`] === "done").length;
  const totalMeals = dayPlan.refeicoes.length;

  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 lg:p-5 hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-primary" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm">{dayPlan.dia}</p>
            <p className="text-[11px] text-muted-foreground">
              {totalMeals} refeições • {dayCal} kcal
              {doneCount > 0 && <span className="text-chart-2 ml-1.5">• {doneCount}/{totalMeals} feitas</span>}
            </p>
          </div>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-4 pb-4 lg:px-5 lg:pb-5 space-y-3">
          {dayPlan.refeicoes.map((meal, i) => {
            const key = `${dayPlan.dia}-${i}`;
            return (
              <MealCard
                key={i}
                meal={meal}
                index={i}
                onFocus={() => onMealFocus?.(meal)}
                status={mealStatuses?.[key] || null}
                onSetStatus={(s) => onSetMealStatus?.(key, s)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

// Weekly block accordion with calorie target header
const WeekBlockAccordion = ({ block, defaultOpen, onMealFocus, mealStatuses, onSetMealStatus }: {
  block: WeekBlock;
  defaultOpen?: boolean;
  onMealFocus?: (meal: MealPlan) => void;
  mealStatuses?: Record<string, MealStatus>;
  onSetMealStatus?: (key: string, s: MealStatus) => void;
}) => {
  const [open, setOpen] = useState(defaultOpen || false);

  return (
    <div className="space-y-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-full glass-card p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors border-primary/10"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/15">
            <span className="text-sm font-bold text-primary">{block.weekNumber}</span>
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm text-foreground">{block.label}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-chart-3 font-medium">{block.targetCalories} kcal/dia</span>
              <span className="text-[11px] text-muted-foreground">•</span>
              <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                <Scale className="w-3 h-3" />
                ~{block.estimatedWeight}kg
              </span>
            </div>
          </div>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="space-y-2 pl-2">
          {block.days.map((dayPlan, i) => (
            <DayAccordion
              key={i}
              dayPlan={dayPlan}
              defaultOpen={i === 0}
              onMealFocus={onMealFocus}
              mealStatuses={mealStatuses}
              onSetMealStatus={onSetMealStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Weight goal progress banner
const WeightGoalBanner = ({ meta, isGain }: { meta: DietMeta; isGain: boolean }) => {
  if (!meta.weightGoal || !meta.currentWeight) return null;
  
  const diff = Math.abs(meta.weightGoal - meta.currentWeight);
  const progressPct = 0; // Starting point — future: connect to body_tracking for real progress
  const TrendIcon = isGain ? TrendingUp : TrendingDown;

  return (
    <div className="glass-card p-5 border-primary/15 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/15 shrink-0">
          <Target className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-display font-bold text-foreground">
            Plano de {meta.currentWeight}kg → {meta.weightGoal}kg
          </p>
          <p className="text-[12px] text-muted-foreground">
            {meta.deadlineMonths
              ? `${isGain ? "Ganho" : "Perda"} de ${diff.toFixed(1)}kg em ${meta.deadlineMonths} ${meta.deadlineMonths === 1 ? "mês" : "meses"}`
              : `${isGain ? "Ganho" : "Perda"} de ${diff.toFixed(1)}kg — ritmo sustentável`
            }
          </p>
        </div>
        <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 ${
          isGain ? "bg-primary/10 text-primary" : "bg-chart-2/10 text-chart-2"
        }`}>
          <TrendIcon className="w-3.5 h-3.5" />
          {meta.monthlyRate ? `${Math.abs(meta.monthlyRate)}kg/mês` : `${diff.toFixed(1)}kg`}
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-muted-foreground font-medium">Progresso da meta</span>
          <span className="text-[11px] text-foreground font-semibold">{progressPct}%</span>
        </div>
        <Progress value={progressPct} className="h-2.5" />
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[10px] text-muted-foreground">{meta.currentWeight}kg</span>
          <span className="text-[10px] text-primary font-medium">{meta.weightGoal}kg</span>
        </div>
      </div>

      {/* Monthly evolution */}
      {meta.weeklyTargets && meta.weeklyTargets.length > 0 && meta.deadlineMonths && (
        <div>
          <p className="text-[11px] text-muted-foreground font-medium mb-2 uppercase tracking-widest">Evolução Mensal Estimada</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Array.from({ length: Math.min(meta.deadlineMonths, 6) }, (_, m) => {
              const weekIdx = Math.min((m + 1) * 4 - 1, meta.weeklyTargets!.length - 1);
              const weekData = meta.weeklyTargets![weekIdx];
              if (!weekData) return null;
              return (
                <div key={m} className="p-3 rounded-xl bg-secondary/40 border border-border/30 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Mês {m + 1}</p>
                  <p className="text-sm font-display font-bold text-foreground">{weekData.estimatedWeight}kg</p>
                  <p className="text-[10px] text-chart-3 font-medium">{weekData.calories} kcal</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const deadlineOptions = [
  { value: "none", label: "Sem prazo" },
  { value: "1", label: "1 mês" },
  { value: "2", label: "2 meses" },
  { value: "3", label: "3 meses" },
  { value: "6", label: "6 meses" },
];

function buildMetaDescription(sp: any): string | null {
  const data = sp.plan_data;
  const meta = data && typeof data === "object" ? (data as any).meta : null;
  if (!meta) return null;
  const { currentWeight, weightGoal, deadlineMonths } = meta;
  if (!weightGoal || !currentWeight) return null;
  if (deadlineMonths) {
    return `De ${currentWeight}kg para ${weightGoal}kg em ${deadlineMonths} ${deadlineMonths === 1 ? "mês" : "meses"}`;
  }
  return `De ${currentWeight}kg para ${weightGoal}kg`;
}

const Dieta = () => {
  const { user, profile } = useAuth();
  const [objetivo, setObjetivo] = useState("");
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [atividade, setAtividade] = useState("");
  const [metaPeso, setMetaPeso] = useState("");
  const [prazo, setPrazo] = useState("none");
  const [preferencias, setPreferencias] = useState("");
  const [periodo, setPeriodo] = useState<PlanPeriod>("hoje");
  const [plan, setPlan] = useState<MealPlan[] | null>(null);
  const [weekPlan, setWeekPlan] = useState<DayPlan[] | null>(null);
  const [weekBlocks, setWeekBlocks] = useState<WeekBlock[] | null>(null);
  const [dietMeta, setDietMeta] = useState<DietMeta | null>(null);
  const [planPeriod, setPlanPeriod] = useState<PlanPeriod>("hoje");
  const [savedPlans, setSavedPlans] = useState<any[]>([]);
  const [viewingSaved, setViewingSaved] = useState<any | null>(null);
  const [generating, setGenerating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [saving, setSaving] = useState(false);
  const [focusMealIndex, setFocusMealIndex] = useState<number | null>(null);
  const [mealStatuses, setMealStatuses] = useState<Record<string, MealStatus>>({});
  
  // Streak & gamification state
  const [dietStreak, setDietStreak] = useState(0);
  const [weeklyAdherence, setWeeklyAdherence] = useState(0);
  const [weeklyMealsDone, setWeeklyMealsDone] = useState(0);
  const [weeklyMealsTotal, setWeeklyMealsTotal] = useState(0);
  const [showStreakAnimation, setShowStreakAnimation] = useState(false);

  // Streak achievements thresholds
  const streakMilestones = [
    { days: 1, title: "Dia Perfeito", icon: "🍽️" },
    { days: 3, title: "Consistência", icon: "🥗" },
    { days: 7, title: "Foco Extremo", icon: "🔥" },
    { days: 15, title: "Máquina", icon: "⚡" },
    { days: 30, title: "Transformação", icon: "🏆" },
  ];

  useEffect(() => {
    if (profile) {
      if (profile.weight) setPeso(String(profile.weight));
      if (profile.height) setAltura(String(profile.height));
      if (profile.objective) setObjetivo(profile.objective);
      if (profile.activity_level) setAtividade(profile.activity_level);
    }
  }, [profile]);

  // Load saved plans and streak data
  useEffect(() => {
    if (!user) return;
    setLoadingPlans(true);
    
    Promise.all([
      supabase.from("diet_plans").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("diet_tracking").select("*").eq("user_id", user.id).order("tracked_date", { ascending: false }).limit(60),
    ]).then(([plansRes, trackingRes]) => {
      if (plansRes.error) toast.error("Erro ao carregar planos salvos");
      setSavedPlans(plansRes.data || []);
      
      // Calculate streak from tracking data
      const tracking = (trackingRes.data || []) as any[];
      const completedDates = tracking.filter(t => t.all_completed).map(t => t.tracked_date).sort().reverse();
      
      let streak = 0;
      if (completedDates.length > 0) {
        const todayStr = format(new Date(), "yyyy-MM-dd");
        const yesterdayStr = format(subDays(new Date(), 1), "yyyy-MM-dd");
        if (completedDates[0] === todayStr || completedDates[0] === yesterdayStr) {
          for (let i = 0; i < completedDates.length; i++) {
            const expected = format(subDays(new Date(), i + (completedDates[0] === todayStr ? 0 : 1)), "yyyy-MM-dd");
            if (completedDates[i] === expected) streak++;
            else break;
          }
        }
      }
      setDietStreak(streak);

      // Weekly stats
      const weekAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");
      const weekData = tracking.filter(t => t.tracked_date >= weekAgo);
      const wDone = weekData.reduce((a: number, t: any) => a + (t.meals_done || 0), 0);
      const wTotal = weekData.reduce((a: number, t: any) => a + (t.meals_total || 0), 0);
      setWeeklyMealsDone(wDone);
      setWeeklyMealsTotal(wTotal);
      setWeeklyAdherence(wTotal > 0 ? Math.round((wDone / wTotal) * 100) : 0);
      
      setLoadingPlans(false);
    });
  }, [user]);

  // Save daily tracking when all meals are marked
  const saveDayTracking = useCallback(async (statuses: Record<string, MealStatus>, totalMeals: number) => {
    if (!user || totalMeals === 0) return;
    
    const done = Object.values(statuses).filter(s => s === "done").length;
    const failed = Object.values(statuses).filter(s => s === "failed").length;
    const allMarked = done + failed >= totalMeals;
    
    if (!allMarked) return;
    
    const allCompleted = done >= totalMeals;
    const adherence = Math.round((done / totalMeals) * 100);
    const todayStr = format(new Date(), "yyyy-MM-dd");
    
    try {
      // Upsert tracking record
      const { data: existing } = await supabase.from("diet_tracking")
        .select("id").eq("user_id", user.id).eq("tracked_date", todayStr).maybeSingle();
      
      if (existing) {
        await supabase.from("diet_tracking").update({
          meals_total: totalMeals,
          meals_done: done,
          meals_failed: failed,
          all_completed: allCompleted,
          adherence_pct: adherence,
          updated_at: new Date().toISOString(),
        }).eq("id", existing.id);
      } else {
        await supabase.from("diet_tracking").insert({
          user_id: user.id,
          tracked_date: todayStr,
          meals_total: totalMeals,
          meals_done: done,
          meals_failed: failed,
          all_completed: allCompleted,
          adherence_pct: adherence,
        });
      }
      
      if (allCompleted) {
        const newStreak = dietStreak + 1;
        setDietStreak(newStreak);
        setShowStreakAnimation(true);
        setTimeout(() => setShowStreakAnimation(false), 2000);
        
        // Check milestone
        const milestone = streakMilestones.find(m => m.days === newStreak);
        if (milestone) {
          setTimeout(() => {
            toast.success(`${milestone.icon} Conquista: ${milestone.title}!`, {
              description: `${newStreak} dia${newStreak > 1 ? "s" : ""} seguido${newStreak > 1 ? "s" : ""} com dieta completa!`,
            });
          }, 500);
        }
      }
    } catch (err) {
      console.error("Error saving diet tracking:", err);
    }
  }, [user, dietStreak, streakMilestones]);

  const setMealStatus = (key: string, status: MealStatus) => {
    const newStatuses = { ...mealStatuses, [key]: status };
    setMealStatuses(newStatuses);
    
    if (status === "done") {
      const msg = getDietMotivationalMessage();
      toast.success(`${msg.emoji} ${msg.text}`);
      // Haptic feedback on mobile
      if (navigator.vibrate) navigator.vibrate(50);
    } else if (status === "failed") {
      const failMsg = getDietFailMessage();
      toast(failMsg, { 
        description: "Continue firme nas próximas refeições!",
        icon: "💪",
      });
    }
    
    // Check if all meals are now marked (for today's plan)
    if (planPeriod === "hoje" && displayPlan) {
      const totalMeals = displayPlan.length;
      const markedCount = Object.values(newStatuses).filter(s => s !== null).length;
      if (markedCount >= totalMeals) {
        saveDayTracking(newStatuses, totalMeals);
      }
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!objetivo) e.objetivo = "Selecione um objetivo";
    if (!peso || Number(peso) <= 20 || Number(peso) > 300) e.peso = "Peso deve ser entre 20 e 300 kg";
    if (!altura || Number(altura) <= 100 || Number(altura) > 250) e.altura = "Altura deve ser entre 100 e 250 cm";
    if (!atividade) e.atividade = "Selecione o nível";
    if (metaPeso && (Number(metaPeso) <= 20 || Number(metaPeso) > 300)) e.metaPeso = "Meta deve ser entre 20 e 300 kg";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleGenerate = () => {
    if (!validate()) return;
    setGenerating(true);
    setMealStatuses({});
    setTimeout(() => {
      try {
        const deadlineValue = prazo === "none" ? undefined : Number(prazo);
        const result = generateDietPlan(
          objetivo as any,
          Number(peso),
          Number(altura),
          atividade,
          profile?.age || undefined,
          profile?.gender || undefined,
          metaPeso ? Number(metaPeso) : undefined,
          periodo,
          deadlineValue,
          preferencias || undefined
        );
        setPlan(result.plan);
        setWeekPlan(result.weekPlan || null);
        setWeekBlocks(result.weekBlocks || null);
        setDietMeta(result.meta);
        setPlanPeriod(result.period);
        setViewingSaved(null);
        const periodLabel = periodo === "hoje" ? "hoje" : periodo === "semana" ? "da semana" : "do mês";
        toast.success(`Plano ${periodLabel} gerado: ~${result.totalCalories} kcal/dia`);
      } catch {
        toast.error("Erro ao gerar dieta. Tente novamente.");
      } finally {
        setGenerating(false);
      }
    }, 800);
  };

  const handleSave = async () => {
    if (!user || !plan) return;
    setSaving(true);
    try {
      const deadlineValue = prazo === "none" ? null : Number(prazo);
      const meta: DietMeta = {
        currentWeight: Number(peso),
        weightGoal: metaPeso ? Number(metaPeso) : null,
        deadlineMonths: deadlineValue,
        preferencias: preferencias || null,
        weeklyTargets: dietMeta?.weeklyTargets || undefined,
        monthlyRate: dietMeta?.monthlyRate || undefined,
      };
      const planData: any = { plan, period: planPeriod, meta };
      if (weekPlan) planData.weekPlan = weekPlan;
      if (weekBlocks) planData.weekBlocks = weekBlocks;

      const { error } = await supabase.from("diet_plans").insert({
        user_id: user.id,
        objective: objetivo,
        weight: Number(peso),
        height: Number(altura) || 0,
        activity_level: atividade || "moderado",
        plan_data: planData,
      });
      if (error) throw error;

      const metaMsg = metaPeso
        ? deadlineValue
          ? `Meta: ${peso}kg → ${metaPeso}kg em ${deadlineValue} ${deadlineValue === 1 ? "mês" : "meses"}`
          : `Meta: ${peso}kg → ${metaPeso}kg`
        : null;
      toast.success(metaMsg ? `Plano salvo! ${metaMsg}` : "Plano salvo!");

      const { data } = await supabase.from("diet_plans").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setSavedPlans(data || []);
    } catch {
      toast.error("Não foi possível salvar o plano. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("diet_plans").delete().eq("id", id);
      if (error) throw error;
      setSavedPlans(savedPlans.filter((p) => p.id !== id));
      if (viewingSaved?.id === id) setViewingSaved(null);
      toast.success("Plano excluído");
    } catch {
      toast.error("Erro ao excluir plano");
    }
  };

  const handleViewSaved = (sp: any) => {
    setViewingSaved(sp);
    setPlan(null);
    setWeekPlan(null);
    setWeekBlocks(null);
    setDietMeta(null);
    setMealStatuses({});
    
    const data = sp.plan_data;
    if (data && typeof data === "object") {
      if ("weekPlan" in data) {
        setPlan(data.plan as MealPlan[]);
        setWeekPlan(data.weekPlan as DayPlan[]);
        setPlanPeriod(data.period as PlanPeriod || "semana");
      } else if ("plan" in data) {
        setPlan(data.plan as MealPlan[]);
        setPlanPeriod(data.period as PlanPeriod || "hoje");
      }
      if ("weekBlocks" in data) {
        setWeekBlocks(data.weekBlocks as WeekBlock[]);
      }
      if ("meta" in data) {
        setDietMeta(data.meta as DietMeta);
      }
    } else {
      setPlanPeriod("hoje");
    }
  };

  const displayPlan = viewingSaved
    ? (viewingSaved.plan_data?.plan || viewingSaved.plan_data) as MealPlan[]
    : plan;
  
  const displayWeekPlan = viewingSaved
    ? (viewingSaved.plan_data?.weekPlan as DayPlan[] | undefined) || null
    : weekPlan;

  const displayWeekBlocks = weekBlocks;
  const displayMeta = dietMeta;

  const totalCal = displayPlan?.reduce((acc, m) => acc + (m?.itens?.reduce((a, i) => a + (i?.cal || 0), 0) || 0), 0) || 0;
  const totalProt = displayPlan?.reduce((acc, m) => acc + (m?.itens?.reduce((a, i) => a + (i?.prot || 0), 0) || 0), 0) || 0;
  const totalCarb = displayPlan?.reduce((acc, m) => acc + (m?.itens?.reduce((a, i) => a + (i?.carb || 0), 0) || 0), 0) || 0;
  const totalGord = displayPlan?.reduce((acc, m) => acc + (m?.itens?.reduce((a, i) => a + (i?.gord || 0), 0) || 0), 0) || 0;

  const macroCards = [
    { label: "Calorias", value: totalCal, unit: "kcal", color: "text-chart-3", bg: "from-chart-3/15 to-chart-3/5" },
    { label: "Proteínas", value: totalProt, unit: "g", color: "text-chart-2", bg: "from-chart-2/15 to-chart-2/5" },
    { label: "Carboidratos", value: totalCarb, unit: "g", color: "text-primary", bg: "from-primary/15 to-primary/5" },
    { label: "Gorduras", value: totalGord, unit: "g", color: "text-chart-4", bg: "from-chart-4/15 to-chart-4/5" },
  ];

  const weightDiff = metaPeso && peso ? Number(metaPeso) - Number(peso) : null;
  const currentGoal = metaPeso && peso
    ? `${peso}kg → ${metaPeso}kg${prazo !== "none" ? ` em ${prazo} ${Number(prazo) === 1 ? "mês" : "meses"}` : ""}`
    : objetivo ? `Objetivo: ${objetivo}` : undefined;

  // Meal progress stats
  const totalMealsCount = displayPlan?.length || 0;
  const doneCount = Object.values(mealStatuses).filter((s) => s === "done").length;
  const failedCount = Object.values(mealStatuses).filter((s) => s === "failed").length;

  // Next streak milestone
  const nextMilestone = useMemo(() => {
    return streakMilestones.find(m => m.days > dietStreak) || streakMilestones[streakMilestones.length - 1];
  }, [dietStreak, streakMilestones]);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight">Dieta Inteligente</h1>
        <p className="text-muted-foreground text-sm mt-1">Plano alimentar progressivo e personalizado para seu perfil e objetivos</p>
      </div>

      {/* Streak & Weekly Stats Bar */}
      {(dietStreak > 0 || weeklyMealsTotal > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Streak Card */}
          <div className={`glass-card p-4 border-chart-3/15 transition-all ${showStreakAnimation ? "animate-scale-in" : ""}`}>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${
                dietStreak >= 7 
                  ? "bg-gradient-to-br from-chart-3/25 to-chart-3/5 border-chart-3/20" 
                  : dietStreak >= 3 
                    ? "bg-gradient-to-br from-primary/20 to-primary/5 border-primary/15"
                    : "bg-gradient-to-br from-chart-4/15 to-chart-4/5 border-chart-4/15"
              }`}>
                <Flame className={`w-6 h-6 ${dietStreak >= 7 ? "text-chart-3" : dietStreak >= 3 ? "text-primary" : "text-chart-4"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-display font-bold text-foreground">{dietStreak}</p>
                  <p className="text-xs text-muted-foreground font-medium">dia{dietStreak !== 1 ? "s" : ""} seguido{dietStreak !== 1 ? "s" : ""}</p>
                </div>
                {nextMilestone && dietStreak < nextMilestone.days && (
                  <div className="mt-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] text-muted-foreground">Próxima: {nextMilestone.icon} {nextMilestone.title}</span>
                      <span className="text-[10px] text-foreground font-medium">{dietStreak}/{nextMilestone.days}</span>
                    </div>
                    <Progress value={(dietStreak / nextMilestone.days) * 100} className="h-1.5" />
                  </div>
                )}
                {dietStreak >= 30 && (
                  <p className="text-[11px] text-chart-3 font-semibold mt-0.5">🏆 Transformação atingida!</p>
                )}
              </div>
            </div>
          </div>

          {/* Weekly Adherence Card */}
          {weeklyMealsTotal > 0 && (
            <div className="glass-card p-4 border-chart-2/15">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-chart-2/20 to-chart-2/5 flex items-center justify-center border border-chart-2/15 shrink-0">
                  <BarChart3 className="w-6 h-6 text-chart-2" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-display font-bold text-foreground">{weeklyAdherence}%</p>
                    <p className="text-xs text-muted-foreground font-medium">aderência semanal</p>
                  </div>
                  <div className="mt-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] text-muted-foreground">{weeklyMealsDone}/{weeklyMealsTotal} refeições</span>
                      {weeklyAdherence >= 90 && <span className="text-[10px] text-chart-2 font-bold">💯 Excelente!</span>}
                    </div>
                    <Progress value={weeklyAdherence} className="h-1.5" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form */}
      <div className="glass-card p-5 lg:p-7 space-y-6">
        {/* Section: Dados */}
        <div>
          <h3 className="font-display font-semibold text-xs mb-4 text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">1</span>
            Seus Dados
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Objetivo</label>
              <Select value={objetivo} onValueChange={(v) => { setObjetivo(v); setErrors(e => ({ ...e, objetivo: "" })); }}>
                <SelectTrigger className="bg-secondary/50 border-border/50"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="emagrecer">Emagrecer</SelectItem>
                  <SelectItem value="massa">Ganhar Massa</SelectItem>
                  <SelectItem value="manter">Manter Peso</SelectItem>
                </SelectContent>
              </Select>
              {errors.objetivo && <p className="text-[11px] text-destructive mt-1">{errors.objetivo}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Peso Atual (kg)</label>
              <Input type="number" placeholder="80" value={peso} onChange={(e) => { setPeso(e.target.value); setErrors(er => ({ ...er, peso: "" })); }} className="bg-secondary/50 border-border/50" />
              {errors.peso && <p className="text-[11px] text-destructive mt-1">{errors.peso}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Altura (cm)</label>
              <Input type="number" placeholder="175" value={altura} onChange={(e) => { setAltura(e.target.value); setErrors(er => ({ ...er, altura: "" })); }} className="bg-secondary/50 border-border/50" />
              {errors.altura && <p className="text-[11px] text-destructive mt-1">{errors.altura}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Atividade</label>
              <Select value={atividade} onValueChange={(v) => { setAtividade(v); setErrors(e => ({ ...e, atividade: "" })); }}>
                <SelectTrigger className="bg-secondary/50 border-border/50"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentario">Sedentário</SelectItem>
                  <SelectItem value="leve">Levemente Ativo</SelectItem>
                  <SelectItem value="moderado">Moderado</SelectItem>
                  <SelectItem value="intenso">Muito Ativo</SelectItem>
                </SelectContent>
              </Select>
              {errors.atividade && <p className="text-[11px] text-destructive mt-1">{errors.atividade}</p>}
            </div>
          </div>
        </div>

        <div className="border-t border-border/40" />

        {/* Section: Meta de Peso + Prazo */}
        <div>
          <h3 className="font-display font-semibold text-xs mb-4 text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-chart-3/10 flex items-center justify-center text-[10px] font-bold text-chart-3">2</span>
            Meta de Peso &amp; Prazo
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Peso Desejado (kg) <span className="text-muted-foreground/60">(opcional)</span></label>
              <div className="relative">
                <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="Ex: 75"
                  value={metaPeso}
                  onChange={(e) => { setMetaPeso(e.target.value); setErrors(er => ({ ...er, metaPeso: "" })); }}
                  className="bg-secondary/50 border-border/50 pl-10"
                />
              </div>
              {errors.metaPeso && <p className="text-[11px] text-destructive mt-1">{errors.metaPeso}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Prazo <span className="text-muted-foreground/60">(opcional)</span></label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Select value={prazo} onValueChange={setPrazo}>
                  <SelectTrigger className="bg-secondary/50 border-border/50 pl-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {deadlineOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Sem prazo = ritmo moderado e sustentável</p>
            </div>
            {weightDiff !== null && peso && metaPeso && (
              <div className="flex items-center gap-2 sm:mt-7">
                <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  weightDiff < 0 
                    ? "bg-chart-2/10 text-chart-2" 
                    : weightDiff > 0 
                      ? "bg-primary/10 text-primary" 
                      : "bg-muted text-muted-foreground"
                }`}>
                  {weightDiff === 0 
                    ? "Manutenção" 
                    : weightDiff < 0 
                      ? `↓ ${Math.abs(weightDiff).toFixed(1)}kg${prazo !== "none" ? ` em ${prazo} ${Number(prazo) === 1 ? "mês" : "meses"}` : ""}` 
                      : `↑ ${weightDiff.toFixed(1)}kg${prazo !== "none" ? ` em ${prazo} ${Number(prazo) === 1 ? "mês" : "meses"}` : ""}`
                  }
                </div>
                {prazo !== "none" && weightDiff !== 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    ~{Math.abs(weightDiff / Number(prazo)).toFixed(1)}kg/mês
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border/40" />

        {/* Section: Preferências Alimentares */}
        <div>
          <h3 className="font-display font-semibold text-xs mb-4 text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-chart-4/10 flex items-center justify-center text-[10px] font-bold text-chart-4">3</span>
            Descrição Alimentar
          </h3>
          <div className="relative">
            <Textarea
              placeholder="Ex: Não gosto de ovo, prefiro frango e arroz, sem lactose..."
              value={preferencias}
              onChange={(e) => setPreferencias(e.target.value.slice(0, 100))}
              maxLength={100}
              rows={2}
              className="bg-secondary/50 border-border/50 resize-none text-sm"
            />
            <span className="absolute bottom-2 right-3 text-[10px] text-muted-foreground">{preferencias.length}/100</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">Opcional — a dieta será adaptada às suas preferências</p>
        </div>

        <div className="border-t border-border/40" />

        {/* Section: Período */}
        <div>
          <h3 className="font-display font-semibold text-xs mb-4 text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-chart-2/10 flex items-center justify-center text-[10px] font-bold text-chart-2">4</span>
            Período do Plano
          </h3>
          <RadioGroup value={periodo} onValueChange={(v) => setPeriodo(v as PlanPeriod)} className="grid grid-cols-3 gap-3">
            {(["hoje", "semana", "mes"] as PlanPeriod[]).map((p) => {
              const PIcon = periodIcons[p];
              const labels: Record<PlanPeriod, string> = { hoje: "Hoje", semana: "Semana", mes: "Mês" };
              const descs: Record<PlanPeriod, string> = { hoje: "Refeições do dia", semana: "7 dias variados", mes: "4 semanas progressivas" };
              return (
                <Label
                  key={p}
                  htmlFor={`period-${p}`}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all text-center ${
                    periodo === p
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border/50 bg-secondary/30 hover:border-border hover:bg-secondary/50"
                  }`}
                >
                  <RadioGroupItem value={p} id={`period-${p}`} className="sr-only" />
                  <PIcon className={`w-5 h-5 ${periodo === p ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-sm font-semibold ${periodo === p ? "text-primary" : "text-foreground"}`}>{labels[p]}</span>
                  <span className="text-[10px] text-muted-foreground leading-tight">{descs[p]}</span>
                </Label>
              );
            })}
          </RadioGroup>
        </div>

        {/* Generate Button */}
        <Button onClick={handleGenerate} disabled={generating} size="lg" className="w-full sm:w-auto">
          {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
          {generating ? "Calculando..." : `Gerar Plano — ${periodo === "hoje" ? "Hoje" : periodo === "semana" ? "Semana" : "Mês"}`}
        </Button>
      </div>

      {/* Saved Plans */}
      {loadingPlans ? (
        <div className="glass-card p-5 lg:p-6 space-y-2">
          {[1,2].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : savedPlans.length > 0 && (
        <div className="glass-card p-5 lg:p-6">
          <h3 className="font-display font-semibold text-xs mb-4 text-muted-foreground uppercase tracking-widest">Planos Salvos</h3>
          <div className="space-y-2">
            {savedPlans.map((sp) => {
              const metaDesc = buildMetaDescription(sp);
              return (
                <div key={sp.id} className={`flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all ${viewingSaved?.id === sp.id ? "bg-primary/8 border border-primary/20" : "bg-secondary/40 hover:bg-secondary/60 border border-transparent"}`}
                  onClick={() => handleViewSaved(sp)}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-chart-3/10 flex items-center justify-center">
                      <UtensilsCrossed className="w-4 h-4 text-chart-3" />
                    </div>
                    <div>
                      <p className="text-sm font-medium capitalize">{sp.objective} — {sp.weight}kg</p>
                      {metaDesc ? (
                        <p className="text-[11px] text-primary/80 font-medium">{metaDesc}</p>
                      ) : null}
                      <p className="text-[11px] text-muted-foreground">{new Date(sp.created_at).toLocaleDateString("pt-BR")}</p>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(sp.id); }} className="text-muted-foreground hover:text-destructive p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Plan Display */}
      {displayPlan && (
        <>
          {/* Weight Goal Banner */}
          {displayMeta?.weightGoal && displayMeta.weightGoal !== displayMeta.currentWeight && (
            <WeightGoalBanner
              meta={displayMeta}
              isGain={displayMeta.weightGoal > displayMeta.currentWeight}
            />
          )}

          {/* Save button */}
          {!viewingSaved && plan && (
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {saving ? "Salvando..." : "Salvar Plano"}
              </Button>
            </div>
          )}

          {/* Meal progress bar */}
          {(doneCount > 0 || failedCount > 0) && planPeriod === "hoje" && (
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Progresso do Dia</p>
                <p className="text-sm font-bold text-foreground">{doneCount}/{totalMealsCount}</p>
              </div>
              <div className="w-full h-2 rounded-full bg-secondary/60 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-chart-2 to-primary transition-all duration-500"
                  style={{ width: `${totalMealsCount > 0 ? (doneCount / totalMealsCount) * 100 : 0}%` }}
                />
              </div>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-[11px] text-chart-2 flex items-center gap-1"><Check className="w-3 h-3" /> {doneCount} feitas</span>
                {failedCount > 0 && <span className="text-[11px] text-destructive flex items-center gap-1"><XIcon className="w-3 h-3" /> {failedCount} falharam</span>}
              </div>
            </div>
          )}

          {/* Macro Summary */}
          <div>
            <h3 className="font-display font-semibold text-xs mb-3 text-muted-foreground uppercase tracking-widest">Resumo Diário de Macros</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {macroCards.map((m) => (
                <div key={m.label} className="metric-card p-4 text-center">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${m.bg} flex items-center justify-center mx-auto mb-2`}>
                    <span className={`text-xs font-bold ${m.color}`}>{m.label[0]}</span>
                  </div>
                  <p className={`text-2xl font-display font-bold ${m.color}`}>{m.value}</p>
                  <p className="text-[11px] text-muted-foreground font-medium">{m.label} ({m.unit})</p>
                </div>
              ))}
            </div>
          </div>

          {/* Meals — Progressive Week Blocks or flat list */}
          {displayWeekBlocks && displayWeekBlocks.length > 0 ? (
            <div className="space-y-4">
              <h3 className="font-display font-semibold text-xs text-muted-foreground uppercase tracking-widest">
                Plano Mensal Progressivo
              </h3>
              <p className="text-[12px] text-muted-foreground -mt-2">
                Calorias ajustadas semanalmente para atingir sua meta de forma gradual e sustentável
              </p>
              {displayWeekBlocks.map((block, i) => (
                <WeekBlockAccordion
                  key={i}
                  block={block}
                  defaultOpen={i === 0}
                  onMealFocus={(meal) => { const idx = (displayPlan || []).findIndex(m => m === meal); setFocusMealIndex(idx >= 0 ? idx : 0); }}
                  mealStatuses={mealStatuses}
                  onSetMealStatus={setMealStatus}
                />
              ))}
            </div>
          ) : displayWeekPlan && displayWeekPlan.length > 0 ? (
            <div className="space-y-3">
              <h3 className="font-display font-semibold text-xs text-muted-foreground uppercase tracking-widest">
                {planPeriod === "semana" ? "Plano Semanal" : "Plano Mensal"}
              </h3>
              {displayWeekPlan.map((dayPlan, i) => (
                <DayAccordion
                  key={i}
                  dayPlan={dayPlan}
                  defaultOpen={i === 0}
                  onMealFocus={(meal) => { const idx = (displayPlan || []).findIndex(m => m === meal); setFocusMealIndex(idx >= 0 ? idx : 0); }}
                  mealStatuses={mealStatuses}
                  onSetMealStatus={setMealStatus}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="font-display font-semibold text-xs text-muted-foreground uppercase tracking-widest">Refeições de Hoje</h3>
              {displayPlan.map((meal, i) => (
                <MealCard
                  key={i}
                  meal={meal}
                  index={i}
                  onFocus={() => setFocusMealIndex(i)}
                  status={mealStatuses[`today-${i}`] || null}
                  onSetStatus={(s) => setMealStatus(`today-${i}`, s)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!loadingPlans && savedPlans.length === 0 && !displayPlan && (
        <div className="empty-state">
          <UtensilsCrossed className="w-10 h-10 text-chart-3 mx-auto mb-3 opacity-60" />
          <h3 className="font-display font-semibold mb-1">Nenhum plano alimentar</h3>
          <p className="text-muted-foreground text-sm">Preencha seus dados e gere seu plano alimentar personalizado.</p>
        </div>
      )}

      {/* Focus Mode for Meals */}
      <DietFocusMode
        open={focusMealIndex !== null}
        onClose={() => setFocusMealIndex(null)}
        meals={displayPlan || []}
        initialIndex={focusMealIndex ?? 0}
        mealStatuses={mealStatuses}
        onSetMealStatus={(idx, s) => setMealStatus(`today-${idx}`, s)}
        userName={profile?.full_name || undefined}
        currentGoal={currentGoal}
      />
    </div>
    
  );
};

export default Dieta;
