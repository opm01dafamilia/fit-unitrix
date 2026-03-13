/**
 * Smart Progression Engine - Etapa 3.14
 * Auto-adjusts difficulty based on RPE (perceived effort) and performance history.
 * Progression is independent per muscle group.
 */

export type RPE = "leve" | "moderado" | "pesado";

export type ExercisePerformance = {
  exercise_name: string;
  muscle_group: string;
  sets_completed: number;
  sets_target: number;
  avg_reps: number;
  target_reps: number;
  max_weight: number;
  rpe: RPE;
  date: string;
};

export type ProgressionAction =
  | "increase_reps"
  | "increase_weight"
  | "reduce_rest"
  | "increase_sets"
  | "suggest_advanced"
  | "decrease_weight"
  | "increase_rest"
  | "suggest_easier"
  | "maintain";

export type ProgressionDecision = {
  action: ProgressionAction;
  label: string;
  emoji: string;
  detail: string;
  type: "evolution" | "overload" | "maintain";
};

export type MuscleGroupEvolution = {
  group: string;
  trend: "up" | "down" | "stable";
  sessions: number;
  avgWeightChange: number;
  lastRPE: RPE | null;
  consecutiveEasy: number;
  consecutiveHard: number;
};

// ===== STORAGE =====
const PERF_KEY = "fitpulse_perf_history";
const MAX_ENTRIES = 200;

export function savePerformance(perf: ExercisePerformance): void {
  try {
    const all = loadAllPerformances();
    all.unshift(perf);
    // Keep only most recent entries
    const trimmed = all.slice(0, MAX_ENTRIES);
    localStorage.setItem(PERF_KEY, JSON.stringify(trimmed));
  } catch {}
}

