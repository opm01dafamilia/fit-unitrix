/**
 * Muscle Fatigue Engine - Etapa 3.15
 * Detects muscle fatigue based on weekly volume, intensity, RPE history,
 * and proximity of stimuli. Adapts workout automatically to prevent overtraining.
 */

import { loadAllPerformances, type ExercisePerformance, type RPE } from "./smartProgressionEngine";

// ===== TYPES =====

export type FatigueLevel = "fresh" | "moderate" | "high" | "extreme";

export type MuscleFatigueStatus = {
  group: string;
  level: FatigueLevel;
  weeklysets: number;
  maxWeeklySets: number;
  avgRPE: number; // 1=leve, 2=moderado, 3=pesado
  daysSinceLastTrain: number;
  consecutiveHeavy: number;
  emoji: string;
  label: string;
  message: string;
};

export type FatigueAdjustment = {
  setsReduction: number; // percentage 0-1
  loadReduction: number; // percentage 0-1
  restIncrease: number; // seconds to add
  suggestRegenerative: boolean;
  suggestAlternateGroup: boolean;
  blockHeavy: boolean;
  tooltip: string;
};

export type WeeklyFatigueSummary = {
  groups: MuscleFatigueStatus[];
  fatigued: MuscleFatigueStatus[];
  overallLevel: FatigueLevel;
  adjustment: FatigueAdjustment | null;
  alertMessage: string | null;
};

// ===== CONSTANTS =====

const RPE_MAP: Record<RPE, number> = { leve: 1, moderado: 2, pesado: 3 };

// Max recommended weekly sets per group (evidence-based ranges)
const MAX_WEEKLY_SETS: Record<string, number> = {
  peito: 20, costas: 22, pernas: 22, ombros: 18,
  biceps: 14, triceps: 14, abdomen: 16, geral: 20,
};

// Minimum recovery days between heavy sessions for same group
const MIN_RECOVERY_DAYS = 2;

// ===== CORE FUNCTIONS =====

/**
 * Get performances from the last N days
 */
function getRecentPerformances(days: number): ExercisePerformance[] {
  const all = loadAllPerformances();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return all.filter(p => p.date >= cutoffStr);
}

/**
 * Calculate fatigue status for a specific muscle group
 */
export function getMuscleFatigue(group: string): MuscleFatigueStatus {
  const weekPerfs = getRecentPerformances(7).filter(p => p.muscle_group === group);
  const maxSets = MAX_WEEKLY_SETS[group] || 20;

  // Weekly volume (total sets)
  const weeklysets = weekPerfs.reduce((a, p) => a + p.sets_completed, 0);

  // Average RPE
  const avgRPE = weekPerfs.length > 0
    ? weekPerfs.reduce((a, p) => a + RPE_MAP[p.rpe], 0) / weekPerfs.length
    : 0;

  // Days since last training
  const today = new Date().toISOString().slice(0, 10);
  const dates = [...new Set(weekPerfs.map(p => p.date))].sort().reverse();
  const daysSinceLastTrain = dates.length > 0
    ? Math.floor((new Date(today).getTime() - new Date(dates[0]).getTime()) / 86400000)
    : 999;

  // Consecutive heavy sessions
  let consecutiveHeavy = 0;
  const sortedByDate = [...weekPerfs].sort((a, b) => b.date.localeCompare(a.date));
  const uniqueDates = [...new Set(sortedByDate.map(p => p.date))];
  for (const date of uniqueDates) {
    const dayPerfs = sortedByDate.filter(p => p.date === date);
    const dayAvgRPE = dayPerfs.reduce((a, p) => a + RPE_MAP[p.rpe], 0) / dayPerfs.length;
    if (dayAvgRPE >= 2.5) consecutiveHeavy++;
    else break;
  }

  // Proximity factor: training same group within MIN_RECOVERY_DAYS
  const proximityPenalty = daysSinceLastTrain < MIN_RECOVERY_DAYS && daysSinceLastTrain < 999 ? 1 : 0;

  // Calculate fatigue score (0-10)
  const volumeRatio = weeklysets / maxSets;
  const score =
    (volumeRatio * 3) +
    (avgRPE * 1.5) +
    (consecutiveHeavy * 1.2) +
    (proximityPenalty * 2);

  // Determine level
  let level: FatigueLevel;
  let emoji: string;
  let label: string;
  let message: string;

  if (score >= 8 || (consecutiveHeavy >= 3 && volumeRatio > 0.8)) {
    level = "extreme";
    emoji = "🔴";
    label = "Fadiga extrema";
    message = "Seus músculos precisam de descanso. Considere treinar outro grupo ou fazer mobilidade.";
  } else if (score >= 5.5 || (consecutiveHeavy >= 2 && avgRPE >= 2.5)) {
    level = "high";
    emoji = "🟠";
    label = "Fadiga alta";
    message = "Volume alto detectado. Vamos ajustar o treino para manter evolução sem risco.";
  } else if (score >= 3 || volumeRatio > 0.6) {
    level = "moderate";
    emoji = "🟡";
    label = "Fadiga moderada";
    message = "Boa carga de treino. Continue monitorando.";
  } else {
    level = "fresh";
    emoji = "🟢";
    label = "Recuperado";
    message = "Músculo descansado e pronto para treinar.";
  }

  return {
    group, level, weeklysets, maxWeeklySets: maxSets,
    avgRPE, daysSinceLastTrain, consecutiveHeavy,
    emoji, label, message,
  };
}

