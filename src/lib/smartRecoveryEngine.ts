/**
 * Smart Recovery Engine — Sistema de Recuperação Inteligente
 * Monitors weekly training load and suggests recovery to prevent overtraining.
 */

import { loadAllPerformances, type ExercisePerformance } from "./smartProgressionEngine";

// ===== TYPES =====

export type RecoveryLevel = "recovered" | "attention" | "overload";

export type WeeklyLoadScore = {
  totalPoints: number;
  maxPoints: number; // 12
  level: RecoveryLevel;
  emoji: string;
  label: string;
  sessionsThisWeek: number;
  consecutiveDays: number;
};

export type RecoveryAction = {
  id: string;
  label: string;
  emoji: string;
  description: string;
};

export type MuscleRecoverySuggestion = {
  avoidGroup: string;
  suggestGroups: string[];
  message: string;
};

export type RegenerativeWorkout = {
  dia: string;
  grupo: string;
  intensidade: "leve";
  exercicios: Array<{
    nome: string;
    series: string;
    reps: string;
    desc: string;
    descanso: string;
  }>;
};

export type RecoverySummary = {
  load: WeeklyLoadScore;
  showAlert: boolean;
  showConsecutiveWarning: boolean;
  consecutiveXPReduction: boolean;
  muscleRecovery: MuscleRecoverySuggestion | null;
  actions: RecoveryAction[];
  alertTitle: string;
  alertMessage: string;
};

// ===== CONSTANTS =====

const MAX_WEEKLY_POINTS = 12;
const CONSECUTIVE_DAYS_WARNING = 5;
const RECOVERY_XP_BONUS = 10;

const STORAGE_KEY = "fitpulse_recovery_log";
const RECOVERY_ACCEPTED_KEY = "fitpulse_recovery_accepted";

// ===== LOAD CALCULATION =====

type SessionEntry = {
  completed_at: string;
  muscle_group: string;
  intensity?: string;
};

function getIntensityPoints(intensity?: string): number {
  switch (intensity?.toLowerCase()) {
    case "pesado": return 3;
    case "moderado": return 2;
    case "leve": return 1;
    default: return 2; // default moderate
  }
}

function getCardioPoints(intensity?: string): number {
  return intensity === "intenso" ? 1 : 0.5;
}

function isCardio(group: string): boolean {
  const g = group.toLowerCase();
  return g.includes("cardio") || g.includes("hiit");
}

/**
 * Calculate weekly load score from session data
 */
export function calculateWeeklyLoad(sessions: SessionEntry[]): WeeklyLoadScore {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);

  const weekSessions = sessions.filter(s => new Date(s.completed_at) >= weekStart);

  let totalPoints = 0;
  weekSessions.forEach(s => {
    if (isCardio(s.muscle_group)) {
      totalPoints += getCardioPoints(s.intensity);
    } else {
      totalPoints += getIntensityPoints(s.intensity);
    }
  });

  // Calculate consecutive days
  const uniqueDays = [...new Set(
    sessions
      .map(s => new Date(s.completed_at).toISOString().slice(0, 10))
      .sort()
      .reverse()
  )];

  let consecutiveDays = 0;
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  if (uniqueDays[0] === today || uniqueDays[0] === yesterday) {
    for (let i = 0; i < uniqueDays.length; i++) {
      const expected = new Date(Date.now() - (i + (uniqueDays[0] === today ? 0 : 1)) * 86400000)
        .toISOString().slice(0, 10);
      if (uniqueDays[i] === expected) consecutiveDays++;
      else break;
    }
  }

  let level: RecoveryLevel;
  let emoji: string;
  let label: string;

  if (totalPoints >= MAX_WEEKLY_POINTS) {
    level = "overload";
    emoji = "🔴";
    label = "Sobrecarga";
  } else if (totalPoints >= MAX_WEEKLY_POINTS * 0.7) {
    level = "attention";
    emoji = "🟡";
    label = "Atenção";
  } else {
    level = "recovered";
    emoji = "🟢";
    label = "Recuperado";
  }

  return {
    totalPoints: Math.round(totalPoints * 10) / 10,
    maxPoints: MAX_WEEKLY_POINTS,
    level,
    emoji,
    label,
    sessionsThisWeek: weekSessions.length,
    consecutiveDays,
  };
}

