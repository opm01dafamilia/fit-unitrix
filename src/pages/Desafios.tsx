import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Target, Flame, Trophy, Clock, Zap, Star, Sparkles,
  Dumbbell, UtensilsCrossed, TrendingUp, Share2, CheckCircle2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/sonner";
import { format, startOfWeek, endOfWeek, differenceInHours, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { calculateTotalXP, getRankForXP, type UserStats } from "@/lib/achievementsEngine";

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
};

const CHALLENGE_POOL: Record<string, ChallengeDefinition[]> = {
  iniciante: [
    { challenge_type: "workouts_3", title: "Semana Ativa", description: "Complete 3 treinos esta semana", icon: "💪", target_value: 3, xp_reward: 15, difficulty: "iniciante" },
    { challenge_type: "meals_5", title: "Alimentação Consciente", description: "Marque 5 refeições como feitas", icon: "🥗", target_value: 5, xp_reward: 10, difficulty: "iniciante" },
    { challenge_type: "streak_2", title: "Consistência Inicial", description: "Mantenha um streak de 2 dias", icon: "🔥", target_value: 2, xp_reward: 10, difficulty: "iniciante" },
    { challenge_type: "exercises_15", title: "Volume Básico", description: "Complete 15 exercícios no total", icon: "🏋️", target_value: 15, xp_reward: 15, difficulty: "iniciante" },
    { challenge_type: "diet_days_2", title: "Dieta em Dia", description: "Complete todas as refeições por 2 dias", icon: "🍽️", target_value: 2, xp_reward: 10, difficulty: "iniciante" },
    { challenge_type: "feed_post_1", title: "Primeira Partilha", description: "Compartilhe 1 evolução no feed", icon: "📢", target_value: 1, xp_reward: 5, difficulty: "iniciante" },
    { challenge_type: "body_track_1", title: "Monitore-se", description: "Registre 1 medida corporal", icon: "📏", target_value: 1, xp_reward: 5, difficulty: "iniciante" },
  ],
  intermediario: [
    { challenge_type: "workouts_4", title: "Rotina Firme", description: "Complete 4 treinos esta semana", icon: "💪", target_value: 4, xp_reward: 25, difficulty: "intermediario" },
    { challenge_type: "meals_10", title: "Dieta Controlada", description: "Marque 10 refeições como feitas", icon: "🥗", target_value: 10, xp_reward: 20, difficulty: "intermediario" },
    { challenge_type: "streak_4", title: "Fogo Aceso", description: "Mantenha streak de 4 dias", icon: "🔥", target_value: 4, xp_reward: 20, difficulty: "intermediario" },
    { challenge_type: "exercises_30", title: "Volume Intermediário", description: "Complete 30 exercícios no total", icon: "🏋️", target_value: 30, xp_reward: 25, difficulty: "intermediario" },
    { challenge_type: "diet_days_3", title: "Dieta Perfeita", description: "Não falhe na dieta por 3 dias", icon: "🍽️", target_value: 3, xp_reward: 20, difficulty: "intermediario" },
    { challenge_type: "progression_1", title: "Superação", description: "Aumente a carga em 1 exercício", icon: "📈", target_value: 1, xp_reward: 15, difficulty: "intermediario" },
    { challenge_type: "feed_post_2", title: "Influenciador", description: "Compartilhe 2 evoluções no feed", icon: "📢", target_value: 2, xp_reward: 10, difficulty: "intermediario" },
  ],
  avancado: [
    { challenge_type: "workouts_5", title: "Máquina de Treino", description: "Complete 5 treinos esta semana", icon: "💪", target_value: 5, xp_reward: 40, difficulty: "avancado" },
    { challenge_type: "meals_15", title: "Dieta Impecável", description: "Marque 15 refeições como feitas", icon: "🥗", target_value: 15, xp_reward: 30, difficulty: "avancado" },
    { challenge_type: "streak_6", title: "Incansável", description: "Mantenha streak de 6 dias", icon: "🔥", target_value: 6, xp_reward: 35, difficulty: "avancado" },
    { challenge_type: "exercises_50", title: "Volume Extremo", description: "Complete 50 exercícios no total", icon: "🏋️", target_value: 50, xp_reward: 40, difficulty: "avancado" },
    { challenge_type: "diet_days_5", title: "Disciplina Total", description: "Não falhe na dieta por 5 dias", icon: "🍽️", target_value: 5, xp_reward: 35, difficulty: "avancado" },
    { challenge_type: "progression_2", title: "Evolução Constante", description: "Aumente a carga em 2 exercícios", icon: "📈", target_value: 2, xp_reward: 25, difficulty: "avancado" },
    { challenge_type: "feed_post_3", title: "Referência Fitness", description: "Compartilhe 3 evoluções no feed", icon: "📢", target_value: 3, xp_reward: 15, difficulty: "avancado" },
  ],
};

