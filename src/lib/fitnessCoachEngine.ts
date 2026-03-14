// Fitness Coach Behavioral Engine — Etapa 6.6
// Analyzes user behavior and generates motivational feedback

export type CoachMessageType = "motivacional" | "alerta" | "conquista" | "dica" | "risco";

export interface CoachMessage {
  id: string;
  type: CoachMessageType;
  icon: string;
  title: string;
  message: string;
  priority: "high" | "medium" | "low";
  actionRoute?: string;
  actionLabel?: string;
}

export interface CoachContext {
  // Training
  workoutsThisWeek: number;
  targetWorkoutsPerWeek: number;
  currentStreak: number;
  trainedToday: boolean;
  lastWorkoutDate?: string;
  totalWorkouts: number;

  // Diet
  mealsCompletedToday: number;
  mealsTotalToday: number;
  mealsFailedThisWeek: number;
  dietStreak: number;

  // Goals
  activeGoals: { title: string; progress: number; target: number }[];
  completedGoalsCount: number;

  // Body
  currentWeight: number;
  previousWeight: number;
  hasRecentBodyRecord: boolean;

  // Score / Ranking
  fitnessScore: number;
  rankPosition?: number;

  // XP / Level
  totalXP: number;
  currentLevel: number;

  // Coach mode
  coachModeActive: boolean;
}

const COACH_STORAGE_KEY = "fitpulse_coach_mode";
const COACH_MESSAGES_KEY = "fitpulse_coach_messages_date";

