/**
 * Smart Progression Cycle Engine for FitPulse
 * Manages periodization cycles: adaptation → increase → moderate → high → deload
 * Provides load, volume, rep, and rest progression recommendations.
 */

// ============ TYPES ============

export type CyclePhase = "adaptacao" | "aumento" | "moderado" | "intenso" | "deload";

export type CycleStatus = {
  currentWeek: number; // 1-5
  phase: CyclePhase;
  phaseLabel: string;
  phaseEmoji: string;
  phaseDescription: string;
  totalCycles: number;
  loadMultiplier: number;    // e.g. 1.0, 1.05, 1.10, 0.85
  volumeAdjust: number;     // extra sets to add (0, 0, +1, +1, -1)
  restAdjust: number;       // seconds to add/subtract from rest
  repRangeShift: number;    // 0 = normal, +2 = push higher reps
};

export type PerformanceMetrics = {
  completionRate: number;      // 0-100 % of sets completed
  failureRate: number;         // 0-100 % of failed sets
  consistencyDays: number;     // consecutive training days
  sessionsThisWeek: number;
  totalSessionsAllTime: number;
  avgRepsHitRate: number;      // 0-100 how often target reps are met
  excessiveSwaps: boolean;     // too many exercise swaps
};

export type ProgressionAdvice = {
  loadChange: "increase" | "maintain" | "decrease";
  loadPercent: number;         // e.g. +5, 0, -5
  volumeChange: "add_set" | "maintain" | "reduce_set";
  restChange: "reduce" | "maintain" | "increase";
  restDelta: number;           // seconds
  repStrategy: "push_reps" | "increase_load" | "maintain";
  overtrainingRisk: boolean;
  feedback: string;
  feedbackEmoji: string;
};

// ============ CONSTANTS ============

const PHASE_CONFIG: Record<CyclePhase, {
  label: string;
  emoji: string;
  description: string;
  loadMultiplier: number;
  volumeAdjust: number;
  restAdjust: number;
  repRangeShift: number;
}> = {
  adaptacao: {
    label: "Adaptação",
    emoji: "🌱",
    description: "Semana de adaptação — foco em técnica e movimento correto",
    loadMultiplier: 1.0,
    volumeAdjust: 0,
    restAdjust: 0,
    repRangeShift: 0,
  },
  aumento: {
    label: "Aumento Leve",
    emoji: "📈",
    description: "Aumento progressivo — carga levemente maior",
    loadMultiplier: 1.05,
    volumeAdjust: 0,
    restAdjust: 0,
    repRangeShift: 0,
  },
  moderado: {
    label: "Intensidade Moderada",
    emoji: "⚡",
    description: "Volume e carga em crescimento — mantenha a consistência",
    loadMultiplier: 1.08,
    volumeAdjust: 1,
    restAdjust: -15,
    repRangeShift: 0,
  },
  intenso: {
    label: "Intensidade Alta",
    emoji: "🔥",
    description: "Semana de pico — máximo esforço controlado",
    loadMultiplier: 1.10,
    volumeAdjust: 1,
    restAdjust: -30,
    repRangeShift: 2,
  },
  deload: {
    label: "Recuperação",
    emoji: "🧘",
    description: "Semana de deload — recuperação estratégica para crescer",
    loadMultiplier: 0.85,
    volumeAdjust: -1,
    restAdjust: 15,
    repRangeShift: -2,
  },
};

const MAX_SERIES: Record<string, number> = {
  iniciante: 4,
  intermediario: 5,
  avancado: 6,
};

// ============ CYCLE DETECTION ============

/**
 * Determine current cycle phase based on weeks since plan creation.
 */
