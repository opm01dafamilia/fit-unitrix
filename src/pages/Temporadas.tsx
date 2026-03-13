import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Flame, Trophy, Star, Clock, Zap, Crown, Medal, Gift, Shield,
  TrendingUp, CheckCircle2, Lock, Sparkles, History, ChevronRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { format, differenceInDays, addDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

// Season level thresholds
const SEASON_LEVELS = [
  { level: 1, xp: 0 },
  { level: 2, xp: 100 },
  { level: 3, xp: 250 },
  { level: 4, xp: 450 },
  { level: 5, xp: 700 },
  { level: 6, xp: 1000 },
  { level: 7, xp: 1350 },
  { level: 8, xp: 1750 },
  { level: 9, xp: 2200 },
  { level: 10, xp: 2700 },
];

const SEASON_REWARDS: Record<number, { badge: string; title: string; description: string }> = {
  1: { badge: "🌱", title: "Iniciante da Season", description: "Começou a temporada!" },
  2: { badge: "⚡", title: "Acelerado", description: "Tema: Neon Pulse" },
  3: { badge: "🔥", title: "Em Chamas", description: "Badge exclusivo desbloqueado" },
  4: { badge: "💎", title: "Diamante Bruto", description: "Bônus +5% ranking" },
  5: { badge: "🏆", title: "Campeão Season", description: "Conquista especial Season" },
  6: { badge: "👑", title: "Realeza Fitness", description: "Tema: Royal Gold" },
  7: { badge: "🌟", title: "Estrela Suprema", description: "Badge lendário" },
  8: { badge: "🔱", title: "Titã", description: "Bônus +10% ranking" },
  9: { badge: "🐉", title: "Dragão Fitness", description: "Tema: Dragon Fire" },
  10: { badge: "💫", title: "Lenda Viva", description: "Recompensa máxima da Season" },
};

function getSeasonLevel(xp: number) {
  let level = 1;
  for (const l of SEASON_LEVELS) {
    if (xp >= l.xp) level = l.level;
    else break;
  }
  return level;
}

function getSeasonLevelProgress(xp: number) {
  const level = getSeasonLevel(xp);
  const currentThreshold = SEASON_LEVELS.find(l => l.level === level)?.xp || 0;
  const nextLevel = SEASON_LEVELS.find(l => l.level === level + 1);
  if (!nextLevel) return 100;
  const needed = nextLevel.xp - currentThreshold;
  const progress = xp - currentThreshold;
  return Math.min(100, Math.round((progress / needed) * 100));
}

function getSeasonName(startDate: string) {
  const d = new Date(startDate);
  const month = d.getMonth();
  if (month < 3) return "❄️ Season Inverno";
  if (month < 6) return "🌸 Season Primavera";
  if (month < 9) return "☀️ Season Verão";
  return "🍂 Season Outono";
}

type SeasonRankEntry = {
  user_id: string;
  user_name: string;
  season_xp: number;
  season_level: number;
};

type PastSeason = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  season_xp: number;
  season_level: number;
  final_position: number | null;
};

