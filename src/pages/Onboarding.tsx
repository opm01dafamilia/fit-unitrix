import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flame, ArrowRight, User, Ruler, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";

const Onboarding = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [data, setData] = useState({
    full_name: "", age: "", gender: "",
    height: "", weight: "",
    objective: "", activity_level: "",
  });

  const steps = [
    { title: "Informações Pessoais", desc: "Nos conte sobre você", icon: User, fields: ["full_name", "age", "gender"] },
    { title: "Dados Físicos", desc: "Suas medidas atuais", icon: Ruler, fields: ["height", "weight"] },
    { title: "Objetivo e Atividade", desc: "O que você busca alcançar", icon: Target, fields: ["objective", "activity_level"] },
  ];

  const validateStep = () => {
    const e: Record<string, string> = {};
    const fields = steps[step].fields;
    fields.forEach(f => {
      const val = data[f as keyof typeof data];
      if (!val) { e[f] = "Campo obrigatório"; return; }
      if (f === "age" && (Number(val) < 10 || Number(val) > 100)) e[f] = "Idade entre 10-100";
      if (f === "height" && (Number(val) < 100 || Number(val) > 250)) e[f] = "Altura entre 100-250 cm";
      if (f === "weight" && (Number(val) < 30 || Number(val) > 300)) e[f] = "Peso entre 30-300 kg";
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const canAdvance = () => steps[step].fields.every((f) => data[f as keyof typeof data]);

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: data.full_name, age: Number(data.age), gender: data.gender,
        height: Number(data.height), weight: Number(data.weight),
        objective: data.objective, activity_level: data.activity_level,
        onboarding_completed: true,
      })
      .eq("user_id", user.id);
    setLoading(false);
    if (error) toast.error("Erro ao salvar perfil");
    else { await refreshProfile(); toast.success("Perfil configurado!"); navigate("/"); }
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (step < steps.length - 1) setStep(step + 1);
    else handleFinish();
  };

  const StepIcon = steps[step].icon;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.03] pointer-events-none"
           style={{ background: 'radial-gradient(circle, hsl(152 69% 46%), transparent 70%)' }} />
      
      <div className="w-full max-w-lg relative">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, hsl(152 69% 46%), hsl(168 80% 38%))' }}>
            <Flame className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Bem-vindo ao FitPulse!</h1>
          <p className="text-muted-foreground text-sm mt-1">Vamos configurar seu perfil</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-6">
          {steps.map((_, i) => (
            <div key={i} className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${i <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
              <StepIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-semibold">{steps[step].title}</h2>
              <p className="text-xs text-muted-foreground">{steps[step].desc}</p>
            </div>
          </div>

          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Nome completo</label>
                <Input placeholder="Seu nome" value={data.full_name} onChange={(e) => { setData({ ...data, full_name: e.target.value }); setErrors(er => ({ ...er, full_name: "" })); }} className="bg-secondary/50 border-border/50" />
                {errors.full_name && <p className="text-[11px] text-destructive mt-1">{errors.full_name}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Idade</label>
                <Input type="number" placeholder="25" value={data.age} onChange={(e) => { setData({ ...data, age: e.target.value }); setErrors(er => ({ ...er, age: "" })); }} className="bg-secondary/50 border-border/50" />
                {errors.age && <p className="text-[11px] text-destructive mt-1">{errors.age}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Sexo</label>
                <Select value={data.gender} onValueChange={(v) => { setData({ ...data, gender: v }); setErrors(er => ({ ...er, gender: "" })); }}>
                  <SelectTrigger className="bg-secondary/50 border-border/50"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && <p className="text-[11px] text-destructive mt-1">{errors.gender}</p>}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Altura (cm)</label>
                <Input type="number" placeholder="175" value={data.height} onChange={(e) => { setData({ ...data, height: e.target.value }); setErrors(er => ({ ...er, height: "" })); }} className="bg-secondary/50 border-border/50" />
                {errors.height && <p className="text-[11px] text-destructive mt-1">{errors.height}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Peso atual (kg)</label>
                <Input type="number" step="0.1" placeholder="80" value={data.weight} onChange={(e) => { setData({ ...data, weight: e.target.value }); setErrors(er => ({ ...er, weight: "" })); }} className="bg-secondary/50 border-border/50" />
                {errors.weight && <p className="text-[11px] text-destructive mt-1">{errors.weight}</p>}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Objetivo</label>
                <Select value={data.objective} onValueChange={(v) => { setData({ ...data, objective: v }); setErrors(er => ({ ...er, objective: "" })); }}>
                  <SelectTrigger className="bg-secondary/50 border-border/50"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emagrecer">Emagrecer</SelectItem>
                    <SelectItem value="massa">Ganhar Massa</SelectItem>
                    <SelectItem value="condicionamento">Condicionamento</SelectItem>
                    <SelectItem value="manter">Manter Peso</SelectItem>
                  </SelectContent>
                </Select>
                {errors.objective && <p className="text-[11px] text-destructive mt-1">{errors.objective}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Nível de atividade</label>
                <Select value={data.activity_level} onValueChange={(v) => { setData({ ...data, activity_level: v }); setErrors(er => ({ ...er, activity_level: "" })); }}>
                  <SelectTrigger className="bg-secondary/50 border-border/50"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentario">Sedentário</SelectItem>
                    <SelectItem value="leve">Levemente Ativo</SelectItem>
                    <SelectItem value="moderado">Moderado</SelectItem>
                    <SelectItem value="intenso">Muito Ativo</SelectItem>
                  </SelectContent>
                </Select>
                {errors.activity_level && <p className="text-[11px] text-destructive mt-1">{errors.activity_level}</p>}
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">Voltar</Button>
            )}
            <Button onClick={handleNext} disabled={!canAdvance() || loading} className="flex-1">
              {loading ? "Salvando..." : step < steps.length - 1 ? "Próximo" : "Finalizar"}
              {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
