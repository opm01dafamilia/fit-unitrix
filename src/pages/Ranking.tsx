import { useState, useEffect, useMemo } from "react";
import {
  Trophy, Flame, Crown, TrendingUp, Zap, Star, MapPin, Share2, Users, ChevronUp, ChevronDown, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import UserPublicProfile from "@/components/community/UserPublicProfile";
import { RankingSkeleton } from "@/components/skeletons/SkeletonPremium";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { format, startOfWeek, subDays } from "date-fns";
import {
  calculateAchievements, calculateTotalXP, getRankForXP, getNextRank,
  RANK_THRESHOLDS, type UserStats
} from "@/lib/achievementsEngine";

type RankingEntry = {
  user_id: string;
  user_name: string;
  total_xp: number;
  weekly_xp: number;
  rank_tier: string;
  ranking_score: number;
  total_workouts: number;
  total_series: number;
  achievements_count: number;
  workout_streak: number;
};

const Ranking = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"global" | "city" | "friends">("global");
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [cityRankings, setCityRankings] = useState<RankingEntry[]>([]);
  const [friendsRankings, setFriendsRankings] = useState<RankingEntry[]>([]);
  const [userXP, setUserXP] = useState(0);
  const [userStreak, setUserStreak] = useState(0);
  const [previousRank, setPreviousRank] = useState(0);
  const [positionChange, setPositionChange] = useState(0);
  const [userGlobalPosition, setUserGlobalPosition] = useState<number | null>(null);
  const [userCityPosition, setUserCityPosition] = useState<number | null>(null);
  const [userFriendsPosition, setUserFriendsPosition] = useState<number | null>(null);
  const [userCity, setUserCity] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<{ userId: string; userName: string } | null>(null);

  const computeAndSaveStats = async () => {
    if (!user) return;
    try {
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekStartStr = format(weekStart, "yyyy-MM-dd");

      const [sessionsRes, historyRes, dietRes] = await Promise.all([
        supabase.from("workout_sessions").select("id,completed_at,exercises_completed").eq("user_id", user.id),
        supabase.from("exercise_history").select("exercise_name, weight, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("diet_tracking").select("tracked_date,all_completed,adherence_pct").eq("user_id", user.id).order("tracked_date", { ascending: false }),
      ]);

      const sessions = sessionsRes.data || [];
      const history = historyRes.data || [];
      const diet = dietRes.data || [];

      const uniqueDays = [...new Set(sessions.map((s: any) => format(new Date(s.completed_at), "yyyy-MM-dd")))].sort().reverse();
      let currentStreak = 0;
      const today = format(new Date(), "yyyy-MM-dd");
      const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
      if (uniqueDays[0] === today || uniqueDays[0] === yesterday) {
        for (let i = 0; i < uniqueDays.length; i++) {
          const expected = format(subDays(new Date(), i + (uniqueDays[0] === today ? 0 : 1)), "yyyy-MM-dd");
          if (uniqueDays[i] === expected) currentStreak++;
          else break;
        }
      }
      setUserStreak(currentStreak);

      let maxStreak = currentStreak;
      if (uniqueDays.length > 1) {
        let ts = 1;
        for (let i = 1; i < uniqueDays.length; i++) {
          const diff = Math.round((new Date(uniqueDays[i - 1]).getTime() - new Date(uniqueDays[i]).getTime()) / 86400000);
          if (diff === 1) { ts++; maxStreak = Math.max(maxStreak, ts); } else ts = 1;
        }
      }

      const exerciseWeights = new Map<string, number[]>();
      (history as any[]).forEach((h: any) => {
        if (!exerciseWeights.has(h.exercise_name)) exerciseWeights.set(h.exercise_name, []);
        exerciseWeights.get(h.exercise_name)!.push(h.weight);
      });
      let totalProgressions = 0;
      exerciseWeights.forEach((weights) => {
        if (weights.length >= 2 && weights[0] > weights[weights.length - 1]) totalProgressions++;
      });

      const totalExCompleted = sessions.reduce((a: number, s: any) => a + s.exercises_completed, 0);
      const perfectDietDays = diet.filter((d: any) => d.all_completed).length;
      const dietDates = diet.filter((d: any) => d.all_completed).map((d: any) => d.tracked_date).sort().reverse();
      let dietMaxStreak = 0;
      if (dietDates.length > 0) {
        let ds = 1; dietMaxStreak = 1;
        for (let i = 1; i < dietDates.length; i++) {
          const diff = Math.round((new Date(dietDates[i - 1]).getTime() - new Date(dietDates[i]).getTime()) / 86400000);
          if (diff === 1) { ds++; dietMaxStreak = Math.max(dietMaxStreak, ds); } else ds = 1;
        }
      }
      const weekAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");
      const weekDietDays = diet.filter((d: any) => d.tracked_date >= weekAgo);
      const weeklyAdherence = weekDietDays.length > 0
        ? Math.round(weekDietDays.reduce((a: number, d: any) => a + (d.adherence_pct || 0), 0) / weekDietDays.length) : 0;

      const stats: UserStats = {
        totalWorkouts: sessions.length, currentStreak, maxStreak, totalProgressions,
        totalExercisesCompleted: totalExCompleted, daysActive: uniqueDays.length,
        dietStreak: 0, dietMaxStreak, dietPerfectDays: perfectDietDays, dietWeeklyAdherence: weeklyAdherence,
      };

      const totalXP = calculateTotalXP(stats);
      setUserXP(totalXP);
      const rank = getRankForXP(totalXP);
      const achievements = calculateAchievements(stats);
      const unlockedCount = achievements.filter(a => a.unlocked).length;

      const weekSessions = sessions.filter((s: any) => new Date(s.completed_at) >= weekStart);
      const weeklyXP = weekSessions.length * 10 + totalProgressions * 5;
      const periodSeries = (history as any[]).filter((h: any) => new Date(h.created_at) >= weekStart);
      const score = weekSessions.length * 100 + periodSeries.length * 10 + currentStreak * 30;

      await supabase.from("user_ranking_stats").upsert({
        user_id: user.id,
        user_name: profile?.full_name || "Usuário",
        total_workouts: weekSessions.length,
        total_series: periodSeries.length,
        diet_streak: 0,
        workout_streak: currentStreak,
        achievements_count: unlockedCount,
        ranking_score: score,
        total_xp: totalXP,
        weekly_xp: weeklyXP,
        rank_tier: rank.tier,
        week_start: weekStartStr,
        updated_at: new Date().toISOString(),
      } as any, { onConflict: "user_id,week_start" });

      // Fetch global rankings
      const { data: globalData } = await supabase
        .from("user_ranking_stats")
        .select("*")
        .order("total_xp" as any, { ascending: false })
        .limit(100);

      const seenUsers = new Set<string>();
      const dedupedGlobal: any[] = [];
      (globalData || []).forEach((r: any) => {
        if (!seenUsers.has(r.user_id)) { seenUsers.add(r.user_id); dedupedGlobal.push(r); }
      });
      setRankings(dedupedGlobal);

      // User global position
      const myGlobalPos = dedupedGlobal.findIndex((r: any) => r.user_id === user.id) + 1;
      if (myGlobalPos > 0) {
        setUserGlobalPosition(myGlobalPos);
      } else {
        const { count } = await supabase
          .from("user_ranking_stats")
          .select("*", { count: "exact", head: true })
          .gt("total_xp", totalXP);
        setUserGlobalPosition((count || 0) + 1);
      }

      // Position change notification
      if (previousRank > 0 && myGlobalPos > 0) {
        const change = previousRank - myGlobalPos;
        setPositionChange(change);
        if (change > 0) {
          toast.success(`⬆️ Você subiu ${change} posição${change > 1 ? "ões" : ""} no ranking!`, { duration: 4000 });
        }
      }
      setPreviousRank(myGlobalPos);

      // City ranking
      const myCity = (profile as any)?.city;
      setUserCity(myCity || null);
      if (myCity) {
        const { data: cityProfiles } = await supabase
          .from("profiles").select("user_id").eq("city", myCity);
        if (cityProfiles && cityProfiles.length > 0) {
          const cityUserIds = cityProfiles.map((p: any) => p.user_id);
          const { data: cityData } = await supabase
            .from("user_ranking_stats").select("*")
            .in("user_id", cityUserIds)
            .gte("total_workouts", 5)
            .order("total_xp" as any, { ascending: false })
            .limit(100);
          const seenCity = new Set<string>();
          const dedupedCity: any[] = [];
          (cityData || []).forEach((r: any) => {
            if (!seenCity.has(r.user_id)) { seenCity.add(r.user_id); dedupedCity.push(r); }
          });
          setCityRankings(dedupedCity);
          const myCityPos = dedupedCity.findIndex((r: any) => r.user_id === user.id) + 1;
          setUserCityPosition(myCityPos > 0 ? myCityPos : null);
        }
      }

      // Friends ranking
      const { data: friendships } = await supabase
        .from("friendships")
        .select("user_id, friend_id")
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq("status", "accepted");

      if (friendships && friendships.length > 0) {
        const friendIds = new Set<string>();
        friendIds.add(user.id); // include self
        friendships.forEach((f: any) => {
          friendIds.add(f.user_id === user.id ? f.friend_id : f.user_id);
        });
        const { data: friendsData } = await supabase
          .from("user_ranking_stats").select("*")
          .in("user_id", Array.from(friendIds))
          .order("total_xp" as any, { ascending: false })
          .limit(100);
        const seenFriends = new Set<string>();
        const dedupedFriends: any[] = [];
        (friendsData || []).forEach((r: any) => {
          if (!seenFriends.has(r.user_id)) { seenFriends.add(r.user_id); dedupedFriends.push(r); }
        });
        setFriendsRankings(dedupedFriends);
        const myFPos = dedupedFriends.findIndex((r: any) => r.user_id === user.id) + 1;
        setUserFriendsPosition(myFPos > 0 ? myFPos : null);
      }
    } catch {
      // silent
    }
  };

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      await computeAndSaveStats();
      setLoading(false);
    };
    load();
  }, [user]);

  const currentRank = getRankForXP(userXP);
  const nextRankInfo = getNextRank(userXP);

  const getMedalIcon = (pos: number) => {
    if (pos === 1) return <span className="text-xl">👑</span>;
    if (pos === 2) return <span className="text-lg">🥈</span>;
    if (pos === 3) return <span className="text-lg">🥉</span>;
    if (pos <= 10) return <span className="text-sm">🔥</span>;
    if (pos <= 50) return <span className="text-sm">⭐</span>;
    return <span className="text-xs font-bold text-muted-foreground w-5 text-center">{pos}</span>;
  };

  const getPositionBadge = (pos: number) => {
    if (pos === 1) return { label: "Top 1", className: "text-chart-3 bg-chart-3/10 border-chart-3/20" };
    if (pos <= 3) return { label: `Top 3`, className: "text-chart-3 bg-chart-3/10 border-chart-3/20" };
    if (pos <= 10) return { label: "Top 10", className: "text-orange-400 bg-orange-500/10 border-orange-500/20" };
    if (pos <= 50) return { label: "Top 50", className: "text-chart-4 bg-chart-4/10 border-chart-4/20" };
    if (pos <= 100) return { label: "Top 100", className: "text-primary bg-primary/10 border-primary/20" };
    return null;
  };

  const renderRankingList = (data: RankingEntry[], title: string, emptyIcon: React.ReactNode, emptyMsg: string, showUserPos?: { pos: number | null; label: string }) => (
    <div className="space-y-4">
      {/* Position highlight card */}
      {showUserPos?.pos && (
        <div className="glass-card p-4 border-primary/15 bg-primary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                {tab === "city" ? <MapPin className="w-5 h-5 text-primary" /> : tab === "friends" ? <Users className="w-5 h-5 text-primary" /> : <Trophy className="w-5 h-5 text-primary" />}
              </div>
              <div>
                <p className="text-sm font-medium">
                  🔥 Você está em <span className="text-primary font-bold">#{showUserPos.pos}</span> {showUserPos.label}
                </p>
                <p className="text-[11px] text-muted-foreground">{data.length} competidores</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
              const text = `💪 Estou em #${showUserPos.pos} no ranking fitness ${showUserPos.label} no Fit-Unitrix! Vem competir!`;
              if (navigator.share) {
                navigator.share({ title: "Fit-Unitrix Ranking", text }).catch(() => {});
              } else {
                navigator.clipboard.writeText(text);
                toast.success("Copiado para compartilhar!");
              }
            }}>
              <Share2 className="w-3.5 h-3.5" />
              Compartilhar
            </Button>
          </div>
        </div>
      )}

      <div className="glass-card p-5 lg:p-6">
        <h3 className="font-display font-semibold text-base mb-4">{title}</h3>
        {data.length > 0 ? (
          <div className="space-y-2">
            {data.map((entry: any, idx: number) => {
              const isMe = entry.user_id === user?.id;
              const pos = idx + 1;
              const entryRank = getRankForXP(entry.total_xp || 0);
              const posBadge = getPositionBadge(pos);
              const streak = entry.workout_streak || 0;

              return (
                <div key={`${entry.user_id}-${idx}`}
                  onClick={() => !isMe && setSelectedProfile({ userId: entry.user_id, userName: entry.user_name })}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer hover:border-primary/20 ${
                    isMe
                      ? "bg-primary/5 border-primary/15 shadow-[0_0_24px_-6px_hsl(var(--primary)/0.2)]"
                      : pos <= 3
                      ? "bg-gradient-to-r from-chart-3/5 to-transparent border-chart-3/10"
                      : "bg-secondary/30 border-border/20"
                  }`}>
                  {/* Position */}
                  <div className="w-8 flex justify-center shrink-0">{getMedalIcon(pos)}</div>

                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    pos <= 3
                      ? "bg-gradient-to-br from-chart-3/20 to-chart-3/5 border border-chart-3/15"
                      : "bg-gradient-to-br from-primary/15 to-primary/5"
                  }`}>
                    <span className={`text-sm font-bold ${pos <= 3 ? "text-chart-3" : "text-primary"}`}>
                      {entry.user_name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-semibold truncate ${isMe ? "text-primary" : ""}`}>
                        {entry.user_name}{isMe ? " (Você)" : ""}
                      </p>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold ${entryRank.color} bg-secondary/60 border border-border/30`}>
                        {entryRank.icon} {entryRank.label}
                      </span>
                      {posBadge && (
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-bold border ${posBadge.className}`}>
                          {posBadge.label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {streak > 0 && (
                        <span className="text-[10px] text-orange-400 font-medium flex items-center gap-0.5">
                          <Flame className="w-3 h-3" /> {streak}d
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {entry.achievements_count || 0} conquistas • {entry.total_workouts || 0} treinos
                      </span>
                    </div>
                  </div>

                  {/* XP + Movement */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-display font-bold">{entry.total_xp || 0}</p>
                    <p className="text-[9px] text-muted-foreground">XP</p>
                  </div>
                </div>
              );
            })}

            {/* Show user position if outside the list */}
            {tab === "global" && userGlobalPosition && !data.some((r: any) => r.user_id === user?.id) && (
              <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/15 text-center">
                <p className="text-sm font-medium">📍 Sua posição atual: <span className="text-primary font-bold">#{userGlobalPosition}</span></p>
                <p className="text-[11px] text-muted-foreground mt-1">Continue treinando para subir no ranking!</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            {emptyIcon}
            <p className="text-sm text-muted-foreground mt-3">{emptyMsg}</p>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) return <RankingSkeleton />;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight flex items-center gap-2.5">
          <Trophy className="w-7 h-7 text-chart-3" />
          Ranking Fitness
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Compete, evolua e conquiste seu lugar no topo</p>
      </div>

      {/* Your Rank Card */}
      <div className="glass-card p-5 lg:p-6 glow-border relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-chart-3/8 to-transparent rounded-bl-full" />
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-chart-3/20 to-chart-3/5 flex items-center justify-center border border-chart-3/15">
              <span className="text-3xl">{currentRank.icon}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-lg">{profile?.full_name || "Você"}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-md font-bold ${currentRank.color} bg-secondary/60 border border-border/30`}>
                  {currentRank.label}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <p className="text-sm text-muted-foreground">{userXP} XP Total</p>
                {userStreak > 0 && (
                  <span className="text-xs text-orange-400 font-medium flex items-center gap-0.5">
                    <Flame className="w-3.5 h-3.5" /> {userStreak}d streak
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-display font-bold text-chart-3">#{userGlobalPosition || '—'}</p>
              <p className="text-[10px] text-muted-foreground">Global</p>
              {positionChange !== 0 && (
                <div className={`flex items-center justify-end gap-0.5 mt-0.5 ${positionChange > 0 ? "text-primary" : "text-destructive"}`}>
                  {positionChange > 0 ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  <span className="text-[10px] font-bold">
                    {positionChange > 0 ? `+${positionChange}` : positionChange}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* XP Progress to next rank */}
          {nextRankInfo && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-muted-foreground">
                  Próximo rank: {nextRankInfo.nextRank.icon} {nextRankInfo.nextRank.label}
                </span>
                <span className="text-[11px] font-bold text-primary">
                  {nextRankInfo.xpNeeded} XP restantes
                </span>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-chart-2 rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, ((userXP - currentRank.minXP) / (nextRankInfo.nextRank.minXP - currentRank.minXP)) * 100)}%`
                  }}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="p-2.5 rounded-xl bg-secondary/40 border border-border/30 text-center">
              <Star className="w-3.5 h-3.5 text-chart-3 mx-auto mb-1" />
              <p className="text-sm font-display font-bold">{userXP}</p>
              <p className="text-[8px] text-muted-foreground">XP Total</p>
            </div>
            <div className="p-2.5 rounded-xl bg-secondary/40 border border-border/30 text-center">
              <TrendingUp className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
              <p className="text-sm font-display font-bold">#{userGlobalPosition || '—'}</p>
              <p className="text-[8px] text-muted-foreground">Posição</p>
            </div>
            <div className="p-2.5 rounded-xl bg-secondary/40 border border-border/30 text-center">
              <Flame className="w-3.5 h-3.5 text-orange-400 mx-auto mb-1" />
              <p className="text-sm font-display font-bold">{userStreak}d</p>
              <p className="text-[8px] text-muted-foreground">Streak</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rank Tiers */}
      <div className="glass-card p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Ranks</h3>
        <div className="grid grid-cols-4 gap-2">
          {RANK_THRESHOLDS.slice().reverse().map(r => (
            <div key={r.tier} className={`p-2.5 rounded-xl text-center border transition-all ${
              currentRank.tier === r.tier ? "border-primary/30 bg-primary/5 scale-[1.02]" : "border-border/20 bg-secondary/20"
            }`}>
              <span className="text-xl">{r.icon}</span>
              <p className={`text-[10px] font-bold mt-1 ${r.color}`}>{r.label}</p>
              <p className="text-[8px] text-muted-foreground">{r.minXP}+ XP</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs — 3 categories */}
      <div className="flex gap-1 p-1 rounded-xl bg-secondary/50 w-full">
        {([
          ["global", "🌎 Global"],
          ["city", "📍 Cidade"],
          ["friends", "👥 Amigos"],
        ] as [typeof tab, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 px-4 py-2.5 text-xs font-semibold rounded-lg transition-all ${
              tab === key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "global" && renderRankingList(
        rankings, "Top 100 — Ranking Global",
        <Trophy className="w-10 h-10 text-muted-foreground/30 mx-auto" />,
        "Nenhum participante ainda. Treine para aparecer!",
        userGlobalPosition ? { pos: userGlobalPosition, label: "no ranking global" } : undefined
      )}

      {tab === "city" && (
        !userCity ? (
          <div className="glass-card p-8 text-center">
            <MapPin className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-3">Cadastre sua cidade no perfil para ver o ranking local.</p>
            <Button variant="outline" size="sm" onClick={() => window.location.href = "/perfil"}>
              Editar Perfil
            </Button>
          </div>
        ) : renderRankingList(
          cityRankings, `Ranking — ${userCity}`,
          <MapPin className="w-10 h-10 text-muted-foreground/30 mx-auto" />,
          "Nenhum competidor na sua cidade ainda. Convide amigos!",
          userCityPosition ? { pos: userCityPosition, label: `em ${userCity}` } : undefined
        )
      )}

      {tab === "friends" && (
        friendsRankings.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-3">Adicione amigos para competir no ranking!</p>
            <Button variant="outline" size="sm" onClick={() => window.location.href = "/amigos"}>
              Encontrar Amigos
            </Button>
          </div>
        ) : renderRankingList(
          friendsRankings, "Ranking entre Amigos",
          <Users className="w-10 h-10 text-muted-foreground/30 mx-auto" />,
          "Adicione amigos para ver o ranking.",
          userFriendsPosition ? { pos: userFriendsPosition, label: "entre amigos" } : undefined
        )
      )}

      {/* Incentive */}
      <div className="glass-card p-4 text-center">
        <p className="text-sm text-muted-foreground">
          💡 <span className="font-medium text-foreground">Suba no ranking mantendo consistência.</span> Treinos, dieta e conquistas aumentam seu XP.
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

export default Ranking;
