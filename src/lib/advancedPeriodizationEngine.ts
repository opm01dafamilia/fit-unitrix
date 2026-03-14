/**
 * Advanced Periodization Engine — Etapa 5.7
 * Professional-grade training periodization with 5 cycle types,
 * dynamic durations (2-4 weeks), and performance-based transitions.
 */

// ===== TYPES =====

export type PeriodCycle =
  | "adaptacao"
  | "progressao"
  | "intensidade"
  | "recuperacao"
  | "consolidacao";

export type PeriodizationStatus = {
  currentCycle: PeriodCycle;
  cycleLabel: string;
  cycleEmoji: string;
  cycleObjective: string;
  cycleDescription: string;
  totalDuration: number; // days
  daysElapsed: number;
  daysRemaining: number;
  intensityLevel: number; // 1-5
  cycleNumber: number; // which cycle in history
  // Adjustments applied during this cycle
  loadMultiplier: number;
  volumeAdjust: number; // series delta
  restAdjust: number; // seconds delta
  cardioRecommendation: string;
  techniques: string[]; // intensity techniques allowed
};

export type TransitionReason = {
  trigger: string;
  message: string;
};

export type PeriodizationHistory = {
  cycle: PeriodCycle;
  startDate: string;
  endDate: string;
  durationDays: number;
  reason: TransitionReason;
};

export type PerformanceInput = {
  workoutsCompleted: number;
  workoutsTarget: number;
  seriesFailRate: number; // 0-1
  streak: number;
  dietAdherencePct: number;
  weightChange: number; // kg
  fatigueLevel: "fresh" | "moderate" | "high" | "extreme";
  avgRestOveruse: number; // 0-1 (how much rest exceeds target)
  abandonedWorkouts: number;
};

// ===== STORAGE =====

const STORAGE_KEY = "fitpulse_periodization_v2";

type StoredState = {
  currentCycle: PeriodCycle;
  cycleStartDate: string;
  cycleDurationDays: number;
  cycleNumber: number;
  history: PeriodizationHistory[];
  lastTransitionDate: string;
};

function loadState(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return getDefaultState();
}

