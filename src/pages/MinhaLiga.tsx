import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Medal, Crown, Shield, Star, TrendingUp, TrendingDown, Minus,
  Users, ChevronUp, ChevronDown, Clock, Zap, Trophy
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

const LEAGUES = [
  { key: "bronze", label: "Bronze", emoji: "🥉", color: "hsl(30 60% 50%)", bgClass: "from-amber-700/20 to-amber-900/5" },
  { key: "prata", label: "Prata", emoji: "🥈", color: "hsl(210 10% 65%)", bgClass: "from-slate-400/20 to-slate-500/5" },
  { key: "ouro", label: "Ouro", emoji: "🥇", color: "hsl(45 90% 50%)", bgClass: "from-yellow-500/20 to-yellow-600/5" },
  { key: "elite", label: "Elite", emoji: "💎", color: "hsl(270 70% 60%)", bgClass: "from-purple-500/20 to-purple-600/5" },
] as const;

type LeagueKey = typeof LEAGUES[number]["key"];

const GROUP_SIZE = 50;
const PROMOTION_ZONE = 10;
const RELEGATION_ZONE = 10;

type GroupMember = {
  user_id: string;
  user_name: string;
  season_xp: number;
  season_level: number;
  league: LeagueKey;
  group_number: number;
};

function getLeagueInfo(key: string) {
  return LEAGUES.find(l => l.key === key) || LEAGUES[0];
}

function getNextLeague(key: LeagueKey): LeagueKey | null {
  const idx = LEAGUES.findIndex(l => l.key === key);
  return idx < LEAGUES.length - 1 ? LEAGUES[idx + 1].key : null;
}

function getPrevLeague(key: LeagueKey): LeagueKey | null {
  const idx = LEAGUES.findIndex(l => l.key === key);
  return idx > 0 ? LEAGUES[idx - 1].key : null;
}

