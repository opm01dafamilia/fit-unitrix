/**
 * Comeback Mode Engine for Fit-Unitrix
 * Detects missed workouts and adapts training automatically.
 * Never punishes — only adapts strategy for safe return.
 */

import { differenceInCalendarDays, format, subDays } from "date-fns";

// ============ TYPES ============

export type ComebackLevel = "none" | "alert" | "comeback";

export type ComebackStatus = {
  level: ComebackLevel;
  missedConsecutive: number;
  daysSinceLastWorkout: number;
  isInComebackMode: boolean;
  comebackDaysRemaining: number; // 0 if not in comeback, 3-5 days
  volumeReduction: number;       // 0 to 0.2 (20%)
  intensityReduction: number;    // 0 to 0.2
  cardioReduction: boolean;      // true = only light cardio
  message: string;
  messageEmoji: string;
  tooltip: string;
  dashboardAlert: string | null;
};

export type ComebackProgress = {
  workoutsCompleted: number;     // in comeback mode
  workoutsNeeded: number;        // 3 to exit
  canExitComeback: boolean;
  progressPct: number;
};

// ============ DETECTION ============

/**
 * Detect consecutive missed workout days based on session history.
 * A "missed" day = scheduled workout day with no session recorded.
 */
export function detectMissedWorkouts(
  sessions: Array<{ completed_at: string }>,
  daysPerWeek: number
): { missedConsecutive: number; daysSinceLastWorkout: number } {
  if (sessions.length === 0) {
    return { missedConsecutive: 0, daysSinceLastWorkout: 999 };
  }

  const lastSession = new Date(sessions[0].completed_at);
  const daysSince = differenceInCalendarDays(new Date(), lastSession);

  // Calculate expected workout frequency (e.g., 5 days/week = ~1.4 days apart)
  const expectedGap = Math.ceil(7 / Math.max(daysPerWeek, 3));
  
  // Count consecutive missed "slots"
  // If daysSince > expectedGap, user is missing workouts
  const missedSlots = Math.max(0, Math.floor(daysSince / expectedGap) - 1);

  return {
    missedConsecutive: Math.min(missedSlots, daysSince), // cap to actual days
    daysSinceLastWorkout: daysSince,
  };
}

// ============ STATUS CALCULATION ============

/**
 * Get the current comeback status for the user.
 */
export function getComebackStatus(
  sessions: Array<{ completed_at: string }>,
  daysPerWeek: number,
  comebackWorkoutsCompleted: number = 0
): ComebackStatus {
  const { missedConsecutive, daysSinceLastWorkout } = detectMissedWorkouts(sessions, daysPerWeek);

  // No issue
  if (daysSinceLastWorkout <= 2) {
    return {
      level: "none",
      missedConsecutive: 0,
      daysSinceLastWorkout,
      isInComebackMode: false,
      comebackDaysRemaining: 0,
      volumeReduction: 0,
      intensityReduction: 0,
      cardioReduction: false,
      message: "",
      messageEmoji: "",
      tooltip: "",
      dashboardAlert: null,
    };
  }

  // Alert: 2-4 days without training (light warning)
  if (daysSinceLastWorkout <= 4) {
    return {
      level: "alert",
      missedConsecutive,
      daysSinceLastWorkout,
      isInComebackMode: false,
      comebackDaysRemaining: 0,
      volumeReduction: 0,
      intensityReduction: 0,
      cardioReduction: false,
      message: "Faz alguns dias sem treinar — volte quando puder!",
      messageEmoji: "💪",
      tooltip: "Consistência é mais importante que intensidade.",
      dashboardAlert: null,
    };
  }

  // Comeback mode: 5+ days without training
  const comebackDuration = daysSinceLastWorkout >= 10 ? 5 : daysSinceLastWorkout >= 7 ? 4 : 3;
  const remaining = Math.max(0, comebackDuration - comebackWorkoutsCompleted);
  const isStillInComeback = remaining > 0;

  // Scale reduction by severity
  const volumeReduction = daysSinceLastWorkout >= 10 ? 0.25 : daysSinceLastWorkout >= 7 ? 0.20 : 0.15;
  const intensityReduction = daysSinceLastWorkout >= 10 ? 0.20 : daysSinceLastWorkout >= 7 ? 0.15 : 0.10;

  return {
    level: "comeback",
    missedConsecutive,
    daysSinceLastWorkout,
    isInComebackMode: isStillInComeback,
    comebackDaysRemaining: remaining,
    volumeReduction: isStillInComeback ? volumeReduction : 0,
    intensityReduction: isStillInComeback ? intensityReduction : 0,
    cardioReduction: isStillInComeback,
    message: isStillInComeback 
      ? "Modo Retomada — treinos adaptados para voltar com segurança"
      : "Você voltou ao ritmo! Treino normal restaurado 💪",
    messageEmoji: isStillInComeback ? "🔥" : "🚀",
    tooltip: "Consistência é mais importante que intensidade. Voltar com calma é a chave para evoluir.",
    dashboardAlert: isStillInComeback
      ? "Você ficou alguns dias sem treinar. Vamos voltar com calma e consistência!"
      : null,
  };
}