export function loadAllPerformances(): ExercisePerformance[] {
  try {
    const raw = localStorage.getItem(PERF_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ExercisePerformance[];
  } catch {
    return [];
  }
}

export function getPerformancesForExercise(name: string): ExercisePerformance[] {
  return loadAllPerformances().filter(p => p.exercise_name === name);
}

export function getPerformancesForGroup(group: string): ExercisePerformance[] {
  return loadAllPerformances().filter(p => p.muscle_group === group);
}

// ===== EVOLUTION DETECTION =====

/**
 * Detect if user should progress (completed all sets, RPE leve/moderado, 2+ consecutive sessions)
 */
function shouldProgress(history: ExercisePerformance[]): boolean {
  if (history.length < 2) return false;
  const recent = history.slice(0, 2);
  return recent.every(p =>
    p.sets_completed >= p.sets_target &&
    p.avg_reps >= p.target_reps &&
    (p.rpe === "leve" || p.rpe === "moderado")
  );
}

/**
 * Detect overload (failing sets, RPE pesado, or abandoning)
 */
function isOverloaded(history: ExercisePerformance[]): boolean {
  if (history.length === 0) return false;
  const last = history[0];
  // Failed more than 40% of sets OR RPE pesado with poor completion
  const failRate = 1 - (last.sets_completed / last.sets_target);
  if (failRate > 0.4) return true;
  if (last.rpe === "pesado" && last.avg_reps < last.target_reps * 0.7) return true;
  // 2 consecutive pesado sessions
  if (history.length >= 2 && history[0].rpe === "pesado" && history[1].rpe === "pesado") return true;
  return false;
}

// ===== PROGRESSION ACTIONS (ordered) =====
const PROGRESSION_ORDER: { action: ProgressionAction; label: string; emoji: string; detail: string }[] = [
  { action: "increase_reps", emoji: "🔄", label: "Aumentar repetições", detail: "Adicione 1-2 reps por série no próximo treino." },
  { action: "increase_weight", emoji: "📈", label: "Aumentar carga", detail: "Suba o peso em 2-5% no próximo treino." },
  { action: "reduce_rest", emoji: "⏱️", label: "Reduzir descanso", detail: "Reduza o descanso em 10-15 segundos." },
  { action: "increase_sets", emoji: "➕", label: "Adicionar série", detail: "Inclua +1 série para aumentar o volume." },
  { action: "suggest_advanced", emoji: "⚡", label: "Variação avançada", detail: "Tente uma variação mais desafiadora do exercício." },
];

const DELOAD_ACTIONS: { action: ProgressionAction; label: string; emoji: string; detail: string }[] = [
  { action: "decrease_weight", emoji: "📉", label: "Reduzir carga", detail: "Reduza o peso em 10-15% para melhor execução." },
  { action: "suggest_easier", emoji: "🔄", label: "Alternativa mais leve", detail: "Considere um exercício mais acessível." },
  { action: "increase_rest", emoji: "⏸️", label: "Aumentar descanso", detail: "Aumente o descanso em 15-30 segundos." },
];

/**
 * Determine next progression step for an exercise based on history.
 * Follows the order: reps → weight → rest → sets → advanced variation.
 */
export function getProgressionDecision(exerciseName: string): ProgressionDecision {
  const history = getPerformancesForExercise(exerciseName);

  if (history.length === 0) {
    return { action: "maintain", label: "Primeiro treino", emoji: "🆕", detail: "Registre seu desempenho para receber recomendações.", type: "maintain" };
  }

  // Check overload first
  if (isOverloaded(history)) {
    const action = DELOAD_ACTIONS[0]; // decrease weight
    const last = history[0];
    // If already reduced weight before, suggest easier
    if (history.length >= 2 && history[1].max_weight > last.max_weight) {
      return { ...DELOAD_ACTIONS[1], type: "overload" };
    }
    return { ...action, type: "overload" };
  }

  // Check progression
  if (shouldProgress(history)) {
    // Determine which step in progression order to suggest
    const progressionIndex = getProgressionStepIndex(history);
    const step = PROGRESSION_ORDER[Math.min(progressionIndex, PROGRESSION_ORDER.length - 1)];
    return { ...step, type: "evolution" };
  }

  // Maintain
  return { action: "maintain", label: "Manter ritmo", emoji: "💪", detail: "Continue com a carga atual — quase lá!", type: "maintain" };
}

/**
 * Determine which progression step the user is at.
 * Tracks consecutive easy sessions to escalate progression.
 */
function getProgressionStepIndex(history: ExercisePerformance[]): number {
  // Count consecutive sessions where user completed everything with easy/moderate RPE
  let consecutive = 0;
  for (const p of history) {
    if (p.sets_completed >= p.sets_target && p.avg_reps >= p.target_reps && (p.rpe === "leve" || p.rpe === "moderado")) {
      consecutive++;
    } else break;
  }
  // Every 2 consecutive easy sessions, escalate one step
  return Math.floor((consecutive - 1) / 2);
}

// ===== MUSCLE GROUP EVOLUTION =====

export function getMuscleGroupEvolution(group: string): MuscleGroupEvolution {
  const history = getPerformancesForGroup(group);

  if (history.length === 0) {
    return { group, trend: "stable", sessions: 0, avgWeightChange: 0, lastRPE: null, consecutiveEasy: 0, consecutiveHard: 0 };
  }

  // Get unique session dates
  const sessionDates = [...new Set(history.map(p => p.date))];
  const sessions = sessionDates.length;

  // Average weight change between sessions
  const weightsByDate = new Map<string, number>();
  history.forEach(p => {
    const current = weightsByDate.get(p.date) || 0;
    weightsByDate.set(p.date, Math.max(current, p.max_weight));
  });
  const weights = Array.from(weightsByDate.values());
  let totalDelta = 0;
  let comparisons = 0;
  for (let i = 0; i < weights.length - 1; i++) {
    totalDelta += weights[i] - weights[i + 1];
    comparisons++;
  }
  const avgWeightChange = comparisons > 0 ? Math.round((totalDelta / comparisons) * 10) / 10 : 0;

  // Trend
  const trend: "up" | "down" | "stable" = avgWeightChange > 0.5 ? "up" : avgWeightChange < -0.5 ? "down" : "stable";

  // Consecutive easy/hard
  let consecutiveEasy = 0;
  let consecutiveHard = 0;
  for (const p of history) {
    if (p.rpe === "leve" || p.rpe === "moderado") {
      consecutiveEasy++;
      if (consecutiveEasy === 1) consecutiveHard = 0; // reset on first
    } else break;
  }
  for (const p of history) {
    if (p.rpe === "pesado") consecutiveHard++;
    else break;
  }

  return { group, trend, sessions, avgWeightChange, lastRPE: history[0]?.rpe || null, consecutiveEasy, consecutiveHard };
}

// ===== WEIGHT EVOLUTION DATA FOR CHARTS =====

export type WeightEvolutionPoint = {
  date: string;
  weight: number;
  reps: number;
  rpe?: RPE;
};

export function getExerciseEvolution(exerciseName: string): WeightEvolutionPoint[] {
  const history = getPerformancesForExercise(exerciseName);
  if (history.length === 0) return [];

  // Group by date, take max weight
  const byDate = new Map<string, WeightEvolutionPoint>();
  history.forEach(p => {
    const existing = byDate.get(p.date);
    if (!existing || p.max_weight > existing.weight) {
      byDate.set(p.date, { date: p.date, weight: p.max_weight, reps: Math.round(p.avg_reps), rpe: p.rpe });
    }
  });

  return Array.from(byDate.values()).reverse().slice(-8); // last 8 sessions
}

// ===== RPE-BASED REST ADJUSTMENT =====

export function getAdjustedRest(baseRest: number, rpe: RPE): number {
  if (rpe === "pesado") return Math.min(180, baseRest + 30);
  if (rpe === "leve") return Math.max(30, baseRest - 15);
  return baseRest;
}

// ===== PROGRESSION SUMMARY FOR COMPLETION SCREEN =====

export type SessionProgressionSummary = {
  totalEvolutions: number;
  totalOverloads: number;
  totalMaintain: number;
  topEvolution: { exercise: string; decision: ProgressionDecision } | null;
  groupSummaries: MuscleGroupEvolution[];
};

export function getSessionSummary(exerciseNames: string[], muscleGroup: string): SessionProgressionSummary {
  let totalEvolutions = 0;
  let totalOverloads = 0;
  let totalMaintain = 0;
  let topEvolution: { exercise: string; decision: ProgressionDecision } | null = null;

  exerciseNames.forEach(name => {
    const decision = getProgressionDecision(name);
    if (decision.type === "evolution") {
      totalEvolutions++;
      if (!topEvolution) topEvolution = { exercise: name, decision };
    } else if (decision.type === "overload") {
      totalOverloads++;
    } else {
      totalMaintain++;
    }
  });

  const groupEvolution = getMuscleGroupEvolution(muscleGroup);

  return { totalEvolutions, totalOverloads, totalMaintain, topEvolution, groupSummaries: [groupEvolution] };
}
