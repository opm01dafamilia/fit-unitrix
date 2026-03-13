import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Target, Flame, Trophy, Clock, Zap, Star, Sparkles,
  Dumbbell, UtensilsCrossed, TrendingUp, Share2, CheckCircle2,
  XCircle, Play, Crown, Medal
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/sonner";
import { format, startOfWeek, endOfWeek, differenceInHours, differenceInDays, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";

type ChallengeDefinition = {
  challenge_type: string;
  title: string;
  description: string;
  icon: string;
  target_value: number;
  xp_reward: number;
  difficulty: string;
};

type ActiveChallenge = {
  id: string;
  challenge_type: string;
  title: string;
  description: string;
  icon: string;
  target_value: number;
  xp_reward: number;
  difficulty: string;
  progress: number;
  completed: boolean;
  completed_at: string | null;
  joined: boolean;
};

type TopParticipant = {
  user_id: string;
  user_name: string;
  completed_count: number;
  total_xp: number;
};

const CHALLENGE_POOL: ChallengeDefinition[] = [
  { challenge_type: "workouts_4", title: "Semana de Treino", description: "Complete 4 treinos esta semana", icon: "💪", target_value: 4, xp_reward: 40, difficulty: "medio" },
  { challenge_type: "workouts_3", title: "Trilogia Fitness", description: "Complete 3 treinos esta semana", icon: "🏋️", target_value: 3, xp_reward: 20, difficulty: "pequeno" },
  { challenge_type: "workouts_5", title: "Máquina de Treino", description: "Complete 5 treinos esta semana", icon: "🔥", target_value: 5, xp_reward: 80, difficulty: "grande" },
  { challenge_type: "meals_10", title: "Dieta Controlada", description: "Marque 10 refeições como feitas", icon: "🥗", target_value: 10, xp_reward: 40, difficulty: "medio" },
  { challenge_type: "meals_5", title: "Alimentação Consciente", description: "Marque 5 refeições como feitas", icon: "🍽️", target_value: 5, xp_reward: 20, difficulty: "pequeno" },
  { challenge_type: "streak_7", title: "Semana Invicta", description: "Mantenha streak de 7 dias", icon: "🔥", target_value: 7, xp_reward: 80, difficulty: "grande" },
  { challenge_type: "streak_4", title: "Fogo Aceso", description: "Mantenha streak de 4 dias", icon: "⚡", target_value: 4, xp_reward: 40, difficulty: "medio" },
  { challenge_type: "diet_days_5", title: "Disciplina Total", description: "Não falhe na dieta por 5 dias", icon: "🎯", target_value: 5, xp_reward: 80, difficulty: "grande" },
  { challenge_type: "diet_days_3", title: "Dieta em Dia", description: "Não falhe na dieta por 3 dias", icon: "✅", target_value: 3, xp_reward: 20, difficulty: "pequeno" },
  { challenge_type: "exercises_30", title: "Volume Total", description: "Complete 30 exercícios no total", icon: "💥", target_value: 30, xp_reward: 40, difficulty: "medio" },
  { challenge_type: "feed_post_1", title: "Primeira Partilha", description: "Compartilhe 1 evolução no feed", icon: "📢", target_value: 1, xp_reward: 20, difficulty: "pequeno" },
];

// Deterministic selection of 3 challenges based on week
function selectWeeklyChallenges(weekStart: string): ChallengeDefinition[] {
  const seed = weekStart.split("-").reduce((a, b) => a + parseInt(b), 0);
  const shuffled = [...CHALLENGE_POOL].sort((a, b) => {
    const ha = (a.challenge_type.charCodeAt(0) * 31 + a.challenge_type.charCodeAt(a.challenge_type.length - 1) * 17 + seed) % 1000;
    const hb = (b.challenge_type.charCodeAt(0) * 31 + b.challenge_type.charCodeAt(b.challenge_type.length - 1) * 17 + seed) % 1000;
    return ha - hb;
  });
  // Pick one from each difficulty tier
  const pequeno = shuffled.find(c => c.difficulty === "pequeno");
  const medio = shuffled.find(c => c.difficulty === "medio");
  const grande = shuffled.find(c => c.difficulty === "grande");
  return [pequeno!, medio!, grande!].filter(Boolean);
}

const difficultyConfig: Record<string, { label: string; color: string; bgClass: string }> = {
  pequeno: { label: "+20 XP", color: "text-chart-2", bgClass: "bg-chart-2/10 border-chart-2/15 text-chart-2" },
  medio: { label: "+40 XP", color: "text-chart-3", bgClass: "bg-chart-3/10 border-chart-3/15 text-chart-3" },
  grande: { label: "+80 XP", color: "text-red-400", bgClass: "bg-red-500/10 border-red-500/15 text-red-400" },
};

const Desafios = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [challenges, setChallenges] = useState<ActiveChallenge[]>([]);
  const [celebratingId, setCelebratingId] = useState<string | null>(null);
  const [topParticipants, setTopParticipants] = useState<TopParticipant[]>([]);

  // Week starts on Sunday
  const weekStart = useMemo(() => format(startOfWeek(new Date(), { weekStartsOn: 0 }), "yyyy-MM-dd"), []);
  const weekEnd = useMemo(() => endOfWeek(new Date(), { weekStartsOn: 0 }), []);
  const hoursLeft = useMemo(() => Math.max(0, differenceInHours(weekEnd, new Date())), [weekEnd]);
  const daysLeft = useMemo(() => Math.max(0, differenceInDays(weekEnd, new Date())), [weekEnd]);
  const weekExpired = useMemo(() => isBefore(weekEnd, new Date()), [weekEnd]);

  const ensureChallengesExist = useCallback(async () => {
    if (!user) return;
    const selected = selectWeeklyChallenges(weekStart);

    for (const ch of selected) {
      await supabase.from("weekly_challenges").upsert({
        challenge_type: ch.challenge_type,
        title: ch.title,
        description: ch.description,
        icon: ch.icon,
        target_value: ch.target_value,
        xp_reward: ch.xp_reward,
        difficulty: ch.difficulty,
        week_start: weekStart,
      } as any, { onConflict: "challenge_type,week_start" });
    }
  }, [user, weekStart]);

  const computeProgress = useCallback(async (challengeType: string): Promise<number> => {
    if (!user) return 0;
    const weekStartDate = startOfWeek(new Date(), { weekStartsOn: 0 });

    if (challengeType.startsWith("workouts_")) {
      const { count } = await supabase.from("workout_sessions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("completed_at", weekStartDate.toISOString());
      return count || 0;
    }

    if (challengeType.startsWith("meals_")) {
      const { data } = await supabase.from("diet_tracking")
        .select("meals_done")
        .eq("user_id", user.id)
        .gte("tracked_date", format(weekStartDate, "yyyy-MM-dd"));
      return (data || []).reduce((a, d) => a + (d.meals_done || 0), 0);
    }

    if (challengeType.startsWith("streak_")) {
      const { data } = await supabase.from("workout_sessions")
        .select("completed_at")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false })
        .limit(30);
      if (!data || data.length === 0) return 0;
      const days = [...new Set(data.map(s => format(new Date(s.completed_at), "yyyy-MM-dd")))].sort().reverse();
      let streak = 0;
      const today = format(new Date(), "yyyy-MM-dd");
      const yesterday = format(new Date(Date.now() - 86400000), "yyyy-MM-dd");
      if (days[0] === today || days[0] === yesterday) {
        for (let i = 0; i < days.length; i++) {
          const expected = format(new Date(Date.now() - (i + (days[0] === today ? 0 : 1)) * 86400000), "yyyy-MM-dd");
          if (days[i] === expected) streak++;
          else break;
        }
      }
      return streak;
    }

    if (challengeType.startsWith("exercises_")) {
      const { data } = await supabase.from("workout_sessions")
        .select("exercises_completed")
        .eq("user_id", user.id)
        .gte("completed_at", weekStartDate.toISOString());
      return (data || []).reduce((a, s) => a + (s.exercises_completed || 0), 0);
    }

    if (challengeType.startsWith("diet_days_")) {
      const { count } = await supabase.from("diet_tracking")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("all_completed", true)
        .gte("tracked_date", format(weekStartDate, "yyyy-MM-dd"));
      return count || 0;
    }

    if (challengeType.startsWith("feed_post_")) {
      const { count } = await supabase.from("activity_feed")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", weekStartDate.toISOString());
      return count || 0;
    }

    return 0;
  }, [user]);

  const loadTopParticipants = useCallback(async () => {
    // Get all completed challenges this week with user info
    const { data } = await supabase
      .from("user_challenge_progress")
      .select("user_id, completed, challenge_id")
      .eq("completed", true);

    if (!data || data.length === 0) return;

    // Get challenge IDs for this week
    const { data: weekChallenges } = await supabase
      .from("weekly_challenges")
      .select("id, xp_reward")
      .eq("week_start", weekStart);

    if (!weekChallenges) return;
    const weekChallengeIds = new Set(weekChallenges.map(c => c.id));
    const xpMap = new Map(weekChallenges.map(c => [c.id, (c as any).xp_reward || 20]));

    // Filter to this week's completions
    const weekCompletions = data.filter(d => weekChallengeIds.has(d.challenge_id));

    // Aggregate per user
    const userMap = new Map<string, { completed_count: number; total_xp: number }>();
    weekCompletions.forEach(d => {
      const existing = userMap.get(d.user_id) || { completed_count: 0, total_xp: 0 };
      existing.completed_count += 1;
      existing.total_xp += xpMap.get(d.challenge_id) || 20;
      userMap.set(d.user_id, existing);
    });

    if (userMap.size === 0) return;

    // Get user names
    const userIds = [...userMap.keys()];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", userIds);

    const nameMap = new Map((profiles || []).map(p => [p.user_id, p.full_name || "Usuário"]));

    const participants: TopParticipant[] = userIds
      .map(uid => ({
        user_id: uid,
        user_name: nameMap.get(uid) || "Usuário",
        completed_count: userMap.get(uid)!.completed_count,
        total_xp: userMap.get(uid)!.total_xp,
      }))
      .sort((a, b) => b.total_xp - a.total_xp || b.completed_count - a.completed_count)
      .slice(0, 10);

    setTopParticipants(participants);
  }, [weekStart]);

  const handleJoinChallenge = async (challengeId: string) => {
    if (!user) return;
    await supabase.from("user_challenge_progress").upsert({
      user_id: user.id,
      challenge_id: challengeId,
      current_value: 0,
      completed: false,
      completed_at: null,
    }, { onConflict: "user_id,challenge_id" });
    toast.success("Você entrou no desafio! 💪");
    loadChallenges();
  };

  const loadChallenges = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    await ensureChallengesExist();

    const { data: challengeData } = await supabase
      .from("weekly_challenges")
      .select("*")
      .eq("week_start", weekStart)
      .order("created_at", { ascending: true })
      .limit(3);

    if (!challengeData || challengeData.length === 0) {
      setLoading(false);
      return;
    }

    // Fetch user progress
    const { data: progressData } = await supabase
      .from("user_challenge_progress")
      .select("*")
      .eq("user_id", user.id);

    const progressMap = new Map((progressData || []).map(p => [p.challenge_id, p]));

    const results: ActiveChallenge[] = [];
    for (const ch of challengeData) {
      const prog = progressMap.get(ch.id);
      const joined = !!prog;
      let actualProgress = 0;

      if (joined) {
        actualProgress = await computeProgress(ch.challenge_type);
        const target = ch.target_value;
        const isCompleted = actualProgress >= target;

        // Auto-update progress
        await supabase.from("user_challenge_progress").upsert({
          user_id: user.id,
          challenge_id: ch.id,
          current_value: Math.min(actualProgress, target),
          completed: isCompleted,
          completed_at: isCompleted && !prog?.completed ? new Date().toISOString() : prog?.completed_at || null,
        }, { onConflict: "user_id,challenge_id" });

        if (isCompleted && !prog?.completed) {
          setCelebratingId(ch.id);
          setTimeout(() => setCelebratingId(null), 3000);
          toast.success(`🎉 Desafio "${ch.title}" concluído! +${(ch as any).xp_reward || 20} XP`, { duration: 5000 });
        }
      }

      const target = ch.target_value;
      results.push({
        id: ch.id,
        challenge_type: ch.challenge_type,
        title: ch.title,
        description: ch.description,
        icon: ch.icon,
        target_value: target,
        xp_reward: (ch as any).xp_reward || 20,
        difficulty: (ch as any).difficulty || "medio",
        progress: joined ? Math.min(actualProgress, target) : 0,
        completed: joined ? actualProgress >= target : false,
        completed_at: joined && actualProgress >= target ? (prog?.completed_at || new Date().toISOString()) : null,
        joined,
      });
    }

    setChallenges(results);
    setLoading(false);
  }, [user, weekStart, ensureChallengesExist, computeProgress]);

  useEffect(() => {
    loadChallenges();
    loadTopParticipants();
  }, [loadChallenges, loadTopParticipants]);

  const completedCount = challenges.filter(c => c.completed).length;
  const joinedCount = challenges.filter(c => c.joined).length;
  const totalXPEarned = challenges.filter(c => c.completed).reduce((a, c) => a + c.xp_reward, 0);
  const totalXPPossible = challenges.reduce((a, c) => a + c.xp_reward, 0);

  const nextChallenge = challenges.find(c => c.joined && !c.completed);
  const nextRemaining = nextChallenge ? nextChallenge.target_value - nextChallenge.progress : 0;

  const getStatusLabel = (ch: ActiveChallenge) => {
    if (ch.completed) return { text: "Concluído", icon: CheckCircle2, class: "bg-primary/15 border-primary/20 text-primary" };
    if (ch.joined && weekExpired) return { text: "Falhou", icon: XCircle, class: "bg-destructive/15 border-destructive/20 text-destructive" };
    if (ch.joined) return { text: "Em andamento", icon: Play, class: "bg-chart-3/15 border-chart-3/20 text-chart-3" };
    return null;
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-secondary/60 rounded-lg" />
        <div className="h-4 w-32 bg-secondary/40 rounded" />
        <div className="h-40 bg-secondary/30 rounded-2xl" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-36 bg-secondary/30 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight flex items-center gap-2.5">
          <Trophy className="w-7 h-7 text-primary" />
          Desafios Semanais
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Participe dos desafios globais e ganhe XP
        </p>
      </div>

      {/* Week status card */}
      <div className="glass-card p-5 lg:p-6 glow-border relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-primary/8 to-transparent rounded-bl-full" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/15">
                <Zap className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg">{completedCount}/{challenges.length} Concluídos</h3>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  {daysLeft > 0 ? `${daysLeft}d ${hoursLeft % 24}h restantes` : `${hoursLeft}h restantes`}
                  <span className="mx-1">•</span>
                  Reinicia domingo
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-display font-bold text-primary">+{totalXPEarned}</p>
              <p className="text-[9px] text-muted-foreground">de {totalXPPossible} XP</p>
            </div>
          </div>

          <div className="mb-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-muted-foreground">Progresso semanal</span>
              <span className="text-[11px] font-bold text-primary">
                {challenges.length > 0 ? Math.round((completedCount / challenges.length) * 100) : 0}%
              </span>
            </div>
            <Progress value={challenges.length > 0 ? (completedCount / challenges.length) * 100 : 0} className="h-2.5" />
          </div>

          {completedCount === challenges.length && challenges.length > 0 && (
            <div className="mt-3 p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-2 animate-pulse">
              <Sparkles className="w-4 h-4 text-primary" />
              <p className="text-sm font-medium text-primary">🏆 Semana perfeita! Todos os desafios completos!</p>
            </div>
          )}
        </div>
      </div>

      {/* Motivation banner */}
      {nextChallenge && (
        <div className="glass-card p-4 border-orange-500/15 bg-orange-500/5">
          <p className="text-sm font-medium flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <span>
              {nextChallenge.challenge_type.startsWith("workouts_")
                ? `Faltam ${nextRemaining} treinos para completar "${nextChallenge.title}"!`
                : nextChallenge.challenge_type.startsWith("meals_")
                ? `Faltam ${nextRemaining} refeições para "${nextChallenge.title}"!`
                : nextChallenge.challenge_type.startsWith("streak_")
                ? `Mais ${nextRemaining} dias de streak para "${nextChallenge.title}"!`
                : `Faltam ${nextRemaining} para completar "${nextChallenge.title}"!`
              }
            </span>
          </p>
        </div>
      )}

      {/* Challenge cards */}
      <div className="space-y-3">
        {challenges.map((ch) => {
          const pct = ch.joined ? Math.min(100, Math.round((ch.progress / ch.target_value) * 100)) : 0;
          const isCelebrating = celebratingId === ch.id;
          const status = getStatusLabel(ch);
          const dc = difficultyConfig[ch.difficulty] || difficultyConfig.medio;

          return (
            <div
              key={ch.id}
              className={`glass-card p-5 relative overflow-hidden transition-all duration-500 ${
                ch.completed
                  ? "border-primary/20 shadow-[0_0_24px_-6px_hsl(var(--primary)/0.2)]"
                  : "hover:border-border/40"
              } ${isCelebrating ? "animate-pulse scale-[1.01]" : ""}`}
            >
              {/* Status badge */}
              {status && (
                <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${status.class}`}>
                  <status.icon className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold">{status.text}</span>
                </div>
              )}

              {/* XP badge when not joined */}
              {!ch.joined && (
                <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-lg border ${dc.bgClass}`}>
                  <span className="text-[10px] font-bold">{dc.label}</span>
                </div>
              )}

              <div className="flex items-start gap-4 mb-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                  ch.completed
                    ? "bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/15"
                    : "bg-gradient-to-br from-secondary/80 to-secondary/40 border border-border/30"
                }`}>
                  {ch.icon}
                </div>
                <div className="flex-1 min-w-0 pr-20">
                  <h4 className="font-display font-semibold text-sm">{ch.title}</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{ch.description}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${dc.bgClass}`}>
                      {ch.difficulty === "grande" ? "Difícil" : ch.difficulty === "medio" ? "Médio" : "Fácil"}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${dc.bgClass}`}>
                      {dc.label}
                    </span>
                    {ch.completed && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold border border-primary/15">
                        ✅ XP ganhos
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress bar (only if joined) */}
              {ch.joined && (
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-muted-foreground">Progresso</span>
                    <span className={`text-[11px] font-bold ${ch.completed ? "text-primary" : "text-foreground"}`}>
                      {ch.progress}/{ch.target_value}
                    </span>
                  </div>
                  <div className="h-3 bg-secondary/60 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        ch.completed
                          ? "bg-gradient-to-r from-primary to-chart-2"
                          : "bg-gradient-to-r from-primary/70 to-primary"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Join button */}
              {!ch.joined && !weekExpired && (
                <Button
                  onClick={() => handleJoinChallenge(ch.id)}
                  className="w-full gap-2"
                  size="sm"
                >
                  <Play className="w-4 h-4" />
                  Participar
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {challenges.length === 0 && (
        <div className="glass-card p-10 text-center">
          <Target className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Nenhum desafio disponível. Atualize a página.</p>
        </div>
      )}

      {/* Top Participants */}
      {topParticipants.length > 0 && (
        <div className="glass-card p-5 lg:p-6">
          <h3 className="font-display font-semibold text-base mb-4 flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            Top Participantes da Semana
          </h3>
          <div className="space-y-2">
            {topParticipants.map((p, i) => (
              <div
                key={p.user_id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  i < 3
                    ? "bg-gradient-to-r from-yellow-500/5 to-transparent border-yellow-500/15"
                    : "bg-secondary/20 border-border/20"
                } ${p.user_id === user?.id ? "ring-1 ring-primary/30" : ""}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                  i === 0 ? "bg-yellow-500/20 text-yellow-500" :
                  i === 1 ? "bg-gray-400/20 text-gray-400" :
                  i === 2 ? "bg-orange-500/20 text-orange-500" :
                  "bg-secondary/50 text-muted-foreground"
                }`}>
                  {i === 0 ? "👑" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {p.user_name}
                    {p.user_id === user?.id && <span className="text-[10px] text-primary ml-1.5">(você)</span>}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{p.completed_count} desafio{p.completed_count > 1 ? "s" : ""} concluído{p.completed_count > 1 ? "s" : ""}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">+{p.total_xp}</p>
                  <p className="text-[9px] text-muted-foreground">XP</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Share card */}
      {completedCount > 0 && (
        <div className="glass-card p-5 text-center">
          <p className="text-sm font-medium mb-3">
            🔥 Você completou {completedCount} desafio{completedCount > 1 ? "s" : ""} esta semana!
          </p>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              const text = `💪 Completei ${completedCount}/${challenges.length} desafios semanais no FitPulse! +${totalXPEarned} XP! #FitPulse`;
              if (navigator.share) {
                navigator.share({ title: "FitPulse Desafios", text }).catch(() => {});
              } else {
                navigator.clipboard.writeText(text);
                toast.success("Copiado para compartilhar!");
              }
            }}
          >
            <Share2 className="w-4 h-4" />
            Compartilhar Progresso
          </Button>
        </div>
      )}

      {/* Info */}
      <div className="glass-card p-4 text-center">
        <p className="text-sm text-muted-foreground">
          💡 <span className="font-medium text-foreground">Desafios renovam todo domingo.</span> Participe e ganhe XP para subir no ranking!
        </p>
      </div>
    </div>
  );
};

export default Desafios;
