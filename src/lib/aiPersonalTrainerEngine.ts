/**
 * AI Personal Trainer Engine — Enhanced
 * Post-workout + weekly analysis → auto-adjusts intensity, volume, load, cardio.
 * Smart exercise swaps, coach messages, and evolution tracking.
 */

// ===== TYPES =====

export type TrainerLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type IntensityTier = "leve" | "moderado" | "intenso" | "avancado";

export type AdjustmentAction =
  | "increase_intensity"
  | "reduce_rest"
  | "add_series"
  | "add_exercise"
  | "increase_difficulty"
  | "increase_reps"
  | "increase_load"
  | "reduce_intensity"
  | "reduce_volume"
  | "increase_rest"
  | "swap_exercises"
  | "suggest_recovery"
  | "add_cardio"
  | "reduce_muscle_intensity"
  | "maintain";

export type WeeklyAnalysis = {
  weekStart: string;
  workoutsDone: number;
  workoutsTarget: number;
  totalSeries: number;
  avgRestTime: number;
  daysWithoutTraining: number;
  streak: number;
  failedSets: number;
  totalSets: number;
  completionRate: number;
  failureRate: number;
  skippedExercises: number;
  swappedExercises: number;
  cardioSessions: number;
  weeklyVolume: number; // total reps * weight
  avgLoadKg: number;
  suggestedLoadChange: number; // % change
  volumeAdjustment: "add" | "reduce" | "maintain";
  cardioRecommendation: "add_light" | "reduce_muscle" | "maintain";
};

export type AdjustmentEntry = {
  date: string;
  weekStart: string;
  actions: AdjustmentAction[];
  reason: string;
  coachMessage: string;
  levelBefore: TrainerLevel;
  levelAfter: TrainerLevel;
  intensityBefore: IntensityTier;
  intensityAfter: IntensityTier;
};

export type TrainerState = {
  currentLevel: TrainerLevel;
  currentIntensity: IntensityTier;
  lastAdjustmentDate: string | null;
  consecutiveIncreases: number;
  totalWorkoutsAnalyzed: number;
  adjustmentHistory: AdjustmentEntry[];
};

export type ExerciseFailureRecord = {
  exerciseName: string;
  muscleGroup: string;
  failCount: number;
  skipCount: number;
  swapCount: number;
  lastFailDate: string;
};

export type SwapSuggestion = {
  original: string;
  suggested: string;
  reason: string;
  muscleGroup: string;
};

export type EvolutionSnapshot = {
  level: TrainerLevel;
  intensity: IntensityTier;
  adjustments: AdjustmentEntry[];
  coachMessage: string;
  swapSuggestions: SwapSuggestion[];
  weeklyAnalysis: WeeklyAnalysis | null;
  suggestedLoadPct: number;
  weeklyVolume: number;
  cardioStatus: "adding" | "reducing" | "ok";
  totalWorkoutsAnalyzed: number;
};

// ===== CONSTANTS =====

const STORAGE_KEY = "fitpulse_trainer_state";
const FAILURE_KEY = "fitpulse_exercise_failures";
const MIN_WORKOUTS_BEFORE_INCREASE = 3;

const INTENSITY_ORDER: IntensityTier[] = ["leve", "moderado", "intenso", "avancado"];

const LEVEL_THRESHOLDS = [0, 50, 120, 210, 320, 450, 600, 780, 1000, 1250];

const INTENSITY_LABELS: Record<IntensityTier, { label: string; emoji: string; color: string }> = {
  leve: { label: "Leve", emoji: "🌱", color: "text-emerald-400" },
  moderado: { label: "Moderado", emoji: "⚡", color: "text-amber-400" },
  intenso: { label: "Intenso", emoji: "🔥", color: "text-orange-400" },
  avancado: { label: "Avançado", emoji: "💎", color: "text-purple-400" },
};

const LEVEL_LABELS: Record<number, string> = {
  1: "Iniciante",
  2: "Aprendiz",
  3: "Praticante",
  4: "Regular",
  5: "Dedicado",
  6: "Avançado",
  7: "Atleta",
  8: "Elite",
  9: "Mestre",
  10: "Lenda",
};

// ===== STORAGE =====