// Deterministic challenge selection based on week
function selectWeeklyChallenges(difficulty: string, weekStart: string): ChallengeDefinition[] {
  const pool = CHALLENGE_POOL[difficulty] || CHALLENGE_POOL.intermediario;
  // Use week string as seed for deterministic shuffle
  const seed = weekStart.split("-").reduce((a, b) => a + parseInt(b), 0);
  const shuffled = [...pool].sort((a, b) => {
    const ha = (a.challenge_type.charCodeAt(0) * 31 + seed) % 100;
    const hb = (b.challenge_type.charCodeAt(0) * 31 + seed) % 100;
    return ha - hb;
  });
  return shuffled.slice(0, 5);
}

const Desafios = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [challenges, setChallenges] = useState<ActiveChallenge[]>([]);
  const [celebratingId, setCelebratingId] = useState<string | null>(null);

  const weekStart = useMemo(() => format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"), []);
  const weekEnd = useMemo(() => endOfWeek(new Date(), { weekStartsOn: 1 }), []);
  const hoursLeft = useMemo(() => Math.max(0, differenceInHours(weekEnd, new Date())), [weekEnd]);
  const daysLeft = useMemo(() => Math.max(0, differenceInDays(weekEnd, new Date())), [weekEnd]);

  const difficulty = useMemo(() => {
    const level = profile?.experience_level;
    if (level === "avancado") return "avancado";
    if (level === "intermediario") return "intermediario";
    return "iniciante";
  }, [profile]);

  const difficultyLabel = difficulty === "avancado" ? "Avançado" : difficulty === "intermediario" ? "Intermediário" : "Iniciante";
  const difficultyColor = difficulty === "avancado" ? "text-red-400" : difficulty === "intermediario" ? "text-chart-3" : "text-chart-2";

  const ensureChallengesExist = useCallback(async () => {
    if (!user) return;
    const selected = selectWeeklyChallenges(difficulty, weekStart);

    // Upsert challenges for this week
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
  }, [user, difficulty, weekStart]);

  const computeProgress = useCallback(async (challengeType: string): Promise<number> => {
    if (!user) return 0;
    const weekStartDate = startOfWeek(new Date(), { weekStartsOn: 1 });

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

    if (challengeType.startsWith("progression_")) {
      const { data } = await supabase.from("exercise_history")
        .select("exercise_name, weight")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);
      if (!data) return 0;
      const map = new Map<string, number[]>();
      data.forEach(h => {
        if (!map.has(h.exercise_name)) map.set(h.exercise_name, []);
        map.get(h.exercise_name)!.push(h.weight);
      });
      let prog = 0;
      map.forEach(weights => { if (weights.length >= 2 && weights[0] > weights[weights.length - 1]) prog++; });
      return prog;
    }

    if (challengeType.startsWith("feed_post_")) {
      const { count } = await supabase.from("activity_feed")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", weekStartDate.toISOString());
      return count || 0;
    }

    if (challengeType.startsWith("body_track_")) {
      const { count } = await supabase.from("body_tracking")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", weekStartDate.toISOString());
      return count || 0;
    }

    return 0;
  }, [user]);

  const loadChallenges = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    await ensureChallengesExist();

    // Fetch this week's challenges
    const { data: challengeData } = await supabase
      .from("weekly_challenges")
      .select("*")
      .eq("week_start", weekStart)
      .order("created_at", { ascending: true })
      .limit(5);

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

    // Compute actual progress for each challenge
    const results: ActiveChallenge[] = [];
    for (const ch of challengeData) {
      const prog = progressMap.get(ch.id);
      const actualProgress = await computeProgress(ch.challenge_type);
      const target = ch.target_value;
      const isCompleted = prog?.completed || actualProgress >= target;

      // Auto-update progress in DB
      await supabase.from("user_challenge_progress").upsert({
        user_id: user.id,
        challenge_id: ch.id,
        current_value: Math.min(actualProgress, target),
        completed: isCompleted,
        completed_at: isCompleted && !prog?.completed ? new Date().toISOString() : prog?.completed_at || null,
      }, { onConflict: "user_id,challenge_id" });

      // Award XP if newly completed
      if (isCompleted && !prog?.completed) {
        setCelebratingId(ch.id);
        setTimeout(() => setCelebratingId(null), 3000);
        toast.success(`🎉 Desafio "${ch.title}" concluído! +${(ch as any).xp_reward || 20} XP`, { duration: 5000 });
      }

      results.push({
        id: ch.id,
        challenge_type: ch.challenge_type,
        title: ch.title,
        description: ch.description,
        icon: ch.icon,
        target_value: target,
        xp_reward: (ch as any).xp_reward || 20,
        difficulty: (ch as any).difficulty || "intermediario",
        progress: Math.min(actualProgress, target),
        completed: isCompleted,
        completed_at: isCompleted ? (prog?.completed_at || new Date().toISOString()) : null,
      });
    }

    setChallenges(results);
    setLoading(false);
  }, [user, weekStart, ensureChallengesExist, computeProgress]);

  useEffect(() => {
    loadChallenges();
  }, [loadChallenges]);

  const completedCount = challenges.filter(c => c.completed).length;
  const totalXPEarned = challenges.filter(c => c.completed).reduce((a, c) => a + c.xp_reward, 0);
  const totalXPPossible = challenges.reduce((a, c) => a + c.xp_reward, 0);

  // Find next incomplete challenge for motivation
  const nextChallenge = challenges.find(c => !c.completed);
  const nextRemaining = nextChallenge ? nextChallenge.target_value - nextChallenge.progress : 0;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-secondary/60 rounded-lg" />
        <div className="h-4 w-32 bg-secondary/40 rounded" />
        <div className="h-40 bg-secondary/30 rounded-2xl" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-32 bg-secondary/30 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight flex items-center gap-2.5">
          <Target className="w-7 h-7 text-primary" />
          Desafios Semanais
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Complete desafios para ganhar XP e subir no ranking
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
                <h3 className="font-display font-bold text-lg">{completedCount}/{challenges.length} Desafios</h3>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  {daysLeft > 0 ? `${daysLeft}d ${hoursLeft % 24}h restantes` : `${hoursLeft}h restantes`}
                  <span className="mx-1">•</span>
                  <span className={difficultyColor}>{difficultyLabel}</span>
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
              <span className="text-[11px] text-muted-foreground">Progresso da semana</span>
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
      {nextChallenge && !nextChallenge.completed && (
        <div className="glass-card p-4 border-orange-500/15 bg-orange-500/5">
          <p className="text-sm font-medium flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <span>
              {nextChallenge.challenge_type.startsWith("workouts_")
                ? `Faltam ${nextRemaining} treinos para completar "${nextChallenge.title}"!`
                : nextChallenge.challenge_type.startsWith("meals_")
                ? `Faltam ${nextRemaining} refeições para completar "${nextChallenge.title}"!`
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
          const pct = Math.min(100, Math.round((ch.progress / ch.target_value) * 100));
          const isCelebrating = celebratingId === ch.id;

          return (
            <div
              key={ch.id}
              className={`glass-card p-5 relative overflow-hidden transition-all duration-500 ${
                ch.completed
                  ? "border-primary/20 shadow-[0_0_24px_-6px_hsl(var(--primary)/0.2)]"
                  : "hover:border-border/40"
              } ${isCelebrating ? "animate-pulse scale-[1.01]" : ""}`}
            >
              {/* Completed badge */}
              {ch.completed && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/15 border border-primary/20">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] font-bold text-primary">COMPLETO</span>
                </div>
              )}

              {/* XP badge */}
              {!ch.completed && (
                <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-chart-3/10 border border-chart-3/15">
                  <span className="text-[10px] font-bold text-chart-3">+{ch.xp_reward} XP</span>
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
                <div className="flex-1 min-w-0 pr-16">
                  <h4 className="font-display font-semibold text-sm">{ch.title}</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{ch.description}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                      ch.difficulty === "avancado" ? "bg-red-500/10 text-red-400 border border-red-500/15" :
                      ch.difficulty === "intermediario" ? "bg-chart-3/10 text-chart-3 border border-chart-3/15" :
                      "bg-chart-2/10 text-chart-2 border border-chart-2/15"
                    }`}>
                      {ch.difficulty === "avancado" ? "Avançado" : ch.difficulty === "intermediario" ? "Intermediário" : "Iniciante"}
                    </span>
                    {ch.completed && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold border border-primary/15">
                        +{ch.xp_reward} XP ganhos
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div>
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

      {/* Incentive */}
      <div className="glass-card p-4 text-center">
        <p className="text-sm text-muted-foreground">
          💡 <span className="font-medium text-foreground">Desafios renovam toda segunda-feira.</span> Complete-os para ganhar XP e subir no ranking!
        </p>
      </div>
    </div>
  );
};

export default Desafios;
