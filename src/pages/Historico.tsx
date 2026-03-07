import { useState, useEffect, useCallback } from "react";
import { History, Dumbbell, UtensilsCrossed, Scale, Target, ChevronDown, ChevronUp, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";

type Tab = "body" | "workout" | "diet" | "goals";
const PAGE_SIZE = 10;

const tabs: { key: Tab; label: string; icon: typeof Scale }[] = [
  { key: "body", label: "Corpo", icon: Scale },
  { key: "workout", label: "Treinos", icon: Dumbbell },
  { key: "diet", label: "Dietas", icon: UtensilsCrossed },
  { key: "goals", label: "Metas", icon: Target },
];

const Historico = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("body");
  const [data, setData] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const tableMap: Record<Tab, string> = { body: "body_tracking", workout: "workout_plans", diet: "diet_plans", goals: "fitness_goals" };

  const fetchData = useCallback(async (currentTab: Tab, currentPage: number) => {
    if (!user) return;
    setLoading(true);
    try {
      const from = currentPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const tableName = tableMap[currentTab] as "body_tracking" | "workout_plans" | "diet_plans" | "fitness_goals";
      const { data: rows, error, count } = await supabase
        .from(tableName)
        .select("*", { count: "exact" })
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      setData(rows || []);
      setTotalCount(count || 0);
      setHasMore((count || 0) > (currentPage + 1) * PAGE_SIZE);
    } catch {
      toast.error("Erro ao carregar dados. Tente novamente.");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    setPage(0);
    setExpandedId(null);
    fetchData(tab, 0);
  }, [tab, user, fetchData]);

  useEffect(() => {
    fetchData(tab, page);
  }, [page]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-7 animate-slide-up">
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight">Histórico</h1>
        <p className="text-muted-foreground text-sm mt-1">Visualize todo seu histórico de atividades</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-secondary/50 w-fit overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-md transition-all whitespace-nowrap ${tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-2">
          {[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      )}

      {/* Body Records */}
      {!loading && tab === "body" && data.map((r) => (
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

      {/* Workout History */}
      {!loading && tab === "workout" && data.map((w) => (
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

      {/* Diet History */}
      {!loading && tab === "diet" && data.map((d) => {
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

      {/* Goals History */}
      {!loading && tab === "goals" && data.map((g) => {
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

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" /> Anterior
          </button>
          <span className="text-xs text-muted-foreground">{page + 1} de {totalPages}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={!hasMore}
            className="flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            Próxima <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && data.length === 0 && (
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