/**
 * Check if a heavy session in a muscle group should block next-day training
 */
export function getMuscleRecoverySuggestion(
  sessions: SessionEntry[],
  targetGroup: string
): MuscleRecoverySuggestion | null {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  // Check if target group was trained intensely yesterday
  const yesterdaySessions = sessions.filter(s =>
    new Date(s.completed_at).toISOString().slice(0, 10) === yesterday
  );

  const targetLower = targetGroup.toLowerCase();
  const hadIntenseYesterday = yesterdaySessions.some(s => {
    const g = s.muscle_group.toLowerCase();
    const isTarget = g.includes(targetLower) || targetLower.includes(g);
    const isIntense = s.intensity === "pesado" || s.intensity === "intenso";
    return isTarget && isIntense;
  });

  if (!hadIntenseYesterday) return null;

  // Suggest alternatives based on the target group
  const alternatives: Record<string, string[]> = {
    pernas: ["peito", "costas", "ombros", "cardio leve"],
    peito: ["pernas", "costas", "cardio leve"],
    costas: ["peito", "pernas", "ombros"],
    ombros: ["pernas", "costas", "cardio leve"],
    biceps: ["pernas", "peito", "cardio leve"],
    triceps: ["pernas", "costas", "cardio leve"],
  };

  const key = Object.keys(alternatives).find(k => targetLower.includes(k));
  const suggestGroups = key ? alternatives[key] : ["cardio leve", "mobilidade"];

  return {
    avoidGroup: targetGroup,
    suggestGroups,
    message: `Treino intenso de ${targetGroup} ontem. Considere treinar ${suggestGroups.slice(0, 2).join(" ou ")} hoje.`,
  };
}

/**
 * Get full recovery summary
 */
export function getRecoverySummary(sessions: SessionEntry[]): RecoverySummary {
  const load = calculateWeeklyLoad(sessions);

  const showAlert = load.level === "overload";
  const showConsecutiveWarning = load.consecutiveDays >= CONSECUTIVE_DAYS_WARNING;
  const consecutiveXPReduction = showConsecutiveWarning && !hasAcceptedRecoveryToday();

  const actions: RecoveryAction[] = [
    {
      id: "regenerative",
      label: "Treino Regenerativo",
      emoji: "🧘",
      description: "Mobilidade + alongamento + core leve (20 min)",
    },
    {
      id: "stretching",
      label: "Alongamento Guiado",
      emoji: "🤸",
      description: "Sessão focada em flexibilidade e relaxamento",
    },
    {
      id: "active_rest",
      label: "Descanso Ativo",
      emoji: "🚶",
      description: "Caminhada leve ou yoga suave",
    },
  ];

  let alertTitle = "";
  let alertMessage = "";

  if (showAlert) {
    alertTitle = "🔥 Seu corpo precisa recuperar.";
    alertMessage = "Você treinou forte essa semana. Recuperar faz parte da evolução.";
  } else if (showConsecutiveWarning) {
    alertTitle = "💪 Que tal um dia de recuperação?";
    alertMessage = `Você treinou ${load.consecutiveDays} dias seguidos. Um dia de descanso ativo pode acelerar seus ganhos.`;
  }

  return {
    load,
    showAlert,
    showConsecutiveWarning,
    consecutiveXPReduction,
    muscleRecovery: null,
    actions,
    alertTitle,
    alertMessage,
  };
}

// ===== REGENERATIVE WORKOUT =====

