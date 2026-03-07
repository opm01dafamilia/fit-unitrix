import { useState, useEffect } from "react";
import { Scale, Ruler, Plus, TrendingDown, TrendingUp, Trash2, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";
import { Skeleton } from "@/components/ui/skeleton";

const tooltipStyle = {
  background: 'hsl(225 16% 9%)',
  border: '1px solid hsl(225 12% 16%)',
  borderRadius: '10px',
  color: 'hsl(210 20% 96%)',
  fontSize: '12px',
  padding: '8px 12px',
};

type ViewMode = "all" | "week" | "month";

const Acompanhamento = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [newPeso, setNewPeso] = useState("");
  const [newBodyFat, setNewBodyFat] = useState("");
  const [newCintura, setNewCintura] = useState("");
  const [newBraco, setNewBraco] = useState("");
  const [newPerna, setNewPerna] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchRecords = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from("body_tracking").select("*").eq("user_id", user.id).order("created_at", { ascending: true });
      if (error) throw error;
      setRecords(data || []);
    } catch {
      toast.error("Erro ao carregar registros");
    } finally {
      setLoadingRecords(false);
    }
  };

  useEffect(() => { fetchRecords(); }, [user]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!newPeso || Number(newPeso) <= 20 || Number(newPeso) > 300) e.peso = "Peso deve ser entre 20 e 300 kg";
    if (newBodyFat && (Number(newBodyFat) < 1 || Number(newBodyFat) > 60)) e.bodyFat = "% gordura entre 1-60";
    if (newCintura && (Number(newCintura) <= 0 || Number(newCintura) > 200)) e.cintura = "Medida inválida";
    if (newBraco && (Number(newBraco) <= 0 || Number(newBraco) > 100)) e.braco = "Medida inválida";
    if (newPerna && (Number(newPerna) <= 0 || Number(newPerna) > 150)) e.perna = "Medida inválida";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdd = async () => {
    if (!validate() || !user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("body_tracking").insert({
        user_id: user.id,
        weight: Number(newPeso),
        body_fat: newBodyFat ? Number(newBodyFat) : null,
        waist: newCintura ? Number(newCintura) : null,
        arm: newBraco ? Number(newBraco) : null,
        leg: newPerna ? Number(newPerna) : null,
      });
      if (error) throw error;
      toast.success("Registro salvo com sucesso!");
      setNewPeso(""); setNewBodyFat(""); setNewCintura(""); setNewBraco(""); setNewPerna("");
      setShowForm(false); setErrors({});
      fetchRecords();
    } catch {
      toast.error("Não foi possível salvar o registro. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("body_tracking").delete().eq("id", id);
      if (error) throw error;
      toast.success("Registro excluído");
      fetchRecords();
    } catch {
      toast.error("Erro ao excluir registro");
    }
  };

  const filteredRecords = records.filter((r) => {
    if (viewMode === "all") return true;
    const d = new Date(r.created_at);
    const now = new Date();
    if (viewMode === "week") return d >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (viewMode === "month") return d >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return true;
  });

  const chartData = filteredRecords.map((r) => ({
    data: new Date(r.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    peso: Number(r.weight),
    gordura: r.body_fat ? Number(r.body_fat) : undefined,
    cintura: r.waist ? Number(r.waist) : undefined,
    braco: r.arm ? Number(r.arm) : undefined,
    perna: r.leg ? Number(r.leg) : undefined,
  }));

  const pesoInicial = records.length > 0 ? Number(records[0].weight) : 0;
  const pesoAtual = records.length > 0 ? Number(records[records.length - 1].weight) : 0;
  const diff = pesoAtual - pesoInicial;
  const lastRecord = records[records.length - 1];
  const prevRecord = records.length > 1 ? records[records.length - 2] : null;
  const recentChange = prevRecord ? pesoAtual - Number(prevRecord.weight) : 0;

  const statCards = [
    { label: "Peso Atual", value: pesoAtual || "—", unit: "kg", icon: Scale, color: "text-primary", bg: "from-primary/15 to-primary/5", change: recentChange !== 0 ? `${recentChange > 0 ? '+' : ''}${recentChange.toFixed(1)}kg` : null, changeColor: recentChange <= 0 ? "text-primary" : "text-destructive" },
    { label: "Variação Total", value: records.length > 1 ? `${diff > 0 ? '+' : ''}${diff.toFixed(1)}` : '—', unit: "kg", icon: diff <= 0 ? TrendingDown : TrendingUp, color: diff <= 0 ? "text-primary" : "text-destructive", bg: diff <= 0 ? "from-primary/15 to-primary/5" : "from-destructive/15 to-destructive/5", change: null, changeColor: "" },
    { label: "% Gordura", value: lastRecord?.body_fat || '—', unit: lastRecord?.body_fat ? "%" : "", icon: Scale, color: "text-chart-3", bg: "from-chart-3/15 to-chart-3/5", change: null, changeColor: "" },
    { label: "Registros", value: String(records.length), unit: "", icon: Calendar, color: "text-chart-2", bg: "from-chart-2/15 to-chart-2/5", change: null, changeColor: "" },
  ];

  if (loadingRecords) {
    return (
      <div className="space-y-7 animate-slide-up">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-7 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight">Acompanhamento Físico</h1>
          <p className="text-muted-foreground text-sm mt-1">Registre e acompanhe sua evolução corporal</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="w-4 h-4 mr-2" /> Novo Registro
        </Button>
      </div>

      {showForm && (
        <div className="glass-card p-5 lg:p-6 glow-border">
          <h3 className="font-display font-semibold text-sm mb-4 text-muted-foreground uppercase tracking-wider">Adicionar Registro</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Peso (kg) *</label>
              <Input type="number" step="0.1" placeholder="80.0" value={newPeso} onChange={(e) => { setNewPeso(e.target.value); setErrors(er => ({ ...er, peso: "" })); }} className="bg-secondary/50 border-border/50" />
              {errors.peso && <p className="text-[11px] text-destructive mt-1">{errors.peso}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">% Gordura</label>
              <Input type="number" step="0.1" placeholder="15" value={newBodyFat} onChange={(e) => { setNewBodyFat(e.target.value); setErrors(er => ({ ...er, bodyFat: "" })); }} className="bg-secondary/50 border-border/50" />
              {errors.bodyFat && <p className="text-[11px] text-destructive mt-1">{errors.bodyFat}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Cintura (cm)</label>
              <Input type="number" step="0.5" placeholder="86" value={newCintura} onChange={(e) => { setNewCintura(e.target.value); setErrors(er => ({ ...er, cintura: "" })); }} className="bg-secondary/50 border-border/50" />
              {errors.cintura && <p className="text-[11px] text-destructive mt-1">{errors.cintura}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Braço (cm)</label>
              <Input type="number" step="0.5" placeholder="36" value={newBraco} onChange={(e) => { setNewBraco(e.target.value); setErrors(er => ({ ...er, braco: "" })); }} className="bg-secondary/50 border-border/50" />
              {errors.braco && <p className="text-[11px] text-destructive mt-1">{errors.braco}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Perna (cm)</label>
              <Input type="number" step="0.5" placeholder="56" value={newPerna} onChange={(e) => { setNewPerna(e.target.value); setErrors(er => ({ ...er, perna: "" })); }} className="bg-secondary/50 border-border/50" />
              {errors.perna && <p className="text-[11px] text-destructive mt-1">{errors.perna}</p>}
            </div>
          </div>
          <Button onClick={handleAdd} disabled={!newPeso || saving} size="sm">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {saving ? "Salvando..." : "Salvar Registro"}
          </Button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((stat) => (
          <div key={stat.label} className="metric-card p-4">
            <div className="flex items-center justify-between mb-2.5">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              {stat.change && <span className={`text-[11px] font-medium ${stat.changeColor}`}>{stat.change}</span>}
            </div>
            <p className="text-xl lg:text-2xl font-display font-bold">{stat.value} <span className="text-xs text-muted-foreground font-medium">{stat.unit}</span></p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* View Mode Tabs */}
      {records.length > 0 && (
        <div className="flex gap-1 p-1 rounded-lg bg-secondary/50 w-fit">
          {([["all", "Tudo"], ["week", "Semana"], ["month", "Mês"]] as [ViewMode, string][]).map(([key, label]) => (
            <button key={key} onClick={() => setViewMode(key)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Weight Chart */}
      {chartData.length > 1 && (
        <div className="glass-card p-5 lg:p-6">
          <h3 className="font-display font-semibold text-base mb-5">Evolução de Peso</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="weightAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(152 69% 46%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(152 69% 46%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 12% 14%)" vertical={false} />
              <XAxis dataKey="data" stroke="hsl(220 10% 40%)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis domain={['dataMin - 1', 'dataMax + 1']} stroke="hsl(220 10% 40%)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="peso" stroke="hsl(152 69% 46%)" fill="url(#weightAreaGrad)" strokeWidth={2.5} dot={{ fill: 'hsl(152 69% 46%)', r: 3, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Measurements Chart */}
      {chartData.filter(r => r.cintura).length > 1 && (
        <div className="glass-card p-5 lg:p-6">
          <h3 className="font-display font-semibold text-base mb-5">Evolução de Medidas</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData.filter(r => r.cintura)}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 12% 14%)" vertical={false} />
              <XAxis dataKey="data" stroke="hsl(220 10% 40%)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(220 10% 40%)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="cintura" name="Cintura" stroke="hsl(199 89% 48%)" strokeWidth={2} dot={{ r: 3, strokeWidth: 0 }} />
              <Line type="monotone" dataKey="braco" name="Braço" stroke="hsl(280 65% 60%)" strokeWidth={2} dot={{ r: 3, strokeWidth: 0 }} />
              <Line type="monotone" dataKey="perna" name="Perna" stroke="hsl(45 93% 47%)" strokeWidth={2} dot={{ r: 3, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Body Fat Chart */}
      {chartData.filter(r => r.gordura).length > 1 && (
        <div className="glass-card p-5 lg:p-6">
          <h3 className="font-display font-semibold text-base mb-5">% Gordura Corporal</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData.filter(r => r.gordura)}>
              <defs>
                <linearGradient id="fatGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(45 93% 47%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(45 93% 47%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 12% 14%)" vertical={false} />
              <XAxis dataKey="data" stroke="hsl(220 10% 40%)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(220 10% 40%)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="gordura" name="% Gordura" stroke="hsl(45 93% 47%)" fill="url(#fatGrad)" strokeWidth={2} dot={{ r: 3, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* History Table */}
      {filteredRecords.length > 0 && (
        <div className="glass-card p-5 lg:p-6">
          <h3 className="font-display font-semibold text-base mb-4">Histórico</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-muted-foreground border-b border-border/50">
                  <th className="text-left pb-3 font-medium">Data</th>
                  <th className="text-right pb-3 font-medium">Peso</th>
                  <th className="text-right pb-3 font-medium">% Gord.</th>
                  <th className="text-right pb-3 font-medium">Cintura</th>
                  <th className="text-right pb-3 font-medium">Braço</th>
                  <th className="text-right pb-3 font-medium">Perna</th>
                  <th className="text-right pb-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {[...filteredRecords].reverse().map((r) => (
                  <tr key={r.id} className="border-b border-border/30 last:border-0">
                    <td className="py-2.5 text-[13px]">{new Date(r.created_at).toLocaleDateString("pt-BR")}</td>
                    <td className="py-2.5 text-right text-[13px] font-medium">{r.weight} kg</td>
                    <td className="py-2.5 text-right text-[13px] text-muted-foreground">{r.body_fat ? `${r.body_fat}%` : '—'}</td>
                    <td className="py-2.5 text-right text-[13px] text-muted-foreground">{r.waist ? `${r.waist} cm` : '—'}</td>
                    <td className="py-2.5 text-right text-[13px] text-muted-foreground">{r.arm ? `${r.arm} cm` : '—'}</td>
                    <td className="py-2.5 text-right text-[13px] text-muted-foreground">{r.leg ? `${r.leg} cm` : '—'}</td>
                    <td className="py-2.5 text-right">
                      <button onClick={() => handleDelete(r.id)} className="text-muted-foreground hover:text-destructive p-1 rounded hover:bg-destructive/10 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {records.length === 0 && !showForm && (
        <div className="empty-state">
          <Scale className="w-10 h-10 text-primary mx-auto mb-3 opacity-60" />
          <h3 className="font-display font-semibold mb-1">Nenhum registro ainda</h3>
          <p className="text-muted-foreground text-sm">Adicione seu primeiro registro corporal para acompanhar sua evolução.</p>
        </div>
      )}
    </div>
  );
};

export default Acompanhamento;
