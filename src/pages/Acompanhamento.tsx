import { useState } from "react";
import { Scale, Ruler, Plus, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type Record = { data: string; peso: number; cintura?: number; braco?: number; perna?: number };

const initialRecords: Record[] = [
  { data: "01/01", peso: 85.0, cintura: 92, braco: 34, perna: 58 },
  { data: "08/01", peso: 84.2, cintura: 91, braco: 34, perna: 58 },
  { data: "15/01", peso: 83.8, cintura: 90.5, braco: 34.5, perna: 57.5 },
  { data: "22/01", peso: 83.1, cintura: 89, braco: 35, perna: 57 },
  { data: "29/01", peso: 82.5, cintura: 88.5, braco: 35, perna: 57 },
  { data: "05/02", peso: 82.0, cintura: 87, braco: 35.5, perna: 56.5 },
  { data: "12/02", peso: 81.4, cintura: 86.5, braco: 35.5, perna: 56 },
  { data: "19/02", peso: 80.8, cintura: 86, braco: 36, perna: 56 },
];

const tooltipStyle = {
  background: 'hsl(220 18% 10%)',
  border: '1px solid hsl(220 14% 18%)',
  borderRadius: '8px',
  color: 'hsl(0 0% 95%)',
};

const Acompanhamento = () => {
  const [records, setRecords] = useState<Record[]>(initialRecords);
  const [showForm, setShowForm] = useState(false);
  const [newPeso, setNewPeso] = useState("");
  const [newCintura, setNewCintura] = useState("");
  const [newBraco, setNewBraco] = useState("");
  const [newPerna, setNewPerna] = useState("");

  const handleAdd = () => {
    if (!newPeso) return;
    const today = new Date();
    const data = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}`;
    setRecords([...records, {
      data,
      peso: Number(newPeso),
      cintura: newCintura ? Number(newCintura) : undefined,
      braco: newBraco ? Number(newBraco) : undefined,
      perna: newPerna ? Number(newPerna) : undefined,
    }]);
    setNewPeso(""); setNewCintura(""); setNewBraco(""); setNewPerna("");
    setShowForm(false);
  };

  const pesoInicial = records[0]?.peso || 0;
  const pesoAtual = records[records.length - 1]?.peso || 0;
  const diff = pesoAtual - pesoInicial;

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
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Peso (kg) *</label>
              <Input type="number" step="0.1" placeholder="80.0" value={newPeso} onChange={(e) => setNewPeso(e.target.value)} />
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
          <p className="stat-value">{pesoAtual} <span className="text-sm text-muted-foreground">kg</span></p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Variação</span>
          </div>
          <p className={`stat-value ${diff <= 0 ? 'text-primary' : 'text-destructive'}`}>
            {diff > 0 ? '+' : ''}{diff.toFixed(1)} <span className="text-sm text-muted-foreground">kg</span>
          </p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Ruler className="w-4 h-4 text-chart-2" />
            <span className="text-xs text-muted-foreground">Cintura</span>
          </div>
          <p className="stat-value">{records[records.length - 1]?.cintura || '—'} <span className="text-sm text-muted-foreground">cm</span></p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Ruler className="w-4 h-4 text-chart-4" />
            <span className="text-xs text-muted-foreground">Braço</span>
          </div>
          <p className="stat-value">{records[records.length - 1]?.braco || '—'} <span className="text-sm text-muted-foreground">cm</span></p>
        </div>
      </div>

      {/* Weight Chart */}
      <div className="glass-card p-6">
        <h3 className="font-display font-semibold mb-6">Evolução de Peso</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={records}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
            <XAxis dataKey="data" stroke="hsl(220 10% 55%)" fontSize={12} />
            <YAxis domain={['dataMin - 1', 'dataMax + 1']} stroke="hsl(220 10% 55%)" fontSize={12} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="peso" stroke="hsl(142 71% 45%)" strokeWidth={2} dot={{ fill: 'hsl(142 71% 45%)', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Measurements Chart */}
      <div className="glass-card p-6">
        <h3 className="font-display font-semibold mb-6">Evolução de Medidas</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={records.filter(r => r.cintura)}>
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

      {/* History Table */}
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
              </tr>
            </thead>
            <tbody>
              {[...records].reverse().map((r, i) => (
                <tr key={i} className="border-b border-border/50 last:border-0">
                  <td className="py-3">{r.data}</td>
                  <td className="py-3 text-right">{r.peso} kg</td>
                  <td className="py-3 text-right text-muted-foreground">{r.cintura ? `${r.cintura} cm` : '—'}</td>
                  <td className="py-3 text-right text-muted-foreground">{r.braco ? `${r.braco} cm` : '—'}</td>
                  <td className="py-3 text-right text-muted-foreground">{r.perna ? `${r.perna} cm` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Acompanhamento;
