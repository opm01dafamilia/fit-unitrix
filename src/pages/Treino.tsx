import { useState, useEffect } from "react";
import { Dumbbell, ChevronDown, ChevronUp, Zap, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";

const workoutPlans: Record<string, { dia: string; grupo: string; exercicios: { nome: string; series: string; reps: string; desc: string }[] }[]> = {
  "emagrecer": [
    { dia: "Segunda", grupo: "HIIT + Core", exercicios: [
      { nome: "Burpees", series: "4", reps: "15", desc: "Exercício completo de alta intensidade. Comece em pé, agache, faça uma flexão e pule." },
      { nome: "Mountain Climbers", series: "4", reps: "30s", desc: "Em posição de prancha, alterne os joelhos em direção ao peito rapidamente." },
      { nome: "Prancha Abdominal", series: "3", reps: "45s", desc: "Mantenha corpo reto em posição de prancha, contraindo o abdômen." },
      { nome: "Jumping Jacks", series: "4", reps: "30", desc: "Pule abrindo braços e pernas simultaneamente." },
    ]},
    { dia: "Terça", grupo: "Inferior + Cardio", exercicios: [
      { nome: "Agachamento Livre", series: "4", reps: "15", desc: "Pés na largura dos ombros, desça até as coxas ficarem paralelas ao chão." },
      { nome: "Avanço Alternado", series: "3", reps: "12/lado", desc: "Dê um passo à frente e flexione ambos os joelhos a 90°." },
      { nome: "Stiff", series: "3", reps: "12", desc: "Com halteres, incline o tronco mantendo as pernas quase estendidas." },
      { nome: "Corrida Esteira", series: "1", reps: "20min", desc: "Corrida moderada a 70% da frequência cardíaca máxima." },
    ]},
    { dia: "Quinta", grupo: "Superior + Core", exercicios: [
      { nome: "Flexão de Braço", series: "4", reps: "12", desc: "Mãos na largura dos ombros, desça até o peito quase tocar o chão." },
      { nome: "Remada Curvada", series: "3", reps: "12", desc: "Incline o tronco a 45°, puxe os halteres em direção ao abdômen." },
      { nome: "Desenvolvimento", series: "3", reps: "12", desc: "Empurre os halteres acima da cabeça partindo dos ombros." },
      { nome: "Abdominal Bicicleta", series: "3", reps: "20", desc: "Deitado, alterne cotovelo ao joelho oposto." },
    ]},
    { dia: "Sábado", grupo: "Full Body + HIIT", exercicios: [
      { nome: "Kettlebell Swing", series: "4", reps: "15", desc: "Balance o kettlebell entre as pernas e projete para frente com os quadris." },
      { nome: "Thruster", series: "3", reps: "12", desc: "Agachamento seguido de desenvolvimento acima da cabeça." },
      { nome: "Box Jump", series: "3", reps: "10", desc: "Salte sobre uma caixa com ambos os pés." },
      { nome: "Prancha Lateral", series: "3", reps: "30s/lado", desc: "Apoie-se em um antebraço, mantendo o corpo em linha reta." },
    ]},
  ],
  "massa": [
    { dia: "Segunda", grupo: "Peito e Tríceps", exercicios: [
      { nome: "Supino Reto", series: "4", reps: "8-10", desc: "Barra na linha dos mamilos, desça controladamente e empurre." },
      { nome: "Supino Inclinado Halteres", series: "4", reps: "10", desc: "Banco a 30-45°, movimento de empurrar com halteres." },
      { nome: "Crucifixo", series: "3", reps: "12", desc: "Braços abertos com halteres, junte na frente do peito." },
      { nome: "Tríceps Testa", series: "3", reps: "12", desc: "Deitado, estenda os cotovelos partindo da testa." },
      { nome: "Tríceps Corda", series: "3", reps: "15", desc: "No cabo, empurre a corda para baixo estendendo os cotovelos." },
    ]},
    { dia: "Terça", grupo: "Costas e Bíceps", exercicios: [
      { nome: "Barra Fixa", series: "4", reps: "8-10", desc: "Pegada pronada, puxe até o queixo passar a barra." },
      { nome: "Remada Cavaleiro", series: "4", reps: "10", desc: "Apoiado no banco, puxe a barra em direção ao abdômen." },
      { nome: "Pulldown", series: "3", reps: "12", desc: "Puxe a barra do cabo em direção ao peito." },
      { nome: "Rosca Direta", series: "3", reps: "12", desc: "Flexione os cotovelos curvando os halteres." },
      { nome: "Rosca Martelo", series: "3", reps: "12", desc: "Pegada neutra, flexione alternando os braços." },
    ]},
    { dia: "Quinta", grupo: "Pernas", exercicios: [
      { nome: "Agachamento Livre", series: "5", reps: "6-8", desc: "Barra nas costas, agache profundo com controle." },
      { nome: "Leg Press 45°", series: "4", reps: "10", desc: "Pés na plataforma, empurre controlando a descida." },
      { nome: "Cadeira Extensora", series: "3", reps: "12", desc: "Estenda as pernas contra a resistência." },
      { nome: "Mesa Flexora", series: "3", reps: "12", desc: "Flexione as pernas contra a resistência." },
      { nome: "Panturrilha", series: "4", reps: "15", desc: "Eleve os calcanhares na ponta dos pés." },
    ]},
    { dia: "Sexta", grupo: "Ombros e Abdômen", exercicios: [
      { nome: "Desenvolvimento Militar", series: "4", reps: "8-10", desc: "Empurre a barra acima da cabeça partindo dos ombros." },
      { nome: "Elevação Lateral", series: "4", reps: "12", desc: "Eleve os halteres lateralmente até a linha dos ombros." },
      { nome: "Elevação Frontal", series: "3", reps: "12", desc: "Eleve os halteres à frente até a linha dos ombros." },
      { nome: "Abdominal Infra", series: "3", reps: "15", desc: "Eleve as pernas mantendo o lombar no chão." },
    ]},
  ],
  "condicionamento": [
    { dia: "Segunda", grupo: "Cardio + Funcional", exercicios: [
      { nome: "Corrida Intervalada", series: "8", reps: "30s sprint / 60s leve", desc: "Alterne sprints intensos com recuperação ativa." },
      { nome: "Burpee com Salto", series: "3", reps: "12", desc: "Burpee clássico com salto explosivo no final." },
      { nome: "Corda Naval", series: "4", reps: "30s", desc: "Movimente as cordas com intensidade máxima." },
    ]},
    { dia: "Quarta", grupo: "Circuito Full Body", exercicios: [
      { nome: "Clean and Press", series: "4", reps: "8", desc: "Levante a barra do chão aos ombros e empurre acima da cabeça." },
      { nome: "Box Jump", series: "4", reps: "12", desc: "Saltos explosivos sobre caixa." },
      { nome: "Remada com Kettlebell", series: "3", reps: "12/lado", desc: "Remada unilateral com kettlebell." },
      { nome: "Wall Ball", series: "3", reps: "15", desc: "Agache segurando a bola e lance contra a parede." },
    ]},
    { dia: "Sexta", grupo: "Resistência + Core", exercicios: [
      { nome: "Bike/Remo", series: "1", reps: "30min", desc: "Cardio moderado a alta intensidade." },
      { nome: "Turkish Get Up", series: "3", reps: "5/lado", desc: "Levante-se do chão segurando peso acima da cabeça." },
      { nome: "Prancha Dinâmica", series: "3", reps: "45s", desc: "Alterne entre prancha de cotovelo e mão." },
      { nome: "Dead Hang", series: "3", reps: "30s", desc: "Pendure-se na barra para fortalecer pegada e ombros." },
    ]},
  ],
};

const Treino = () => {
  const { user } = useAuth();
  const [objetivo, setObjetivo] = useState("");
  const [nivel, setNivel] = useState("");
  const [dias, setDias] = useState("");
  const [showPlan, setShowPlan] = useState(false);
  const [expandedDay, setExpandedDay] = useState<number | null>(0);
  const [savedPlans, setSavedPlans] = useState<any[]>([]);
  const [viewingSaved, setViewingSaved] = useState<any | null>(null);

  const plan = objetivo ? workoutPlans[objetivo] || [] : [];

  useEffect(() => {
    if (!user) return;
    supabase.from("workout_plans").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => setSavedPlans(data || []));
  }, [user]);

  const handleGenerate = () => {
    if (objetivo) setShowPlan(true);
    setViewingSaved(null);
  };

  const handleSave = async () => {
    if (!user || !objetivo) return;
    const { error } = await supabase.from("workout_plans").insert({
      user_id: user.id,
      objective: objetivo,
      experience_level: nivel || "iniciante",
      days_per_week: Number(dias) || 4,
      plan_data: plan,
    });
    if (error) {
      toast.error("Erro ao salvar plano");
    } else {
      toast.success("Plano salvo!");
      const { data } = await supabase.from("workout_plans").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setSavedPlans(data || []);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("workout_plans").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir");
    } else {
      setSavedPlans(savedPlans.filter((p) => p.id !== id));
      if (viewingSaved?.id === id) setViewingSaved(null);
      toast.success("Plano excluído");
    }
  };

  const displayPlan = viewingSaved ? (viewingSaved.plan_data as any[]) : plan;
  const showDisplay = showPlan || viewingSaved;

  return (
    <div className="space-y-8 animate-slide-up">
      <div>
        <h1 className="text-3xl font-display font-bold">Treino Personalizado</h1>
        <p className="text-muted-foreground mt-1">Monte seu plano de treino ideal</p>
      </div>

      {/* Form */}
      <div className="glass-card p-6">
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Objetivo</label>
            <Select value={objetivo} onValueChange={setObjetivo}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="emagrecer">Emagrecer</SelectItem>
                <SelectItem value="massa">Ganhar Massa</SelectItem>
                <SelectItem value="condicionamento">Condicionamento</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Nível</label>
            <Select value={nivel} onValueChange={setNivel}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="iniciante">Iniciante</SelectItem>
                <SelectItem value="intermediario">Intermediário</SelectItem>
                <SelectItem value="avancado">Avançado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Dias/Semana</label>
            <Select value={dias} onValueChange={setDias}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 dias</SelectItem>
                <SelectItem value="4">4 dias</SelectItem>
                <SelectItem value="5">5 dias</SelectItem>
                <SelectItem value="6">6 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={handleGenerate} disabled={!objetivo} className="w-full sm:w-auto">
          <Zap className="w-4 h-4 mr-2" /> Gerar Plano de Treino
        </Button>
      </div>

      {/* Saved Plans */}
      {savedPlans.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="font-display font-semibold mb-4">Planos Salvos</h3>
          <div className="space-y-2">
            {savedPlans.map((sp) => (
              <div key={sp.id} className={`flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer ${viewingSaved?.id === sp.id ? "bg-primary/10 border border-primary/20" : "bg-secondary/50 hover:bg-secondary"}`}
                onClick={() => { setViewingSaved(sp); setShowPlan(false); setExpandedDay(0); }}>
                <div>
                  <p className="text-sm font-medium capitalize">{sp.objective} — {sp.experience_level}</p>
                  <p className="text-xs text-muted-foreground">{new Date(sp.created_at).toLocaleDateString("pt-BR")} • {sp.days_per_week} dias/sem</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(sp.id); }} className="text-muted-foreground hover:text-destructive p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plan Display */}
      {showDisplay && displayPlan.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-xl">
              {viewingSaved ? "Plano Salvo" : "Seu Plano Semanal"}
            </h2>
            {!viewingSaved && showPlan && (
              <Button variant="outline" onClick={handleSave}>Salvar Plano</Button>
            )}
          </div>
          {displayPlan.map((day: any, i: number) => (
            <div key={i} className="glass-card overflow-hidden">
              <button
                onClick={() => setExpandedDay(expandedDay === i ? null : i)}
                className="w-full flex items-center justify-between p-5 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Dumbbell className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">{day.dia}</p>
                    <p className="text-sm text-muted-foreground">{day.grupo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground hidden sm:block">
                    {day.exercicios.length} exercícios
                  </span>
                  {expandedDay === i ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                </div>
              </button>
              {expandedDay === i && (
                <div className="px-5 pb-5 space-y-3 border-t border-border">
                  {day.exercicios.map((ex: any, j: number) => (
                    <div key={j} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg bg-secondary/30 mt-3">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{ex.nome}</p>
                        <p className="text-xs text-muted-foreground mt-1">{ex.desc}</p>
                      </div>
                      <div className="flex gap-4 text-xs">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{ex.series}x{ex.reps}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Treino;
