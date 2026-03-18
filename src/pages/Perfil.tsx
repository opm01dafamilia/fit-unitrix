import { useState, useEffect } from "react";
import { User, Save, Loader2 } from "lucide-react";
import ProfilePhotoUpload from "@/components/ProfilePhotoUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";
import MeusArquivos from "@/components/MeusArquivos";

const Perfil = () => {
  const { profile, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [nome, setNome] = useState("");
  const [idade, setIdade] = useState("");
  const [sexo, setSexo] = useState("");
  const [altura, setAltura] = useState("");
  const [peso, setPeso] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [atividade, setAtividade] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [pais, setPais] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (profile) {
      setNome(profile.full_name || "");
      setIdade(profile.age ? String(profile.age) : "");
      setSexo(profile.gender || "");
      setAltura(profile.height ? String(profile.height) : "");
      setPeso(profile.weight ? String(profile.weight) : "");
      setObjetivo(profile.objective || "");
      setAtividade(profile.activity_level || "");
      setCidade((profile as any).city || "");
      setEstado((profile as any).state || "");
      setPais((profile as any).country || "");
    }
  }, [profile]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!nome.trim()) e.nome = "Nome obrigatório";
    if (!idade || Number(idade) < 10 || Number(idade) > 120) e.idade = "Idade entre 10 e 120";
    if (!altura || Number(altura) <= 0) e.altura = "Altura inválida";
    if (!peso || Number(peso) <= 0) e.peso = "Peso inválido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !profile) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: nome.trim(),
      age: Number(idade),
      gender: sexo || null,
      height: Number(altura),
      weight: Number(peso),
      objective: objetivo || null,
      activity_level: atividade || null,
      city: cidade.trim() || null,
      state: estado.trim() || null,
      country: pais.trim() || null,
    } as any).eq("id", profile.id);
    setSaving(false);
    if (error) toast.error("Erro ao salvar");
    else {
      toast.success("Perfil atualizado com sucesso!");
      await refreshProfile();
    }
  };

  const objectiveLabel = (v: string) => {
    const map: Record<string, string> = { emagrecer: "Emagrecimento", massa: "Ganho de Massa", condicionamento: "Condicionamento", manter: "Manutenção" };
    return map[v] || v;
  };

  return (
    <div className="space-y-7 animate-slide-up">
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight">Meu Perfil</h1>
        <p className="text-muted-foreground text-sm mt-1">Visualize e edite suas informações pessoais</p>
      </div>

      {/* Profile Summary Card */}
      <div className="glass-card p-5 lg:p-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 mb-6">
          <ProfilePhotoUpload currentUrl={profile?.avatar_url} size="lg" />
          <div className="text-center sm:text-left">
            <h2 className="text-lg font-display font-bold">{profile?.full_name || "Usuário"}</h2>
            <p className="text-sm text-muted-foreground">{objectiveLabel(profile?.objective || "")} • {profile?.activity_level || "—"}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Peso", value: profile?.weight ? `${profile.weight} kg` : "—" },
            { label: "Altura", value: profile?.height ? `${profile.height} cm` : "—" },
            { label: "Idade", value: profile?.age ? `${profile.age} anos` : "—" },
            { label: "Sexo", value: profile?.gender === "masculino" ? "Masculino" : profile?.gender === "feminino" ? "Feminino" : "—" },
          ].map((item) => (
            <div key={item.label} className="p-3.5 rounded-xl bg-secondary/40 border border-border/30 text-center">
              <p className="text-[11px] text-muted-foreground font-medium mb-1">{item.label}</p>
              <p className="text-sm font-semibold">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Form */}
      <div className="glass-card p-5 lg:p-6">
        <h3 className="font-display font-semibold text-sm mb-5 text-muted-foreground uppercase tracking-wider">Editar Dados</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Nome Completo *</label>
            <Input value={nome} onChange={(e) => { setNome(e.target.value); setErrors(er => ({ ...er, nome: "" })); }} className="bg-secondary/50 border-border/50" />
            {errors.nome && <p className="text-[11px] text-destructive mt-1">{errors.nome}</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Idade *</label>
            <Input type="number" value={idade} onChange={(e) => { setIdade(e.target.value); setErrors(er => ({ ...er, idade: "" })); }} className="bg-secondary/50 border-border/50" />
            {errors.idade && <p className="text-[11px] text-destructive mt-1">{errors.idade}</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Sexo</label>
            <Select value={sexo} onValueChange={setSexo}>
              <SelectTrigger className="bg-secondary/50 border-border/50"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="masculino">Masculino</SelectItem>
                <SelectItem value="feminino">Feminino</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Altura (cm) *</label>
            <Input type="number" value={altura} onChange={(e) => { setAltura(e.target.value); setErrors(er => ({ ...er, altura: "" })); }} className="bg-secondary/50 border-border/50" />
            {errors.altura && <p className="text-[11px] text-destructive mt-1">{errors.altura}</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Peso (kg) *</label>
            <Input type="number" step="0.1" value={peso} onChange={(e) => { setPeso(e.target.value); setErrors(er => ({ ...er, peso: "" })); }} className="bg-secondary/50 border-border/50" />
            {errors.peso && <p className="text-[11px] text-destructive mt-1">{errors.peso}</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Objetivo</label>
            <Select value={objetivo} onValueChange={setObjetivo}>
              <SelectTrigger className="bg-secondary/50 border-border/50"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="emagrecer">Emagrecer</SelectItem>
                <SelectItem value="massa">Ganhar Massa</SelectItem>
                <SelectItem value="condicionamento">Condicionamento</SelectItem>
                <SelectItem value="manter">Manter Peso</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Nível de Atividade</label>
            <Select value={atividade} onValueChange={setAtividade}>
              <SelectTrigger className="bg-secondary/50 border-border/50"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sedentario">Sedentário</SelectItem>
                <SelectItem value="leve">Levemente Ativo</SelectItem>
                <SelectItem value="moderado">Moderado</SelectItem>
                <SelectItem value="intenso">Muito Ativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Cidade *</label>
            <Input value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Ex: São Paulo" className="bg-secondary/50 border-border/50" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Estado</label>
            <Input value={estado} onChange={(e) => setEstado(e.target.value)} placeholder="Ex: SP" className="bg-secondary/50 border-border/50" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">País</label>
            <Input value={pais} onChange={(e) => setPais(e.target.value)} placeholder="Ex: Brasil" className="bg-secondary/50 border-border/50" />
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {saving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </div>
  );
};

export default Perfil;