const MinhaLiga = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [myLeague, setMyLeague] = useState<LeagueKey>("bronze");
  const [myGroup, setMyGroup] = useState(1);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [myPosition, setMyPosition] = useState<number | null>(null);
  const [seasonName, setSeasonName] = useState("");
  const [daysLeft, setDaysLeft] = useState(0);
  const [totalMembers, setTotalMembers] = useState(0);

  const leagueInfo = useMemo(() => getLeagueInfo(myLeague), [myLeague]);

  const zone = useMemo(() => {
    if (!myPosition || totalMembers === 0) return "neutral";
    if (myLeague !== "elite" && myPosition <= PROMOTION_ZONE) return "promotion";
    if (myLeague !== "bronze" && myPosition > totalMembers - RELEGATION_ZONE) return "relegation";
    return "neutral";
  }, [myPosition, totalMembers, myLeague]);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Get active season
    const { data: seasons } = await supabase
      .from("seasons")
      .select("*")
      .eq("status", "active")
      .limit(1);

    if (!seasons || seasons.length === 0) {
      setLoading(false);
      return;
    }

    const season = seasons[0];
    setSeasonName(season.name);
    const end = new Date(season.end_date);
    setDaysLeft(Math.max(0, differenceInDays(end, new Date()) + 1));

    // Get or create user league entry
    let { data: myLeagueData } = await supabase
      .from("user_leagues")
      .select("*")
      .eq("user_id", user.id)
      .eq("season_id", season.id)
      .maybeSingle();

    if (!myLeagueData) {
      // Determine league from previous season
      const league = await determineLeague(user.id, season.id);
      const group = await assignGroup(season.id, league);

      const { data: inserted } = await supabase
        .from("user_leagues")
        .insert({
          user_id: user.id,
          season_id: season.id,
          league,
          group_number: group,
        } as any)
        .select()
        .single();

      myLeagueData = inserted;
    }

    if (!myLeagueData) { setLoading(false); return; }

    const currentLeague = (myLeagueData as any).league as LeagueKey;
    const currentGroup = (myLeagueData as any).group_number as number;
    setMyLeague(currentLeague);
    setMyGroup(currentGroup);

    // Get all members in same group
    const { data: groupLeagues } = await supabase
      .from("user_leagues")
      .select("user_id, league, group_number")
      .eq("season_id", season.id)
      .eq("league", currentLeague)
      .eq("group_number", currentGroup);

    if (!groupLeagues || groupLeagues.length === 0) {
      setLoading(false);
      return;
    }

    const userIds = groupLeagues.map((g: any) => g.user_id);
    setTotalMembers(userIds.length);

    // Get season progress for these users
    const { data: progressData } = await supabase
      .from("user_season_progress")
      .select("user_id, season_xp, season_level")
      .eq("season_id", season.id)
      .in("user_id", userIds);

    // Get profile names
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", userIds);

    const nameMap = new Map((profiles || []).map((p: any) => [p.user_id, p.full_name || "Usuário"]));
    const xpMap = new Map((progressData || []).map((p: any) => [p.user_id, { xp: p.season_xp, level: p.season_level }]));

    const members: GroupMember[] = userIds.map((uid: string) => ({
      user_id: uid,
      user_name: nameMap.get(uid) || "Usuário",
      season_xp: xpMap.get(uid)?.xp || 0,
      season_level: xpMap.get(uid)?.level || 1,
      league: currentLeague,
      group_number: currentGroup,
    }));

    members.sort((a, b) => b.season_xp - a.season_xp);
    setGroupMembers(members);

    const pos = members.findIndex(m => m.user_id === user.id);
    setMyPosition(pos >= 0 ? pos + 1 : null);

    setLoading(false);
  }, [user]);

  const determineLeague = async (userId: string, currentSeasonId: string): Promise<LeagueKey> => {
    // Check previous season league
    const { data: prevSeasons } = await supabase
      .from("seasons")
      .select("id")
      .eq("status", "completed")
      .order("end_date", { ascending: false })
      .limit(1);

    if (!prevSeasons || prevSeasons.length === 0) return "bronze";

    const { data: prevLeague } = await supabase
      .from("user_leagues")
      .select("league, group_number")
      .eq("user_id", userId)
      .eq("season_id", prevSeasons[0].id)
      .maybeSingle();

    if (!prevLeague) return "bronze";

    // Check prev season position to determine promotion/relegation
    const prevL = (prevLeague as any).league as LeagueKey;
    const prevG = (prevLeague as any).group_number as number;

    // Get all members of prev group sorted by XP
    const { data: prevGroupMembers } = await supabase
      .from("user_leagues")
      .select("user_id")
      .eq("season_id", prevSeasons[0].id)
      .eq("league", prevL)
      .eq("group_number", prevG);

    if (!prevGroupMembers) return prevL;

    const prevUserIds = prevGroupMembers.map((m: any) => m.user_id);
    const { data: prevProgress } = await supabase
      .from("user_season_progress")
      .select("user_id, season_xp")
      .eq("season_id", prevSeasons[0].id)
      .in("user_id", prevUserIds);

    const sorted = (prevProgress || []).sort((a: any, b: any) => b.season_xp - a.season_xp);
    const myIdx = sorted.findIndex((s: any) => s.user_id === userId);

    if (myIdx < 0) return prevL;

    const pos = myIdx + 1;
    const total = sorted.length;

    // Top 10 = promote
    if (pos <= PROMOTION_ZONE && prevL !== "elite") {
      return getNextLeague(prevL) || prevL;
    }
    // Bottom 10 = relegate
    if (pos > total - RELEGATION_ZONE && prevL !== "bronze") {
      return getPrevLeague(prevL) || prevL;
    }
    return prevL;
  };

  const assignGroup = async (seasonId: string, league: LeagueKey): Promise<number> => {
    // Count users per group in this league/season
    const { data: existing } = await supabase
      .from("user_leagues")
      .select("group_number")
      .eq("season_id", seasonId)
      .eq("league", league);

    if (!existing || existing.length === 0) return 1;

    const groupCounts = new Map<number, number>();
    existing.forEach((e: any) => {
      const g = e.group_number;
      groupCounts.set(g, (groupCounts.get(g) || 0) + 1);
    });

    // Find group with space
    for (const [group, count] of groupCounts) {
      if (count < GROUP_SIZE) return group;
    }

    // All full, create new group
    return Math.max(...Array.from(groupCounts.keys())) + 1;
  };

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-secondary/60 rounded-lg" />
        <div className="h-48 bg-secondary/30 rounded-2xl" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-secondary/30 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight flex items-center gap-2.5">
          <Medal className="w-7 h-7 text-primary" />
          Minha Liga
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Compete no seu grupo e suba de divisão a cada temporada
        </p>
      </div>

      {/* League Card */}
      <div className="glass-card p-5 lg:p-6 glow-border relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-56 h-56 bg-gradient-to-bl ${leagueInfo.bgClass} rounded-bl-full opacity-60`} />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center border border-primary/15 shadow-lg">
                <span className="text-3xl">{leagueInfo.emoji}</span>
              </div>
              <div>
                <p className="text-[11px] text-primary font-semibold uppercase tracking-wider">🏅 Liga Atual</p>
                <h3 className="font-display font-bold text-xl">{leagueInfo.label}</h3>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <Users className="w-3 h-3" />
                  Grupo {myGroup} • {totalMembers} competidores
                </p>
              </div>
            </div>
            <div className="text-right">
              {myPosition && (
                <>
                  <p className="text-3xl font-display font-bold text-primary">#{myPosition}</p>
                  <p className="text-[10px] text-muted-foreground">Posição</p>
                </>
              )}
            </div>
          </div>

          {/* Zone indicator */}
          <div className={`p-3 rounded-xl border text-sm font-medium flex items-center gap-2 ${
            zone === "promotion"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : zone === "relegation"
              ? "bg-red-500/10 border-red-500/20 text-red-400"
              : "bg-secondary/40 border-border/30 text-muted-foreground"
          }`}>
            {zone === "promotion" && <><ChevronUp className="w-4 h-4" /> Zona de Promoção — Top {PROMOTION_ZONE} sobem para {getLeagueInfo(getNextLeague(myLeague) || myLeague).label}</>}
            {zone === "relegation" && <><ChevronDown className="w-4 h-4" /> Zona de Rebaixamento — Últimos {RELEGATION_ZONE} descem para {getLeagueInfo(getPrevLeague(myLeague) || myLeague).label}</>}
            {zone === "neutral" && <><Minus className="w-4 h-4" /> Zona de Manutenção — Permanece na liga {leagueInfo.label}</>}
          </div>

          {/* Season info */}
          <div className="flex items-center justify-between mt-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{seasonName}</span>
            <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{daysLeft} dias restantes</span>
          </div>
        </div>
      </div>

      {/* League Tiers */}
      <div className="grid grid-cols-4 gap-2">
        {LEAGUES.map(l => {
          const isActive = l.key === myLeague;
          return (
            <div key={l.key} className={`p-3 rounded-xl border text-center transition-all ${
              isActive
                ? "bg-primary/10 border-primary/20 shadow-[0_0_20px_-5px_hsl(var(--primary)/0.2)]"
                : "bg-secondary/30 border-border/20 opacity-50"
            }`}>
              <span className="text-xl">{l.emoji}</span>
              <p className={`text-[11px] font-semibold mt-1 ${isActive ? "text-primary" : "text-muted-foreground"}`}>{l.label}</p>
            </div>
          );
        })}
      </div>

      {/* Group Ranking */}
      <div className="glass-card p-5 lg:p-6">
        <h3 className="font-display font-semibold text-base mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          Ranking do Grupo {myGroup}
        </h3>

        {groupMembers.length > 0 ? (
          <div className="space-y-1.5">
            {groupMembers.map((member, idx) => {
              const pos = idx + 1;
              const isMe = member.user_id === user?.id;
              const isPromoZone = myLeague !== "elite" && pos <= PROMOTION_ZONE;
              const isRelegZone = myLeague !== "bronze" && pos > totalMembers - RELEGATION_ZONE;

              return (
                <div
                  key={member.user_id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    isMe
                      ? "bg-primary/5 border-primary/15 shadow-[0_0_20px_-6px_hsl(var(--primary)/0.2)]"
                      : isPromoZone
                      ? "bg-emerald-500/5 border-emerald-500/10"
                      : isRelegZone
                      ? "bg-red-500/5 border-red-500/10"
                      : "bg-secondary/20 border-border/15"
                  }`}
                >
                  {/* Position */}
                  <div className="w-8 text-center shrink-0">
                    {pos <= 3 ? (
                      <span className="text-lg">{pos === 1 ? "👑" : pos === 2 ? "🥈" : "🥉"}</span>
                    ) : (
                      <span className={`text-sm font-bold ${
                        isPromoZone ? "text-emerald-400" : isRelegZone ? "text-red-400" : "text-muted-foreground"
                      }`}>
                        {pos}
                      </span>
                    )}
                  </div>

                  {/* Zone indicator bar */}
                  <div className={`w-1 h-8 rounded-full shrink-0 ${
                    isPromoZone ? "bg-emerald-500" : isRelegZone ? "bg-red-500" : "bg-border/30"
                  }`} />

                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    isMe
                      ? "bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/15"
                      : "bg-secondary/40 border border-border/20"
                  }`}>
                    <span className={`text-sm font-bold ${isMe ? "text-primary" : "text-muted-foreground"}`}>
                      {member.user_name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isMe ? "text-primary" : ""}`}>
                      {member.user_name}{isMe ? " (Você)" : ""}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Nível {member.season_level}
                    </p>
                  </div>

                  {/* XP */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-display font-bold">{member.season_xp}</p>
                    <p className="text-[9px] text-muted-foreground">XP</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum competidor no grupo ainda</p>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 mt-5 pt-4 border-t border-border/20">
          {myLeague !== "elite" && (
            <div className="flex items-center gap-1.5 text-[10px]">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">Promoção (Top {PROMOTION_ZONE})</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-[10px]">
            <div className="w-2.5 h-2.5 rounded-full bg-border/50" />
            <span className="text-muted-foreground">Manutenção</span>
          </div>
          {myLeague !== "bronze" && (
            <div className="flex items-center gap-1.5 text-[10px]">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-muted-foreground">Rebaixamento (Últimos {RELEGATION_ZONE})</span>
            </div>
          )}
        </div>
      </div>

      {/* End of Season Rewards */}
      <div className="glass-card p-5">
        <h3 className="font-display font-semibold text-base mb-3 flex items-center gap-2">
          <Star className="w-5 h-5 text-primary" />
          Recompensas de Final de Temporada
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {LEAGUES.map(l => (
            <div key={l.key} className={`p-4 rounded-xl border text-center ${
              l.key === myLeague ? "border-primary/20 bg-primary/5" : "border-border/20 bg-secondary/20 opacity-60"
            }`}>
              <span className="text-2xl">{l.emoji}</span>
              <p className="text-xs font-semibold mt-2">{l.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {l.key === "elite" ? "Badge Elite + Conquista Rara" : `Badge ${l.label}`}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MinhaLiga;