export function isCoachModeActive(): boolean {
  try {
    return localStorage.getItem(COACH_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function setCoachMode(active: boolean) {
  localStorage.setItem(COACH_STORAGE_KEY, active ? "true" : "false");
}

function hasShownToday(): boolean {
  try {
    const stored = localStorage.getItem(COACH_MESSAGES_KEY);
    return stored === new Date().toISOString().slice(0, 10);
  } catch {
    return false;
  }
}

function markShownToday() {
  localStorage.setItem(COACH_MESSAGES_KEY, new Date().toISOString().slice(0, 10));
}

// --- Workout In-Progress Feedback ---
export interface WorkoutFeedback {
  message: string;
  icon: string;
}

export function getWorkoutMidFeedback(completedExercises: number, totalExercises: number): WorkoutFeedback | null {
  const pct = totalExercises > 0 ? completedExercises / totalExercises : 0;
  if (pct >= 0.5 && pct < 0.6) {
    return { message: "Metade do treino concluída. O resto é com você! 💪", icon: "⚡" };
  }
  if (pct >= 0.75 && pct < 0.85) {
    return { message: "Falta pouco! Mantenha a intensidade. 🔥", icon: "🔥" };
  }
  return null;
}

export function getWorkoutCompleteFeedback(streak: number): WorkoutFeedback {
  if (streak >= 7) return { message: `Treino finalizado! ${streak} dias consecutivos — você é imparável! 🏆`, icon: "🏆" };
  if (streak >= 3) return { message: "Ótimo treino! Sua consistência está construindo resultados reais. ✅", icon: "✅" };
  return { message: "Treino concluído! Cada sessão conta na sua evolução. 💪", icon: "💪" };
}

export function getRestTimeFeedback(restSeconds: number, targetSeconds: number): WorkoutFeedback | null {
  if (restSeconds > targetSeconds * 1.5) {
    return { message: "Descanso um pouco longo. Tente manter o ritmo para melhor resultado.", icon: "⏱️" };
  }
  return null;
}

// Encouraging phrases between sets
const SET_ENCOURAGEMENTS = [
  "Continue assim! 💪",
  "Foco no movimento. Qualidade acima de tudo.",
  "Cada rep te aproxima do seu objetivo.",
  "Você é mais forte do que pensa.",
  "Mente forte, corpo forte.",
  "Respire fundo. A próxima série é sua.",
];

export function getSetEncouragement(): string {
  return SET_ENCOURAGEMENTS[Math.floor(Math.random() * SET_ENCOURAGEMENTS.length)];
}

// --- Risk Detection ---
export interface DropoutRisk {
  detected: boolean;
  severity: "low" | "medium" | "high";
  reason: string;
  suggestion: string;
  ctaLabel: string;
  ctaRoute: string;
}

export function detectDropoutRisk(ctx: CoachContext): DropoutRisk | null {
  const daysSinceWorkout = ctx.lastWorkoutDate
    ? Math.floor((Date.now() - new Date(ctx.lastWorkoutDate).getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  // High risk: 5+ days inactive
  if (daysSinceWorkout >= 5) {
    return {
      detected: true,
      severity: "high",
      reason: `Faz ${daysSinceWorkout} dias sem treinar.`,
      suggestion: "Que tal um treino curto de 15 minutos? Voltar ao ritmo é o mais importante.",
      ctaLabel: "Treinar agora",
      ctaRoute: "/treino",
    };
  }

  // Medium risk: 3-4 days inactive
  if (daysSinceWorkout >= 3) {
    return {
      detected: true,
      severity: "medium",
      reason: `Faz ${daysSinceWorkout} dias sem treinar.`,
      suggestion: "Um treino leve já ajuda a manter a consistência. Cada dia conta!",
      ctaLabel: "Ver treino do dia",
      ctaRoute: "/treino",
    };
  }

  // Diet consecutive failures
  if (ctx.mealsFailedThisWeek >= 5) {
    return {
      detected: true,
      severity: "medium",
      reason: "Muitas refeições falhadas esta semana.",
      suggestion: "Simplifique: foque em uma refeição por vez. Pequenos ajustes geram grandes resultados.",
      ctaLabel: "Ver dieta",
      ctaRoute: "/dieta",
    };
  }

  return null;
}

// --- Main Coach Analysis ---
export function generateCoachFeedback(ctx: CoachContext): CoachMessage[] {
  const messages: CoachMessage[] = [];
  const maxMessages = ctx.coachModeActive ? 4 : 2;

  // Don't repeat if already shown today (unless coach mode)
  if (!ctx.coachModeActive && hasShownToday()) return [];

  // 1. Streak celebration
  if (ctx.currentStreak >= 7 && ctx.currentStreak % 7 === 0) {
    messages.push({
      id: "streak_week",
      type: "conquista",
      icon: "🔥",
      title: "Sequência impressionante!",
      message: `${ctx.currentStreak} dias consecutivos treinando. Sua disciplina está acima da média.`,
      priority: "high",
    });
  } else if (ctx.currentStreak >= 3 && ctx.trainedToday) {
    messages.push({
      id: "streak_going",
      type: "motivacional",
      icon: "💪",
      title: "Consistência é tudo",
      message: `${ctx.currentStreak} dias em sequência. Continue — o resultado vem com o tempo.`,
      priority: "medium",
    });
  }

  // 2. Workout reminder
  if (!ctx.trainedToday && ctx.workoutsThisWeek < ctx.targetWorkoutsPerWeek) {
    messages.push({
      id: "train_today",
      type: "alerta",
      icon: "🏋️",
      title: "Treino pendente hoje",
      message: ctx.currentStreak > 2
        ? `Não quebre sua sequência de ${ctx.currentStreak} dias! 20 minutos já fazem diferença.`
        : "Seu corpo está pronto. Um treino curto já conta.",
      priority: ctx.currentStreak > 5 ? "high" : "medium",
      actionRoute: "/treino",
      actionLabel: "Ir para treino",
    });
  }

  // 3. Diet feedback
  if (ctx.mealsTotalToday > 0 && ctx.mealsCompletedToday === ctx.mealsTotalToday) {
    messages.push({
      id: "diet_perfect",
      type: "conquista",
      icon: "🥗",
      title: "Dieta perfeita hoje!",
      message: "Todas as refeições concluídas. Seu resultado está sendo construído.",
      priority: "low",
    });
  } else if (ctx.mealsFailedThisWeek > 3 && ctx.coachModeActive) {
    messages.push({
      id: "diet_alert",
      type: "dica",
      icon: "🍎",
      title: "Atenção na alimentação",
      message: "A dieta é 70% do resultado. Tente focar em preparar as refeições com antecedência.",
      priority: "medium",
      actionRoute: "/dieta",
      actionLabel: "Ver plano alimentar",
    });
  }

  // 4. Goal proximity
  for (const goal of ctx.activeGoals) {
    const pct = goal.target > 0 ? (goal.progress / goal.target) * 100 : 0;
    if (pct >= 80 && pct < 100) {
      messages.push({
        id: `goal_close_${goal.title}`,
        type: "motivacional",
        icon: "🎯",
        title: "Meta quase alcançada!",
        message: `Faltam apenas ${Math.round(100 - pct)}% para bater "${goal.title}". Continue!`,
        priority: "high",
        actionRoute: "/metas",
        actionLabel: "Ver meta",
      });
      break;
    }
  }

  // 5. Score / ranking feedback (coach mode)
  if (ctx.coachModeActive && ctx.fitnessScore > 0) {
    if (ctx.fitnessScore >= 80) {
      messages.push({
        id: "score_high",
        type: "conquista",
        icon: "⭐",
        title: "Performance excelente",
        message: `Score fitness de ${ctx.fitnessScore}. Você está no caminho certo para resultados reais.`,
        priority: "low",
      });
    } else if (ctx.fitnessScore < 40) {
      messages.push({
        id: "score_low",
        type: "dica",
        icon: "📊",
        title: "Seu score pode melhorar",
        message: "Foque em treinar com regularidade e seguir a dieta. Pequenas melhorias diárias fazem grande diferença.",
        priority: "medium",
      });
    }
  }

  // 6. Body progress
  if (ctx.hasRecentBodyRecord && ctx.previousWeight !== ctx.currentWeight) {
    const diff = ctx.currentWeight - ctx.previousWeight;
    messages.push({
      id: "body_progress",
      type: "motivacional",
      icon: "✨",
      title: "Progresso real registrado",
      message: `${Math.abs(diff).toFixed(1)}kg ${diff < 0 ? "a menos" : "a mais"}. Seu corpo está respondendo ao esforço. Continue confiando no processo.`,
      priority: "medium",
    });
  }

  // 7. Milestone celebrations
  if (ctx.totalWorkouts > 0 && ctx.totalWorkouts % 10 === 0) {
    messages.push({
      id: `milestone_${ctx.totalWorkouts}`,
      type: "conquista",
      icon: "🏆",
      title: `${ctx.totalWorkouts} treinos concluídos!`,
      message: "Cada treino acumulado é mais um passo na sua transformação. Parabéns!",
      priority: "high",
    });
  }

  markShownToday();
  return messages.slice(0, maxMessages);
}
