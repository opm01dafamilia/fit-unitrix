import { useState, useEffect } from "react";
import { Target, Plus, Trophy, TrendingUp, CheckCircle2, Trash2, Edit2, X, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingMetas, setLoadingMetas] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchMetas = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from("fitness_goals").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (error) throw error;
      setMetas(data || []);
    } catch {
      toast.error("Erro ao carregar metas");
    } finally {
      setLoadingMetas(false);
    }
  };

  useEffect(() => { fetchMetas(); }, [user]);

  const resetForm = () => {
    setTitulo(""); setTipo(""); setValorAtual(""); setValorMeta(""); setUnidade(""); setTargetDate("");
    setEditingId(null); setShowForm(false); setErrors({});
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!titulo.trim()) e.titulo = "Título obrigatório";
    if (titulo.trim().length > 100) e.titulo = "Máximo 100 caracteres";
    if (!valorAtual || Number(valorAtual) < 0) e.valorAtual = "Valor inválido";
    if (!valorMeta || Number(valorMeta) <= 0) e.valorMeta = "Meta deve ser > 0";
    if (Number(valorMeta) > 99999) e.valorMeta = "Valor muito alto";
    if (targetDate && new Date(targetDate) < new Date()) e.targetDate = "Data deve ser futura";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !user) return;
    setSaving(true);

    const progress = Math.min(100, Math.max(0, (Number(valorAtual) / Number(valorMeta)) * 100));
    const autoStatus = progress >= 100 ? "completed" : "active";

    const payload = {
      user_id: user.id,
      title: titulo.trim(),
      goal_type: tipo || "outro",
      current_value: Number(valorAtual),
      target_value: Number(valorMeta),
      unit: unidade || null,
      target_date: targetDate || null,
      status: autoStatus,
    };

    try {
      if (editingId) {
        const { error } = await supabase.from("fitness_goals").update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Meta atualizada!");
      } else {
        const { error } = await supabase.from("fitness_goals").insert(payload);
        if (error) throw error;
        toast.success("Meta criada!");
      }
      resetForm();
      fetchMetas();
    } catch {
      toast.error("Não foi possível salvar a meta. Tente novamente.");
    } finally {
      setSaving(false);
    }
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
    try {
      const { error } = await supabase.from("fitness_goals").delete().eq("id", id);
      if (error) throw error;
      toast.success("Meta excluída");
      fetchMetas();
    } catch {
      toast.error("Erro ao excluir meta");
    }
  };

  const handleToggleComplete = async (meta: any) => {
    try {
      const newStatus = meta.status === "completed" ? "active" : "completed";
      const updates: any = { status: newStatus };
      if (newStatus === "completed") updates.current_value = meta.target_value;
      const { error } = await supabase.from("fitness_goals").update(updates).eq("id", meta.id);
      if (error) throw error;
      fetchMetas();
    } catch {
      toast.error("Erro ao atualizar meta");
    }
  };

  const getProgress = (m: any) => {
    if (m.status === "completed") return 100;
    return Math.min(100, Math.max(0, (m.current_value / m.target_value) * 100));
  };

  const getStatus = (m: any) => {
    if (m.status === "completed") return { label: "Concluída", color: "text-primary", bg: "bg-primary/10" };
    if (m.target_date && new Date(m.target_date) < new Date()) return { label: "Atrasada", color: "text-destructive", bg: "bg-destructive/10" };
    return { label: "Em andamento", color: "text-chart-2", bg: "bg-chart-2/10" };
  };

  const concluidas = metas.filter(m => m.status === "completed").length;
  const emAndamento = metas.filter(m => m.status === "active").length;
  const atrasadas = metas.filter(m => m.status === "active" && m.target_date && new Date(m.target_date) < new Date()).length;

  const summaryCards = [
    { icon: Target, value: metas.length, label: "Total", color: "text-primary", bg: "from-primary/15 to-primary/5" },
    { icon: TrendingUp, value: emAndamento, label: "Em Andamento", color: "text-chart-2", bg: "from-chart-2/15 to-chart-2/5" },
    { icon: Trophy, value: concluidas, label: "Concluídas", color: "text-chart-3", bg: "from-chart-3/15 to-chart-3/5" },
    { icon: AlertTriangle, value: atrasadas, label: "Atrasadas", color: "text-destructive", bg: "from-destructive/15 to-destructive/5" },
  ];

  if (loadingMetas) {
    return (
      <div className="space-y-7 animate-slide-up">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        {[1,2].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-7 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight">Metas Fitness</h1>
          <p className="text-muted-foreground text-sm mt-1">Defina e acompanhe seus objetivos</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(!showForm); }} size="sm">
          <Plus className="w-4 h-4 mr-2" /> Nova Meta
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryCards.map((s) => (
          <div key={s.label} className="metric-card p-4 text-center">
            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${s.bg} flex items-center justify-center mx-auto mb-2`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[11px] text-muted-foreground font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="glass-card p-5 lg:p-6 glow-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-sm">{editingId ? "Editar Meta" : "Nova Meta"}</h3>
            <button onClick={resetForm} className="text-muted-foreground hover:text-foreground p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Título *</label>
              <Input placeholder="Ex: Perder 5kg" value={titulo} onChange={(e) => { setTitulo(e.target.value); setErrors(er => ({ ...er, titulo: "" })); }} className="bg-secondary/50 border-border/50" maxLength={100} />
              {errors.titulo && <p className="text-[11px] text-destructive mt-1">{errors.titulo}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Tipo</label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger className="bg-secondary/50 border-border/50"><SelectValue placeholder="Tipo" /></SelectTrigger>
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
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Valor Atual *</label>
              <Input type="number" placeholder="80" value={valorAtual} onChange={(e) => { setValorAtual(e.target.value); setErrors(er => ({ ...er, valorAtual: "" })); }} className="bg-secondary/50 border-border/50" />
              {errors.valorAtual && <p className="text-[11px] text-destructive mt-1">{errors.valorAtual}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Valor Meta *</label>
              <Input type="number" placeholder="75" value={valorMeta} onChange={(e) => { setValorMeta(e.target.value); setErrors(er => ({ ...er, valorMeta: "" })); }} className="bg-secondary/50 border-border/50" />
              {errors.valorMeta && <p className="text-[11px] text-destructive mt-1">{errors.valorMeta}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Unidade</label>
              <Input placeholder="kg" value={unidade} onChange={(e) => setUnidade(e.target.value)} className="bg-secondary/50 border-border/50" maxLength={20} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Data Alvo</label>
              <Input type="date" value={targetDate} onChange={(e) => { setTargetDate(e.target.value); setErrors(er => ({ ...er, targetDate: "" })); }} className="bg-secondary/50 border-border/50" />
              {errors.targetDate && <p className="text-[11px] text-destructive mt-1">{errors.targetDate}</p>}
            </div>
          </div>
          <Button onClick={handleSave} disabled={!titulo || !valorAtual || !valorMeta || saving} size="sm">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {saving ? "Salvando..." : editingId ? "Atualizar Meta" : "Criar Meta"}
          </Button>
        </div>
      )}

      {/* Goals List */}
      <div className="space-y-3">
        {metas.map((meta) => {
          const progress = getProgress(meta);
          const status = getStatus(meta);
          const isDone = meta.status === "completed";
          const remaining = meta.target_value - meta.current_value;
          return (
            <div key={meta.id} className={`glass-card p-4 lg:p-5 ${isDone ? 'glow-border' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <button onClick={() => handleToggleComplete(meta)} className="mt-0.5">
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/40" />
                    )}
                  </button>
                  <div>
                    <p className={`font-semibold text-sm ${isDone ? 'text-primary' : ''}`}>{meta.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>{status.label}</span>
                      {meta.target_date && (
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          até {new Date(meta.target_date).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => handleEdit(meta)} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-secondary/60 transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(meta.id)} className="text-muted-foreground hover:text-destructive p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1">
                  <div className="progress-bar !h-2">
                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                  </div>
                </div>
                <span className={`text-xs font-bold min-w-[40px] text-right ${isDone ? 'text-primary' : 'text-foreground'}`}>
                  {Math.round(progress)}%
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{meta.current_value} / {meta.target_value} {meta.unit || ""}</span>
                {!isDone && remaining > 0 && (
                  <span>Faltam {remaining.toFixed(1)} {meta.unit || ""}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {metas.length === 0 && !showForm && (
        <div className="empty-state">
          <Target className="w-10 h-10 text-primary mx-auto mb-3 opacity-60" />
          <h3 className="font-display font-semibold mb-1">Nenhuma meta definida</h3>
          <p className="text-muted-foreground text-sm">Crie sua primeira meta fitness para acompanhar seu progresso!</p>
        </div>
      )}
    </div>
  );
};

export default Metas;
