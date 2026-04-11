/**
 * Smart Progression Engine for Fit-Unitrix
 * Calculates weight recommendations based on exercise history and user level.
 */

export type ExerciseHistoryEntry = {
  weight: number;
  reps: number;
  set_number: number;
  created_at: string;
};

export type ProgressionResult = {
  recommendedWeight: number;
  feedback: "increase" | "maintain" | "decrease" | "first_time";
  feedbackLabel: string;
  feedbackEmoji: string;
  lastWeight: number;
  bestWeight: number;
  lastReps: number;
  weightDelta: number;
};

// Weight increment rules based on exercise type (small vs compound)
const COMPOUND_EXERCISES = new Set([
  "Supino Reto", "Supino Inclinado Halteres", "Supino Reto Máquina",
  "Agachamento Livre", "Agachamento Búlgaro", "Leg Press", "Leg Press 45°",
  "Stiff", "Remada Curvada", "Remada Cavaleiro", "Remada Curvada Pronada",
  "Barra Fixa", "Barra Fixa com Peso", "Desenvolvimento Militar",
  "Desenvolvimento Arnold", "Desenvolvimento Máquina", "Mergulho Paralelas",
]);

function getWeightIncrement(exerciseName: string, level: string): number {
  const isCompound = COMPOUND_EXERCISES.has(exerciseName);

  if (level === "iniciante") {
    return isCompound ? 2 : 1;
  }
  if (level === "intermediario") {
    return isCompound ? 2.5 : 1;
  }
  // avancado
  return isCompound ? 5 : 2;
}

function getWeightDecrement(exerciseName: string): number {
  return COMPOUND_EXERCISES.has(exerciseName) ? 2.5 : 1;
}

/**
 * Analyze the last session for an exercise and determine progression.
 * @param history - All sets from the most recent session for this exercise
 * @param targetSeries - Number of target sets
 * @param targetReps - Target reps per set (string like "10" or "8-12")
 * @param level - User experience level
 * @param exerciseName - Name of the exercise
 */
export function calculateProgression(
  history: ExerciseHistoryEntry[],
  targetSeries: number,
  targetReps: string,
  level: string,
  exerciseName: string
): ProgressionResult {
  // First time — no history
  if (!history || history.length === 0) {
    return {
      recommendedWeight: 0,
      feedback: "first_time",
      feedbackLabel: "Primeiro treino — registre seu peso",
      feedbackEmoji: "🆕",
      lastWeight: 0,
      bestWeight: 0,
      lastReps: 0,
      weightDelta: 0,
    };
  }

  // Parse target reps (handle ranges like "8-12")
  const targetRepNum = parseInt(targetReps) || 10;

  // Get the most recent session's sets (grouped by created_at date)
  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Group by session date
  const lastSessionDate = sortedHistory[0].created_at.slice(0, 10);
  const lastSessionSets = sortedHistory.filter(
    (h) => h.created_at.slice(0, 10) === lastSessionDate
  );

  const lastWeight = lastSessionSets.length > 0
    ? Math.max(...lastSessionSets.map((s) => s.weight))
    : 0;

  const bestWeight = Math.max(...sortedHistory.map((s) => s.weight));
  const lastReps = lastSessionSets.length > 0 ? lastSessionSets[0].reps : 0;

  // Evaluate performance
  const completedSets = lastSessionSets.length;
  const avgReps =
    lastSessionSets.reduce((sum, s) => sum + s.reps, 0) / lastSessionSets.length;

  const setsComplete = completedSets >= targetSeries;
  const repsComplete = avgReps >= targetRepNum;

  const increment = getWeightIncrement(exerciseName, level);
  const decrement = getWeightDecrement(exerciseName);

  let recommendedWeight = lastWeight;
  let feedback: ProgressionResult["feedback"] = "maintain";
  let feedbackLabel = "Manter carga atual";
  let feedbackEmoji = "➡️";

  if (setsComplete && repsComplete) {
    // All sets and reps completed — suggest increase
    recommendedWeight = lastWeight + increment;
    feedback = "increase";
    feedbackLabel = `Aumentar +${increment}kg — ótimo desempenho!`;
    feedbackEmoji = "📈";
  } else if (completedSets < targetSeries * 0.5 || avgReps < targetRepNum * 0.6) {
    // Failed significantly — suggest decrease
    recommendedWeight = Math.max(0, lastWeight - decrement);
    feedback = "decrease";
    feedbackLabel = `Reduzir -${decrement}kg — ajuste para melhor forma`;
    feedbackEmoji = "📉";
  } else {
    // Partial completion — maintain
    feedback = "maintain";
    feedbackLabel = "Manter carga — quase lá!";
    feedbackEmoji = "💪";
  }

  return {
    recommendedWeight: Math.max(0, recommendedWeight),
    feedback,
    feedbackLabel,
    feedbackEmoji,
    lastWeight,
    bestWeight,
    lastReps,
    weightDelta: recommendedWeight - lastWeight,
  };
}

/**
 * Calculate weekly evolution summary
 */
export type WeeklyEvolution = {
  exercisesImproved: number;
  exercisesTotal: number;
  avgWeightIncrease: number;
  consistency: number; // 0-100
  totalSessions: number;
};

export function calculateWeeklyEvolution(
  thisWeekHistory: ExerciseHistoryEntry[],
  lastWeekHistory: ExerciseHistoryEntry[],
  sessionsThisWeek: number,
  targetDaysPerWeek: number
): WeeklyEvolution {
  if (thisWeekHistory.length === 0) {
    return {
      exercisesImproved: 0,
      exercisesTotal: 0,
      avgWeightIncrease: 0,
      consistency: 0,
      totalSessions: sessionsThisWeek,
    };
  }

  // Group by exercise name for this week
  const thisWeekByExercise = new Map<string, number>();
  const lastWeekByExercise = new Map<string, number>();

  // Use the interface with exercise_name
  type HistoryWithName = ExerciseHistoryEntry & { exercise_name?: string };

  (thisWeekHistory as HistoryWithName[]).forEach((h) => {
    const name = h.exercise_name || "unknown";
    const current = thisWeekByExercise.get(name) || 0;
    thisWeekByExercise.set(name, Math.max(current, h.weight));
  });

  (lastWeekHistory as HistoryWithName[]).forEach((h) => {
    const name = h.exercise_name || "unknown";
    const current = lastWeekByExercise.get(name) || 0;
    lastWeekByExercise.set(name, Math.max(current, h.weight));
  });

  let improved = 0;
  let totalDelta = 0;
  let comparedCount = 0;

  thisWeekByExercise.forEach((weight, name) => {
    const lastWeekWeight = lastWeekByExercise.get(name);
    if (lastWeekWeight !== undefined) {
      comparedCount++;
      if (weight > lastWeekWeight) {
        improved++;
        totalDelta += weight - lastWeekWeight;
      }
    }
  });

  return {
    exercisesImproved: improved,
    exercisesTotal: thisWeekByExercise.size,
    avgWeightIncrease: comparedCount > 0 ? Math.round((totalDelta / comparedCount) * 10) / 10 : 0,
    consistency: Math.min(100, Math.round((sessionsThisWeek / targetDaysPerWeek) * 100)),
    totalSessions: sessionsThisWeek,
  };
}
