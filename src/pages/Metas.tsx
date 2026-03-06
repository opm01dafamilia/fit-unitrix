import { useState } from "react";
import { Target, Plus, Trophy, TrendingUp, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Meta = {
  id: number;
  titulo: string;
  tipo: string;
  valorAtual: number;
  valorMeta: number;
  unidade: string;
  concluida: boolean;
};

const initialMetas: Meta[] = [
  { id: 1, titulo: "Perder 10kg", tipo: "peso", valorAtual: 80.8, valorMeta: 75, unidade: "kg", concluida: false },
  { id: 2, titulo: "Treinar 5x/semana", tipo: "treino", valorAtual: 5, valorMeta: 5, unidade: "dias", concluida: true },
  { id: 3, titulo: "Correr 5km", tipo: "condicionamento", valorAtual: 3.5, valorMeta: 5, unidade: "km", concluida: false },
  { id: 4, titulo: "Supino 100kg", tipo: "forca", valorAtual: 85, valorMeta: 100, unidade: "kg", concluida: false },
  { id: 5, titulo: "Reduzir cintura para 82cm", tipo: "medida", valorAtual: 86, valorMeta: 82, unidade: "cm", concluida: false },
];

const Metas = () => {
  const [metas, setMetas] = useState<Meta[]>(initialMetas);
  const [showForm, setShowForm] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState("");
  const [valorAtual, setValorAtual] = useState("");
  const [valorMeta, setValorMeta] = useState("");
  const [unidade, setUnidade] = useState("");

  const handleAdd = () => {
    if (!titulo || !valorAtual || !valorMeta) return;
    setMetas([...metas, {
      id: Date.now(),
      titulo,
      tipo: tipo || "outro",
      valorAtual: Number(valorAtual),
      valorMeta: Number(valorMeta),
      unidade: unidade || "",
      concluida: false,
    }]);
    setTitulo(""); setTipo(""); setValorAtual(""); setValorMeta(""); setUnidade("");
    setShowForm(false);
  };

  const getProgress = (m: Meta) => {
    if (m.concluida) return 100;
    // For weight loss type goals where lower is better
    if (m.tipo === "peso" || m.tipo === "medida") {
      const total = m.valorAtual > m.valorMeta 
        ? ((initialMetas.find(im => im.id === m.id)?.valorAtual || m.valorAtual) - m.valorMeta) 
        : (m.valorMeta - (initialMetas.find(im => im.id === m.id)?.valorAtual || m.valorAtual));
      const current = m.valorAtual > m.valorMeta 
        ? ((initialMetas.find(im => im.id === m.id)?.valorAtual || m.valorAtual) - m.valorAtual)
        : (m.valorAtual - (initialMetas.find(im => im.id === m.id)?.valorAtual || m.valorAtual));
      return Math.min(100, Math.max(0, (current / total) * 100));
    }
    return Math.min(100, (m.valorAtual / m.valorMeta) * 100);
  };

  const concluidas = metas.filter(m => m.concluida || getProgress(m) >= 100).length;
  const emAndamento = metas.length - concluidas;

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Metas Fitness</h1>
          <p className="text-muted-foreground mt-1">Defina e acompanhe seus objetivos</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" /> Nova Meta
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-5 text-center">
          <Target className="w-5 h-5 text-primary mx-auto mb-2" />
          <p className="stat-value">{metas.length}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div className="glass-card p-5 text-center">
          <TrendingUp className="w-5 h-5 text-chart-2 mx-auto mb-2" />
          <p className="stat-value text-chart-2">{emAndamento}</p>
          <p className="text-xs text-muted-foreground">Em Andamento</p>
        </div>
        <div className="glass-card p-5 text-center">
          <Trophy className="w-5 h-5 text-chart-3 mx-auto mb-2" />
          <p className="stat-value text-chart-3">{concluidas}</p>
          <p className="text-xs text-muted-foreground">Concluídas</p>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="glass-card p-6 glow-border">
          <h3 className="font-display font-semibold mb-4">Nova Meta</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="text-sm text-muted-foreground mb-2 block">Título</label>
              <Input placeholder="Ex: Perder 5kg" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Tipo</label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="peso">Peso</SelectItem>
                  <SelectItem value="forca">Força</SelectItem>
                  <SelectItem value="condicionamento">Condicionamento</SelectItem>
                  <SelectItem value="medida">Medida</SelectItem>
                  <SelectItem value="treino">Treino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Valor Atual</label>
              <Input type="number" placeholder="80" value={valorAtual} onChange={(e) => setValorAtual(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Valor Meta</label>
              <Input type="number" placeholder="75" value={valorMeta} onChange={(e) => setValorMeta(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Unidade</label>
              <Input placeholder="kg" value={unidade} onChange={(e) => setUnidade(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleAdd} disabled={!titulo || !valorAtual || !valorMeta}>Criar Meta</Button>
        </div>
      )}

      {/* Goals List */}
      <div className="space-y-4">
        {metas.map((meta) => {
          const progress = getProgress(meta);
          const isDone = meta.concluida || progress >= 100;
          return (
            <div key={meta.id} className={`glass-card p-5 ${isDone ? 'glow-border' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  ) : (
                    <Target className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className={`font-semibold ${isDone ? 'text-primary' : ''}`}>{meta.titulo}</p>
                    <p className="text-xs text-muted-foreground capitalize">{meta.tipo}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {meta.valorAtual} <span className="text-muted-foreground">/ {meta.valorMeta} {meta.unidade}</span>
                  </p>
                  <p className={`text-xs font-medium ${isDone ? 'text-primary' : 'text-muted-foreground'}`}>
                    {Math.round(progress)}%
                  </p>
                </div>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Metas;