/**
 * Get adjustment recommendations based on fatigue level
 */
export function getFatigueAdjustment(fatigue: MuscleFatigueStatus): FatigueAdjustment | null {
  if (fatigue.level === "fresh" || fatigue.level === "moderate") return null;

  if (fatigue.level === "extreme") {
    return {
      setsReduction: 0.35,
      loadReduction: 0.20,
      restIncrease: 30,
      suggestRegenerative: true,
      suggestAlternateGroup: true,
      blockHeavy: true,
      tooltip: "Fadiga extrema detectada. Treino regenerativo ativado para proteger sua evolução.",
    };
  }

  // high
  return {
    setsReduction: 0.20,
    loadReduction: 0.10,
    restIncrease: 15,
    suggestRegenerative: false,
    suggestAlternateGroup: false,
    blockHeavy: true,
    tooltip: "Fadiga alta detectada. Volume e intensidade reduzidos para manter consistência.",
  };
}

/**
 * Get weekly fatigue summary across all trained muscle groups
 */
export function getWeeklyFatigueSummary(): WeeklyFatigueSummary {
  const weekPerfs = getRecentPerformances(7);
  const groups = [...new Set(weekPerfs.map(p => p.muscle_group))];

  const statuses = groups.map(g => getMuscleFatigue(g));
  const fatigued = statuses.filter(s => s.level === "high" || s.level === "extreme");

  // Overall level
  let overallLevel: FatigueLevel = "fresh";
  if (fatigued.some(f => f.level === "extreme")) overallLevel = "extreme";
  else if (fatigued.length >= 2) overallLevel = "high";
  else if (fatigued.length === 1) overallLevel = "high";
  else if (statuses.some(s => s.level === "moderate")) overallLevel = "moderate";

  const topFatigued = fatigued.sort((a, b) => {
    const order: Record<FatigueLevel, number> = { extreme: 4, high: 3, moderate: 2, fresh: 1 };
    return order[b.level] - order[a.level];
  })[0];

  const adjustment = topFatigued ? getFatigueAdjustment(topFatigued) : null;

  let alertMessage: string | null = null;
  if (fatigued.length > 0) {
    const names = fatigued.map(f => f.group).join(", ");
    alertMessage = `⚠️ Fadiga detectada em: ${names}. Vamos ajustar para manter evolução sem risco.`;
  }

  return { groups: statuses, fatigued, overallLevel, adjustment, alertMessage };
}

/**
 * Check if a specific muscle group should be trained today
 */
export function shouldTrainGroup(group: string): {
  safe: boolean;
  fatigue: MuscleFatigueStatus;
  adjustment: FatigueAdjustment | null;
  alternativeMessage: string | null;
} {
  const fatigue = getMuscleFatigue(group);
  const adjustment = getFatigueAdjustment(fatigue);

  let alternativeMessage: string | null = null;
  if (fatigue.level === "extreme") {
    alternativeMessage = "Considere treinar outro grupo muscular ou fazer um treino de mobilidade/cardio leve.";
  }

  return {
    safe: fatigue.level !== "extreme",
    fatigue,
    adjustment,
    alternativeMessage,
  };
}

/**
 * Check if fatigue has recovered (for re-enabling progression)
 */
export function hasRecovered(group: string): boolean {
  const fatigue = getMuscleFatigue(group);
  return fatigue.level === "fresh" || fatigue.level === "moderate";
}

/**
 * Apply fatigue adjustments to exercise parameters
 */
export function applyFatigueToExercise(
  series: number,
  restSeconds: number,
  weight: number,
  adjustment: FatigueAdjustment
): { series: number; restSeconds: number; weight: number } {
  return {
    series: Math.max(2, Math.round(series * (1 - adjustment.setsReduction))),
    restSeconds: Math.min(180, restSeconds + adjustment.restIncrease),
    weight: Math.round(weight * (1 - adjustment.loadReduction) * 2) / 2,
  };
}
