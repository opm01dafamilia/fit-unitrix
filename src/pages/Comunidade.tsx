import { useState, useEffect, useCallback, useRef } from "react";
import {
  Users, Shield, Globe, Lock,
  UserCheck, Zap, Plus, Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ComunidadeSkeleton } from "@/components/skeletons/SkeletonPremium";
import { toast } from "@/components/ui/sonner";
import ActivityFeedCard, { type Activity, type FeedComment } from "@/components/community/ActivityFeedCard";
import UserPublicProfile from "@/components/community/UserPublicProfile";
import CommunityMotivation from "@/components/community/CommunityMotivation";
import CreatePostDialog from "@/components/community/CreatePostDialog";
import { getRankForXP } from "@/lib/achievementsEngine";

const PAGE_SIZE = 20;

const privacyOptions = [
  { value: "public", label: "Público", icon: Globe, desc: "Todos podem ver sua atividade" },
  { value: "friends", label: "Apenas Amigos", icon: UserCheck, desc: "Apenas amigos veem sua atividade" },
  { value: "private", label: "Privado", icon: Lock, desc: "Ninguém pode ver sua atividade" },
];

const Comunidade = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [privacyLevel, setPrivacyLevel] = useState<string>(profile?.privacy_level || "public");
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ userId: string; userName: string } | null>(null);
  const [myRank, setMyRank] = useState<{ icon: string; label: string; color: string } | null>(null);
  const [myXP, setMyXP] = useState(0);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const [userCity, setUserCity] = useState<string | null>(null);
  const [feedFilter, setFeedFilter] = useState<"global" | "friends">("global");
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Load friend IDs and user city
  const loadFriendsAndCity = useCallback(async () => {
    if (!user) return;
    const [friendsRes, profileRes] = await Promise.all([
      supabase.from("friendships").select("user_id, friend_id").or(`user_id.eq.${user.id},friend_id.eq.${user.id}`).eq("status", "accepted"),
      supabase.from("profiles").select("city").eq("user_id", user.id).single(),
    ]);
    const ids = (friendsRes.data || []).map(f => f.user_id === user.id ? f.friend_id : f.user_id);
    setFriendIds(ids);
    setUserCity(profileRes.data?.city || null);
  }, [user]);

  const fetchActivities = useCallback(async (offset = 0, append = false) => {
    try {
      const { data: feedData } = await supabase
        .from("activity_feed")
        .select("*")
        .order("created_at", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (!feedData || feedData.length < PAGE_SIZE) setHasMore(false);
      if (!feedData) {
        if (!append) setActivities([]);
        return;
      }

      const activityIds = feedData.map(a => a.id);

      // Fetch reactions, comments, and user cities in parallel
      const [reactionsRes, commentsRes, profilesRes] = await Promise.all([
        supabase.from("activity_reactions").select("*").in("activity_id", activityIds.length > 0 ? activityIds : ["_none_"]),
        supabase.from("feed_comments").select("*").in("activity_id", activityIds.length > 0 ? activityIds : ["_none_"]).order("created_at", { ascending: true }),
        supabase.from("profiles").select("user_id, city").in("user_id", [...new Set(feedData.map(a => a.user_id))]),
      ]);

      const reactionsMap = new Map<string, { emoji: string; user_id: string }[]>();
      (reactionsRes.data || []).forEach(r => {
        if (!reactionsMap.has(r.activity_id)) reactionsMap.set(r.activity_id, []);
        reactionsMap.get(r.activity_id)!.push({ emoji: r.emoji, user_id: r.user_id });
      });

      const commentsMap = new Map<string, FeedComment[]>();
      (commentsRes.data || []).forEach(c => {
        if (!commentsMap.has(c.activity_id)) commentsMap.set(c.activity_id, []);
        commentsMap.get(c.activity_id)!.push(c as FeedComment);
      });

      const cityMap = new Map<string, string>();
      (profilesRes.data || []).forEach(p => {
        if (p.city) cityMap.set(p.user_id, p.city);
      });

      const mapped: Activity[] = feedData.map(a => ({
        ...a,
        user_city: cityMap.get(a.user_id),
        reactions: reactionsMap.get(a.id) || [],
        reaction_count: (reactionsMap.get(a.id) || []).length,
        comments: commentsMap.get(a.id) || [],
      }));

      // Filter by tab
      let filtered = mapped;
      if (feedFilter === "friends" && user) {
        filtered = mapped.filter(a => friendIds.includes(a.user_id) || a.user_id === user.id);
      }

      // Sort: friends first, then same city, then global
      if (user && feedFilter === "global") {
        filtered.sort((a, b) => {
          const aFriend = friendIds.includes(a.user_id) || a.user_id === user.id;
          const bFriend = friendIds.includes(b.user_id) || b.user_id === user.id;
          if (aFriend && !bFriend) return -1;
          if (!aFriend && bFriend) return 1;

          if (userCity) {
            const aCity = a.user_city === userCity;
            const bCity = b.user_city === userCity;
            if (aCity && !bCity) return -1;
            if (!aCity && bCity) return 1;
          }

          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
      }

      if (append) {
        setActivities(prev => [...prev, ...filtered]);
      } else {
        setActivities(filtered);
      }
    } catch { /* silent */ }
  }, [user, friendIds, userCity]);

  // Initial load
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      await loadFriendsAndCity();
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
  }, [user, loadFriendsAndCity]);

  // Fetch activities after friends/city loaded
  useEffect(() => {
    if (!user || loading) return;
    fetchActivities(0, false);
  }, [user, loading, fetchActivities]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('community-feed-v2')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_feed' }, () => fetchActivities(0, false))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_reactions' }, () => fetchActivities(0, false))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feed_comments' }, () => fetchActivities(0, false))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchActivities]);

  // Infinite scroll observer
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loadingMore && hasMore) {
          setLoadingMore(true);
          fetchActivities(activities.length, true).finally(() => setLoadingMore(false));
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, activities.length, fetchActivities]);

  const handleReaction = async (activityId: string, emoji: string) => {
    if (!user) return;
    const existing = activities.find(a => a.id === activityId)?.reactions.find(r => r.user_id === user.id);
    if (existing) {
      await supabase.from("activity_reactions").delete().eq("activity_id", activityId).eq("user_id", user.id);
    } else {
      await supabase.from("activity_reactions").insert({ activity_id: activityId, user_id: user.id, emoji });
    }
  };

  const handleComment = async (activityId: string, content: string) => {
    if (!user || !profile) return;
    await supabase.from("feed_comments").insert({
      activity_id: activityId,
      user_id: user.id,
      user_name: profile.full_name || "Usuário",
      content,
    });
  };

  const handleDeleteComment = async (commentId: string) => {
    await supabase.from("feed_comments").delete().eq("id", commentId);
  };

  const handleCreatePost = async (type: string, text: string) => {
    if (!user || !profile) return;
    await supabase.from("activity_feed").insert({
      user_id: user.id,
      user_name: profile.full_name || "Usuário",
      activity_type: type,
      description: text,
      metadata: {},
    });
    toast.success("Post publicado! 🎉");
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

  if (loading) return <ComunidadeSkeleton />;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-primary" />
            Comunidade Fitness
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Acompanhe a evolução da comunidade</p>
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
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-chart-2/10 flex items-center justify-center border border-primary/15">
            <span className="text-xl font-display font-bold text-primary">
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
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-[10px] text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-md">
                {myXP} XP
              </span>
              <span className="text-[10px] text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-md flex items-center gap-1">
                {privacyLevel === "public" ? <Globe className="w-2.5 h-2.5" /> :
                 privacyLevel === "friends" ? <UserCheck className="w-2.5 h-2.5" /> :
                 <Lock className="w-2.5 h-2.5" />}
                {privacyLevel === "public" ? "Público" : privacyLevel === "friends" ? "Apenas Amigos" : "Privado"}
              </span>
            </div>
          </div>
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
                onComment={handleComment}
                onDeleteComment={handleDeleteComment}
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

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-4" />
        {loadingMore && (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        )}
      </div>

      {/* FAB - Create Post */}
      <button
        onClick={() => setShowCreatePost(true)}
        className="fixed bottom-20 right-4 lg:bottom-8 lg:right-8 z-30 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95"
        style={{ background: 'linear-gradient(135deg, hsl(152 69% 46%), hsl(168 80% 38%))' }}
      >
        <Plus className="w-6 h-6 text-primary-foreground" />
      </button>

      {/* Create Post Dialog */}
      {showCreatePost && (
        <CreatePostDialog
          onClose={() => setShowCreatePost(false)}
          onSubmit={handleCreatePost}
        />
      )}

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
