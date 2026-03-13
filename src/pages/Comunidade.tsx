import { useState, useEffect, useCallback } from "react";
import {
  Users, Send, Shield, Globe, Lock,
  UserCheck, Loader2, Zap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ComunidadeSkeleton } from "@/components/skeletons/SkeletonPremium";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import ActivityFeedCard, { type Activity } from "@/components/community/ActivityFeedCard";
import UserPublicProfile from "@/components/community/UserPublicProfile";
import CommunityMotivation from "@/components/community/CommunityMotivation";
import { getRankForXP } from "@/lib/achievementsEngine";

const privacyOptions = [
  { value: "public", label: "Público", icon: Globe, desc: "Todos podem ver sua atividade" },
  { value: "friends", label: "Apenas Ranking", icon: UserCheck, desc: "Aparece no ranking com dados mínimos" },
  { value: "private", label: "Privado", icon: Lock, desc: "Ninguém pode ver sua atividade" },
];

const Comunidade = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [privacyLevel, setPrivacyLevel] = useState<string>(profile?.privacy_level || "public");
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [posting, setPosting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ userId: string; userName: string } | null>(null);
  const [myRank, setMyRank] = useState<{ icon: string; label: string; color: string } | null>(null);
  const [myXP, setMyXP] = useState(0);

  const fetchActivities = useCallback(async () => {
    try {
      const { data: feedData } = await supabase
        .from("activity_feed")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (!feedData) { setActivities([]); return; }

      const activityIds = feedData.map(a => a.id);
      const { data: reactionsData } = await supabase
        .from("activity_reactions")
        .select("*")
        .in("activity_id", activityIds.length > 0 ? activityIds : ["_none_"]);

      const reactionsMap = new Map<string, { emoji: string; user_id: string }[]>();
      (reactionsData || []).forEach(r => {
        if (!reactionsMap.has(r.activity_id)) reactionsMap.set(r.activity_id, []);
        reactionsMap.get(r.activity_id)!.push({ emoji: r.emoji, user_id: r.user_id });
      });

      const mapped: Activity[] = feedData.map(a => ({
        ...a,
        reactions: reactionsMap.get(a.id) || [],
        reaction_count: (reactionsMap.get(a.id) || []).length,
      }));

      setActivities(mapped);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      await fetchActivities();

      // Load privacy + rank
      const [privRes, rankRes] = await Promise.all([
        supabase.from("profiles").select("privacy_level").eq("user_id", user.id).single(),
        supabase.from("user_ranking_stats").select("total_xp").eq("user_id", user.id).single(),
      ]);
      if (privRes.data?.privacy_level) setPrivacyLevel(privRes.data.privacy_level);
      if (rankRes.data) {
        const xp = rankRes.data.total_xp || 0;
        setMyXP(xp);
        setMyRank(getRankForXP(xp));
      }
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel('community-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_feed' }, () => fetchActivities())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_reactions' }, () => fetchActivities())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchActivities]);

  const handleReaction = async (activityId: string, emoji: string) => {
    if (!user) return;
    const existing = activities.find(a => a.id === activityId)?.reactions.find(r => r.user_id === user.id);
    if (existing) {
      await supabase.from("activity_reactions").delete().eq("activity_id", activityId).eq("user_id", user.id);
    } else {
      await supabase.from("activity_reactions").insert({ activity_id: activityId, user_id: user.id, emoji });
    }
    fetchActivities();
  };

  const handleShareActivity = async () => {
    if (!user || !profile) return;
    setPosting(true);
    try {
      const messages = [
        { type: "workout", desc: `${profile.full_name || "Usuário"} está treinando duro hoje! 💪` },
        { type: "streak", desc: `${profile.full_name || "Usuário"} está mantendo a consistência! 🔥` },
        { type: "goal", desc: `${profile.full_name || "Usuário"} está focado nos objetivos! 🎯` },
      ];
      const msg = messages[Math.floor(Math.random() * messages.length)];
      await supabase.from("activity_feed").insert({
        user_id: user.id,
        user_name: profile.full_name || "Usuário",
        activity_type: msg.type,
        description: msg.desc,
        metadata: {},
      });
      toast.success("Atividade compartilhada! 🎉");
      fetchActivities();
    } catch {
      toast.error("Erro ao compartilhar");
    } finally {
      setPosting(false);
    }
  };

  const handlePrivacyChange = async (level: string) => {
    if (!user) return;
    try {
      await supabase.from("profiles").update({ privacy_level: level }).eq("user_id", user.id);
      setPrivacyLevel(level);
      toast.success("Privacidade atualizada");
      setShowPrivacy(false);
    } catch {
      toast.error("Erro ao atualizar privacidade");
    }
  };

  if (loading) {
    return (
      <div className="space-y-7 animate-slide-up">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 rounded-2xl" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-7 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-primary" />
            Comunidade Fitness
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Acompanhe a evolução da comunidade fitness</p>
        </div>
        <button
          onClick={() => setShowPrivacy(!showPrivacy)}
          className="p-2.5 rounded-xl bg-secondary/50 border border-border/30 hover:bg-secondary/70 transition-colors"
          title="Privacidade"
        >
          <Shield className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Privacy Settings */}
      {showPrivacy && (
        <div className="glass-card p-5 glow-border animate-slide-up">
          <h3 className="font-display font-semibold text-sm mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Configurações de Privacidade
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {privacyOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => handlePrivacyChange(opt.value)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  privacyLevel === opt.value
                    ? "bg-primary/10 border-primary/20 text-primary"
                    : "bg-secondary/30 border-border/30 text-muted-foreground hover:bg-secondary/50"
                }`}
              >
                <opt.icon className="w-5 h-5 mb-2" />
                <p className="text-sm font-medium">{opt.label}</p>
                <p className="text-[10px] mt-0.5 opacity-70">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Motivational Banner */}
      <CommunityMotivation activityCount={activities.length} />

      {/* My Fitness Card */}
      <div className="glass-card p-5 lg:p-6">
        <h3 className="font-display font-semibold text-sm mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          Seu Perfil na Comunidade
        </h3>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-chart-2/10 flex items-center justify-center border border-primary/15">
            <span className="text-2xl font-display font-bold text-primary">
              {(profile?.full_name || "U").charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <h4 className="font-display font-bold text-lg">{profile?.full_name || "Usuário"}</h4>
            {myRank && (
              <p className={`text-sm font-medium ${myRank.color}`}>
                {myRank.icon} {myRank.label}
              </p>
            )}
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-[10px] text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-md">
                {myXP} XP
              </span>
              <span className="text-[10px] text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-md flex items-center gap-1">
                {privacyLevel === "public" ? <Globe className="w-2.5 h-2.5" /> :
                 privacyLevel === "friends" ? <UserCheck className="w-2.5 h-2.5" /> :
                 <Lock className="w-2.5 h-2.5" />}
                {privacyLevel === "public" ? "Público" : privacyLevel === "friends" ? "Apenas Ranking" : "Privado"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Share Activity */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
            <span className="text-sm font-bold text-primary">
              {(profile?.full_name || "U").charAt(0).toUpperCase()}
            </span>
          </div>
          <button
            onClick={handleShareActivity}
            disabled={posting}
            className="flex-1 p-3 rounded-xl bg-secondary/40 border border-border/30 text-left text-sm text-muted-foreground hover:bg-secondary/60 transition-colors"
          >
            {posting ? "Compartilhando..." : "Compartilhar sua atividade..."}
          </button>
          <Button onClick={handleShareActivity} disabled={posting} size="sm" className="shrink-0">
            {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Activity Feed */}
      <div>
        <h3 className="font-display font-semibold text-base mb-4">Feed de Atividades</h3>
        {activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map(activity => (
              <ActivityFeedCard
                key={activity.id}
                activity={activity}
                currentUserId={user?.id}
                onReaction={handleReaction}
                onUserClick={(userId, userName) => setSelectedUser({ userId, userName })}
              />
            ))}
          </div>
        ) : (
          <div className="glass-card p-8 text-center">
            <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="font-display font-semibold mb-1">Nenhuma atividade ainda</h3>
            <p className="text-muted-foreground text-sm">Seja o primeiro a compartilhar sua evolução!</p>
          </div>
        )}
      </div>

      {/* Public Profile Modal */}
      {selectedUser && (
        <UserPublicProfile
          userId={selectedUser.userId}
          userName={selectedUser.userName}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
};

export default Comunidade;
