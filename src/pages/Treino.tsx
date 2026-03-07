import { useState, useEffect } from "react";
import { Dumbbell, ChevronDown, ChevronUp, Zap, Clock, Trash2, Timer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";
import { generateWorkoutPlan, BodyFocus } from "@/lib/workoutGenerator";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const Treino = () => {
  const { user, profile } = useAuth();
  const [objetivo, setObjetivo] = useState("");
  const [nivel, setNivel] = useState("");
  const [dias, setDias] = useState("");
  const [foco, setFoco] = useState<BodyFocus>("completo");
  const [expandedDay, setExpandedDay] = useState<number | null>(0);
  const [savedPlans, setSavedPlans] = useState<any[]>([]);
  const [viewingSaved, setViewingSaved] = useState<any | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.objective) setObjetivo(profile.objective === "manter" ? "condicionamento" : profile.objective);
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    setLoadingPlans(true);
    supabase.from("workout_plans").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error("Erro ao carregar planos salvos");
        setSavedPlans(data || []);
        setLoadingPlans(false);
      });
  }, [user]);

  const handleGenerate = () => {
    if (!objetivo || !nivel || !dias) {
      toast.error("Preencha todos os campos");
      return;
    }
    setGenerating(true);
    setTimeout(() => {
      try {
        const plan = generateWorkoutPlan(
          objetivo as "emagrecer" | "massa" | "condicionamento",
          nivel as "iniciante" | "intermediario" | "avancado",
          Number(dias),
          foco
        );
        setGeneratedPlan(plan);
        setShowPlan(true);
        setViewingSaved(null);
        setExpandedDay(0);
        toast.success("Plano gerado com sucesso!");
      } catch {
        toast.error("Erro ao gerar plano. Tente novamente.");
      } finally {
        setGenerating(false);
      }
    }, 800);
  };

  const handleSave = async () => {
    if (!user || generatedPlan.length === 0) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("workout_plans").insert({
        user_id: user.id,
        objective: objetivo,
        experience_level: nivel,
        days_per_week: Number(dias),
        body_focus: foco,
        plan_data: generatedPlan,
      } as any);
      if (error) throw error;
      toast.success("Plano salvo!");
      const { data } = await supabase.from("workout_plans").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setSavedPlans(data || []);
    } catch {
      toast.error("Não foi possível salvar o plano. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("workout_plans").delete().eq("id", id);
      if (error) throw error;
      setSavedPlans(savedPlans.filter((p) => p.id !== id));
      if (viewingSaved?.id === id) setViewingSaved(null);
      toast.success("Plano excluído");
    } catch {
      toast.error("Erro ao excluir plano");
    }
  };

  const displayPlan = viewingSaved ? (viewingSaved.plan_data as any[]) : generatedPlan;
  const showDisplay = (showPlan && generatedPlan.length > 0) || viewingSaved;

  return (
    <div className="space-y-7 animate-slide-up">
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight">Treino Personalizado</h1>
        <p className="text-muted-foreground text-sm mt-1">Monte seu plano de treino baseado no seu perfil</p>
      </div>

      {/* Form */}
      <div className="glass-card p-5 lg:p-6">
        <h3 className="font-display font-semibold text-sm mb-4 text-muted-foreground uppercase tracking-wider">Configurar Treino</h3>
        <div className="grid sm:grid-cols-3 gap-4 mb-5">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Objetivo</label>
            <Select value={objetivo} onValueChange={setObjetivo}>
              <SelectTrigger className="bg-secondary/50 border-border/50"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="emagrecer">Emagrecer</SelectItem>
                <SelectItem value="massa">Ganhar Massa</SelectItem>
                <SelectItem value="condicionamento">Condicionamento</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Nível</label>
            <Select value={nivel} onValueChange={setNivel}>
              <SelectTrigger className="bg-secondary/50 border-border/50"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="iniciante">Iniciante</SelectItem>
                <SelectItem value="intermediario">Intermediário</SelectItem>
                <SelectItem value="avancado">Avançado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Dias/Semana</label>
            <Select value={dias} onValueChange={setDias}>
              <SelectTrigger className="bg-secondary/50 border-border/50"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 dias</SelectItem>
                <SelectItem value="4">4 dias</SelectItem>
                <SelectItem value="5">5 dias</SelectItem>
                <SelectItem value="6">6 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={handleGenerate} disabled={!objetivo || !nivel || !dias || generating} className="w-full sm:w-auto">
          {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
          {generating ? "Gerando..." : "Gerar Plano de Treino"}
        </Button>
      </div>

      {/* Saved Plans */}
      {loadingPlans ? (
        <div className="glass-card p-5 lg:p-6 space-y-2">
          {[1,2].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : savedPlans.length > 0 && (
        <div className="glass-card p-5 lg:p-6">
          <h3 className="font-display font-semibold text-sm mb-4 text-muted-foreground uppercase tracking-wider">Planos Salvos</h3>
          <div className="space-y-2">
            {savedPlans.map((sp) => (
              <div key={sp.id} className={`flex items-center justify-between p-3.5 rounded-xl transition-all cursor-pointer ${viewingSaved?.id === sp.id ? "bg-primary/8 border border-primary/20 shadow-[0_0_16px_-4px_hsl(152_69%_46%_/_0.1)]" : "bg-secondary/40 hover:bg-secondary/60 border border-transparent"}`}
                onClick={() => { setViewingSaved(sp); setShowPlan(false); setExpandedDay(0); }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Dumbbell className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium capitalize">{sp.objective} — {sp.experience_level}</p>
                    <p className="text-[11px] text-muted-foreground">{new Date(sp.created_at).toLocaleDateString("pt-BR")} • {sp.days_per_week} dias/sem</p>
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
      {showDisplay && displayPlan.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-lg">
              {viewingSaved ? "Plano Salvo" : "Seu Plano Semanal"}
            </h2>
            {!viewingSaved && showPlan && (
              <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {saving ? "Salvando..." : "Salvar Plano"}
              </Button>
            )}
          </div>
          {displayPlan.map((day: any, i: number) => (
            <div key={i} className="glass-card overflow-hidden">
              <button
                onClick={() => setExpandedDay(expandedDay === i ? null : i)}
                className="w-full flex items-center justify-between p-4 lg:p-5 hover:bg-secondary/20 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                    <Dumbbell className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm">{day.dia}</p>
                    <p className="text-xs text-muted-foreground">{day.grupo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-muted-foreground hidden sm:block px-2 py-1 rounded-md bg-secondary/50">
                    {day.exercicios.length} exercícios
                  </span>
                  {expandedDay === i ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>
              {expandedDay === i && (
                <div className="px-4 lg:px-5 pb-4 lg:pb-5 space-y-2.5 border-t border-border/50">
                  {day.exercicios.map((ex: any, j: number) => (
                    <div key={j} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 rounded-xl bg-secondary/30 mt-2.5 first:mt-3">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{ex.nome}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{ex.desc}</p>
                      </div>
                      <div className="flex gap-3 text-[11px] shrink-0">
                        <div className="flex items-center gap-1 text-primary font-medium px-2 py-1 rounded-md bg-primary/8">
                          <Clock className="w-3 h-3" />
                          <span>{ex.series}x{ex.reps}</span>
                        </div>
                        {ex.descanso && ex.descanso !== "—" && (
                          <div className="flex items-center gap-1 text-muted-foreground px-2 py-1 rounded-md bg-secondary/50">
                            <Timer className="w-3 h-3" />
                            <span>{ex.descanso}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loadingPlans && savedPlans.length === 0 && !showDisplay && (
        <div className="empty-state">
          <Dumbbell className="w-10 h-10 text-primary mx-auto mb-3 opacity-60" />
          <h3 className="font-display font-semibold mb-1">Nenhum plano de treino</h3>
          <p className="text-muted-foreground text-sm">Configure e gere seu primeiro plano de treino personalizado acima.</p>
        </div>
      )}
    </div>
  );
};

export default Treino;