export function loadTrainerState(): TrainerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { totalWorkoutsAnalyzed: 0, ...parsed };
    }
  } catch {}
  return {
    currentLevel: 1,
    currentIntensity: "moderado",
    lastAdjustmentDate: null,
    consecutiveIncreases: 0,
    totalWorkoutsAnalyzed: 0,
    adjustmentHistory: [],
  };
}

export function saveTrainerState(state: TrainerState): void {
  try {
    state.adjustmentHistory = state.adjustmentHistory.slice(0, 30);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function loadExerciseFailures(): ExerciseFailureRecord[] {
  try {
    const raw = localStorage.getItem(FAILURE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveExerciseFailures(records: ExerciseFailureRecord[]): void {
  try {
    localStorage.setItem(FAILURE_KEY, JSON.stringify(records.slice(0, 50)));
  } catch {}
}

export function recordExerciseFailure(exerciseName: string, muscleGroup: string): void {
  const records = loadExerciseFailures();
  const existing = records.find(r => r.exerciseName === exerciseName);
  if (existing) {
    existing.failCount++;
    existing.lastFailDate = new Date().toISOString().slice(0, 10);
  } else {
    records.push({
      exerciseName,
      muscleGroup,
      failCount: 1,
      skipCount: 0,
      swapCount: 0,
      lastFailDate: new Date().toISOString().slice(0, 10),
    });
  }
  saveExerciseFailures(records);
}

export function recordExerciseSkip(exerciseName: string, muscleGroup: string): void {
  const records = loadExerciseFailures();
  const existing = records.find(r => r.exerciseName === exerciseName);
  if (existing) {
    existing.skipCount = (existing.skipCount || 0) + 1;
    existing.lastFailDate = new Date().toISOString().slice(0, 10);
  } else {
    records.push({
      exerciseName,
      muscleGroup,
      failCount: 0,
      skipCount: 1,
      swapCount: 0,
      lastFailDate: new Date().toISOString().slice(0, 10),
    });
  }
  saveExerciseFailures(records);
}

export function recordExerciseSwap(exerciseName: string, muscleGroup: string): void {
  const records = loadExerciseFailures();
  const existing = records.find(r => r.exerciseName === exerciseName);
  if (existing) {
    existing.swapCount = (existing.swapCount || 0) + 1;
    existing.lastFailDate = new Date().toISOString().slice(0, 10);
  } else {
    records.push({
      exerciseName,
      muscleGroup,
      failCount: 0,
      skipCount: 0,
      swapCount: 1,
      lastFailDate: new Date().toISOString().slice(0, 10),
    });
  }
  saveExerciseFailures(records);
}

// ===== WEEKLY ANALYSIS =====

export function buildWeeklyAnalysis(
  sessions: Array<{
    completed_at: string;
    exercises_completed: number;
    exercises_total: number;
  }>,
  exerciseHistory: Array<{
    weight: number;
    reps: number;
    set_number: number;
    created_at: string;
  }>,
  targetDays: number,
  streak: number,
  skippedExercises?: number,
  swappedExercises?: number,
  cardioSessions?: number
): WeeklyAnalysis {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekStartStr = weekStart.toISOString().slice(0, 10);

  const weekSessions = sessions.filter(s => s.completed_at.slice(0, 10) >= weekStartStr);
  const weekHistory = exerciseHistory.filter(h => h.created_at.slice(0, 10) >= weekStartStr);

  const workoutsDone = new Set(weekSessions.map(s => s.completed_at.slice(0, 10))).size;
  const totalSeries = weekHistory.length;

  const avgRestTime = 60;
  const dayOfWeek = now.getDay();
  const daysWithoutTraining = Math.max(0, dayOfWeek - workoutsDone);

  const totalExercisesTarget = weekSessions.reduce((a, s) => a + s.exercises_total, 0);
  const totalExercisesDone = weekSessions.reduce((a, s) => a + s.exercises_completed, 0);
  const completionRate = totalExercisesTarget > 0 ? Math.round((totalExercisesDone / totalExercisesTarget) * 100) : 100;
  const failedSets = Math.max(0, totalExercisesTarget - totalExercisesDone);
  const failureRate = totalExercisesTarget > 0 ? Math.round((failedSets / totalExercisesTarget) * 100) : 0;

  // Volume and load
  const weeklyVolume = weekHistory.reduce((sum, h) => sum + h.weight * h.reps, 0);
  const avgLoadKg = weekHistory.length > 0
    ? Math.round(weekHistory.reduce((s, h) => s + h.weight, 0) / weekHistory.length * 10) / 10
    : 0;

  // Suggested load change based on performance
  let suggestedLoadChange = 0;
  if (completionRate >= 90 && failureRate < 10) {
    suggestedLoadChange = 5; // +5%
  } else if (completionRate >= 75) {
    suggestedLoadChange = 2; // +2%
  } else if (failureRate > 30) {
    suggestedLoadChange = -10; // -10%
  } else if (failureRate > 15) {
    suggestedLoadChange = -5; // -5%
  }

  // Volume adjustment: streak 10+ → add, 3+ failures in week → reduce
  const failedWorkouts = weekSessions.filter(s => s.exercises_completed < s.exercises_total * 0.5).length;
  let volumeAdjustment: "add" | "reduce" | "maintain" = "maintain";
  if (streak >= 10 && completionRate >= 80) {
    volumeAdjustment = "add";
  } else if (failedWorkouts >= 3) {
    volumeAdjustment = "reduce";
  }

  // Cardio recommendation
  const actualCardio = cardioSessions ?? 0;
  let cardioRecommendation: "add_light" | "reduce_muscle" | "maintain" = "maintain";
  if (actualCardio === 0 && workoutsDone >= 2) {
    cardioRecommendation = "add_light";
  } else if (actualCardio >= workoutsDone && workoutsDone >= 4) {
    cardioRecommendation = "reduce_muscle";
  }

  return {
    weekStart: weekStartStr,
    workoutsDone,
    workoutsTarget: targetDays,
    totalSeries,
    avgRestTime,
    daysWithoutTraining,
    streak,
    failedSets,
    totalSets: totalSeries,
    completionRate,
    failureRate,
    skippedExercises: skippedExercises ?? 0,
    swappedExercises: swappedExercises ?? 0,
    cardioSessions: actualCardio,
    weeklyVolume,
    avgLoadKg,
    suggestedLoadChange,
    volumeAdjustment,
    cardioRecommendation,
  };
}

// ===== CORE ADJUSTMENT LOGIC =====

export function performWeeklyAdjustment(
  analysis: WeeklyAnalysis,
  state: TrainerState
): AdjustmentEntry {
  const actions: AdjustmentAction[] = [];
  let reason = "";
  const levelBefore = state.currentLevel;
  const intensityBefore = state.currentIntensity;
  let newLevel = state.currentLevel;
  let newIntensity = state.currentIntensity;

  const performanceScore = (
    (analysis.completionRate * 0.35) +
    (Math.min(100, (analysis.workoutsDone / Math.max(1, analysis.workoutsTarget)) * 100) * 0.25) +
    (Math.min(100, analysis.streak * 12) * 0.2) +
    ((100 - analysis.failureRate) * 0.1) +
    ((100 - Math.min(100, analysis.skippedExercises * 20)) * 0.1)
  );

  const isPerformingWell = performanceScore >= 75;
  const isStruggling = performanceScore < 45;
  // PROTECTION: never increase in less than MIN_WORKOUTS_BEFORE_INCREASE workouts
  const canIncrease = state.consecutiveIncreases < 2 && (state.totalWorkoutsAnalyzed || 0) >= MIN_WORKOUTS_BEFORE_INCREASE;

  if (isPerformingWell && canIncrease) {
    if (analysis.completionRate >= 90 && analysis.workoutsDone >= analysis.workoutsTarget) {
      actions.push("increase_intensity");
      actions.push("increase_reps");
      if (analysis.suggestedLoadChange > 0) {
        actions.push("increase_load");
      }
      reason = "Desempenho excelente — aumentando desafio e carga";
    } else {
      actions.push("add_series");
      reason = "Bom progresso — adicionando volume";
    }

    if (analysis.streak >= 5) {
      actions.push("increase_difficulty");
    }

    // Volume: add exercise if streak 10+
    if (analysis.volumeAdjustment === "add") {
      actions.push("add_exercise");
      reason += ". Streak forte — exercício extra adicionado";
    }

    // Reduce rest for high performers
    if (analysis.completionRate >= 95) {
      actions.push("reduce_rest");
    }

    newLevel = Math.min(10, newLevel + 1) as TrainerLevel;
    const intensityIdx = INTENSITY_ORDER.indexOf(newIntensity);
    if (newLevel % 2 === 0 && intensityIdx < INTENSITY_ORDER.length - 1) {
      newIntensity = INTENSITY_ORDER[intensityIdx + 1];
    }
  } else if (isStruggling) {
    actions.push("reduce_intensity");
    actions.push("increase_rest");

    if (analysis.failureRate > 30) {
      actions.push("swap_exercises");
    }

    if (analysis.daysWithoutTraining >= 3) {
      actions.push("suggest_recovery");
    }

    // Reduce volume if 3+ failed workouts
    if (analysis.volumeAdjustment === "reduce") {
      actions.push("reduce_volume");
    }

    reason = "Ajustando treino para melhor recuperação e evolução";

    const intensityIdx = INTENSITY_ORDER.indexOf(newIntensity);
    if (intensityIdx > 0) {
      newIntensity = INTENSITY_ORDER[intensityIdx - 1];
    }
  } else {
    actions.push("maintain");
    reason = "Ritmo estável — mantenha a consistência";
  }

  // Cardio intelligence
  if (analysis.cardioRecommendation === "add_light") {
    actions.push("add_cardio");
    reason += ". Cardio leve sugerido pós-treino";
  } else if (analysis.cardioRecommendation === "reduce_muscle") {
    actions.push("reduce_muscle_intensity");
    reason += ". Muita atividade aeróbica — intensidade muscular reduzida";
  }

  const coachMessage = generateCoachMessage(actions, analysis, performanceScore);

  const entry: AdjustmentEntry = {
    date: new Date().toISOString().slice(0, 10),
    weekStart: analysis.weekStart,
    actions,
    reason,
    coachMessage,
    levelBefore,
    levelAfter: newLevel,
    intensityBefore,
    intensityAfter: newIntensity,
  };

  state.currentLevel = newLevel;
  state.currentIntensity = newIntensity;
  state.lastAdjustmentDate = entry.date;
  state.consecutiveIncreases = isPerformingWell && canIncrease
    ? state.consecutiveIncreases + 1
    : 0;
  state.totalWorkoutsAnalyzed = (state.totalWorkoutsAnalyzed || 0) + analysis.workoutsDone;
  state.adjustmentHistory.unshift(entry);
  saveTrainerState(state);

  return entry;
}

// ===== COACH MESSAGES =====

function generateCoachMessage(
  actions: AdjustmentAction[],
  analysis: WeeklyAnalysis,
  score: number
): string {
  if (actions.includes("add_exercise")) {
    return "🚀 Seu streak está incrível! Adicionei um exercício extra para maximizar seus resultados.";
  }

  if (actions.includes("increase_load")) {
    return "📈 Você está evoluindo! Intensidade e carga aumentadas para o próximo nível.";
  }

  if (score >= 85) {
    const msgs = [
      "🚀 Seu treino foi ajustado para acelerar seus resultados. Você está evoluindo rápido!",
      "💪 Performance incrível! Estou aumentando o desafio para manter sua evolução.",
      "🔥 Consistência impecável! Novos ajustes aplicados para levar você ao próximo nível.",
    ];
    return msgs[Math.floor(Math.random() * msgs.length)];
  }

  if (score >= 60) {
    const msgs = [
      "⚡ Bom ritmo! Pequenos ajustes foram feitos para otimizar seus resultados.",
      "📈 Seu treino está no caminho certo. Mantenha a consistência!",
      "💪 Continue assim! Os ajustes desta semana vão consolidar seu progresso.",
    ];
    return msgs[Math.floor(Math.random() * msgs.length)];
  }

  if (actions.includes("reduce_volume")) {
    return "📊 Detectei dificuldade nos últimos treinos. Volume reduzido para melhorar recuperação.";
  }

  if (actions.includes("suggest_recovery")) {
    return "🌱 Notei que você precisa de mais recuperação. Ajustei o treino para voltar com segurança.";
  }

  if (actions.includes("swap_exercises")) {
    return "🔄 Exercício substituído para manter sua evolução. Alternativa mais adequada sugerida.";
  }

  if (actions.includes("add_cardio")) {
    return "🏃 Adicionei cardio leve pós-treino para melhorar seu condicionamento e recuperação.";
  }

  if (actions.includes("reduce_muscle_intensity")) {
    return "⚖️ Você está fazendo muito cardio. Reduzi a intensidade muscular para evitar overtraining.";
  }

  return "📊 Seu treino foi adaptado com base na análise semanal. Foco em evolução sustentável!";
}

// ===== EXERCISE SWAP SUGGESTIONS =====

const SWAP_MAP: Record<string, string[]> = {
  "Supino Reto": ["Supino Inclinado", "Supino com Halteres", "Flexão de Braço"],
  "Agachamento Livre": ["Leg Press", "Agachamento no Smith", "Agachamento Búlgaro"],
  "Levantamento Terra": ["Stiff", "Elevação Pélvica", "Good Morning"],
  "Desenvolvimento": ["Elevação Lateral", "Arnold Press", "Desenvolvimento com Halteres"],
  "Rosca Direta": ["Rosca Alternada", "Rosca Martelo", "Rosca Scott"],
  "Tríceps Pulley": ["Tríceps Francês", "Tríceps Testa", "Mergulho"],
  "Puxada Frontal": ["Remada Curvada", "Pulldown", "Remada Unilateral"],
  "Remada Curvada": ["Remada Cavalinho", "Remada Unilateral", "Puxada Frontal"],
  "Cadeira Extensora": ["Agachamento Búlgaro", "Passada", "Leg Press"],
  "Mesa Flexora": ["Stiff", "Cadeira Flexora", "Elevação Pélvica"],
  "Leg Press": ["Agachamento no Smith", "Hack Squat", "Agachamento Livre"],
  "Elevação Lateral": ["Elevação Frontal", "Desenvolvimento com Halteres", "Face Pull"],
  "Crucifixo": ["Crossover", "Peck Deck", "Flexão Aberta"],
};

export function getSwapSuggestions(): SwapSuggestion[] {
  const failures = loadExerciseFailures();
  const suggestions: SwapSuggestion[] = [];

  for (const record of failures) {
    const totalIssues = (record.failCount || 0) + (record.skipCount || 0) + (record.swapCount || 0);
    if (totalIssues >= 3) {
      const alternatives = SWAP_MAP[record.exerciseName];
      if (alternatives && alternatives.length > 0) {
        const suggested = alternatives[Math.floor(Math.random() * alternatives.length)];
        let reason = "";
        if ((record.skipCount || 0) >= 2) {
          reason = `Pulado ${record.skipCount}x — substituição automática recomendada`;
        } else if ((record.swapCount || 0) >= 2) {
          reason = `Trocado ${record.swapCount}x — alternativa permanente sugerida`;
        } else {
          reason = `Falhou ${record.failCount}x — alternativa recomendada`;
        }
        suggestions.push({
          original: record.exerciseName,
          suggested,
          reason,
          muscleGroup: record.muscleGroup,
        });
      }
    }
  }

  return suggestions;
}

// ===== CHECK IF ANALYSIS NEEDED =====

export function needsWeeklyAnalysis(state: TrainerState): boolean {
  if (!state.lastAdjustmentDate) return true;

  const lastDate = new Date(state.lastAdjustmentDate);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - lastDate.getTime()) / 86400000);

  return daysDiff >= 7;
}

// ===== EVOLUTION SNAPSHOT =====

export function getEvolutionSnapshot(
  sessions: Array<{ completed_at: string; exercises_completed: number; exercises_total: number }>,
  exerciseHistory: Array<{ weight: number; reps: number; set_number: number; created_at: string }>,
  targetDays: number,
  streak: number,
  skippedExercises?: number,
  swappedExercises?: number,
  cardioSessions?: number
): EvolutionSnapshot {
  const state = loadTrainerState();
  let weeklyAnalysis: WeeklyAnalysis | null = null;
  let latestCoachMessage = "";

  if (needsWeeklyAnalysis(state)) {
    weeklyAnalysis = buildWeeklyAnalysis(sessions, exerciseHistory, targetDays, streak, skippedExercises, swappedExercises, cardioSessions);
    const entry = performWeeklyAdjustment(weeklyAnalysis, state);
    latestCoachMessage = entry.coachMessage;
  } else {
    latestCoachMessage = state.adjustmentHistory[0]?.coachMessage || "Bem-vindo ao seu treinador inteligente!";
    if (sessions.length > 0) {
      weeklyAnalysis = buildWeeklyAnalysis(sessions, exerciseHistory, targetDays, streak, skippedExercises, swappedExercises, cardioSessions);
    }
  }

  const suggestedLoadPct = weeklyAnalysis?.suggestedLoadChange ?? 0;
  const weeklyVolume = weeklyAnalysis?.weeklyVolume ?? 0;

  let cardioStatus: "adding" | "reducing" | "ok" = "ok";
  if (weeklyAnalysis?.cardioRecommendation === "add_light") cardioStatus = "adding";
  else if (weeklyAnalysis?.cardioRecommendation === "reduce_muscle") cardioStatus = "reducing";

  return {
    level: state.currentLevel,
    intensity: state.currentIntensity,
    adjustments: state.adjustmentHistory,
    coachMessage: latestCoachMessage,
    swapSuggestions: getSwapSuggestions(),
    weeklyAnalysis,
    suggestedLoadPct,
    weeklyVolume,
    cardioStatus,
    totalWorkoutsAnalyzed: state.totalWorkoutsAnalyzed || 0,
  };
}

// ===== GETTERS =====

export function getIntensityInfo(tier: IntensityTier) {
  return INTENSITY_LABELS[tier];
}

export function getLevelLabel(level: TrainerLevel): string {
  return LEVEL_LABELS[level] || "Nível " + level;
}

export function getLevelProgress(level: TrainerLevel): { current: number; next: number; pct: number } {
  const current = LEVEL_THRESHOLDS[level - 1] || 0;
  const next = LEVEL_THRESHOLDS[level] || current + 200;
  const state = loadTrainerState();
  const adjustmentsCount = state.adjustmentHistory.length;
  const estimatedXP = adjustmentsCount * 50 + (state.totalWorkoutsAnalyzed || 0) * 10;
  const pct = Math.min(100, Math.round(((estimatedXP - current) / (next - current)) * 100));
  return { current, next, pct: Math.max(0, pct) };
}

export function getActionLabel(action: AdjustmentAction): { label: string; emoji: string; type: "up" | "down" | "neutral" } {
  const map: Record<AdjustmentAction, { label: string; emoji: string; type: "up" | "down" | "neutral" }> = {
    increase_intensity: { label: "Intensidade aumentada", emoji: "🔥", type: "up" },
    reduce_rest: { label: "Descanso reduzido", emoji: "⏱️", type: "up" },
    add_series: { label: "Séries adicionadas", emoji: "➕", type: "up" },
    add_exercise: { label: "Exercício extra", emoji: "🆕", type: "up" },
    increase_difficulty: { label: "Dificuldade aumentada", emoji: "⚡", type: "up" },
    increase_reps: { label: "Repetições aumentadas", emoji: "🔄", type: "up" },
    increase_load: { label: "Carga aumentada", emoji: "📈", type: "up" },
    reduce_intensity: { label: "Intensidade reduzida", emoji: "📉", type: "down" },
    reduce_volume: { label: "Volume reduzido", emoji: "📊", type: "down" },
    increase_rest: { label: "Descanso aumentado", emoji: "⏸️", type: "down" },
    swap_exercises: { label: "Troca de exercícios", emoji: "🔄", type: "neutral" },
    suggest_recovery: { label: "Recuperação sugerida", emoji: "🌱", type: "down" },
    add_cardio: { label: "Cardio adicionado", emoji: "🏃", type: "up" },
    reduce_muscle_intensity: { label: "Intensidade muscular reduzida", emoji: "⚖️", type: "down" },
    maintain: { label: "Manter ritmo", emoji: "💪", type: "neutral" },
  };
  return map[action];
}