function saveState(state: StoredState): void {
  try {
    const trimmed = { ...state, history: state.history.slice(-30) };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {}
}

function getDefaultState(): StoredState {
  const today = new Date().toISOString().slice(0, 10);
  return {
    currentCycle: "adaptacao",
    cycleStartDate: today,
    cycleDurationDays: 14,
    cycleNumber: 1,
    history: [],
    lastTransitionDate: today,
  };
}

// ===== CYCLE CONFIGS =====

type CycleConfig = {
  label: string;
  emoji: string;
  objective: string;
  description: string;
  intensityLevel: number;
  loadMultiplier: number;
  volumeAdjust: number;
  restAdjust: number;
  cardioRecommendation: string;
  techniques: string[];
  minDuration: number;
  maxDuration: number;
  defaultDuration: number;
};

const CYCLE_CONFIGS: Record<PeriodCycle, CycleConfig> = {
  adaptacao: {
    label: "Adaptação",
    emoji: "🌱",
    objective: "Construir base técnica e preparar o corpo",
    description: "Foco em técnica, exercícios básicos e carga moderada. Descanso maior para aprender os movimentos corretamente.",
    intensityLevel: 1,
    loadMultiplier: 0.85,
    volumeAdjust: -1,
    restAdjust: 15,
    cardioRecommendation: "Cardio leve opcional (caminhada 15-20 min)",
    techniques: [],
    minDuration: 14,
    maxDuration: 21,
    defaultDuration: 14,
  },
  progressao: {
    label: "Progressão",
    emoji: "📈",
    objective: "Aumentar força e volume progressivamente",
    description: "Aumento gradual de séries e carga. Inclusão de exercícios compostos e redução leve do descanso.",
    intensityLevel: 2,
    loadMultiplier: 1.05,
    volumeAdjust: 1,
    restAdjust: -10,
    cardioRecommendation: "Cardio moderado 2-3x por semana (20 min)",
    techniques: ["piramide_crescente"],
    minDuration: 14,
    maxDuration: 28,
    defaultDuration: 21,
  },
  intensidade: {
    label: "Intensidade",
    emoji: "🔥",
    objective: "Acelerar hipertrofia e gasto calórico",
    description: "Descanso curto, treinos metabólicos, técnicas avançadas (drop-set, bi-set, super-set). Cardio pós treino obrigatório.",
    intensityLevel: 4,
    loadMultiplier: 1.12,
    volumeAdjust: 1,
    restAdjust: -30,
    cardioRecommendation: "Cardio pós-treino obrigatório (15-20 min)",
    techniques: ["drop_set", "bi_set", "rest_pause", "piramide_regressiva"],
    minDuration: 14,
    maxDuration: 21,
    defaultDuration: 14,
  },
  recuperacao: {
    label: "Recuperação",
    emoji: "🧘",
    objective: "Recuperar músculos e sistema nervoso",
    description: "Redução de carga e séries. Treino funcional leve, mobilidade e alongamentos obrigatórios. Foco em recuperação muscular.",
    intensityLevel: 1,
    loadMultiplier: 0.70,
    volumeAdjust: -2,
    restAdjust: 30,
    cardioRecommendation: "Apenas caminhada leve ou yoga",
    techniques: [],
    minDuration: 7,
    maxDuration: 14,
    defaultDuration: 10,
  },
  consolidacao: {
    label: "Consolidação",
    emoji: "💎",
    objective: "Estabilizar ganhos e manter resultados",
    description: "Treino equilibrado com volume controlado. Manutenção de resultados e estabilidade metabólica.",
    intensityLevel: 3,
    loadMultiplier: 1.0,
    volumeAdjust: 0,
    restAdjust: 0,
    cardioRecommendation: "Cardio moderado 2x por semana",
    techniques: ["piramide_crescente"],
    minDuration: 14,
    maxDuration: 21,
    defaultDuration: 14,
  },
};

// ===== TRANSITION RULES =====

// Never allow two intensity cycles in a row
// Always insert recovery after intensity
const VALID_TRANSITIONS: Record<PeriodCycle, PeriodCycle[]> = {
  adaptacao: ["progressao", "consolidacao"],
  progressao: ["intensidade", "consolidacao", "recuperacao"],
  intensidade: ["recuperacao"], // MUST go to recovery
  recuperacao: ["progressao", "consolidacao", "adaptacao"],
  consolidacao: ["progressao", "intensidade", "recuperacao"],
};

function selectNextCycle(
  current: PeriodCycle,
  perf: PerformanceInput,
  history: PeriodizationHistory[]
): { next: PeriodCycle; reason: TransitionReason; duration: number } {
  const candidates = VALID_TRANSITIONS[current];

  // If coming from intensity → must recover
  if (current === "intensidade") {
    return {
      next: "recuperacao",
      reason: { trigger: "post_intensity", message: "Recuperação obrigatória após ciclo de intensidade." },
      duration: CYCLE_CONFIGS.recuperacao.defaultDuration,
    };
  }

  // Fatigue-based: force recovery
  if (perf.fatigueLevel === "extreme" || perf.fatigueLevel === "high") {
    if (candidates.includes("recuperacao")) {
      return {
        next: "recuperacao",
        reason: { trigger: "fatigue", message: "Fadiga alta detectada. Ativando ciclo de recuperação." },
        duration: perf.fatigueLevel === "extreme" ? 14 : 10,
      };
    }
  }

  // High failure rate → recovery or adaptation
  if (perf.seriesFailRate > 0.3 || perf.abandonedWorkouts >= 2) {
    const preferred = candidates.includes("recuperacao") ? "recuperacao" : "adaptacao";
    if (candidates.includes(preferred)) {
      return {
        next: preferred,
        reason: { trigger: "high_failure", message: "Taxa de falha elevada. Ajustando para recuperação." },
        duration: CYCLE_CONFIGS[preferred].defaultDuration,
      };
    }
  }

  // Excellent performance → escalate
  const completionPct = perf.workoutsTarget > 0
    ? perf.workoutsCompleted / perf.workoutsTarget : 0;

  if (completionPct >= 0.85 && perf.streak >= 7 && perf.seriesFailRate < 0.1) {
    // Ready for intensity
    if (candidates.includes("intensidade")) {
      return {
        next: "intensidade",
        reason: { trigger: "excellent_performance", message: "Desempenho excelente! Avançando para intensidade." },
        duration: CYCLE_CONFIGS.intensidade.defaultDuration,
      };
    }
    if (candidates.includes("progressao")) {
      return {
        next: "progressao",
        reason: { trigger: "good_performance", message: "Bom desempenho. Avançando para progressão." },
        duration: 21,
      };
    }
  }

  // Good performance → progress
  if (completionPct >= 0.7 && perf.seriesFailRate < 0.2) {
    if (candidates.includes("progressao")) {
      return {
        next: "progressao",
        reason: { trigger: "steady_progress", message: "Progresso consistente. Avançando gradualmente." },
        duration: CYCLE_CONFIGS.progressao.defaultDuration,
      };
    }
    if (candidates.includes("consolidacao")) {
      return {
        next: "consolidacao",
        reason: { trigger: "consolidating", message: "Estabilizando ganhos antes do próximo avanço." },
        duration: CYCLE_CONFIGS.consolidacao.defaultDuration,
      };
    }
  }

  // Default: consolidation or first available
  const fallback = candidates.includes("consolidacao") ? "consolidacao" : candidates[0];
  return {
    next: fallback,
    reason: { trigger: "default", message: "Transição natural para o próximo ciclo." },
    duration: CYCLE_CONFIGS[fallback].defaultDuration,
  };
}

// ===== PUBLIC API =====

/**
 * Get the current periodization status
 */
export function getPeriodizationStatus(): PeriodizationStatus {
  const state = loadState();
  const config = CYCLE_CONFIGS[state.currentCycle];
  const today = new Date().toISOString().slice(0, 10);
  const start = new Date(state.cycleStartDate);
  const daysElapsed = Math.floor((Date.now() - start.getTime()) / 86400000);
  const daysRemaining = Math.max(0, state.cycleDurationDays - daysElapsed);

  return {
    currentCycle: state.currentCycle,
    cycleLabel: config.label,
    cycleEmoji: config.emoji,
    cycleObjective: config.objective,
    cycleDescription: config.description,
    totalDuration: state.cycleDurationDays,
    daysElapsed,
    daysRemaining,
    intensityLevel: config.intensityLevel,
    cycleNumber: state.cycleNumber,
    loadMultiplier: config.loadMultiplier,
    volumeAdjust: config.volumeAdjust,
    restAdjust: config.restAdjust,
    cardioRecommendation: config.cardioRecommendation,
    techniques: config.techniques,
  };
}

/**
 * Check if cycle should transition and apply if needed
 */
export function checkAndTransition(perf: PerformanceInput): {
  transitioned: boolean;
  newStatus: PeriodizationStatus;
  reason: TransitionReason | null;
} {
  const state = loadState();
  const start = new Date(state.cycleStartDate);
  const daysElapsed = Math.floor((Date.now() - start.getTime()) / 86400000);
  const config = CYCLE_CONFIGS[state.currentCycle];

  // Check if minimum duration passed
  if (daysElapsed < config.minDuration) {
    return { transitioned: false, newStatus: getPeriodizationStatus(), reason: null };
  }

  // Check if max duration exceeded (force transition)
  const shouldTransition = daysElapsed >= state.cycleDurationDays;

  // Early transition if performance dictates
  const earlyTransition = daysElapsed >= config.minDuration && (
    perf.fatigueLevel === "extreme" ||
    (perf.seriesFailRate > 0.4 && state.currentCycle !== "recuperacao") ||
    (perf.abandonedWorkouts >= 3)
  );

  if (!shouldTransition && !earlyTransition) {
    return { transitioned: false, newStatus: getPeriodizationStatus(), reason: null };
  }

  // Perform transition
  const { next, reason, duration } = selectNextCycle(state.currentCycle, perf, state.history);
  const today = new Date().toISOString().slice(0, 10);

  // Record history
  state.history.push({
    cycle: state.currentCycle,
    startDate: state.cycleStartDate,
    endDate: today,
    durationDays: daysElapsed,
    reason,
  });

  // Update state
  state.currentCycle = next;
  state.cycleStartDate = today;
  state.cycleDurationDays = duration;
  state.cycleNumber++;
  state.lastTransitionDate = today;

  saveState(state);

  return {
    transitioned: true,
    newStatus: getPeriodizationStatus(),
    reason,
  };
}

/**
 * Get the cycle history for displaying evolution
 */
export function getPeriodizationHistory(): PeriodizationHistory[] {
  const state = loadState();
  return state.history;
}

/**
 * Force initialize periodization (e.g., when creating first plan)
 */
export function initializePeriodization(startCycle: PeriodCycle = "adaptacao"): void {
  const state = getDefaultState();
  state.currentCycle = startCycle;
  saveState(state);
}

/**
 * Get visual config for a cycle (used by UI)
 */
export function getCycleVisualConfig(cycle: PeriodCycle): {
  gradient: string;
  borderColor: string;
  textColor: string;
  bgColor: string;
} {
  switch (cycle) {
    case "adaptacao":
      return {
        gradient: "from-chart-2/10 to-primary/5",
        borderColor: "border-chart-2/20",
        textColor: "text-chart-2",
        bgColor: "bg-chart-2/10",
      };
    case "progressao":
      return {
        gradient: "from-primary/10 to-chart-2/5",
        borderColor: "border-primary/20",
        textColor: "text-primary",
        bgColor: "bg-primary/10",
      };
    case "intensidade":
      return {
        gradient: "from-orange-500/10 to-destructive/5",
        borderColor: "border-orange-500/20",
        textColor: "text-orange-400",
        bgColor: "bg-orange-500/10",
      };
    case "recuperacao":
      return {
        gradient: "from-chart-2/10 to-chart-2/5",
        borderColor: "border-chart-2/20",
        textColor: "text-chart-2",
        bgColor: "bg-chart-2/10",
      };
    case "consolidacao":
      return {
        gradient: "from-chart-4/10 to-primary/5",
        borderColor: "border-chart-4/20",
        textColor: "text-chart-4",
        bgColor: "bg-chart-4/10",
      };
  }
}

/**
 * Get all cycle configs (for displaying the full cycle roadmap)
 */
export function getAllCycleConfigs() {
  return CYCLE_CONFIGS;
}