const Temporadas = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"season" | "ranking" | "history">("season");
  const [seasonXP, setSeasonXP] = useState(0);
  const [seasonId, setSeasonId] = useState<string | null>(null);
  const [seasonName, setSeasonName] = useState("");
  const [daysLeft, setDaysLeft] = useState(0);
  const [totalDays, setTotalDays] = useState(30);
  const [rankingData, setRankingData] = useState<SeasonRankEntry[]>([]);
  const [userPosition, setUserPosition] = useState<number | null>(null);
  const [pastSeasons, setPastSeasons] = useState<PastSeason[]>([]);
  const [seasonEnded, setSeasonEnded] = useState(false);

  const seasonLevel = useMemo(() => getSeasonLevel(seasonXP), [seasonXP]);
  const levelProgress = useMemo(() => getSeasonLevelProgress(seasonXP), [seasonXP]);
  const nextLevelXP = useMemo(() => {
    const next = SEASON_LEVELS.find(l => l.level === seasonLevel + 1);
    return next ? next.xp - seasonXP : 0;
  }, [seasonXP, seasonLevel]);

  const ensureActiveSeason = useCallback(async () => {
    const today = format(new Date(), "yyyy-MM-dd");

    // Check for active season
    const { data: active } = await supabase
      .from("seasons")
      .select("*")
      .eq("status", "active")
      .limit(1);

    if (active && active.length > 0) {
      const s = active[0];
      const end = new Date(s.end_date);
      if (new Date(today) > end) {
        // Season expired - finalize it
        await supabase.from("seasons").update({ status: "completed" } as any).eq("id", s.id);
        // Save final positions
        await finalizeSeasonPositions(s.id);
        setSeasonEnded(true);
        // Create new season
        return await createNewSeason();
      }
      return s;
    }

    // No active season, create one
    return await createNewSeason();
  }, []);

  const createNewSeason = async () => {
    const today = new Date();
    const startDate = format(today, "yyyy-MM-dd");
    const endDate = format(addDays(today, 29), "yyyy-MM-dd");
    const name = getSeasonName(startDate);

    const { data, error } = await supabase.from("seasons").insert({
      name,
      start_date: startDate,
      end_date: endDate,
      status: "active",
    } as any).select().single();

    return data;
  };

  const finalizeSeasonPositions = async (sId: string) => {
    const { data: allProgress } = await supabase
      .from("user_season_progress")
      .select("*")
      .eq("season_id", sId)
      .order("season_xp", { ascending: false });

    if (allProgress) {
      for (let i = 0; i < allProgress.length; i++) {
        await supabase.from("user_season_progress")
          .update({ final_position: i + 1 } as any)
          .eq("id", allProgress[i].id);
      }
    }
  };

  const computeSeasonXP = useCallback(async (seasonStart: string) => {
    if (!user) return 0;
    let xp = 0;

    // Workouts in season period = 15 XP each
    const { count: workouts } = await supabase
      .from("workout_sessions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("completed_at", seasonStart);
    xp += (workouts || 0) * 15;

    // Diet days completed = 10 XP each
    const { count: dietDays } = await supabase
      .from("diet_tracking")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("all_completed", true)
      .gte("tracked_date", seasonStart);
    xp += (dietDays || 0) * 10;

    // Feed posts = 5 XP each
    const { count: posts } = await supabase
      .from("activity_feed")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", seasonStart);
    xp += (posts || 0) * 5;

    // Completed challenges = challenge XP
    const { data: challengeProgress } = await supabase
      .from("user_challenge_progress")
      .select("challenge_id")
      .eq("user_id", user.id)
      .eq("completed", true);

    if (challengeProgress && challengeProgress.length > 0) {
      const challengeIds = challengeProgress.map(c => c.challenge_id);
      const { data: challenges } = await supabase
        .from("weekly_challenges")
        .select("xp_reward")
        .in("id", challengeIds)
        .gte("week_start", seasonStart);
      xp += (challenges || []).reduce((a, c) => a + ((c as any).xp_reward || 0), 0);
    }

    return xp;
  }, [user]);

  const loadSeasonRanking = useCallback(async (sId: string) => {
    const { data } = await supabase
      .from("user_season_progress")
      .select("user_id, season_xp, season_level")
      .eq("season_id", sId)
      .order("season_xp", { ascending: false })
      .limit(50);

    if (!data || data.length === 0) {
      setRankingData([]);
      return;
    }

    const userIds = data.map(d => d.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", userIds);

    const nameMap = new Map((profiles || []).map(p => [p.user_id, p.full_name || "Usuário"]));

    const entries: SeasonRankEntry[] = data.map(d => ({
      user_id: d.user_id,
      user_name: nameMap.get(d.user_id) || "Usuário",
      season_xp: d.season_xp,
      season_level: d.season_level,
    }));

    setRankingData(entries);
    const myPos = entries.findIndex(e => e.user_id === user?.id);
    setUserPosition(myPos >= 0 ? myPos + 1 : null);
  }, [user]);

  const loadPastSeasons = useCallback(async () => {
    if (!user) return;
    const { data: completed } = await supabase
      .from("seasons")
      .select("*")
      .eq("status", "completed")
      .order("end_date", { ascending: false })
      .limit(10);

    if (!completed || completed.length === 0) {
      setPastSeasons([]);
      return;
    }

    const seasonIds = completed.map(s => s.id);
    const { data: progress } = await supabase
      .from("user_season_progress")
      .select("*")
      .eq("user_id", user.id)
      .in("season_id", seasonIds);

    const progressMap = new Map((progress || []).map(p => [p.season_id, p]));

    const past: PastSeason[] = completed.map(s => {
      const p = progressMap.get(s.id);
      return {
        id: s.id,
        name: s.name,
        start_date: s.start_date,
        end_date: s.end_date,
        season_xp: p?.season_xp || 0,
        season_level: p?.season_level || 1,
        final_position: p?.final_position || null,
      };
    });

    setPastSeasons(past);
  }, [user]);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const season = await ensureActiveSeason();
    if (!season) { setLoading(false); return; }

    setSeasonId(season.id);
    setSeasonName(season.name);
    const end = new Date(season.end_date);
    const remaining = Math.max(0, differenceInDays(end, new Date()) + 1);
    setDaysLeft(remaining);
    setTotalDays(differenceInDays(end, new Date(season.start_date)) + 1);

    // Compute season XP
    const xp = await computeSeasonXP(season.start_date);
    const level = getSeasonLevel(xp);
    setSeasonXP(xp);

    // Upsert user progress
    await supabase.from("user_season_progress").upsert({
      user_id: user.id,
      season_id: season.id,
      season_xp: xp,
      season_level: level,
    } as any, { onConflict: "user_id,season_id" });

    await Promise.all([
      loadSeasonRanking(season.id),
      loadPastSeasons(),
    ]);

    setLoading(false);
  }, [user, ensureActiveSeason, computeSeasonXP, loadSeasonRanking, loadPastSeasons]);

  useEffect(() => { loadData(); }, [loadData]);

  const getMedalIcon = (pos: number) => {
    if (pos === 1) return "👑";
    if (pos === 2) return "🥈";
    if (pos === 3) return "🥉";
    if (pos <= 10) return "🔥";
    return "⭐";
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-secondary/60 rounded-lg" />
        <div className="h-4 w-32 bg-secondary/40 rounded" />
        <div className="h-48 bg-secondary/30 rounded-2xl" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-secondary/30 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight flex items-center gap-2.5">
          <Flame className="w-7 h-7 text-primary" />
          Temporadas
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Suba de nível a cada temporada e ganhe recompensas exclusivas
        </p>
      </div>

      {/* Season ended banner */}
      {seasonEnded && (
        <div className="glass-card p-5 border-primary/20 bg-primary/5 text-center animate-pulse">
          <p className="text-lg font-display font-bold">🎉 Temporada Finalizada!</p>
          <p className="text-sm text-muted-foreground mt-1">Nova temporada começou. Continue evoluindo!</p>
        </div>
      )}

      {/* Active Season Card */}
      <div className="glass-card p-5 lg:p-6 glow-border relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-primary/8 to-transparent rounded-bl-full" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/15">
                <span className="text-2xl">{SEASON_REWARDS[seasonLevel]?.badge || "🌱"}</span>
              </div>
              <div>
                <p className="text-[11px] text-primary font-semibold uppercase tracking-wider">🔥 Temporada Ativa</p>
                <h3 className="font-display font-bold text-lg">{seasonName}</h3>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  {daysLeft} dias restantes
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-display font-bold text-primary">{seasonXP}</p>
              <p className="text-[10px] text-muted-foreground">XP Season</p>
            </div>
          </div>

          {/* Season Level Progress */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-primary" />
                Nível {seasonLevel}
                {seasonLevel < 10 && <span className="text-muted-foreground font-normal">→ Nível {seasonLevel + 1}</span>}
              </span>
              <span className="text-[11px] font-bold text-primary">{levelProgress}%</span>
            </div>
            <Progress value={levelProgress} className="h-3" />
            {nextLevelXP > 0 && (
              <p className="text-[10px] text-muted-foreground mt-1">Faltam {nextLevelXP} XP para o próximo nível</p>
            )}
          </div>

          {/* Days progress */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-muted-foreground">Progresso da temporada</span>
              <span className="text-[11px] font-bold">{Math.round(((totalDays - daysLeft) / totalDays) * 100)}%</span>
            </div>
            <Progress value={((totalDays - daysLeft) / totalDays) * 100} className="h-2" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: "season" as const, label: "Recompensas", icon: Gift },
          { key: "ranking" as const, label: "Ranking Season", icon: Trophy },
          { key: "history" as const, label: "Histórico", icon: History },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
              tab === t.key
                ? "bg-primary/10 border-primary/20 text-primary"
                : "bg-secondary/40 border-border/30 text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "season" && (
        <div className="space-y-3">
          <h3 className="font-display font-semibold text-base flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Recompensas por Nível
          </h3>
          <div className="grid gap-3">
            {SEASON_LEVELS.map(l => {
              const reward = SEASON_REWARDS[l.level];
              const unlocked = seasonLevel >= l.level;
              return (
                <div
                  key={l.level}
                  className={`glass-card p-4 flex items-center gap-4 transition-all ${
                    unlocked
                      ? "border-primary/15 bg-primary/5"
                      : "opacity-60"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                    unlocked
                      ? "bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/15"
                      : "bg-secondary/40 border border-border/30"
                  }`}>
                    {unlocked ? reward?.badge : <Lock className="w-5 h-5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">Nível {l.level} — {reward?.title}</p>
                      {unlocked && <CheckCircle2 className="w-4 h-4 text-primary" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground">{reward?.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-muted-foreground">{l.xp} XP</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "ranking" && (
        <div className="space-y-4">
          {userPosition && (
            <div className="glass-card p-4 border-primary/15 bg-primary/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm font-medium">
                  🔥 Você está em <span className="text-primary font-bold">#{userPosition}</span> na temporada
                </p>
              </div>
            </div>
          )}

          <div className="glass-card p-5 lg:p-6">
            <h3 className="font-display font-semibold text-base mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              🏆 Ranking Season
            </h3>
            {rankingData.length > 0 ? (
              <div className="space-y-2">
                {rankingData.map((entry, idx) => {
                  const pos = idx + 1;
                  const isMe = entry.user_id === user?.id;
                  const reward = SEASON_REWARDS[entry.season_level];
                  return (
                    <div
                      key={entry.user_id}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
                        isMe
                          ? "bg-primary/5 border-primary/15 shadow-[0_0_24px_-6px_hsl(var(--primary)/0.2)]"
                          : pos <= 3
                          ? "bg-gradient-to-r from-chart-3/5 to-transparent border-chart-3/10"
                          : "bg-secondary/30 border-border/20"
                      }`}
                    >
                      <div className="w-8 text-center shrink-0">
                        <span className="text-lg">{getMedalIcon(pos)}</span>
                      </div>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        pos <= 3
                          ? "bg-gradient-to-br from-chart-3/20 to-chart-3/5 border border-chart-3/15"
                          : "bg-gradient-to-br from-primary/15 to-primary/5"
                      }`}>
                        <span className={`text-sm font-bold ${pos <= 3 ? "text-chart-3" : "text-primary"}`}>
                          {entry.user_name?.charAt(0)?.toUpperCase() || "U"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${isMe ? "text-primary" : ""}`}>
                          {entry.user_name}{isMe ? " (Você)" : ""}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {reward?.badge} Nível {entry.season_level}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-display font-bold">{entry.season_xp}</p>
                        <p className="text-[9px] text-muted-foreground">XP Season</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Trophy className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum participante ainda</p>
                <p className="text-xs text-muted-foreground mt-1">Complete atividades para aparecer no ranking!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "history" && (
        <div className="space-y-4">
          <h3 className="font-display font-semibold text-base flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Histórico de Temporadas
          </h3>
          {pastSeasons.length > 0 ? (
            <div className="space-y-3">
              {pastSeasons.map(s => (
                <div key={s.id} className="glass-card p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary/60 to-secondary/30 flex items-center justify-center border border-border/30">
                    <span className="text-xl">{SEASON_REWARDS[s.season_level]?.badge || "🌱"}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{s.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {format(new Date(s.start_date), "dd MMM", { locale: ptBR })} — {format(new Date(s.end_date), "dd MMM yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold">{s.season_xp} XP</p>
                    <p className="text-[10px] text-muted-foreground">
                      Nível {s.season_level} {s.final_position ? `• #${s.final_position}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card p-8 text-center">
              <History className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma temporada finalizada ainda</p>
              <p className="text-xs text-muted-foreground mt-1">Complete a temporada atual para ver seu histórico aqui</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Temporadas;