export function getCycleStatus(
  planCreatedAt: string,
  totalCompletedCycles: number = 0
): CycleStatus {
  const created = new Date(planCreatedAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const weeksSincePlan = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  
  // Cycle repeats every 5 weeks
  const weekInCycle = (weeksSincePlan % 5) + 1; // 1-5
  const totalCycles = Math.floor(weeksSincePlan / 5);
  
  const phases: CyclePhase[] = ["adaptacao", "aumento", "moderado", "intenso", "deload"];
  const phase = phases[weekInCycle - 1];
  const config = PHASE_CONFIG[phase];
  
  // After each cycle, the base gets slightly stronger
  const cycleBoost = 1 + (totalCycles + totalCompletedCycles) * 0.02;
  
  return {
    currentWeek: weekInCycle,
    phase,
    phaseLabel: config.label,
    phaseEmoji: config.emoji,
    phaseDescription: config.description,
    totalCycles: totalCycles + totalCompletedCycles,
    loadMultiplier: Math.round(config.loadMultiplier * cycleBoost * 100) / 100,
    volumeAdjust: config.volumeAdjust,
    restAdjust: config.restAdjust,
    repRangeShift: config.repRangeShift,
  };
}

// ============ PERFORMANCE ANALYSIS ============

/**
 * Analyze performance and provide progression advice.
 */
export function analyzePerformance(
  metrics: PerformanceMetrics,
  cycleStatus: CycleStatus,
  experienceLevel: string
): ProgressionAdvice {
  const { completionRate, failureRate, consistencyDays, sessionsThisWeek, avgRepsHitRate, excessiveSwaps } = metrics;
  
  // Overtraining detection
  const overtrainingRisk = (
    failureRate > 40 ||
    (consistencyDays >= 7 && failureRate > 25) ||
    excessiveSwaps
  );
  
  if (overtrainingRisk) {
    return {
      loadChange: "decrease",
      loadPercent: -10,
      volumeChange: "reduce_set",
      restChange: "increase",
      restDelta: 30,
      repStrategy: "maintain",
      overtrainingRisk: true,
      feedback: "Sinais de overtraining detectados — reduzindo intensidade para recuperação",
      feedbackEmoji: "⚠️",
    };
  }
  
  // Deload week — always reduce
  if (cycleStatus.phase === "deload") {
    return {
      loadChange: "decrease",
      loadPercent: -15,
      volumeChange: "reduce_set",
      restChange: "increase",
      restDelta: 15,
      repStrategy: "maintain",
      overtrainingRisk: false,
      feedback: "Semana de recuperação — treino leve para crescer na próxima fase",
      feedbackEmoji: "🧘",
    };
  }
  
  // Excellent performance: all sets done, reps hit
  if (completionRate >= 90 && avgRepsHitRate >= 85 && sessionsThisWeek >= 3) {
    const maxSeries = MAX_SERIES[experienceLevel] || 5;
    const canAddVolume = cycleStatus.phase === "moderado" || cycleStatus.phase === "intenso";
    
    return {
      loadChange: "increase",
      loadPercent: cycleStatus.phase === "intenso" ? 10 : 5,
      volumeChange: canAddVolume ? "add_set" : "maintain",
      restChange: cycleStatus.phase === "intenso" ? "reduce" : "maintain",
      restDelta: cycleStatus.phase === "intenso" ? -15 : 0,
      repStrategy: avgRepsHitRate >= 95 ? "increase_load" : "push_reps",
      overtrainingRisk: false,
      feedback: "Desempenho excelente! Aumentando desafio 💪",
      feedbackEmoji: "🚀",
    };
  }
  
  // Good performance: most sets done
  if (completionRate >= 70 && avgRepsHitRate >= 60) {
    return {
      loadChange: "maintain",
      loadPercent: 0,
      volumeChange: "maintain",
      restChange: "maintain",
      restDelta: 0,
      repStrategy: "push_reps",
      overtrainingRisk: false,
      feedback: "Bom progresso — mantenha o ritmo para evoluir",
      feedbackEmoji: "💪",
    };
  }
  
  // Poor performance: struggling
  return {
    loadChange: "decrease",
    loadPercent: -5,
    volumeChange: "maintain",
    restChange: "increase",
    restDelta: 15,
    repStrategy: "maintain",
    overtrainingRisk: false,
    feedback: "Ajustando carga para melhor forma e segurança",
    feedbackEmoji: "📉",
  };
}

// ============ APPLY PROGRESSION TO EXERCISE ============

/**
 * Apply cycle adjustments to a specific exercise's parameters.
 */
export function applyProgressionToExercise(
  baseWeight: number,
  baseSeries: number,
  baseReps: string,
  baseRest: number,
  cycleStatus: CycleStatus,
  advice: ProgressionAdvice | null,
  experienceLevel: string
): {
  adjustedWeight: number;
  adjustedSeries: number;
  adjustedReps: string;
  adjustedRest: number;
  changes: string[];
} {
  const changes: string[] = [];
  const maxSeries = MAX_SERIES[experienceLevel] || 5;
  
  // Weight adjustment
  let adjustedWeight = baseWeight;
  if (baseWeight > 0) {
    adjustedWeight = Math.round(baseWeight * cycleStatus.loadMultiplier * 2) / 2; // round to 0.5
    if (advice) {
      adjustedWeight = Math.round(adjustedWeight * (1 + advice.loadPercent / 100) * 2) / 2;
    }
    if (adjustedWeight !== baseWeight) {
      const delta = adjustedWeight - baseWeight;
      changes.push(`${delta > 0 ? "+" : ""}${delta}kg carga`);
    }
  }
  
  // Volume adjustment
  let adjustedSeries = baseSeries + cycleStatus.volumeAdjust;
  if (advice?.volumeChange === "add_set") adjustedSeries += 1;
  if (advice?.volumeChange === "reduce_set") adjustedSeries -= 1;
  adjustedSeries = Math.max(2, Math.min(maxSeries, adjustedSeries));
  if (adjustedSeries !== baseSeries) {
    changes.push(`${adjustedSeries > baseSeries ? "+" : ""}${adjustedSeries - baseSeries} série${Math.abs(adjustedSeries - baseSeries) > 1 ? "s" : ""}`);
  }
  
  // Rep range adjustment
  let adjustedReps = baseReps;
  const repMatch = baseReps.match(/^(\d+)(?:[–-](\d+))?$/);
  if (repMatch) {
    const low = parseInt(repMatch[1]);
    const high = repMatch[2] ? parseInt(repMatch[2]) : low;
    const shift = cycleStatus.repRangeShift + (advice?.repStrategy === "push_reps" ? 2 : 0);
    if (shift !== 0) {
      const newLow = Math.max(4, low + shift);
      const newHigh = Math.max(newLow, high + shift);
      adjustedReps = newLow === newHigh ? `${newLow}` : `${newLow}–${newHigh}`;
      if (adjustedReps !== baseReps) changes.push(`reps → ${adjustedReps}`);
    }
  }
  
  // Rest adjustment
  let adjustedRest = baseRest + cycleStatus.restAdjust;
  if (advice) adjustedRest += advice.restDelta;
  adjustedRest = Math.max(30, Math.min(180, adjustedRest));
  if (adjustedRest !== baseRest) {
    changes.push(`descanso ${adjustedRest}s`);
  }
  
  return {
    adjustedWeight: Math.max(0, adjustedWeight),
    adjustedSeries,
    adjustedReps,
    adjustedRest,
    changes,
  };
}

// ============ OVERTRAINING PROTECTION ============

/**
 * Check if the same muscle group was trained the day before (heavy).
 */
export function checkOvertrain(
  targetGroup: string,
  recentSessions: Array<{ muscle_group: string; completed_at: string }>
): { safe: boolean; warning: string | null } {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);
  
  const yesterdaySessions = recentSessions.filter(
    s => s.completed_at.slice(0, 10) === yesterdayKey
  );
  
  const sameGroupYesterday = yesterdaySessions.some(
    s => s.muscle_group.toLowerCase().includes(targetGroup.toLowerCase())
  );
  
  if (sameGroupYesterday) {
    return {
      safe: false,
      warning: `Você treinou ${targetGroup} ontem. Considere um treino de outro grupo muscular ou mobilidade.`,
    };
  }
  
  return { safe: true, warning: null };
}

