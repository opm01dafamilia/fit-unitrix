import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flame, ArrowRight } from "lucide-react";
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
  const [data, setData] = useState({
    full_name: "",
    age: "",
    gender: "",
    height: "",
    weight: "",
    objective: "",
    activity_level: "",
  });

  const steps = [
    { title: "Informações Pessoais", fields: ["full_name", "age", "gender"] },
    { title: "Dados Físicos", fields: ["height", "weight"] },
    { title: "Objetivo e Atividade", fields: ["objective", "activity_level"] },
  ];

  const canAdvance = () => {
    const currentFields = steps[step].fields;
    return currentFields.every((f) => data[f as keyof typeof data]);
  };

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: data.full_name,
        age: Number(data.age),
        gender: data.gender,
        height: Number(data.height),
        weight: Number(data.weight),
        objective: data.objective,
        activity_level: data.activity_level,
        onboarding_completed: true,
      })
      .eq("user_id", user.id);
    setLoading(false);
    if (error) {
      toast.error("Erro ao salvar perfil");
    } else {
      await refreshProfile();
      toast.success("Perfil configurado!");
      navigate("/");
    }
  };

  const handleNext = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else handleFinish();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <Flame className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold">Bem-vindo ao FitPulse!</h1>
          <p className="text-muted-foreground mt-1">Vamos configurar seu perfil</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-6">
          {steps.map((_, i) => (
            <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

        <div className="glass-card p-6">
          <h2 className="font-display font-semibold text-lg mb-6">{steps[step].title}</h2>

          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Nome completo</label>
                <Input placeholder="Seu nome" value={data.full_name} onChange={(e) => setData({ ...data, full_name: e.target.value })} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Idade</label>
                <Input type="number" placeholder="25" value={data.age} onChange={(e) => setData({ ...data, age: e.target.value })} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Sexo</label>
                <Select value={data.gender} onValueChange={(v) => setData({ ...data, gender: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Altura (cm)</label>
                <Input type="number" placeholder="175" value={data.height} onChange={(e) => setData({ ...data, height: e.target.value })} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Peso atual (kg)</label>
                <Input type="number" step="0.1" placeholder="80" value={data.weight} onChange={(e) => setData({ ...data, weight: e.target.value })} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Objetivo</label>
                <Select value={data.objective} onValueChange={(v) => setData({ ...data, objective: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emagrecer">Emagrecer</SelectItem>
                    <SelectItem value="massa">Ganhar Massa</SelectItem>
                    <SelectItem value="condicionamento">Condicionamento</SelectItem>
                    <SelectItem value="manter">Manter Peso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Nível de atividade</label>
                <Select value={data.activity_level} onValueChange={(v) => setData({ ...data, activity_level: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentario">Sedentário</SelectItem>
                    <SelectItem value="leve">Levemente Ativo</SelectItem>
                    <SelectItem value="moderado">Moderado</SelectItem>
                    <SelectItem value="intenso">Muito Ativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
                Voltar
              </Button>
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
