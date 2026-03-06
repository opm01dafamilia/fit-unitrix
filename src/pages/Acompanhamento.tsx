import { useState, useEffect } from "react";
import { Scale, Ruler, Plus, TrendingDown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";

const tooltipStyle = {
  background: 'hsl(220 18% 10%)',
  border: '1px solid hsl(220 14% 18%)',
  borderRadius: '8px',
  color: 'hsl(0 0% 95%)',
};

const Acompanhamento = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newPeso, setNewPeso] = useState("");
  const [newBodyFat, setNewBodyFat] = useState("");
  const [newCintura, setNewCintura] = useState("");
  const [newBraco, setNewBraco] = useState("");
  const [newPerna, setNewPerna] = useState("");

  const fetchRecords = async () => {
    if (!user) return;
    const { data } = await supabase.from("body_tracking").select("*").eq("user_id", user.id).order("created_at", { ascending: true });
    setRecords(data || []);
  };

  useEffect(() => { fetchRecords(); }, [user]);

  const handleAdd = async () => {
    if (!newPeso || !user) return;
    const { error } = await supabase.from("body_tracking").insert({
      user_id: user.id,
      weight: Number(newPeso),
      body_fat: newBodyFat ? Number(newBodyFat) : null,
      waist: newCintura ? Number(newCintura) : null,
      arm: newBraco ? Number(newBraco) : null,
      leg: newPerna ? Number(newPerna) : null,
    });
    if (error) toast.error("Erro ao salvar");
    else {
      toast.success("Registro salvo!");
      setNewPeso(""); setNewBodyFat(""); setNewCintura(""); setNewBraco(""); setNewPerna("");
      setShowForm(false);
      fetchRecords();
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("body_tracking").delete().eq("id", id);
    toast.success("Registro excluído");
    fetchRecords();
  };

  const chartData = records.map((r, i) => ({
    data: new Date(r.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    peso: Number(r.weight),
    cintura: r.waist ? Number(r.waist) : undefined,
    braco: r.arm ? Number(r.arm) : undefined,
    perna: r.leg ? Number(r.leg) : undefined,
  }));

  const pesoInicial = records.length > 0 ? Number(records[0].weight) : 0;
  const pesoAtual = records.length > 0 ? Number(records[records.length - 1].weight) : 0;
  const diff = pesoAtual - pesoInicial;
  const lastRecord = records[records.length - 1];

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Acompanhamento Físico</h1>
          <p className="text-muted-foreground mt-1">Registre e acompanhe sua evolução</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" /> Novo Registro
        </Button>
      </div>

      {showForm && (
        <div className="glass-card p-6 glow-border">
          <h3 className="font-display font-semibold mb-4">Adicionar Registro</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Peso (kg) *</label>
              <Input type="number" step="0.1" placeholder="80.0" value={newPeso} onChange={(e) => setNewPeso(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">% Gordura</label>
              <Input type="number" step="0.1" placeholder="15" value={newBodyFat} onChange={(e) => setNewBodyFat(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Cintura (cm)</label>
              <Input type="number" step="0.5" placeholder="86" value={newCintura} onChange={(e) => setNewCintura(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Braço (cm)</label>
              <Input type="number" step="0.5" placeholder="36" value={newBraco} onChange={(e) => setNewBraco(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Perna (cm)</label>
              <Input type="number" step="0.5" placeholder="56" value={newPerna} onChange={(e) => setNewPerna(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleAdd} disabled={!newPeso}>Salvar Registro</Button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Scale className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Peso Atual</span>
          </div>
          <p className="stat-value">{pesoAtual || "—"} <span className="text-sm text-muted-foreground">kg</span></p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Variação</span>
          </div>
          <p className={`stat-value ${diff <= 0 ? 'text-primary' : 'text-destructive'}`}>
            {records.length > 1 ? `${diff > 0 ? '+' : ''}${diff.toFixed(1)}` : '—'} <span className="text-sm text-muted-foreground">kg</span>
          </p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Ruler className="w-4 h-4 text-chart-2" />
            <span className="text-xs text-muted-foreground">Cintura</span>
          </div>
          <p className="stat-value">{lastRecord?.waist || '—'} <span className="text-sm text-muted-foreground">cm</span></p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Ruler className="w-4 h-4 text-chart-4" />
            <span className="text-xs text-muted-foreground">Braço</span>
          </div>
          <p className="stat-value">{lastRecord?.arm || '—'} <span className="text-sm text-muted-foreground">cm</span></p>
        </div>
      </div>

      {/* Weight Chart */}
      {chartData.length > 1 && (
        <div className="glass-card p-6">
          <h3 className="font-display font-semibold mb-6">Evolução de Peso</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
              <XAxis dataKey="data" stroke="hsl(220 10% 55%)" fontSize={12} />
              <YAxis domain={['dataMin - 1', 'dataMax + 1']} stroke="hsl(220 10% 55%)" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="peso" stroke="hsl(142 71% 45%)" strokeWidth={2} dot={{ fill: 'hsl(142 71% 45%)', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Measurements Chart */}
      {chartData.filter(r => r.cintura).length > 1 && (
        <div className="glass-card p-6">
          <h3 className="font-display font-semibold mb-6">Evolução de Medidas</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData.filter(r => r.cintura)}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
              <XAxis dataKey="data" stroke="hsl(220 10% 55%)" fontSize={12} />
              <YAxis stroke="hsl(220 10% 55%)" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="cintura" name="Cintura" stroke="hsl(199 89% 48%)" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="braco" name="Braço" stroke="hsl(280 65% 60%)" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="perna" name="Perna" stroke="hsl(45 93% 47%)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* History Table */}
      {records.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="font-display font-semibold mb-4">Histórico</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-border">
                  <th className="text-left pb-3 font-medium">Data</th>
                  <th className="text-right pb-3 font-medium">Peso</th>
                  <th className="text-right pb-3 font-medium">Cintura</th>
                  <th className="text-right pb-3 font-medium">Braço</th>
                  <th className="text-right pb-3 font-medium">Perna</th>
                  <th className="text-right pb-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {[...records].reverse().map((r) => (
                  <tr key={r.id} className="border-b border-border/50 last:border-0">
                    <td className="py-3">{new Date(r.created_at).toLocaleDateString("pt-BR")}</td>
                    <td className="py-3 text-right">{r.weight} kg</td>
                    <td className="py-3 text-right text-muted-foreground">{r.waist ? `${r.waist} cm` : '—'}</td>
                    <td className="py-3 text-right text-muted-foreground">{r.arm ? `${r.arm} cm` : '—'}</td>
                    <td className="py-3 text-right text-muted-foreground">{r.leg ? `${r.leg} cm` : '—'}</td>
                    <td className="py-3 text-right">
                      <button onClick={() => handleDelete(r.id)} className="text-muted-foreground hover:text-destructive">
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
        <div className="glass-card p-8 text-center">
          <Scale className="w-10 h-10 text-primary mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Nenhum registro ainda. Adicione seu primeiro registro corporal!</p>
        </div>
      )}
    </div>
  );
};

export default Acompanhamento;