// ============ COMEBACK PROGRESS ============

/**
 * Track progress within comeback mode.
 */
export function getComebackProgress(
  comebackWorkoutsCompleted: number,
  comebackDuration: number
): ComebackProgress {
  const needed = comebackDuration;
  const completed = Math.min(comebackWorkoutsCompleted, needed);
  return {
    workoutsCompleted: completed,
    workoutsNeeded: needed,
    canExitComeback: completed >= 3,
    progressPct: Math.round((completed / needed) * 100),
  };
}

// ============ APPLY TO WORKOUT ============

/**
 * Adjust workout parameters for comeback mode.
 */
export function applyComebackAdjustments(
  baseSeries: number,
  baseRest: number,
  comebackStatus: ComebackStatus
): {
  adjustedSeries: number;
  adjustedRest: number;
  changes: string[];
} {
  if (!comebackStatus.isInComebackMode) {
    return { adjustedSeries: baseSeries, adjustedRest: baseRest, changes: [] };
  }

  const changes: string[] = [];

  // Reduce volume
  const seriesReduction = Math.max(1, Math.round(baseSeries * comebackStatus.volumeReduction));
  const adjustedSeries = Math.max(2, baseSeries - seriesReduction);
  if (adjustedSeries !== baseSeries) {
    changes.push(`-${baseSeries - adjustedSeries} série(s) (retomada)`);
  }

  // Increase rest for recovery
  const adjustedRest = Math.min(180, baseRest + 15);
  if (adjustedRest !== baseRest) {
    changes.push(`+15s descanso (retomada)`);
  }

  return { adjustedSeries, adjustedRest, changes };
}

// ============ COMEBACK MESSAGES ============

/**
 * Get motivational messages for comeback mode (never punishing).
 */
export function getComebackFeedback(daysSince: number, workoutsCompleted: number): {
  title: string;
  description: string;
  emoji: string;
} {
  if (workoutsCompleted >= 3) {
    return {
      title: "Você está de volta! 🚀",
      description: "3 treinos seguidos no modo retomada. Seu plano volta ao normal agora!",
      emoji: "🚀",
    };
  }

  if (workoutsCompleted >= 2) {
    return {
      title: "Quase lá!",
      description: "Mais 1 treino e você sai do modo retomada. Continue firme!",
      emoji: "💪",
    };
  }

  if (workoutsCompleted >= 1) {
    return {
      title: "Boa volta!",
      description: "Primeiro treino de retomada concluído. O corpo agradece!",
      emoji: "🔥",
    };
  }

  if (daysSince >= 10) {
    return {
      title: "Bem-vindo de volta!",
      description: "Preparamos um treino mais leve para você retomar com segurança.",
      emoji: "🌱",
    };
  }

  return {
    title: "Vamos retomar!",
    description: "Treino adaptado para que você volte ao ritmo sem riscos.",
    emoji: "💪",
  };
}
