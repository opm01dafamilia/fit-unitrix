/**
 * Smart Load Engine — Etapa 5.8
 * Suggests ideal weight for each exercise based on real performance history.
 * Works like a professional personal trainer.
 */

export type EffortLevel = "leve" | "moderado" | "pesado" | "extremo";

export type LoadSuggestion = {
  suggestedWeight: number;
  direction: "up" | "down" | "maintain";
  deltaKg: number;
  deltaPct: number;
  reason: string;
  emoji: string;
  confidence: "high" | "medium" | "low";
  recoveryWarning: boolean;
};

export type ExerciseLoadHistory = {
  weight: number;
  reps: number;
  sets_completed: number;
  sets_target: number;
  effort: EffortLevel;
  date: string;
};

const LOAD_HISTORY_KEY = "fitpulse_load_history";
const MAX_ENTRIES = 300;

// ===== STORAGE =====

export function saveLoadEntry(exerciseName: string, entry: ExerciseLoadHistory): void {
  try {
    const all = loadAllLoadHistory();
    if (!all[exerciseName]) all[exerciseName] = [];
    all[exerciseName].unshift(entry);
    // Trim per exercise
    if (all[exerciseName].length > 30) all[exerciseName] = all[exerciseName].slice(0, 30);
    // Trim total
    let total = Object.values(all).reduce((a, b) => a + b.length, 0);
    if (total > MAX_ENTRIES) {
      // Remove oldest entries from exercises with most history
      const sorted = Object.entries(all).sort((a, b) => b[1].length - a[1].length);
      for (const [key, arr] of sorted) {
        if (total <= MAX_ENTRIES) break;
        const toRemove = Math.min(arr.length - 3, total - MAX_ENTRIES);
        if (toRemove > 0) {
          all[key] = arr.slice(0, arr.length - toRemove);
          total -= toRemove;
        }
      }
    }
    localStorage.setItem(LOAD_HISTORY_KEY, JSON.stringify(all));
  } catch {}
}

