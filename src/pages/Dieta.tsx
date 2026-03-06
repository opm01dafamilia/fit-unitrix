import { useState, useEffect } from "react";
import { UtensilsCrossed, Zap, Coffee, Sun, Moon, Apple, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";

type MealPlan = {
  refeicao: string;
  iconName: string;
  horario: string;
  itens: { alimento: string; qtd: string; cal: number; prot: number; carb: number; gord: number }[];
};

const iconMap: Record<string, typeof Coffee> = { Coffee, Sun, Moon, Apple };

const generatePlan = (objetivo: string, peso: number): MealPlan[] => {
  return [
    { refeicao: "Café da Manhã", iconName: "Coffee", horario: "07:00", itens: [
      { alimento: "Ovos mexidos", qtd: "3 unidades", cal: 210, prot: 18, carb: 2, gord: 15 },
      { alimento: "Pão integral", qtd: "2 fatias", cal: 140, prot: 6, carb: 24, gord: 2 },
      { alimento: "Banana", qtd: "1 unidade", cal: 89, prot: 1, carb: 23, gord: 0 },
      { alimento: "Café com leite", qtd: "1 xícara", cal: 60, prot: 3, carb: 5, gord: 3 },
    ]},
    { refeicao: "Lanche Manhã", iconName: "Apple", horario: "10:00", itens: [
      { alimento: "Iogurte natural", qtd: "200ml", cal: 120, prot: 8, carb: 10, gord: 5 },
      { alimento: "Granola", qtd: "30g", cal: 130, prot: 3, carb: 22, gord: 4 },
      { alimento: "Castanhas", qtd: "20g", cal: 120, prot: 4, carb: 3, gord: 10 },
    ]},
    { refeicao: "Almoço", iconName: "Sun", horario: "12:30", itens: [
      { alimento: "Arroz integral", qtd: "150g", cal: 170, prot: 4, carb: 35, gord: 1 },
      { alimento: "Feijão", qtd: "100g", cal: 77, prot: 5, carb: 14, gord: 0 },
      { alimento: "Frango grelhado", qtd: "150g", cal: 248, prot: 38, carb: 0, gord: 10 },
      { alimento: "Salada verde", qtd: "à vontade", cal: 25, prot: 2, carb: 4, gord: 0 },
      { alimento: "Azeite", qtd: "1 colher", cal: 90, prot: 0, carb: 0, gord: 10 },
    ]},
    { refeicao: "Lanche Tarde", iconName: "Apple", horario: "16:00", itens: [
      { alimento: "Whey Protein", qtd: "1 scoop", cal: 120, prot: 24, carb: 3, gord: 1 },
      { alimento: "Batata doce", qtd: "100g", cal: 86, prot: 2, carb: 20, gord: 0 },
    ]},
    { refeicao: "Jantar", iconName: "Moon", horario: "19:30", itens: [
      { alimento: "Salmão grelhado", qtd: "150g", cal: 280, prot: 30, carb: 0, gord: 18 },
      { alimento: "Batata doce", qtd: "150g", cal: 129, prot: 2, carb: 30, gord: 0 },
      { alimento: "Brócolis", qtd: "100g", cal: 34, prot: 3, carb: 7, gord: 0 },
      { alimento: "Azeite", qtd: "1 colher", cal: 90, prot: 0, carb: 0, gord: 10 },
    ]},
  ];
};

const Dieta = () => {
  const { user, profile } = useAuth();
  const [objetivo, setObjetivo] = useState("");
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [atividade, setAtividade] = useState("");
  const [plan, setPlan] = useState<MealPlan[] | null>(null);
  const [savedPlans, setSavedPlans] = useState<any[]>([]);
  const [viewingSaved, setViewingSaved] = useState<any | null>(null);

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

  const handleGenerate = () => {
    if (objetivo && peso) {
      setPlan(generatePlan(objetivo, Number(peso)));
      setViewingSaved(null);
    }
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

  return (
    <div className="space-y-8 animate-slide-up">
      <div>
        <h1 className="text-3xl font-display font-bold">Dieta Automática</h1>
        <p className="text-muted-foreground mt-1">Plano alimentar personalizado</p>
      </div>

      {/* Form */}
      <div className="glass-card p-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Objetivo</label>
            <Select value={objetivo} onValueChange={setObjetivo}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="emagrecer">Emagrecer</SelectItem>
                <SelectItem value="massa">Ganhar Massa</SelectItem>
                <SelectItem value="manter">Manter Peso</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Peso (kg)</label>
            <Input type="number" placeholder="80" value={peso} onChange={(e) => setPeso(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Altura (cm)</label>
            <Input type="number" placeholder="175" value={altura} onChange={(e) => setAltura(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Atividade</label>
            <Select value={atividade} onValueChange={setAtividade}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sedentario">Sedentário</SelectItem>
                <SelectItem value="leve">Levemente Ativo</SelectItem>
                <SelectItem value="moderado">Moderado</SelectItem>
                <SelectItem value="intenso">Muito Ativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={handleGenerate} disabled={!objetivo || !peso}>
          <Zap className="w-4 h-4 mr-2" /> Gerar Plano Alimentar
        </Button>
      </div>

      {/* Saved Plans */}
      {savedPlans.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="font-display font-semibold mb-4">Planos Salvos</h3>
          <div className="space-y-2">
            {savedPlans.map((sp) => (
              <div key={sp.id} className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${viewingSaved?.id === sp.id ? "bg-primary/10 border border-primary/20" : "bg-secondary/50 hover:bg-secondary"}`}
                onClick={() => { setViewingSaved(sp); setPlan(null); }}>
                <div>
                  <p className="text-sm font-medium capitalize">{sp.objective} — {sp.weight}kg</p>
                  <p className="text-xs text-muted-foreground">{new Date(sp.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(sp.id); }} className="text-muted-foreground hover:text-destructive p-1">
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
              <Button variant="outline" onClick={handleSave}>Salvar Plano</Button>
            </div>
          )}

          {/* Macro Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Calorias", value: totalCal, unit: "kcal", color: "text-chart-3" },
              { label: "Proteínas", value: totalProt, unit: "g", color: "text-chart-2" },
              { label: "Carboidratos", value: totalCarb, unit: "g", color: "text-primary" },
              { label: "Gorduras", value: totalGord, unit: "g", color: "text-chart-4" },
            ].map((m) => (
              <div key={m.label} className="glass-card p-5 text-center">
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <p className={`stat-value ${m.color} mt-1`}>{m.value}</p>
                <p className="text-xs text-muted-foreground">{m.unit}</p>
              </div>
            ))}
          </div>

          {/* Meals */}
          <div className="space-y-4">
            {displayPlan.map((meal, i) => {
              const MealIcon = iconMap[meal.iconName] || Coffee;
              return (
                <div key={i} className="glass-card p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MealIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{meal.refeicao}</p>
                      <p className="text-xs text-muted-foreground">{meal.horario}</p>
                    </div>
                    <div className="ml-auto text-sm text-muted-foreground">
                      {meal.itens.reduce((a, i) => a + i.cal, 0)} kcal
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-muted-foreground border-b border-border">
                          <th className="text-left pb-2 font-medium">Alimento</th>
                          <th className="text-left pb-2 font-medium">Qtd</th>
                          <th className="text-right pb-2 font-medium">Cal</th>
                          <th className="text-right pb-2 font-medium">Prot</th>
                          <th className="text-right pb-2 font-medium">Carb</th>
                          <th className="text-right pb-2 font-medium">Gord</th>
                        </tr>
                      </thead>
                      <tbody>
                        {meal.itens.map((item, j) => (
                          <tr key={j} className="border-b border-border/50 last:border-0">
                            <td className="py-2">{item.alimento}</td>
                            <td className="py-2 text-muted-foreground">{item.qtd}</td>
                            <td className="py-2 text-right">{item.cal}</td>
                            <td className="py-2 text-right text-chart-2">{item.prot}g</td>
                            <td className="py-2 text-right text-primary">{item.carb}g</td>
                            <td className="py-2 text-right text-chart-4">{item.gord}g</td>
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
    </div>
  );
};

export default Dieta;
