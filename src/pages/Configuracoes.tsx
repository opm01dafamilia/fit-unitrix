import { useState, useEffect } from "react";
import { Settings, Lock, LogOut, Loader2, Bell, Ruler, Shield, LayoutGrid, Pin, PinOff, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";
import { useNavigate } from "react-router-dom";
import { getHonestyMode, setHonestyMode, getValidationStats } from "@/lib/antiFakeEngine";
import { getMenuPreferences, saveMenuPreferences, resetMenuPreferences, MODULAR_ROUTES } from "@/lib/menuPreferences";
import { getNotificationPreferences, saveNotificationPreferences, type NotificationType } from "@/lib/smartNotificationsEngine";
import { isCoachModeActive, setCoachMode } from "@/lib/fitnessCoachEngine";
import { THEME_COLORS, getSavedThemeColor, saveThemeColor, type ThemeColor } from "@/lib/themeColors";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

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
  const [honestyMode, setHonestyModeState] = useState(getHonestyMode());
  const validationStats = getValidationStats();
  const [pinnedItems, setPinnedItems] = useState<string[]>(() => getMenuPreferences().pinnedSocialItems);
  const [notifPrefs, setNotifPrefs] = useState(() => getNotificationPreferences());
  const [coachMode, setCoachModeState] = useState(() => isCoachModeActive());
  const [selectedColor, setSelectedColor] = useState<ThemeColor>(() => getSavedThemeColor());

  const NOTIF_TYPE_LABELS: Record<NotificationType, string> = {
    treino: "🏋️ Treino",
    dieta: "🥗 Dieta",
    ranking: "🏆 Ranking",
    recuperacao: "🧘 Recuperação",
    meta: "🎯 Metas",
    conquista: "🏅 Conquistas",
    social: "👥 Social",
  };

  const updateNotifPref = (key: keyof typeof notifPrefs.types | "enabled" | "soundEnabled", value: boolean) => {
    const updated = { ...notifPrefs };
    if (key === "enabled") updated.enabled = value;
    else if (key === "soundEnabled") updated.soundEnabled = value;
    else updated.types = { ...updated.types, [key]: value };
    setNotifPrefs(updated);
    saveNotificationPreferences(updated);
    toast.success("Preferência atualizada!");
  };

  const togglePin = (route: string) => {
    const prefs = getMenuPreferences();
    const idx = prefs.pinnedSocialItems.indexOf(route);
    if (idx >= 0) {
      prefs.pinnedSocialItems.splice(idx, 1);
    } else {
      prefs.pinnedSocialItems.push(route);
    }
    saveMenuPreferences(prefs);
    setPinnedItems([...prefs.pinnedSocialItems]);
    window.dispatchEvent(new Event("menuPrefsChanged"));
    toast.success("Menu atualizado!");
  };

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
  };

  const handleHonestyToggle = (enabled: boolean) => {
    setHonestyModeState(enabled);
    setHonestyMode(enabled);
    if (!enabled) {
      toast.warning("Modo Honesto desativado — seu ranking não será contabilizado.", { duration: 5000 });
    } else {
      toast.success("Modo Honesto ativado — ranking ativo!", { duration: 3000 });
    }
  };

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie sua conta e preferências</p>
      </div>

      <Accordion type="multiple" className="space-y-3">
        {/* Perfil */}
        <AccordionItem value="perfil" className="glass-card border-none rounded-xl overflow-hidden">
          <AccordionTrigger className="px-5 py-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                <Settings className="w-4 h-4 text-primary" />
              </div>
              <span className="font-display font-semibold text-base">Perfil</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5">
            <p className="text-sm text-muted-foreground mb-4">Edite suas informações pessoais como nome, peso, altura e objetivo.</p>
            <Button variant="outline" size="sm" onClick={() => navigate("/app/perfil")}>Editar Perfil</Button>
          </AccordionContent>
        </AccordionItem>

        {/* Modo Honesto */}
        <AccordionItem value="honesty" className="glass-card border-none rounded-xl overflow-hidden">
          <AccordionTrigger className="px-5 py-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-chart-2/15 to-chart-2/5 flex items-center justify-center">
                <Shield className="w-4 h-4 text-chart-2" />
              </div>
              <span className="font-display font-semibold text-base">Modo Honesto</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5">
            <p className="text-sm text-muted-foreground mb-4">
              Quando ativado, seus treinos são validados para ranking e conquistas. Desativar remove sua pontuação do ranking.
            </p>
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/30 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Modo Honesto</span>
                {honestyMode ? (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-chart-2/15 text-chart-2 font-bold">ATIVO</span>
                ) : (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-destructive/15 text-destructive font-bold">INATIVO</span>
                )}
              </div>
              <Switch checked={honestyMode} onCheckedChange={handleHonestyToggle} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-lg bg-secondary/30 text-center">
                <p className="text-base font-display font-bold text-chart-2">{validationStats.totalValidated}</p>
                <p className="text-[9px] text-muted-foreground">Validados</p>
              </div>
              <div className="p-2.5 rounded-lg bg-secondary/30 text-center">
                <p className="text-base font-display font-bold text-destructive">{validationStats.totalNotValidated}</p>
                <p className="text-[9px] text-muted-foreground">Não validados</p>
              </div>
              <div className="p-2.5 rounded-lg bg-secondary/30 text-center">
                <p className="text-base font-display font-bold text-chart-4">{validationStats.totalExtra}</p>
                <p className="text-[9px] text-muted-foreground">Extras</p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Personalizar Menu */}
        <AccordionItem value="menu" className="glass-card border-none rounded-xl overflow-hidden">
          <AccordionTrigger className="px-5 py-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                <LayoutGrid className="w-4 h-4 text-primary" />
              </div>
              <span className="font-display font-semibold text-base">Personalizar Menu</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5">
            <div className="flex justify-end mb-3">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => {
                resetMenuPreferences();
                setPinnedItems([]);
                window.dispatchEvent(new Event("menuPrefsChanged"));
                toast.success("Menu restaurado ao padrão!");
              }}>
                Resetar
              </Button>
            </div>
            <div className="space-y-2">
              {MODULAR_ROUTES.map((route) => {
                const isPinned = pinnedItems.includes(route.to);
                return (
                  <div key={route.to} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/30">
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-medium">{route.label}</span>
                      <span className="text-[10px] text-muted-foreground hidden sm:inline">{route.desc}</span>
                    </div>
                    <button
                      onClick={() => togglePin(route.to)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                        isPinned
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-secondary/50 text-muted-foreground hover:text-foreground border border-transparent"
                      }`}
                    >
                      {isPinned ? <Pin className="w-3 h-3" /> : <PinOff className="w-3 h-3" />}
                      {isPinned ? "Fixado" : "Fixar"}
                    </button>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground mt-3">
              💡 Módulos não fixados ficam acessíveis pelo <span className="font-semibold">Perfil Fitness</span>.
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* Alterar Senha */}
        <AccordionItem value="password" className="glass-card border-none rounded-xl overflow-hidden">
          <AccordionTrigger className="px-5 py-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-chart-4/15 to-chart-4/5 flex items-center justify-center">
                <Lock className="w-4 h-4 text-chart-4" />
              </div>
              <span className="font-display font-semibold text-base">Alterar Senha</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5">
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
          </AccordionContent>
        </AccordionItem>

        {/* Unidades */}
        <AccordionItem value="units" className="glass-card border-none rounded-xl overflow-hidden">
          <AccordionTrigger className="px-5 py-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-chart-2/15 to-chart-2/5 flex items-center justify-center">
                <Ruler className="w-4 h-4 text-chart-2" />
              </div>
              <span className="font-display font-semibold text-base">Preferências de Unidade</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5">
            <div className="flex gap-2">
              {(["kg", "lb"] as const).map((u) => (
                <button key={u} onClick={() => setUnidade(u)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${unidade === u ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground hover:text-foreground"}`}>
                  {u.toUpperCase()}
                </button>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Coach Mode */}
        <AccordionItem value="coach" className="glass-card border-none rounded-xl overflow-hidden">
          <AccordionTrigger className="px-5 py-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/15 to-chart-2/5 flex items-center justify-center">
                <span className="text-base">🧠</span>
              </div>
              <span className="font-display font-semibold text-base">Modo Coach Ativo</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5">
            <p className="text-sm text-muted-foreground mb-4">
              Quando ativado, o FitPulse aumenta a frequência de mensagens motivacionais, sugestões diárias e alertas estratégicos.
            </p>
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/30">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Modo Coach</span>
                {coachMode ? (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-bold">ATIVO</span>
                ) : (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground font-bold">INATIVO</span>
                )}
              </div>
              <Switch checked={coachMode} onCheckedChange={(v) => {
                setCoachModeState(v);
                setCoachMode(v);
                toast.success(v ? "Modo Coach ativado! 🧠" : "Modo Coach desativado.");
              }} />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Notificações */}
        <AccordionItem value="notifications" className="glass-card border-none rounded-xl overflow-hidden">
          <AccordionTrigger className="px-5 py-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-chart-3/15 to-chart-3/5 flex items-center justify-center">
                <Bell className="w-4 h-4 text-chart-3" />
              </div>
              <span className="font-display font-semibold text-base">Notificações Inteligentes</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5">
            <p className="text-sm text-muted-foreground mb-4">
              O FitPulse acompanha seu comportamento e envia alertas estratégicos como um coach pessoal.
            </p>
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/30 mb-3">
              <span className="text-sm font-medium">Notificações ativas</span>
              <Switch checked={notifPrefs.enabled} onCheckedChange={(v) => updateNotifPref("enabled", v)} />
            </div>
            {notifPrefs.enabled && (
              <div className="space-y-2 mt-3">
                {(Object.keys(notifPrefs.types) as NotificationType[]).map((type) => (
                  <div key={type} className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/20 border border-border/20">
                    <span className="text-xs font-medium">{NOTIF_TYPE_LABELS[type]}</span>
                    <Switch checked={notifPrefs.types[type]} onCheckedChange={(v) => updateNotifPref(type, v)} />
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-border/30">
              <p className="text-[10px] text-muted-foreground mb-3 uppercase tracking-wider font-semibold">Lembretes básicos</p>
              <div className="space-y-2">
                {[
                  { label: "Lembrete para registrar peso", value: notifPeso, onChange: setNotifPeso },
                  { label: "Lembrete de treino", value: notifTreino, onChange: setNotifTreino },
                  { label: "Lembrete para atualizar medidas", value: notifMedidas, onChange: setNotifMedidas },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/20 border border-border/20">
                    <span className="text-xs font-medium">{item.label}</span>
                    <Switch checked={item.value} onCheckedChange={item.onChange} />
                  </div>
                ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Cor do Tema */}
        <AccordionItem value="theme" className="glass-card border-none rounded-xl overflow-hidden">
          <AccordionTrigger className="px-5 py-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                <Palette className="w-4 h-4 text-primary" />
              </div>
              <span className="font-display font-semibold text-base">Cor do Tema</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5">
            <div className="flex gap-3 flex-wrap">
              {THEME_COLORS.map((color) => (
                <button
                  key={color.id}
                  onClick={() => {
                    setSelectedColor(color.id);
                    saveThemeColor(color.id);
                    toast.success(`Tema ${color.label} aplicado!`);
                  }}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    selectedColor === color.id
                      ? "border-primary bg-primary/10 scale-105"
                      : "border-border/30 bg-secondary/30 hover:bg-secondary/50"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full shadow-lg" style={{ backgroundColor: color.preview }} />
                  <span className="text-[11px] font-medium">{color.label}</span>
                </button>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Logout - always visible */}
      <div className="glass-card p-5 lg:p-6">
        <Button variant="destructive" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" /> Sair da Conta
        </Button>
      </div>
    </div>
  );
};

export default Configuracoes;
