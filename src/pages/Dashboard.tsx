import { TrendingUp, Flame, Dumbbell, Scale, Target } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const weeklyData = [
  { day: "Seg", calorias: 2200, treinos: 1 },
  { day: "Ter", calorias: 1800, treinos: 1 },
  { day: "Qua", calorias: 2400, treinos: 0 },
  { day: "Qui", calorias: 2100, treinos: 1 },
  { day: "Sex", calorias: 1900, treinos: 1 },
  { day: "Sáb", calorias: 2600, treinos: 1 },
  { day: "Dom", calorias: 2000, treinos: 0 },
];

const weightData = [
  { semana: "S1", peso: 85 },
  { semana: "S2", peso: 84.2 },
  { semana: "S3", peso: 83.8 },
  { semana: "S4", peso: 83.1 },
  { semana: "S5", peso: 82.5 },
  { semana: "S6", peso: 82.0 },
  { semana: "S7", peso: 81.4 },
  { semana: "S8", peso: 80.8 },
];

const stats = [
  { label: "Calorias Hoje", value: "2,150", icon: Flame, suffix: "kcal", color: "text-chart-3" },
  { label: "Treinos Semana", value: "5", icon: Dumbbell, suffix: "/6", color: "text-primary" },
  { label: "Peso Atual", value: "80.8", icon: Scale, suffix: "kg", color: "text-chart-2" },
  { label: "Meta Atingida", value: "72", icon: Target, suffix: "%", color: "text-chart-4" },
];

const activities = [
  { name: "Treino de Peito e Tríceps", time: "Hoje, 07:30", duration: "52 min", cal: "420 kcal" },
  { name: "Corrida Leve", time: "Ontem, 18:00", duration: "30 min", cal: "280 kcal" },
  { name: "Treino de Costas e Bíceps", time: "Ontem, 07:30", duration: "48 min", cal: "390 kcal" },
  { name: "Treino de Pernas", time: "2 dias atrás", duration: "55 min", cal: "510 kcal" },
];

const Dashboard = () => {
  return (
    <div className="space-y-8 animate-slide-up">
      <div>
        <h1 className="text-3xl font-display font-bold">Dashboard</h1>
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

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weight Chart */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-semibold">Evolução de Peso</h3>
              <p className="text-xs text-muted-foreground mt-1">Últimas 8 semanas</p>
            </div>
            <div className="flex items-center gap-1 text-primary text-sm">
              <TrendingUp className="w-4 h-4" />
              <span>-4.2kg</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={weightData}>
              <defs>
                <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142 71% 45%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
              <XAxis dataKey="semana" stroke="hsl(220 10% 55%)" fontSize={12} />
              <YAxis domain={['dataMin - 1', 'dataMax + 1']} stroke="hsl(220 10% 55%)" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  background: 'hsl(220 18% 10%)', 
                  border: '1px solid hsl(220 14% 18%)',
                  borderRadius: '8px',
                  color: 'hsl(0 0% 95%)'
                }} 
              />
              <Area type="monotone" dataKey="peso" stroke="hsl(142 71% 45%)" fill="url(#weightGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Calories Chart */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-semibold">Calorias Semanais</h3>
              <p className="text-xs text-muted-foreground mt-1">Consumo diário</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
              <XAxis dataKey="day" stroke="hsl(220 10% 55%)" fontSize={12} />
              <YAxis stroke="hsl(220 10% 55%)" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  background: 'hsl(220 18% 10%)', 
                  border: '1px solid hsl(220 14% 18%)',
                  borderRadius: '8px',
                  color: 'hsl(0 0% 95%)'
                }} 
              />
              <Bar dataKey="calorias" fill="hsl(199 89% 48%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="glass-card p-6">
        <h3 className="font-display font-semibold mb-4">Atividades Recentes</h3>
        <div className="space-y-3">
          {activities.map((act, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Dumbbell className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{act.name}</p>
                  <p className="text-xs text-muted-foreground">{act.time}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{act.cal}</p>
                <p className="text-xs text-muted-foreground">{act.duration}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
