import { useState } from "react";
import { Settings, Lock, LogOut, Loader2, Bell, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";
import { useNavigate } from "react-router-dom";

const Configuracoes = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [notifPeso, setNotifPeso] = useState(true);
  const [notifTreino, setNotifTreino] = useState(true);
  const [notifMedidas, setNotifMedidas] = useState(true);
  const [unidade, setUnidade] = useState<"kg" | "lb">("kg");

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) toast.error("Erro ao alterar senha");
    else {
      toast.success("Senha alterada com sucesso!");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="space-y-7 animate-slide-up">
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie sua conta e preferências</p>
      </div>

      {/* Profile Link */}
      <div className="glass-card p-5 lg:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
            <Settings className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-display font-semibold text-base">Perfil</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Edite suas informações pessoais como nome, peso, altura e objetivo.</p>
        <Button variant="outline" size="sm" onClick={() => navigate("/perfil")}>Editar Perfil</Button>
      </div>

      {/* Change Password */}
      <div className="glass-card p-5 lg:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-chart-4/15 to-chart-4/5 flex items-center justify-center">
            <Lock className="w-4 h-4 text-chart-4" />
          </div>
          <h3 className="font-display font-semibold text-base">Alterar Senha</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Nova Senha</label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="bg-secondary/50 border-border/50" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Confirmar Senha</label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repita a senha" className="bg-secondary/50 border-border/50" />
          </div>
        </div>
        <Button onClick={handleChangePassword} disabled={changingPassword || !newPassword} size="sm">
          {changingPassword ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
          {changingPassword ? "Alterando..." : "Alterar Senha"}
        </Button>
      </div>

      {/* Unit Preference */}
      <div className="glass-card p-5 lg:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-chart-2/15 to-chart-2/5 flex items-center justify-center">
            <Ruler className="w-4 h-4 text-chart-2" />
          </div>
          <h3 className="font-display font-semibold text-base">Preferências de Unidade</h3>
        </div>
        <div className="flex gap-2">
          {(["kg", "lb"] as const).map((u) => (
            <button key={u} onClick={() => setUnidade(u)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${unidade === u ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground hover:text-foreground"}`}>
              {u.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="glass-card p-5 lg:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-chart-3/15 to-chart-3/5 flex items-center justify-center">
            <Bell className="w-4 h-4 text-chart-3" />
          </div>
          <h3 className="font-display font-semibold text-base">Notificações</h3>
        </div>
        <div className="space-y-4">
          {[
            { label: "Lembrete para registrar peso", value: notifPeso, onChange: setNotifPeso },
            { label: "Lembrete de treino", value: notifTreino, onChange: setNotifTreino },
            { label: "Lembrete para atualizar medidas", value: notifMedidas, onChange: setNotifMedidas },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/30">
              <span className="text-sm font-medium">{item.label}</span>
              <Switch checked={item.value} onCheckedChange={item.onChange} />
            </div>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="glass-card p-5 lg:p-6">
        <Button variant="destructive" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" /> Sair da Conta
        </Button>
      </div>
    </div>
  );
};

export default Configuracoes;