export function loadAllLoadHistory(): Record<string, ExerciseLoadHistory[]> {
  try {
    const raw = localStorage.getItem(LOAD_HISTORY_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function getLoadHistory(exerciseName: string): ExerciseLoadHistory[] {
  return loadAllLoadHistory()[exerciseName] || [];
}

// ===== CHECK RECOVERY CYCLE =====

function isInRecoveryCycle(): boolean {
  try {
    const raw = localStorage.getItem("fitpulse_periodization");
    if (!raw) return false;
    const data = JSON.parse(raw);
    return data.currentPhase === "recuperacao";
  } catch {
    return false;
  }
}

// ===== WEEKLY CONSISTENCY =====

function getWeeklyConsistency(): number {
  try {
    const raw = localStorage.getItem("fitpulse_perf_history");
    if (!raw) return 0.5;
    const perfs = JSON.parse(raw) as any[];
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thisWeek = perfs.filter(p => new Date(p.date).getTime() > weekAgo);
    // Unique days trained
    const uniqueDays = new Set(thisWeek.map(p => p.date));
    return Math.min(1, uniqueDays.size / 4); // assume 4 days/week target
  } catch {
    return 0.5;
  }
}

// ===== MAIN SUGGESTION ENGINE =====

export function calculateLoadSuggestion(
  exerciseName: string,
  lastWeight: number,
  lastReps: number,
  targetReps: number,
  targetSets: number,
  experienceLevel: string
): LoadSuggestion {
  const history = getLoadHistory(exerciseName);
  const inRecovery = isInRecoveryCycle();
  const consistency = getWeeklyConsistency();

  // Default: no history
  if (history.length === 0 && lastWeight === 0) {
    return {
      suggestedWeight: 0,
      direction: "maintain",
      deltaKg: 0,
      deltaPct: 0,
      reason: "Primeiro treino — registre seu peso para receber sugestões",
      emoji: "🆕",
      confidence: "low",
      recoveryWarning: false,
    };
  }

  const baseWeight = history.length > 0 ? history[0].weight : lastWeight;
  const lastEffort = history.length > 0 ? history[0].effort : "moderado";
  const lastSetsCompleted = history.length > 0 ? history[0].sets_completed : targetSets;
  const lastSetsTarget = history.length > 0 ? history[0].sets_target : targetSets;

  // Recovery cycle: always reduce
  if (inRecovery) {
    const reduced = Math.round(baseWeight * 0.85 * 2) / 2;
    return {
      suggestedWeight: Math.max(0, reduced),
      direction: "down",
      deltaKg: +(reduced - baseWeight).toFixed(1),
      deltaPct: -15,
      reason: "Ciclo de recuperação ativo — carga reduzida para proteção muscular",
      emoji: "🛡️",
      confidence: "high",
      recoveryWarning: true,
    };
  }

  // Determine increment based on exercise type and level
  const increment = getSmartIncrement(exerciseName, experienceLevel);

  // Failed significantly (extremo effort or missed many sets)
  const failRate = 1 - (lastSetsCompleted / lastSetsTarget);
  if (lastEffort === "extremo" || failRate > 0.4) {
    const reduced = Math.round((baseWeight * 0.9) * 2) / 2;
    return {
      suggestedWeight: Math.max(0, reduced),
      direction: "down",
      deltaKg: +(reduced - baseWeight).toFixed(1),
      deltaPct: -10,
      reason: "Carga muito alta detectada — reduza para melhor execução e segurança",
      emoji: "📉",
      confidence: "high",
      recoveryWarning: false,
    };
  }

  // Check for consecutive failures in last 2 sessions
  if (history.length >= 2 && history[0].effort === "pesado" && history[1].effort === "pesado") {
    const reduced = Math.round((baseWeight * 0.92) * 2) / 2;
    return {
      suggestedWeight: Math.max(0, reduced),
      direction: "down",
      deltaKg: +(reduced - baseWeight).toFixed(1),
      deltaPct: -8,
      reason: "Duas sessões pesadas consecutivas — ajuste para recuperação",
      emoji: "⚠️",
      confidence: "high",
      recoveryWarning: false,
    };
  }

  // Completed all sets with ease
  if (lastEffort === "leve" && lastSetsCompleted >= lastSetsTarget) {
    // Check consistency before suggesting increase
    if (consistency < 0.5) {
      return {
        suggestedWeight: baseWeight,
        direction: "maintain",
        deltaKg: 0,
        deltaPct: 0,
        reason: "Mantenha a carga — aumente sua consistência semanal primeiro",
        emoji: "💪",
        confidence: "medium",
        recoveryWarning: false,
      };
    }
    const increased = Math.round((baseWeight + increment) * 2) / 2;
    const pct = baseWeight > 0 ? Math.round((increment / baseWeight) * 100) : 10;
    return {
      suggestedWeight: increased,
      direction: "up",
      deltaKg: +increment.toFixed(1),
      deltaPct: pct,
      reason: "Ótimo desempenho — hora de evoluir a carga!",
      emoji: "📈",
      confidence: "high",
      recoveryWarning: false,
    };
  }

  // Completed all sets with moderate effort
  if (lastEffort === "moderado" && lastSetsCompleted >= lastSetsTarget) {
    // Only suggest increase if 2+ consecutive moderate/easy sessions
    const consecutiveGood = countConsecutiveGoodSessions(history);
    if (consecutiveGood >= 2) {
      const smallIncrement = Math.round((increment * 0.6) * 2) / 2 || increment;
      const increased = Math.round((baseWeight + smallIncrement) * 2) / 2;
      const pct = baseWeight > 0 ? Math.round((smallIncrement / baseWeight) * 100) : 5;
      return {
        suggestedWeight: increased,
        direction: "up",
        deltaKg: +smallIncrement.toFixed(1),
        deltaPct: pct,
        reason: "Consistência excelente — aumento gradual recomendado",
        emoji: "🔥",
        confidence: "medium",
        recoveryWarning: false,
      };
    }
    return {
      suggestedWeight: baseWeight,
      direction: "maintain",
      deltaKg: 0,
      deltaPct: 0,
      reason: "Bom treino — mantenha e consolide antes de aumentar",
      emoji: "💪",
      confidence: "high",
      recoveryWarning: false,
    };
  }

  // Pesado but completed
  if (lastEffort === "pesado" && lastSetsCompleted >= lastSetsTarget) {
    return {
      suggestedWeight: baseWeight,
      direction: "maintain",
      deltaKg: 0,
      deltaPct: 0,
      reason: "Treino desafiador — mantenha a carga para adaptar",
      emoji: "➡️",
      confidence: "high",
      recoveryWarning: false,
    };
  }

  // Default: maintain
  return {
    suggestedWeight: baseWeight,
    direction: "maintain",
    deltaKg: 0,
    deltaPct: 0,
    reason: "Mantenha a carga atual — quase lá!",
    emoji: "💪",
    confidence: "medium",
    recoveryWarning: false,
  };
}

function countConsecutiveGoodSessions(history: ExerciseLoadHistory[]): number {
  let count = 0;
  for (const h of history) {
    if ((h.effort === "leve" || h.effort === "moderado") && h.sets_completed >= h.sets_target) {
      count++;
    } else break;
  }
  return count;
}

// Compound exercises get bigger increments
const COMPOUND_SET = new Set([
  "supino reto", "supino inclinado", "agachamento", "leg press", "stiff",
  "remada curvada", "remada cavaleiro", "barra fixa", "desenvolvimento",
  "mergulho", "terra", "levantamento terra",
]);

function getSmartIncrement(exerciseName: string, level: string): number {
  const name = exerciseName.toLowerCase();
  const isCompound = Array.from(COMPOUND_SET).some(c => name.includes(c));

  if (level === "iniciante") return isCompound ? 2 : 1;
  if (level === "intermediario") return isCompound ? 2.5 : 1;
  return isCompound ? 2.5 : 1.5; // avancado
}

// ===== FORCE EVOLUTION DATA =====

export type ForceEvolutionPoint = {
  date: string;
  weight: number;
  reps: number;
  effort: EffortLevel;
  volume: number; // weight * reps * sets
};

export function getForceEvolution(exerciseName: string): ForceEvolutionPoint[] {
  const history = getLoadHistory(exerciseName);
  if (history.length === 0) return [];

  return history
    .map(h => ({
      date: h.date,
      weight: h.weight,
      reps: h.reps,
      effort: h.effort,
      volume: h.weight * h.reps * h.sets_completed,
    }))
    .reverse()
    .slice(-12);
}

// ===== ALL EXERCISE NAMES WITH HISTORY =====

export function getExercisesWithHistory(): string[] {
  const all = loadAllLoadHistory();
  return Object.keys(all).filter(k => all[k].length > 0);
}
