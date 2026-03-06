import { useState, useEffect } from "react";
import { History, Dumbbell, UtensilsCrossed, Scale, Target, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type Tab = "body" | "workout" | "diet" | "goals";

const tabs: { key: Tab; label: string; icon: typeof Scale }[] = [
  { key: "body", label: "Corpo", icon: Scale },
  { key: "workout", label: "Treinos", icon: Dumbbell },
  { key: "diet", label: "Dietas", icon: UtensilsCrossed },
  { key: "goals", label: "Metas", icon: Target },
];

const Historico = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("body");
  const [bodyRecords, setBodyRecords] = useState<any[]>([]);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [diets, setDiets] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      const [b, w, d, g] = await Promise.all([
        supabase.from("body_tracking").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("workout_plans").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("diet_plans").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("fitness_goals").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      setBodyRecords(b.data || []);
      setWorkouts(w.data || []);
      setDiets(d.data || []);
      setGoals(g.data || []);
    };
    fetchAll();
  }, [user]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

  const currentData = tab === "body" ? bodyRecords : tab === "workout" ? workouts : tab === "diet" ? diets : goals;

  return (
    <div className="space-y-7 animate-slide-up">
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight">Histórico</h1>
        <p className="text-muted-foreground text-sm mt-1">Visualize todo seu histórico de atividades</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-secondary/50 w-fit overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => { setTab(t.key); setExpandedId(null); }}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-md transition-all whitespace-nowrap ${tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Body Records */}
      {tab === "body" && (
        <div className="space-y-2">
          {bodyRecords.map((r) => (
            <div key={r.id} className="glass-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Scale className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{r.weight} kg</p>
                    <p className="text-[11px] text-muted-foreground">{formatDate(r.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  {r.body_fat && <span>{r.body_fat}% gordura</span>}
                  {r.waist && <span className="hidden sm:inline">Cintura: {r.waist}cm</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Workout History */}
      {tab === "workout" && (
        <div className="space-y-2">
          {workouts.map((w) => (
            <div key={w.id} className="glass-card overflow-hidden">
              <button onClick={() => setExpandedId(expandedId === w.id ? null : w.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Dumbbell className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold capitalize">{w.objective} — {w.experience_level}</p>
                    <p className="text-[11px] text-muted-foreground">{formatDate(w.created_at)} • {w.days_per_week} dias/sem</p>
                  </div>
                </div>
                {expandedId === w.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>
              {expandedId === w.id && (
                <div className="px-4 pb-4 border-t border-border/50 pt-3 space-y-2">
                  {(w.plan_data as any[]).map((day: any, i: number) => (
                    <div key={i} className="p-3 rounded-lg bg-secondary/30">
                      <p className="text-xs font-semibold mb-1">{day.dia} — {day.grupo}</p>
                      <p className="text-[11px] text-muted-foreground">{day.exercicios?.length || 0} exercícios</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Diet History */}
      {tab === "diet" && (
        <div className="space-y-2">
          {diets.map((d) => {
            const totalCal = (d.plan_data as any[])?.reduce((acc: number, m: any) => acc + (m.itens?.reduce((a: number, i: any) => a + (i.cal || 0), 0) || 0), 0) || 0;
            return (
              <div key={d.id} className="glass-card overflow-hidden">
                <button onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-chart-3/10 flex items-center justify-center">
                      <UtensilsCrossed className="w-4 h-4 text-chart-3" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold capitalize">{d.objective} — {d.weight}kg</p>
                      <p className="text-[11px] text-muted-foreground">{formatDate(d.created_at)} • {totalCal} kcal/dia</p>
                    </div>
                  </div>
                  {expandedId === d.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>
                {expandedId === d.id && (
                  <div className="px-4 pb-4 border-t border-border/50 pt-3 space-y-2">
                    {(d.plan_data as any[]).map((meal: any, i: number) => (
                      <div key={i} className="p-3 rounded-lg bg-secondary/30">
                        <p className="text-xs font-semibold">{meal.refeicao} — {meal.horario}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{meal.itens?.length || 0} itens</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Goals History */}
      {tab === "goals" && (
        <div className="space-y-2">
          {goals.map((g) => {
            const progress = Math.min(100, Math.max(0, (g.current_value / g.target_value) * 100));
            const isDone = g.status === "completed";
            return (
              <div key={g.id} className="glass-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isDone ? "bg-primary/10" : "bg-chart-2/10"}`}>
                      <Target className={`w-4 h-4 ${isDone ? "text-primary" : "text-chart-2"}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{g.title}</p>
                      <p className="text-[11px] text-muted-foreground">{formatDate(g.created_at)}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${isDone ? "bg-primary/10 text-primary" : "bg-chart-2/10 text-chart-2"}`}>
                    {isDone ? "Concluída" : `${Math.round(progress)}%`}
                  </span>
                </div>
                <div className="progress-bar !h-1.5">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">{g.current_value} / {g.target_value} {g.unit || ""}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {currentData.length === 0 && (
        <div className="empty-state">
          <History className="w-10 h-10 text-primary mx-auto mb-3 opacity-60" />
          <h3 className="font-display font-semibold mb-1">Nenhum registro ainda</h3>
          <p className="text-muted-foreground text-sm">Comece a usar o app para ver seu histórico aqui.</p>
        </div>
      )}
    </div>
  );
};

export default Historico;
