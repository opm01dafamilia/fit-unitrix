import { useState, useEffect } from "react";
import { UtensilsCrossed, Zap, Coffee, Sun, Moon, Apple, Trash2, Loader2, Target, Calendar, CalendarDays, CalendarRange, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";
import { generateDietPlan, type MealPlan, type DayPlan, type PlanPeriod } from "@/lib/dietGenerator";
import { Skeleton } from "@/components/ui/skeleton";

const iconMap: Record<string, typeof Coffee> = { Coffee, Sun, Moon, Apple };

const periodIcons: Record<PlanPeriod, typeof Calendar> = {
  hoje: Calendar,
  semana: CalendarDays,
  mes: CalendarRange,
};

const MealCard = ({ meal, index }: { meal: MealPlan; index: number }) => {
  const MealIcon = iconMap[meal.iconName] || Coffee;
  const mealCal = meal.itens.reduce((a, item) => a + item.cal, 0);

  return (
    <div className="glass-card p-4 lg:p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
          <MealIcon className="w-4.5 h-4.5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">{meal.refeicao}</p>
          <p className="text-[11px] text-muted-foreground">{meal.horario}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-chart-3">{mealCal}</p>
          <p className="text-[10px] text-muted-foreground">kcal</p>
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

const DayAccordion = ({ dayPlan, defaultOpen }: { dayPlan: DayPlan; defaultOpen?: boolean }) => {
  const [open, setOpen] = useState(defaultOpen || false);
  const dayCal = dayPlan.refeicoes.reduce((acc, m) => acc + m.itens.reduce((a, i) => a + i.cal, 0), 0);

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
            <p className="text-[11px] text-muted-foreground">{dayPlan.refeicoes.length} refeições • {dayCal} kcal</p>
          </div>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-4 pb-4 lg:px-5 lg:pb-5 space-y-3">
          {dayPlan.refeicoes.map((meal, i) => (
            <MealCard key={i} meal={meal} index={i} />
          ))}
        </div>
      )}
    </div>
  );
};

