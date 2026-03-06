import { useState, useEffect } from "react";
import { Target, Plus, Trophy, TrendingUp, CheckCircle2, Trash2, Edit2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";

const Metas = () => {
  const { user } = useAuth();
  const [metas, setMetas] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState("");
  const [valorAtual, setValorAtual] = useState("");
  const [valorMeta, setValorMeta] = useState("");
  const [unidade, setUnidade] = useState("");
  const [targetDate, setTargetDate] = useState("");

  const fetchMetas = async () => {
    if (!user) return;
    const { data } = await supabase.from("fitness_goals").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setMetas(data || []);
  };

  useEffect(() => { fetchMetas(); }, [user]);

  const resetForm = () => {
    setTitulo(""); setTipo(""); setValorAtual(""); setValorMeta(""); setUnidade(""); setTargetDate("");
    setEditingId(null); setShowForm(false);
  };

  const handleSave = async () => {
    if (!titulo || !valorAtual || !valorMeta || !user) return;
    const payload = {
      user_id: user.id,
      title: titulo,
      goal_type: tipo || "outro",
      current_value: Number(valorAtual),
      target_value: Number(valorMeta),
      unit: unidade || null,
      target_date: targetDate || null,
      status: "active" as string,
    };

    if (editingId) {
      const { error } = await supabase.from("fitness_goals").update(payload).eq("id", editingId);
      if (error) toast.error("Erro ao atualizar");
      else toast.success("Meta atualizada!");
    } else {
      const { error } = await supabase.from("fitness_goals").insert(payload);
      if (error) toast.error("Erro ao criar meta");
      else toast.success("Meta criada!");
    }
    resetForm();
    fetchMetas();
  };

  const handleEdit = (meta: any) => {
    setEditingId(meta.id);
    setTitulo(meta.title);
    setTipo(meta.goal_type || "");
    setValorAtual(String(meta.current_value));
    setValorMeta(String(meta.target_value));
    setUnidade(meta.unit || "");
    setTargetDate(meta.target_date || "");
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("fitness_goals").delete().eq("id", id);
    toast.success("Meta excluída");
    fetchMetas();
  };

  const handleToggleComplete = async (meta: any) => {
    const newStatus = meta.status === "completed" ? "active" : "completed";
    await supabase.from("fitness_goals").update({ status: newStatus }).eq("id", meta.id);
    fetchMetas();
  };

  const getProgress = (m: any) => {
    if (m.status === "completed") return 100;
    return Math.min(100, Math.max(0, (m.current_value / m.target_value) * 100));
  };

  const concluidas = metas.filter(m => m.status === "completed").length;
  const emAndamento = metas.filter(m => m.status === "active").length;

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Metas Fitness</h1>
          <p className="text-muted-foreground mt-1">Defina e acompanhe seus objetivos</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(!showForm); }}>
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

      {/* Add/Edit Form */}
      {showForm && (
        <div className="glass-card p-6 glow-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold">{editingId ? "Editar Meta" : "Nova Meta"}</h3>
            <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
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
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Data Alvo</label>
              <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleSave} disabled={!titulo || !valorAtual || !valorMeta}>
            {editingId ? "Atualizar Meta" : "Criar Meta"}
          </Button>
        </div>
      )}

      {/* Goals List */}
      <div className="space-y-4">
        {metas.map((meta) => {
          const progress = getProgress(meta);
          const isDone = meta.status === "completed";
          return (
            <div key={meta.id} className={`glass-card p-5 ${isDone ? 'glow-border' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <button onClick={() => handleToggleComplete(meta)}>
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    ) : (
                      <Target className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                  <div>
                    <p className={`font-semibold ${isDone ? 'text-primary' : ''}`}>{meta.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {meta.goal_type}
                      {meta.target_date && ` • até ${new Date(meta.target_date).toLocaleDateString("pt-BR")}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right mr-2">
                    <p className="text-sm font-medium">
                      {meta.current_value} <span className="text-muted-foreground">/ {meta.target_value} {meta.unit || ""}</span>
                    </p>
                    <p className={`text-xs font-medium ${isDone ? 'text-primary' : 'text-muted-foreground'}`}>
                      {Math.round(progress)}%
                    </p>
                  </div>
                  <button onClick={() => handleEdit(meta)} className="text-muted-foreground hover:text-foreground p-1">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(meta.id)} className="text-muted-foreground hover:text-destructive p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {metas.length === 0 && !showForm && (
        <div className="glass-card p-8 text-center">
          <Target className="w-10 h-10 text-primary mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Nenhuma meta definida. Crie sua primeira meta fitness!</p>
        </div>
      )}
    </div>
  );
};

export default Metas;
