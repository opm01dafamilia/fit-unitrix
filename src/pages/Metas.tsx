import { useState, useEffect } from "react";
import { Target, Plus, Trophy, TrendingUp, CheckCircle2, Trash2, Edit2, X, Clock, AlertTriangle, Loader2, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { addWeeks, addMonths, format } from "date-fns";

const prazoOptions = [
  { value: "1s", label: "1 semana" },
  { value: "1m", label: "1 mês" },
  { value: "3m", label: "3 meses" },
  { value: "6m", label: "6 meses" },
  { value: "custom", label: "Personalizado" },
];

function prazoToDate(prazo: string): string {
  const now = new Date();
  switch (prazo) {
    case "1s": return format(addWeeks(now, 1), "yyyy-MM-dd");
    case "1m": return format(addMonths(now, 1), "yyyy-MM-dd");
    case "3m": return format(addMonths(now, 3), "yyyy-MM-dd");
    case "6m": return format(addMonths(now, 6), "yyyy-MM-dd");
    default: return "";
  }
}

function prazoLabel(prazo: string): string {
  return prazoOptions.find(p => p.value === prazo)?.label || prazo;
}

const Metas = () => {
  const { user, profile } = useAuth();
  const [metas, setMetas] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [valorAtual, setValorAtual] = useState("");
  const [valorMeta, setValorMeta] = useState("");
  const [unidade, setUnidade] = useState("kg");
  const [prazo, setPrazo] = useState("");
  const [customDate, setCustomDate] = useState("");
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

  // Pre-fill peso atual from profile
  useEffect(() => {
    if (profile?.weight && !valorAtual && !editingId) {
      setValorAtual(String(profile.weight));
    }
  }, [profile, showForm]);

  const resetForm = () => {
    setTitulo(""); setObjetivo(""); setValorAtual(profile?.weight ? String(profile.weight) : ""); setValorMeta(""); setUnidade("kg"); setPrazo(""); setCustomDate("");
    setEditingId(null); setShowForm(false); setShowConfirm(false); setErrors({});
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!titulo.trim()) e.titulo = "Título obrigatório";
    if (titulo.trim().length > 100) e.titulo = "Máximo 100 caracteres";
    if (!objetivo) e.objetivo = "Selecione um objetivo";
    if (!valorAtual || Number(valorAtual) <= 0) e.valorAtual = "Peso atual inválido";
    if (!valorMeta || Number(valorMeta) <= 0) e.valorMeta = "Peso meta inválido";
    if (!prazo) e.prazo = "Selecione um prazo";
    if (prazo === "custom" && !customDate) e.customDate = "Informe a data";
    if (prazo === "custom" && customDate && new Date(customDate) <= new Date()) e.customDate = "Data deve ser futura";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const getTargetDate = (): string | null => {
    if (prazo === "custom") return customDate || null;
    if (prazo) return prazoToDate(prazo);
    return null;
  };

  const handleNext = () => {
    if (!validate()) return;
    setShowConfirm(true);
  };

  const getSummaryText = () => {
    const atual = Number(valorAtual);
    const meta = Number(valorMeta);
    const diff = meta - atual;
    const direction = diff > 0 ? "ganhar" : "perder";
    const prazoText = prazo === "custom" && customDate
      ? `até ${new Date(customDate).toLocaleDateString("pt-BR")}`
      : prazoLabel(prazo);
    return `Você quer ir de ${atual}${unidade} para ${meta}${unidade} (${direction} ${Math.abs(diff).toFixed(1)}${unidade}) em ${prazoText}.`;
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const targetDate = getTargetDate();
    const progress = Math.min(100, Math.max(0, (Number(valorAtual) / Number(valorMeta)) * 100));
    const autoStatus = progress >= 100 ? "completed" : "active";

    const payload = {
      user_id: user.id,
      title: titulo.trim(),
      goal_type: objetivo || "outro",
      current_value: Number(valorAtual),
      target_value: Number(valorMeta),
      unit: unidade || null,
      target_date: targetDate,
      status: autoStatus,
    };

    try {
      if (editingId) {
        const { error } = await supabase.from("fitness_goals").update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Meta atualizada com sucesso!");
      } else {
        const { error } = await supabase.from("fitness_goals").insert(payload);
        if (error) throw error;
        toast.success("Meta criada com sucesso! 🎯");
      }
      resetForm();
      fetchMetas();
    } catch {
      toast.error("Não foi possível salvar a meta.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (meta: any) => {
    setEditingId(meta.id);
    setTitulo(meta.title);
    setObjetivo(meta.goal_type || "");
    setValorAtual(String(meta.current_value));
    setValorMeta(String(meta.target_value));
    setUnidade(meta.unit || "kg");
    setPrazo("custom");
    setCustomDate(meta.target_date || "");
    setShowForm(true);
    setShowConfirm(false);
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
        <Button onClick={() => { resetForm(); setShowForm(true); }} size="sm">
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

      {/* Creation / Edit Form */}
      {showForm && !showConfirm && (
        <div className="glass-card p-6 lg:p-8 glow-border max-w-2xl mx-auto animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display font-bold text-lg">{editingId ? "Editar Meta" : "Nova Meta"}</h3>
            </div>
            <button onClick={resetForm} className="text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-secondary/60 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-5">
            {/* Título */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">Título da Meta *</label>
              <Input
                placeholder="Ex: Ganhar 5kg de massa muscular"
                value={titulo}
                onChange={(e) => { setTitulo(e.target.value); setErrors(er => ({ ...er, titulo: "" })); }}
                className="bg-secondary/50 border-border/50 h-12 text-base"
                maxLength={100}
              />
              {errors.titulo && <p className="text-[11px] text-destructive mt-1">{errors.titulo}</p>}
            </div>

            {/* Objetivo */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">Objetivo *</label>
              <Select value={objetivo} onValueChange={(v) => { setObjetivo(v); setErrors(er => ({ ...er, objetivo: "" })); }}>
                <SelectTrigger className="bg-secondary/50 border-border/50 h-12 text-base">
                  <SelectValue placeholder="Selecione o objetivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="massa">Ganhar Massa</SelectItem>
                  <SelectItem value="emagrecer">Emagrecer</SelectItem>
                  <SelectItem value="definicao">Definição</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                </SelectContent>
              </Select>
              {errors.objetivo && <p className="text-[11px] text-destructive mt-1">{errors.objetivo}</p>}
            </div>

            {/* Peso Atual + Peso Meta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">Peso Atual (kg) *</label>
                <Input
                  type="number"
                  placeholder="76"
                  value={valorAtual}
                  onChange={(e) => { setValorAtual(e.target.value); setErrors(er => ({ ...er, valorAtual: "" })); }}
                  className="bg-secondary/50 border-border/50 h-12 text-base"
                />
                {errors.valorAtual && <p className="text-[11px] text-destructive mt-1">{errors.valorAtual}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">Peso Meta (kg) *</label>
                <Input
                  type="number"
                  placeholder="82"
                  value={valorMeta}
                  onChange={(e) => { setValorMeta(e.target.value); setErrors(er => ({ ...er, valorMeta: "" })); }}
                  className="bg-secondary/50 border-border/50 h-12 text-base"
                />
                {errors.valorMeta && <p className="text-[11px] text-destructive mt-1">{errors.valorMeta}</p>}
              </div>
            </div>

            {/* Prazo */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">Prazo *</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {prazoOptions.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => { setPrazo(p.value); setErrors(er => ({ ...er, prazo: "" })); }}
                    className={`p-3 rounded-xl text-sm font-medium border transition-all text-center ${
                      prazo === p.value
                        ? "bg-primary/15 border-primary/30 text-primary"
                        : "bg-secondary/40 border-border/30 text-muted-foreground hover:bg-secondary/60 hover:border-border/50"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              {errors.prazo && <p className="text-[11px] text-destructive mt-1">{errors.prazo}</p>}
              {prazo === "custom" && (
                <div className="mt-3">
                  <Input
                    type="date"
                    value={customDate}
                    onChange={(e) => { setCustomDate(e.target.value); setErrors(er => ({ ...er, customDate: "" })); }}
                    className="bg-secondary/50 border-border/50 h-12 text-base"
                  />
                  {errors.customDate && <p className="text-[11px] text-destructive mt-1">{errors.customDate}</p>}
                </div>
              )}
            </div>

            {/* Unidade */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">Unidade</label>
              <Input
                placeholder="kg"
                value={unidade}
                onChange={(e) => setUnidade(e.target.value)}
                className="bg-secondary/50 border-border/50 h-12 text-base"
                maxLength={20}
              />
            </div>

            {/* Avançar */}
            <Button
              onClick={handleNext}
              disabled={!titulo || !valorAtual || !valorMeta || !objetivo || !prazo}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-chart-2 hover:opacity-90 transition-opacity"
            >
              Revisar Meta <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Confirmation Screen */}
      {showForm && showConfirm && (
        <div className="glass-card p-6 lg:p-8 glow-border max-w-2xl mx-auto animate-slide-up">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-chart-2/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-display font-bold text-xl mb-2">Confirme sua Meta</h3>
            <p className="text-muted-foreground text-sm">{titulo}</p>
          </div>

          {/* Summary Card */}
          <div className="bg-secondary/30 border border-border/30 rounded-2xl p-5 mb-6 space-y-4">
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-display font-bold text-foreground">{valorAtual}<span className="text-sm text-muted-foreground ml-1">{unidade}</span></p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Atual</p>
              </div>
              <ArrowRight className="w-5 h-5 text-primary" />
              <div className="text-center">
                <p className="text-2xl font-display font-bold text-primary">{valorMeta}<span className="text-sm text-primary/60 ml-1">{unidade}</span></p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Meta</p>
              </div>
            </div>

            <div className="border-t border-border/20 pt-3">
              <p className="text-sm text-center text-muted-foreground">{getSummaryText()}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-secondary/40 rounded-xl p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Objetivo</p>
                <p className="text-sm font-semibold text-foreground mt-1 capitalize">{objetivo}</p>
              </div>
              <div className="bg-secondary/40 rounded-xl p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Prazo</p>
                <p className="text-sm font-semibold text-foreground mt-1">{prazo === "custom" && customDate ? new Date(customDate).toLocaleDateString("pt-BR") : prazoLabel(prazo)}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowConfirm(false)} className="flex-1 h-12 text-base">
              Voltar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-primary to-chart-2 hover:opacity-90 transition-opacity"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              {saving ? "Salvando..." : "Confirmar Meta"}
            </Button>
          </div>
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
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>{status.label}</span>
                      {meta.goal_type && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary/60 text-muted-foreground capitalize">{meta.goal_type}</span>
                      )}
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
