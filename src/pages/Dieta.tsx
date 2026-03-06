import { useState, useEffect } from "react";
import { UtensilsCrossed, Zap, Coffee, Sun, Moon, Apple, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";
import { generateDietPlan, type MealPlan } from "@/lib/dietGenerator";

const iconMap: Record<string, typeof Coffee> = { Coffee, Sun, Moon, Apple };

const Dieta = () => {
  const { user, profile } = useAuth();
  const [objetivo, setObjetivo] = useState("");
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [atividade, setAtividade] = useState("");
  const [plan, setPlan] = useState<MealPlan[] | null>(null);
  const [savedPlans, setSavedPlans] = useState<any[]>([]);
  const [viewingSaved, setViewingSaved] = useState<any | null>(null);
  const [generating, setGenerating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    supabase.from("diet_plans").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => setSavedPlans(data || []));
  }, [user]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!objetivo) e.objetivo = "Selecione um objetivo";
    if (!peso || Number(peso) <= 0) e.peso = "Peso inválido";
    if (!altura || Number(altura) <= 0) e.altura = "Altura inválida";
    if (!atividade) e.atividade = "Selecione o nível";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleGenerate = () => {
    if (!validate()) return;
    setGenerating(true);
    setTimeout(() => {
      const result = generateDietPlan(
        objetivo as any,
        Number(peso),
        Number(altura),
        atividade,
        profile?.age || undefined,
        profile?.gender || undefined
      );
      setPlan(result.plan);
      setViewingSaved(null);
      setGenerating(false);
      toast.success(`Plano gerado: ~${result.totalCalories} kcal/dia`);
    }, 800);
  };

  const handleSave = async () => {
    if (!user || !plan) return;
    const { error } = await supabase.from("diet_plans").insert({
      user_id: user.id,
      objective: objetivo,
      weight: Number(peso),
      height: Number(altura) || 0,
      activity_level: atividade || "moderado",
      plan_data: plan,
    });
    if (error) toast.error("Erro ao salvar");
    else {
      toast.success("Plano salvo!");
      const { data } = await supabase.from("diet_plans").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setSavedPlans(data || []);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("diet_plans").delete().eq("id", id);
    setSavedPlans(savedPlans.filter((p) => p.id !== id));
    if (viewingSaved?.id === id) setViewingSaved(null);
    toast.success("Plano excluído");
  };

  const displayPlan = viewingSaved ? (viewingSaved.plan_data as MealPlan[]) : plan;

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

  return (
    <div className="space-y-7 animate-slide-up">
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight">Dieta Automática</h1>
        <p className="text-muted-foreground text-sm mt-1">Plano alimentar calculado para seu perfil</p>
      </div>

      {/* Form */}
      <div className="glass-card p-5 lg:p-6">
        <h3 className="font-display font-semibold text-sm mb-4 text-muted-foreground uppercase tracking-wider">Seus Dados</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
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
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Peso (kg)</label>
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
        <Button onClick={handleGenerate} disabled={generating}>
          {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
          {generating ? "Calculando..." : "Gerar Plano Alimentar"}
        </Button>
      </div>

      {/* Saved Plans */}
      {savedPlans.length > 0 && (
        <div className="glass-card p-5 lg:p-6">
          <h3 className="font-display font-semibold text-sm mb-4 text-muted-foreground uppercase tracking-wider">Planos Salvos</h3>
          <div className="space-y-2">
            {savedPlans.map((sp) => (
              <div key={sp.id} className={`flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all ${viewingSaved?.id === sp.id ? "bg-primary/8 border border-primary/20" : "bg-secondary/40 hover:bg-secondary/60 border border-transparent"}`}
                onClick={() => { setViewingSaved(sp); setPlan(null); }}>
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

      {displayPlan && (
        <>
          {!viewingSaved && plan && (
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={handleSave}>Salvar Plano</Button>
            </div>
          )}

          {/* Macro Summary */}
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

          {/* Meals */}
          <div className="space-y-3">
            {displayPlan.map((meal, i) => {
              const MealIcon = iconMap[meal.iconName] || Coffee;
              const mealCal = meal.itens.reduce((a, item) => a + item.cal, 0);
              return (
                <div key={i} className="glass-card p-4 lg:p-5">
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
            })}
          </div>
        </>
      )}

      {/* Empty state */}
      {savedPlans.length === 0 && !displayPlan && (
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
