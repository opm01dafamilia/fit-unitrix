import { useState, useEffect, useCallback } from "react";
import {
  Users, UserPlus, Search, Loader2, Crown, Copy, Check, X,
  Trophy, Flame, Zap, Star, ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import UserPublicProfile from "@/components/community/UserPublicProfile";
import { getRankForXP } from "@/lib/achievementsEngine";

type Friend = {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  created_at: string;
  // populated
  friendUserId: string;
  friendName: string;
  friendXP: number;
  friendRankTier: string;
  friendWorkoutStreak: number;
  friendTotalWorkouts: number;
};

type FriendRequest = {
  id: string;
  user_id: string;
  status: string;
  senderName: string;
  senderXP: number;
};

const Amigos = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [tab, setTab] = useState<"friends" | "ranking" | "requests">("friends");
  const [searchCode, setSearchCode] = useState("");
  const [searching, setSearching] = useState(false);
  const [myCode, setMyCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<{ userId: string; userName: string } | null>(null);

  // Generate friend code if user doesn't have one
  const ensureFriendCode = useCallback(async () => {
    if (!user || !profile) return;
    const { data } = await supabase
      .from("profiles")
      .select("friend_code")
      .eq("user_id", user.id)
      .single();

    if (data?.friend_code) {
      setMyCode(data.friend_code);
    } else {
      const code = (profile.full_name || "user")
        .toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8)
        + Math.random().toString(36).substring(2, 6);
      await supabase.from("profiles").update({ friend_code: code } as any).eq("user_id", user.id);
      setMyCode(code);
    }
  }, [user, profile]);

  const fetchFriends = useCallback(async () => {
    if (!user) return;

    // Get all accepted friendships
    const { data: friendships } = await supabase
      .from("friendships")
      .select("*")
      .eq("status", "accepted");

    if (!friendships) { setLoading(false); return; }

    const myFriendships = friendships.filter(
      (f: any) => f.user_id === user.id || f.friend_id === user.id
    );

    const friendUserIds = myFriendships.map((f: any) =>
      f.user_id === user.id ? f.friend_id : f.user_id
    );

    if (friendUserIds.length === 0) {
      setFriends([]);
      setLoading(false);
      return;
    }

    // Get ranking stats for friends
    const { data: stats } = await supabase
      .from("user_ranking_stats")
      .select("*")
      .in("user_id", friendUserIds);

    const statsMap = new Map((stats || []).map((s: any) => [s.user_id, s]));

    const enriched: Friend[] = myFriendships.map((f: any) => {
      const fId = f.user_id === user.id ? f.friend_id : f.user_id;
      const s = statsMap.get(fId);
      return {
        ...f,
        friendUserId: fId,
        friendName: s?.user_name || "Usuário",
        friendXP: s?.total_xp || 0,
        friendRankTier: s?.rank_tier || "bronze",
        friendWorkoutStreak: s?.workout_streak || 0,
        friendTotalWorkouts: s?.total_workouts || 0,
      };
    });

    setFriends(enriched);
    setLoading(false);
  }, [user]);

  const fetchRequests = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("friendships")
      .select("*")
      .eq("friend_id", user.id)
      .eq("status", "pending");

    if (!data || data.length === 0) { setRequests([]); return; }

    const senderIds = data.map((r: any) => r.user_id);
    const { data: stats } = await supabase
      .from("user_ranking_stats")
      .select("user_id, user_name, total_xp")
      .in("user_id", senderIds);

    const statsMap = new Map((stats || []).map((s: any) => [s.user_id, s]));

    setRequests(data.map((r: any) => ({
      id: r.id,
      user_id: r.user_id,
      status: r.status,
      senderName: statsMap.get(r.user_id)?.user_name || "Usuário",
      senderXP: statsMap.get(r.user_id)?.total_xp || 0,
    })));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      await Promise.all([ensureFriendCode(), fetchFriends(), fetchRequests()]);
      setLoading(false);
    };
    load();
  }, [user, ensureFriendCode, fetchFriends, fetchRequests]);

  const handleAddFriend = async () => {
    if (!user || !searchCode.trim()) return;
    setSearching(true);
    try {
      // Find user by friend_code
      const { data: foundProfile } = await supabase
        .from("profiles")
        .select("user_id, full_name, friend_code")
        .eq("friend_code", searchCode.trim().toLowerCase())
        .single();

      if (!foundProfile) {
        toast.error("Código não encontrado. Verifique e tente novamente.");
        setSearching(false);
        return;
      }

      if (foundProfile.user_id === user.id) {
        toast.error("Você não pode se adicionar como amigo!");
        setSearching(false);
        return;
      }

      // Check if already friends or pending
      const { data: existing } = await supabase
        .from("friendships")
        .select("id, status")
        .or(`and(user_id.eq.${user.id},friend_id.eq.${foundProfile.user_id}),and(user_id.eq.${foundProfile.user_id},friend_id.eq.${user.id})`);

      if (existing && existing.length > 0) {
        const f = existing[0] as any;
        if (f.status === "accepted") toast.info("Vocês já são amigos!");
        else toast.info("Solicitação já enviada!");
        setSearching(false);
        return;
      }

      await supabase.from("friendships").insert({
        user_id: user.id,
        friend_id: foundProfile.user_id,
        status: "pending",
      });

      toast.success(`Solicitação enviada para ${foundProfile.full_name || "usuário"}! 🤝`);
      setSearchCode("");
      fetchRequests();
    } catch {
      toast.error("Erro ao adicionar amigo.");
    }
    setSearching(false);
  };

  const handleAccept = async (requestId: string) => {
    await supabase.from("friendships").update({ status: "accepted", updated_at: new Date().toISOString() } as any).eq("id", requestId);
    toast.success("Amizade aceita! 🎉");
    fetchFriends();
    fetchRequests();
  };

  const handleReject = async (requestId: string) => {
    await supabase.from("friendships").delete().eq("id", requestId);
    toast.info("Solicitação recusada.");
    fetchRequests();
  };

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(myCode);
    setCopied(true);
    toast.success("Código copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Ranked friends list (sorted by XP)
  const rankedFriends = [...friends].sort((a, b) => b.friendXP - a.friendXP);

  // Find user's position among friends
  const myStats = friends.length > 0 ? (() => {
    const allXPs = [...rankedFriends.map(f => f.friendXP)];
    // Get my XP from ranking stats
    return allXPs;
  })() : [];

  const getMedalIcon = (pos: number) => {
    if (pos === 1) return <span className="text-lg">👑</span>;
    if (pos <= 3) return <Crown className="w-5 h-5 text-chart-3" />;
    if (pos <= 10) return <span className="text-sm">🔥</span>;
    return <span className="text-xs font-bold text-muted-foreground w-5 text-center">{pos}</span>;
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
        <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight flex items-center gap-2">
          <Users className="w-7 h-7 text-primary" />
          Meus Amigos
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Adicione amigos e compita no ranking</p>
      </div>

      {/* My Code Card */}
      <div className="glass-card p-5 lg:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-base">Seu Código de Amigo</h3>
            <p className="text-xs text-muted-foreground">Compartilhe para que amigos te adicionem</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 p-3 rounded-xl bg-secondary/50 border border-border/50">
            <code className="text-sm font-bold text-primary">{myCode}</code>
          </div>
          <Button onClick={handleCopyCode} variant="outline" size="icon" className="shrink-0">
            {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Add Friend */}
      <div className="glass-card p-5 lg:p-6">
        <h3 className="font-display font-semibold text-sm mb-3">➕ Adicionar Amigo</h3>
        <div className="flex gap-2">
          <Input
            placeholder="Digite o código do amigo..."
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddFriend()}
            className="flex-1"
          />
          <Button onClick={handleAddFriend} disabled={searching || !searchCode.trim()} className="gap-2">
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Buscar
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-secondary/50 w-fit">
        {([
          ["friends", `👥 Amigos (${friends.length})`],
          ["ranking", "🏆 Ranking"],
          ["requests", `📩 Pedidos (${requests.length})`],
        ] as [typeof tab, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 text-xs font-medium rounded-md transition-all ${
              tab === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Friends List */}
      {tab === "friends" && (
        <div className="glass-card p-5 lg:p-6">
          <h3 className="font-display font-semibold text-base mb-4">👥 Meus Amigos</h3>
          {friends.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum amigo adicionado ainda</p>
              <p className="text-xs text-muted-foreground mt-1">Use o código acima ou adicione pelo código de um amigo</p>
            </div>
          ) : (
            <div className="space-y-2">
              {friends.map((f) => {
                const rank = getRankForXP(f.friendXP);
                return (
                  <div key={f.id}
                    onClick={() => setSelectedProfile({ userId: f.friendUserId, userName: f.friendName })}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-secondary/30 border border-border/20 cursor-pointer hover:border-primary/20 transition-all">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">
                        {f.friendName?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{f.friendName}</p>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold ${rank.color} bg-secondary/60 border border-border/30`}>
                          {rank.icon} {rank.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        🔥 {f.friendWorkoutStreak} dias • {f.friendTotalWorkouts} treinos
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-display font-bold">{f.friendXP}</p>
                      <p className="text-[9px] text-muted-foreground">XP</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Friends Ranking */}
      {tab === "ranking" && (
        <div className="glass-card p-5 lg:p-6">
          <h3 className="font-display font-semibold text-base mb-4">🏆 Ranking dos Amigos</h3>
          {rankedFriends.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Adicione amigos para ver o ranking!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {rankedFriends.map((f, idx) => {
                const pos = idx + 1;
                const rank = getRankForXP(f.friendXP);
                return (
                  <div key={f.id}
                    onClick={() => setSelectedProfile({ userId: f.friendUserId, userName: f.friendName })}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer hover:border-primary/20 ${
                      pos <= 3 ? "bg-secondary/50 border-chart-3/10" : "bg-secondary/30 border-border/20"
                    }`}>
                    <div className="w-8 flex justify-center">{getMedalIcon(pos)}</div>
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">
                        {f.friendName?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{f.friendName}</p>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold ${rank.color} bg-secondary/60 border border-border/30`}>
                          {rank.icon} {rank.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        🔥 {f.friendWorkoutStreak} dias • {f.friendTotalWorkouts} treinos
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-display font-bold">{f.friendXP}</p>
                      <p className="text-[9px] text-muted-foreground">XP</p>
                    </div>
                  </div>
                );
              })}

              {/* User's own position card */}
              <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/15 text-center">
                <p className="text-sm font-medium">
                  ⭐ Sua posição: <span className="text-primary font-bold">Compare seu XP no Ranking Global!</span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Supere seus amigos mantendo consistência nos treinos 💪
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Friend Requests */}
      {tab === "requests" && (
        <div className="glass-card p-5 lg:p-6">
          <h3 className="font-display font-semibold text-base mb-4">📩 Solicitações de Amizade</h3>
          {requests.length === 0 ? (
            <div className="text-center py-8">
              <UserPlus className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma solicitação pendente</p>
            </div>
          ) : (
            <div className="space-y-2">
              {requests.map((r) => (
                <div key={r.id} className="flex items-center gap-3 p-3.5 rounded-xl bg-secondary/30 border border-border/20">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-chart-4/15 to-chart-4/5 flex items-center justify-center">
                    <span className="text-sm font-bold text-chart-4">
                      {r.senderName?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.senderName}</p>
                    <p className="text-[10px] text-muted-foreground">{r.senderXP} XP</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleAccept(r.id)} className="h-8 px-3 text-xs gap-1">
                      <Check className="w-3.5 h-3.5" /> Aceitar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleReject(r.id)} className="h-8 px-2">
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Incentive */}
      <div className="glass-card p-4 text-center">
        <p className="text-sm text-muted-foreground">
          💡 <span className="font-medium text-foreground">Adicione amigos e compita!</span> Treinos regulares sobem seu XP e posição entre amigos.
        </p>
      </div>

      {/* Public Profile Modal */}
      {selectedProfile && (
        <UserPublicProfile
          userId={selectedProfile.userId}
          userName={selectedProfile.userName}
          onClose={() => setSelectedProfile(null)}
        />
      )}
    </div>
  );
};

export default Amigos;
