import { useState, useEffect, useCallback } from "react";
import { Link2, Copy, Share2, Users, Check, Trophy, Rocket, Gift, Loader2, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

type Invite = {
  id: string;
  invite_code: string;
  invited_email: string | null;
  invited_user_id: string | null;
  status: string;
  workouts_completed: number;
  has_subscription: boolean;
  validated: boolean;
  created_at: string;
};

const SOCIAL_ACHIEVEMENTS = [
  { threshold: 5, xp: 15, label: "Convide 5 amigos", icon: "🤝" },
  { threshold: 10, xp: 35, label: "Convide 10 amigos", icon: "🎯" },
  { threshold: 30, xp: 60, label: "Convide 30 amigos", icon: "🔥" },
  { threshold: 50, xp: 120, label: "Convide 50 amigos", icon: "🚀" },
];

const Convites = () => {
  const { user, profile } = useAuth();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const generateCode = useCallback(() => {
    const name = (profile?.full_name || "user").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10);
    const rand = Math.random().toString(36).substring(2, 8);
    return `${name}${rand}`;
  }, [profile]);

  const fetchInvites = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_invites")
      .select("*")
      .eq("inviter_id", user.id)
      .order("created_at", { ascending: false });
    if (data) {
      setInvites(data as Invite[]);
      // Set current invite code from existing or generate new
      const existing = data.find((i: Invite) => i.status === "pending" && !i.invited_user_id);
      if (existing) setInviteCode(existing.invite_code);
      else setInviteCode(generateCode());
    }
    setLoading(false);
  }, [user, generateCode]);

  useEffect(() => { fetchInvites(); }, [fetchInvites]);

  const validatedCount = invites.filter(i => i.validated).length;

  const handleCopyLink = async () => {
    if (!user) return;
    setGenerating(true);
    
    // Ensure invite record exists
    const existingPending = invites.find(i => i.status === "pending" && !i.invited_user_id && i.invite_code === inviteCode);
    if (!existingPending) {
      await supabase.from("user_invites").insert({
        inviter_id: user.id,
        invite_code: inviteCode,
      });
    }

    const link = `https://eco-platform-hub.lovable.app/invite/${inviteCode}`;
    await navigator.clipboard.writeText(link);
    toast.success("Link copiado! Compartilhe com seus amigos 🎉");
    setGenerating(false);
    fetchInvites();
  };

  const handleShare = async () => {
    if (!user) return;
    const existingPending = invites.find(i => i.status === "pending" && !i.invited_user_id && i.invite_code === inviteCode);
    if (!existingPending) {
      await supabase.from("user_invites").insert({
        inviter_id: user.id,
        invite_code: inviteCode,
      });
      fetchInvites();
    }

    const link = `https://eco-platform-hub.lovable.app/invite/${inviteCode}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "FitPulse - Treine comigo!",
          text: "Entre no FitPulse e comece sua jornada fitness! 💪",
          url: link,
        });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(link);
      toast.success("Link copiado!");
    }
  };

  const getStatusInfo = (invite: Invite) => {
    if (invite.validated) return { label: "Ativo ✅", color: "text-primary", icon: CheckCircle2 };
    if (invite.status === "registered") return { label: "Cadastrado", color: "text-chart-4", icon: Clock };
    if (invite.status === "pending") return { label: "Pendente", color: "text-muted-foreground", icon: Clock };
    return { label: invite.status, color: "text-muted-foreground", icon: XCircle };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-7 animate-slide-up">
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight">Convites</h1>
        <p className="text-muted-foreground text-sm mt-1">Convide amigos e ganhe XP social</p>
      </div>

      {/* Invite Link Card */}
      <div className="glass-card p-5 lg:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Link2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-base">Seu Link de Convite</h3>
            <p className="text-xs text-muted-foreground">Compartilhe e ganhe XP quando amigos entrarem</p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50 border border-border/50 mb-4">
          <code className="flex-1 text-xs text-foreground truncate">
            https://eco-platform-hub.lovable.app/invite/{inviteCode}
          </code>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleCopyLink} disabled={generating} className="flex-1 gap-2">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
            Copiar Link
          </Button>
          <Button onClick={handleShare} variant="outline" className="gap-2">
            <Share2 className="w-4 h-4" />
            Compartilhar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-display font-bold text-foreground">{invites.filter(i => i.invited_user_id).length}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Cadastrados</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-display font-bold text-primary">{validatedCount}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Ativos</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-display font-bold text-chart-4">
            {SOCIAL_ACHIEVEMENTS.filter(a => validatedCount >= a.threshold).reduce((sum, a) => sum + a.xp, 0)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">XP Ganho</p>
        </div>
      </div>

      {/* Social Achievements */}
      <div className="glass-card p-5 lg:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-chart-4/15 to-chart-4/5 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-chart-4" />
          </div>
          <h3 className="font-display font-semibold text-base">Conquistas Sociais</h3>
        </div>
        <div className="space-y-3">
          {SOCIAL_ACHIEVEMENTS.map((ach) => {
            const unlocked = validatedCount >= ach.threshold;
            return (
              <div key={ach.threshold}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  unlocked 
                    ? "bg-primary/5 border-primary/20" 
                    : "bg-secondary/30 border-border/30"
                }`}
              >
                <span className="text-xl">{ach.icon}</span>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${unlocked ? "text-primary" : "text-foreground"}`}>
                    {ach.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {unlocked ? "Desbloqueado ✨" : `${validatedCount}/${ach.threshold} amigos`}
                  </p>
                </div>
                <span className={`text-xs font-bold ${unlocked ? "text-primary" : "text-muted-foreground"}`}>
                  +{ach.xp} XP
                </span>
                {unlocked && <Check className="w-4 h-4 text-primary" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Influencer Badge */}
      {validatedCount >= 10 && (
        <div className="glass-card p-5 lg:p-6 border-primary/20 bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/30 to-chart-4/20 flex items-center justify-center">
              <Rocket className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-primary">🚀 Influencer Fitness</h3>
              <p className="text-xs text-muted-foreground">Você é um influenciador ativo da comunidade!</p>
            </div>
          </div>
        </div>
      )}

      {/* Invite List */}
      <div className="glass-card p-5 lg:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-chart-2/15 to-chart-2/5 flex items-center justify-center">
            <Users className="w-4 h-4 text-chart-2" />
          </div>
          <h3 className="font-display font-semibold text-base">Seus Convites</h3>
        </div>

        {invites.filter(i => i.invited_user_id).length === 0 ? (
          <div className="text-center py-8">
            <Gift className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum amigo convidado ainda</p>
            <p className="text-xs text-muted-foreground mt-1">Compartilhe seu link para começar!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {invites.filter(i => i.invited_user_id).map((invite) => {
              const statusInfo = getStatusInfo(invite);
              const StatusIcon = statusInfo.icon;
              return (
                <div key={invite.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border/30">
                  <div className="w-8 h-8 rounded-lg bg-secondary/80 flex items-center justify-center">
                    <Users className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {invite.invited_email || "Usuário convidado"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(invite.created_at).toLocaleDateString("pt-BR")}
                      {invite.validated && ` • ${invite.workouts_completed} treinos`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StatusIcon className={`w-3.5 h-3.5 ${statusInfo.color}`} />
                    <span className={`text-[11px] font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Conditions */}
      <div className="glass-card p-5 lg:p-6">
        <h3 className="font-display font-semibold text-sm mb-3">Como funciona?</h3>
        <div className="space-y-2 text-xs text-muted-foreground">
          <p>1. Compartilhe seu link de convite com amigos</p>
          <p>2. O convite é validado quando o amigo:</p>
          <div className="pl-4 space-y-1">
            <p>• Faz cadastro no FitPulse</p>
            <p>• Assina um plano</p>
            <p>• Completa pelo menos 3 treinos</p>
          </div>
          <p>3. Você ganha XP social e sobe no ranking!</p>
        </div>
      </div>

      {/* Motivation */}
      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground">
          💪 Suba no ranking mantendo consistência e convidando amigos
        </p>
      </div>
    </div>
  );
};

export default Convites;
