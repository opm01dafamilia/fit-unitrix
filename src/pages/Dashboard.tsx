import { useEffect, useState } from "react";
import { TrendingUp, Flame, Dumbbell, Scale, Target } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const { user, profile } = useAuth();
  const [bodyRecords, setBodyRecords] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [workoutPlans, setWorkoutPlans] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [bodyRes, goalsRes, workoutRes] = await Promise.all([
        supabase.from("body_tracking").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
        supabase.from("fitness_goals").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("workout_plans").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
      ]);
      setBodyRecords(bodyRes.data || []);
      setGoals(goalsRes.data || []);
      setWorkoutPlans(workoutRes.data || []);
    };
    fetchData();
  }, [user]);

  const currentWeight = bodyRecords.length > 0 ? bodyRecords[bodyRecords.length - 1].weight : profile?.weight || 0;
  const firstWeight = bodyRecords.length > 0 ? bodyRecords[0].weight : profile?.weight || 0;
  const weightDiff = currentWeight - firstWeight;

  const activeGoals = goals.filter((g) => g.status === "active");
  const completedGoals = goals.filter((g) => g.status === "completed");
  const goalProgress = goals.length > 0
    ? Math.round((completedGoals.length / goals.length) * 100)
    : 0;

  const weightChartData = bodyRecords.length > 0
    ? bodyRecords.map((r, i) => ({
        semana: `S${i + 1}`,
        peso: Number(r.weight),
      }))
    : [{ semana: "Atual", peso: Number(profile?.weight || 0) }];

  const stats = [
    { label: "Peso Atual", value: currentWeight ? String(currentWeight) : "—", icon: Scale, suffix: "kg", color: "text-chart-2" },
    { label: "Treinos Salvos", value: String(workoutPlans.length), icon: Dumbbell, suffix: "", color: "text-primary" },
    { label: "Metas Ativas", value: String(activeGoals.length), icon: Target, suffix: "", color: "text-chart-4" },
    { label: "Meta Atingida", value: String(goalProgress), icon: Flame, suffix: "%", color: "text-chart-3" },
  ];

  return (
    <div className="space-y-8 animate-slide-up">
      <div>
        <h1 className="text-3xl font-display font-bold">
          Olá, {profile?.full_name?.split(" ")[0] || "Usuário"} 👋
        </h1>
        <p className="text-muted-foreground mt-1">Visão geral do seu progresso fitness</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="stat-value text-foreground">{stat.value}</span>
              <span className="text-sm text-muted-foreground">{stat.suffix}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Weight Chart */}
      {weightChartData.length > 1 && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-semibold">Evolução de Peso</h3>
              <p className="text-xs text-muted-foreground mt-1">{bodyRecords.length} registros</p>
            </div>
            {bodyRecords.length > 1 && (
              <div className={`flex items-center gap-1 text-sm ${weightDiff <= 0 ? "text-primary" : "text-destructive"}`}>
                <TrendingUp className="w-4 h-4" />
                <span>{weightDiff > 0 ? "+" : ""}{weightDiff.toFixed(1)}kg</span>
              </div>
            )}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={weightChartData}>
              <defs>
                <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142 71% 45%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
              <XAxis dataKey="semana" stroke="hsl(220 10% 55%)" fontSize={12} />
              <YAxis domain={['dataMin - 1', 'dataMax + 1']} stroke="hsl(220 10% 55%)" fontSize={12} />
              <Tooltip contentStyle={{ background: 'hsl(220 18% 10%)', border: '1px solid hsl(220 14% 18%)', borderRadius: '8px', color: 'hsl(0 0% 95%)' }} />
              <Area type="monotone" dataKey="peso" stroke="hsl(142 71% 45%)" fill="url(#weightGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="font-display font-semibold mb-4">Metas Ativas</h3>
          <div className="space-y-3">
            {activeGoals.slice(0, 4).map((goal) => {
              const progress = Math.min(100, (goal.current_value / goal.target_value) * 100);
              return (
                <div key={goal.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{goal.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {goal.current_value} / {goal.target_value} {goal.unit || ""}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-primary">{Math.round(progress)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {bodyRecords.length === 0 && goals.length === 0 && workoutPlans.length === 0 && (
        <div className="glass-card p-8 text-center">
          <Flame className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="font-display font-semibold text-lg mb-2">Comece sua jornada!</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Explore os módulos de Treino, Dieta, Acompanhamento e Metas para começar a registrar seu progresso.
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