export function generateRegenerativeWorkout(): RegenerativeWorkout {
  return {
    dia: "Recuperação",
    grupo: "Regenerativo",
    intensidade: "leve",
    exercicios: [
      {
        nome: "Mobilidade de Quadril",
        series: "2",
        reps: "10 cada lado",
        desc: "Círculos amplos com o quadril, alternando direções.",
        descanso: "30s",
      },
      {
        nome: "Alongamento Gato-Vaca",
        series: "2",
        reps: "12",
        desc: "Em quatro apoios, alterne arredondando e arqueando a coluna.",
        descanso: "20s",
      },
      {
        nome: "Prancha Isométrica",
        series: "2",
        reps: "30s",
        desc: "Mantenha o corpo alinhado em posição de prancha.",
        descanso: "30s",
      },
      {
        nome: "Alongamento de Posterior",
        series: "2",
        reps: "30s cada lado",
        desc: "Sentado, alcance os pés mantendo as costas retas.",
        descanso: "20s",
      },
      {
        nome: "Caminhada Leve",
        series: "1",
        reps: "5 min",
        desc: "Ritmo tranquilo para ativar circulação e recuperação.",
        descanso: "—",
      },
      {
        nome: "Respiração Diafragmática",
        series: "2",
        reps: "8 respirações",
        desc: "Inspire pelo nariz 4s, segure 4s, expire pela boca 6s.",
        descanso: "—",
      },
    ],
  };
}

// ===== RECOVERY LOG =====

export type RecoveryLogEntry = {
  date: string;
  type: "recovery_accepted" | "recovery_ignored" | "consecutive_warning" | "overload_alert";
  xpBonus?: number;
};

export function logRecoveryEvent(entry: RecoveryLogEntry): void {
  const logs = getRecoveryLog();
  logs.push(entry);
  // Keep last 100 entries
  const trimmed = logs.slice(-100);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export function getRecoveryLog(): RecoveryLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function acceptRecoveryToday(): void {
  const today = new Date().toISOString().slice(0, 10);
  localStorage.setItem(RECOVERY_ACCEPTED_KEY, today);
  logRecoveryEvent({
    date: today,
    type: "recovery_accepted",
    xpBonus: RECOVERY_XP_BONUS,
  });
}

export function hasAcceptedRecoveryToday(): boolean {
  const stored = localStorage.getItem(RECOVERY_ACCEPTED_KEY);
  const today = new Date().toISOString().slice(0, 10);
  return stored === today;
}

/**
 * Get XP reduction factor (0.8 if consecutive warning ignored, 1.0 otherwise)
 */
export function getXPReductionFactor(sessions: SessionEntry[]): number {
  const load = calculateWeeklyLoad(sessions);
  if (load.consecutiveDays >= CONSECUTIVE_DAYS_WARNING && !hasAcceptedRecoveryToday()) {
    return 0.8;
  }
  return 1.0;
}

/**
 * Get recovery level for a specific muscle group (for visual indicators on plan cards)
 */
export function getGroupRecoveryLevel(
  group: string,
  sessions: SessionEntry[]
): RecoveryLevel {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);

  const groupLower = group.toLowerCase();
  const recentForGroup = sessions.filter(s => {
    const date = new Date(s.completed_at).toISOString().slice(0, 10);
    const g = s.muscle_group.toLowerCase();
    return (g.includes(groupLower) || groupLower.includes(g)) &&
      (date === yesterday || date === twoDaysAgo || date === today);
  });

  if (recentForGroup.length === 0) return "recovered";

  const hadIntense = recentForGroup.some(s =>
    new Date(s.completed_at).toISOString().slice(0, 10) === yesterday &&
    (s.intensity === "pesado" || s.intensity === "intenso")
  );

  if (hadIntense) return "overload";

  const hadModerate = recentForGroup.some(s =>
    new Date(s.completed_at).toISOString().slice(0, 10) === yesterday
  );

  return hadModerate ? "attention" : "recovered";
}