const Dieta = () => {
  const { user, profile } = useAuth();
  const [objetivo, setObjetivo] = useState("");
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [atividade, setAtividade] = useState("");
  const [metaPeso, setMetaPeso] = useState("");
  const [periodo, setPeriodo] = useState<PlanPeriod>("hoje");
  const [plan, setPlan] = useState<MealPlan[] | null>(null);
  const [weekPlan, setWeekPlan] = useState<DayPlan[] | null>(null);
  const [planPeriod, setPlanPeriod] = useState<PlanPeriod>("hoje");
  const [savedPlans, setSavedPlans] = useState<any[]>([]);
  const [viewingSaved, setViewingSaved] = useState<any | null>(null);
  const [generating, setGenerating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      if (profile.weight) setPeso(String(profile.weight));
      if (profile.height) setAltura(String(profile.height));
      if (profile.objective) setObjetivo(profile.objective);
      if (profile.activity_level) setAtividade(profile.activity_level);
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    setLoadingPlans(true);
    supabase.from("diet_plans").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error("Erro ao carregar planos salvos");
        setSavedPlans(data || []);
        setLoadingPlans(false);
      });
  }, [user]);

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
    setTimeout(() => {
      try {
        const result = generateDietPlan(
          objetivo as any,
          Number(peso),
          Number(altura),
          atividade,
          profile?.age || undefined,
          profile?.gender || undefined,
          metaPeso ? Number(metaPeso) : undefined,
          periodo
        );
        setPlan(result.plan);
        setWeekPlan(result.weekPlan || null);
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
      const { error } = await supabase.from("diet_plans").insert({
        user_id: user.id,
        objective: objetivo,
        weight: Number(peso),
        height: Number(altura) || 0,
        activity_level: atividade || "moderado",
        plan_data: weekPlan ? { plan, weekPlan, period: planPeriod } : plan,
      });
      if (error) throw error;
      toast.success("Plano salvo!");
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

  // Handle viewing saved plans (may have weekPlan embedded)
  const handleViewSaved = (sp: any) => {
    setViewingSaved(sp);
    setPlan(null);
    setWeekPlan(null);
    
    const data = sp.plan_data;
    if (data && typeof data === "object" && "weekPlan" in data) {
      setPlan(data.plan as MealPlan[]);
      setWeekPlan(data.weekPlan as DayPlan[]);
      setPlanPeriod(data.period as PlanPeriod || "semana");
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

  const totalCal = displayPlan?.reduce((acc, m) => acc + m.itens.reduce((a, i) => a + i.cal, 0), 0) || 0;
  const totalProt = displayPlan?.reduce((acc, m) => acc + m.itens.reduce((a, i) => a + i.prot, 0), 0) || 0;
  const totalCarb = displayPlan?.reduce((acc, m) => acc + m.itens.reduce((a, i) => a + i.carb, 0), 0) || 0;
  const totalGord = displayPlan?.reduce((acc, m) => acc + m.itens.reduce((a, i) => a + i.gord, 0), 0) || 0;

  const macroCards = [
    { label: "Calorias", value: totalCal, unit: "kcal", color: "text-chart-3", bg: "from-chart-3/15 to-chart-3/5" },
    { label: "Proteínas", value: totalProt, unit: "g", color: "text-chart-2", bg: "from-chart-2/15 to-chart-2/5" },
    { label: "Carboidratos", value: totalCarb, unit: "g", color: "text-primary", bg: "from-primary/15 to-primary/5" },
    { label: "Gorduras", value: totalGord, unit: "g", color: "text-chart-4", bg: "from-chart-4/15 to-chart-4/5" },
  ];

  const weightDiff = metaPeso && peso ? Number(metaPeso) - Number(peso) : null;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight">Dieta Automática</h1>
        <p className="text-muted-foreground text-sm mt-1">Plano alimentar personalizado para seu perfil e objetivos</p>
      </div>

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

        {/* Divider */}
        <div className="border-t border-border/40" />

        {/* Section: Meta de Peso */}
        <div>
          <h3 className="font-display font-semibold text-xs mb-4 text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-chart-3/10 flex items-center justify-center text-[10px] font-bold text-chart-3">2</span>
            Meta de Peso
          </h3>
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="flex-1 w-full sm:max-w-xs">
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Peso Desejado (kg)</label>
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
            {weightDiff !== null && peso && metaPeso && (
              <div className="flex items-center gap-2 mt-1 sm:mt-7">
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
                      ? `↓ ${Math.abs(weightDiff).toFixed(1)} kg para perder` 
                      : `↑ ${weightDiff.toFixed(1)} kg para ganhar`
                  }
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/40" />

        {/* Section: Período */}
        <div>
          <h3 className="font-display font-semibold text-xs mb-4 text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-chart-2/10 flex items-center justify-center text-[10px] font-bold text-chart-2">3</span>
            Período do Plano
          </h3>
          <RadioGroup value={periodo} onValueChange={(v) => setPeriodo(v as PlanPeriod)} className="grid grid-cols-3 gap-3">
            {(["hoje", "semana", "mes"] as PlanPeriod[]).map((p) => {
              const PIcon = periodIcons[p];
              const labels: Record<PlanPeriod, string> = { hoje: "Hoje", semana: "Semana", mes: "Mês" };
              const descs: Record<PlanPeriod, string> = { hoje: "Refeições do dia", semana: "7 dias variados", mes: "4 semanas completas" };
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
            {savedPlans.map((sp) => (
              <div key={sp.id} className={`flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all ${viewingSaved?.id === sp.id ? "bg-primary/8 border border-primary/20" : "bg-secondary/40 hover:bg-secondary/60 border border-transparent"}`}
                onClick={() => handleViewSaved(sp)}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-chart-3/10 flex items-center justify-center">
                    <UtensilsCrossed className="w-4 h-4 text-chart-3" />
                  </div>
                  <div>
                    <p className="text-sm font-medium capitalize">{sp.objective} — {sp.weight}kg</p>
                    <p className="text-[11px] text-muted-foreground">{new Date(sp.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(sp.id); }} className="text-muted-foreground hover:text-destructive p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plan Display */}
      {displayPlan && (
        <>
          {!viewingSaved && plan && (
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {saving ? "Salvando..." : "Salvar Plano"}
              </Button>
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

          {/* Meals — Today or Week/Month */}
          {displayWeekPlan && displayWeekPlan.length > 0 ? (
            <div className="space-y-3">
              <h3 className="font-display font-semibold text-xs text-muted-foreground uppercase tracking-widest">
                {planPeriod === "semana" ? "Plano Semanal" : "Plano Mensal"}
              </h3>
              {displayWeekPlan.map((dayPlan, i) => (
                <DayAccordion key={i} dayPlan={dayPlan} defaultOpen={i === 0} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="font-display font-semibold text-xs text-muted-foreground uppercase tracking-widest">Refeições de Hoje</h3>
              {displayPlan.map((meal, i) => (
                <MealCard key={i} meal={meal} index={i} />
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
    </div>
  );
};

export default Dieta;