// ============ EVOLUTION TIMELINE ============

export type EvolutionEntry = {
  weekLabel: string;
  phase: CyclePhase;
  phaseLabel: string;
  phaseEmoji: string;
  avgLoad: number;
  maxReps: number;
  consistency: number; // 0-100
  sessionsCount: number;
};

/**
 * Build a timeline of evolution over the last N weeks.
 */
export function buildEvolutionTimeline(
  sessions: Array<{ completed_at: string; exercises_completed: number; exercises_total: number }>,
  exerciseHistory: Array<{ weight: number; reps: number; created_at: string }>,
  planCreatedAt: string,
  weeks: number = 8
): EvolutionEntry[] {
  const timeline: EvolutionEntry[] = [];
  const now = new Date();
  
  for (let w = weeks - 1; w >= 0; w--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (w + 1) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    
    const weekSessions = sessions.filter(s => {
      const d = new Date(s.completed_at);
      return d >= weekStart && d < weekEnd;
    });
    
    const weekHistory = exerciseHistory.filter(h => {
      const d = new Date(h.created_at);
      return d >= weekStart && d < weekEnd;
    });
    
    const cycleStatus = getCycleStatus(planCreatedAt);
    // Approximate what week in cycle this was
    const diffWeeks = Math.floor((weekStart.getTime() - new Date(planCreatedAt).getTime()) / (7 * 24 * 60 * 60 * 1000));
    const weekInCycle = (Math.max(0, diffWeeks) % 5) + 1;
    const phases: CyclePhase[] = ["adaptacao", "aumento", "moderado", "intenso", "deload"];
    const phase = phases[weekInCycle - 1] || "adaptacao";
    const phaseConfig = PHASE_CONFIG[phase];
    
    const avgLoad = weekHistory.length > 0
      ? Math.round(weekHistory.reduce((a, h) => a + h.weight, 0) / weekHistory.length * 10) / 10
      : 0;
    const maxReps = weekHistory.length > 0
      ? Math.max(...weekHistory.map(h => h.reps))
      : 0;
    
    timeline.push({
      weekLabel: `Sem ${weeks - w}`,
      phase,
      phaseLabel: phaseConfig.label,
      phaseEmoji: phaseConfig.emoji,
      avgLoad,
      maxReps,
      consistency: weekSessions.length > 0 ? Math.min(100, Math.round((weekSessions.length / 5) * 100)) : 0,
      sessionsCount: weekSessions.length,
    });
  }
  
  return timeline;
}
