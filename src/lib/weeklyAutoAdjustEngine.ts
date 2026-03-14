/**
 * Weekly Auto-Adjust Engine — Etapa 5.6
 * Unified weekly analysis that combines workout + diet data
 * to produce intelligent adjustment recommendations.
 */

import { loadTrainerState, type TrainerState, type IntensityTier } from "./aiPersonalTrainerEngine";
import { getWeeklyFatigueSummary, type FatigueLevel } from "./muscleFatigueEngine";
import { calculateWeeklyLoad, type RecoveryLevel } from "./smartRecoveryEngine";

// ===== TYPES =====

export type PerformanceStatus = "evolving" | "stagnant" | "fatigued";

export type AdjustmentCategory = "workout" | "diet" | "recovery" | "cardio";

export type SmartAdjustment = {
  id: string;
  category: AdjustmentCategory;
  title: string;
  description: string;
  emoji: string;
  impact: "positive" | "neutral" | "protective";
  metric?: string; // e.g. "-10s descanso", "+1 série"
};

export type WeeklyPerformanceData = {
  // Workout
  workoutsCompleted: number;
  workoutsTarget: number;
  totalSeries: number;
  seriesCompleted: number;
  seriesFailed: number;
  avgRestTimeUsed: number; // seconds
  targetRestTime: number; // seconds
  abandonedWorkouts: number;
  streak: number;
  // Diet
  mealsDone: number;
  mealsFailed: number;
  mealsTotal: number;
  dietAdherencePct: number;
  // Body
  currentWeight: number;
  previousWeight: number; // weight from last week
  goalWeight: number | null;
  objective: string; // "emagrecer" | "massa" | "manter"
  // Sessions for recovery engine
  sessions: Array<{ completed_at: string; muscle_group: string; intensity?: string }>;
};

export type WeeklyAdjustmentReport = {
  weekStart: string;
  status: PerformanceStatus;
  statusEmoji: string;
  statusLabel: string;
  statusMessage: string;
  adjustments: SmartAdjustment[];
  fatigueLevel: FatigueLevel;
  recoveryLevel: RecoveryLevel;
  trainerLevel: number;
  trainerIntensity: IntensityTier;
  // Metrics
  workoutCompletionPct: number;
  dietAdherencePct: number;
  weightChangePct: number;
  consistencyScore: number; // 0-100
  fatigueScore: number; // 0-100
  overallScore: number; // 0-100
};

export type UserAdjustmentDecision = "accepted" | "rejected" | "kept_current";

export type AdjustmentHistoryEntry = {
  weekStart: string;
  date: string;
  report: WeeklyAdjustmentReport;
  decision: UserAdjustmentDecision;
};

// ===== STORAGE =====

const STORAGE_KEY = "fitpulse_weekly_adjustments";
const DECISION_KEY = "fitpulse_adjustment_decision";

export function loadAdjustmentHistory(): AdjustmentHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveAdjustmentHistory(entries: AdjustmentHistoryEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-20)));
  } catch {}
}

export function saveDecision(weekStart: string, decision: UserAdjustmentDecision, report: WeeklyAdjustmentReport): void {
  const history = loadAdjustmentHistory();
  history.push({ weekStart, date: new Date().toISOString(), report, decision });
  saveAdjustmentHistory(history);
  localStorage.setItem(DECISION_KEY, JSON.stringify({ weekStart, decision, date: new Date().toISOString() }));
}

export function getCurrentWeekDecision(): { weekStart: string; decision: UserAdjustmentDecision } | null {
  try {
    const raw = localStorage.getItem(DECISION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const thisWeekStart = getWeekStart();
    if (parsed.weekStart === thisWeekStart) return parsed;
    return null;
  } catch { return null; }
}

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff);
  return monday.toISOString().slice(0, 10);
}

// ===== CORE ANALYSIS =====

export function analyzeWeeklyPerformance(data: WeeklyPerformanceData): WeeklyAdjustmentReport {
  const weekStart = getWeekStart();
  const trainerState = loadTrainerState();
  const fatigueSummary = getWeeklyFatigueSummary();
  const weeklyLoad = calculateWeeklyLoad(data.sessions);

  // Calculate core metrics
  const workoutCompletionPct = data.workoutsTarget > 0
    ? Math.round((data.workoutsCompleted / data.workoutsTarget) * 100) : 0;

  const dietAdherencePct = data.dietAdherencePct;

  const weightChange = data.previousWeight > 0
    ? data.currentWeight - data.previousWeight : 0;
  const weightChangePct = data.previousWeight > 0
    ? Math.round((weightChange / data.previousWeight) * 1000) / 10 : 0;

  // Consistency score (0-100)
  const streakFactor = Math.min(30, data.streak * 3);
  const completionFactor = workoutCompletionPct * 0.4;
  const dietFactor = dietAdherencePct * 0.2;
  const abandonPenalty = data.abandonedWorkouts * 10;
  const consistencyScore = Math.round(Math.max(0, Math.min(100,
    streakFactor + completionFactor + dietFactor - abandonPenalty
  )));

  // Fatigue score (0-100)
  const seriesFailRate = data.totalSeries > 0
    ? (data.seriesFailed / data.totalSeries) : 0;
  const restOveruse = data.targetRestTime > 0
    ? Math.max(0, (data.avgRestTimeUsed - data.targetRestTime) / data.targetRestTime) : 0;
  const abandonRate = data.workoutsTarget > 0
    ? data.abandonedWorkouts / data.workoutsTarget : 0;
  const fatigueScore = Math.round(Math.min(100,
    seriesFailRate * 40 + restOveruse * 30 + abandonRate * 30 +
    (fatigueSummary.fatigued.length * 10)
  ));

  // Overall score
  const overallScore = Math.round(
    consistencyScore * 0.5 + (100 - fatigueScore) * 0.3 + dietAdherencePct * 0.2
  );

  // Determine status
  let status: PerformanceStatus;
  let statusEmoji: string;
  let statusLabel: string;
  let statusMessage: string;

  if (fatigueScore >= 60 || seriesFailRate > 0.3 || data.abandonedWorkouts >= 2) {
    status = "fatigued";
    statusEmoji = "🛡️";
    statusLabel = "Recuperação Necessária";
    statusMessage = "Seu corpo precisa de ajustes para evitar fadiga excessiva. Vamos adaptar seu plano.";
  } else if (workoutCompletionPct >= 80 && consistencyScore >= 60 && seriesFailRate < 0.15) {
    status = "evolving";
    statusEmoji = "🚀";
    statusLabel = "Evoluindo";
    statusMessage = "Ótimo desempenho! Vamos aumentar a intensidade para continuar sua evolução.";
  } else {
    status = "stagnant";
    statusEmoji = "🔄";
    statusLabel = "Ajuste Estratégico";
    statusMessage = "Detectamos oportunidades para otimizar seu treino e dieta.";
  }

  // Generate adjustments
  const adjustments = generateAdjustments(data, status, fatigueScore, consistencyScore, trainerState);

  return {
    weekStart,
    status,
    statusEmoji,
    statusLabel,
    statusMessage,
    adjustments,
    fatigueLevel: fatigueSummary.overallLevel,
    recoveryLevel: weeklyLoad.level,
    trainerLevel: trainerState.currentLevel,
    trainerIntensity: trainerState.currentIntensity,
    workoutCompletionPct,
    dietAdherencePct,
    weightChangePct,
    consistencyScore,
    fatigueScore,
    overallScore,
  };
}

// ===== ADJUSTMENT GENERATION =====

function generateAdjustments(
  data: WeeklyPerformanceData,
  status: PerformanceStatus,
  fatigueScore: number,
  consistencyScore: number,
  trainerState: TrainerState
): SmartAdjustment[] {
  const adjustments: SmartAdjustment[] = [];

  if (status === "evolving") {
    // User is performing well → increase challenge
    if (data.avgRestTimeUsed > 50) {
      adjustments.push({
        id: "reduce_rest",
        category: "workout",
        title: "Descanso reduzido",
        description: "Seu descanso foi reduzido para aumentar intensidade e acelerar sua evolução muscular.",
        emoji: "⏱️",
        impact: "positive",
        metric: `-${Math.min(10, Math.round(data.avgRestTimeUsed * 0.1))}s`,
      });
    }

    if (data.seriesCompleted > 0 && (data.seriesFailed / Math.max(1, data.totalSeries)) < 0.1) {
      adjustments.push({
        id: "suggest_load_increase",
        category: "workout",
        title: "Aumento de carga sugerido",
        description: "Sua taxa de conclusão está excelente. É hora de aumentar a carga em 5-10%.",
        emoji: "💪",
        impact: "positive",
        metric: "+5-10%",
      });
    }

    if (data.streak >= 7) {
      adjustments.push({
        id: "add_volume",
        category: "workout",
        title: "Volume aumentado",
        description: "Sua consistência permite adicionar 1 série extra nos exercícios principais.",
        emoji: "📈",
        impact: "positive",
        metric: "+1 série",
      });
    }

    if (data.dietAdherencePct >= 85) {
      adjustments.push({
        id: "diet_optimize",
        category: "diet",
        title: "Dieta otimizada",
        description: "Ótima aderência! Ajustamos macros para maximizar seus resultados.",
        emoji: "🎯",
        impact: "positive",
      });
    }

  } else if (status === "stagnant") {
    // User is plateauing → change stimulus
    adjustments.push({
      id: "swap_exercises",
      category: "workout",
      title: "Exercícios alternados",
      description: "Substituímos exercícios principais para quebrar a estagnação e criar novo estímulo.",
      emoji: "🔄",
      impact: "neutral",
    });

    if (data.workoutsCompleted < data.workoutsTarget * 0.7) {
      adjustments.push({
        id: "adjust_frequency",
        category: "workout",
        title: "Frequência ajustada",
        description: "Reduzimos os dias de treino para garantir qualidade sobre quantidade.",
        emoji: "📅",
        impact: "neutral",
        metric: `-1 dia`,
      });
    }

    // Diet stagnation
    const weightChange = data.currentWeight - data.previousWeight;
    const isLosing = data.objective === "emagrecer";
    const isGaining = data.objective === "massa";

    if ((isLosing && weightChange >= 0) || (isGaining && weightChange <= 0)) {
      adjustments.push({
        id: "diet_calories_adjust",
        category: "diet",
        title: "Calorias ajustadas",
        description: isLosing
          ? "Peso estagnado. Reduzimos levemente suas calorias para reativar a perda."
          : "Ganho estagnado. Aumentamos calorias para impulsionar o crescimento.",
        emoji: "🔥",
        impact: "neutral",
        metric: isLosing ? "-150 kcal" : "+200 kcal",
      });
    }

    adjustments.push({
      id: "add_metabolic",
      category: "cardio",
      title: "Treino metabólico inserido",
      description: "Adicionamos um circuito funcional para variar o estímulo e queimar mais calorias.",
      emoji: "⚡",
      impact: "neutral",
    });

  } else if (status === "fatigued") {
    // User is struggling → protect and recover
    adjustments.push({
      id: "increase_rest",
      category: "workout",
      title: "Descanso aumentado",
      description: "Aumentamos seu tempo de descanso para melhorar a recuperação entre séries.",
      emoji: "😌",
      impact: "protective",
      metric: "+15s",
    });

    adjustments.push({
      id: "reduce_volume",
      category: "workout",
      title: "Volume reduzido",
      description: "Reduzimos o número de séries para evitar sobrecarga e manter a qualidade.",
      emoji: "🛡️",
      impact: "protective",
      metric: "-20%",
    });

    if (fatigueScore >= 70) {
      adjustments.push({
        id: "recovery_week",
        category: "recovery",
        title: "Semana de recuperação ativada",
        description: "Seu corpo precisa recuperar. Ativamos uma semana de treinos leves e regenerativos.",
        emoji: "🧘",
        impact: "protective",
      });
    }

    adjustments.push({
      id: "reduce_cardio",
      category: "cardio",
      title: "Cardio reduzido",
      description: "Reduzimos o cardio para preservar energia e acelerar a recuperação muscular.",
      emoji: "🚶",
      impact: "protective",
    });

    if (data.mealsFailed > data.mealsDone) {
      adjustments.push({
        id: "simplify_diet",
        category: "diet",
        title: "Dieta simplificada",
        description: "Simplificamos suas refeições para facilitar o cumprimento do plano alimentar.",
        emoji: "🍽️",
        impact: "protective",
      });
    }
  }

  return adjustments;
}

// ===== UTILITY =====

export function hasNewAdjustmentsThisWeek(): boolean {
  const decision = getCurrentWeekDecision();
  return decision === null; // no decision yet = new adjustments available
}

export function getAdjustmentCategoryIcon(cat: AdjustmentCategory): string {
  switch (cat) {
    case "workout": return "🏋️";
    case "diet": return "🥗";
    case "recovery": return "💚";
    case "cardio": return "🏃";
  }
}

export function getImpactColor(impact: SmartAdjustment["impact"]): string {
  switch (impact) {
    case "positive": return "text-primary";
    case "neutral": return "text-amber-400";
    case "protective": return "text-chart-2";
  }
}

export function getImpactBg(impact: SmartAdjustment["impact"]): string {
  switch (impact) {
    case "positive": return "bg-primary/10 border-primary/15";
    case "neutral": return "bg-amber-500/10 border-amber-500/15";
    case "protective": return "bg-chart-2/10 border-chart-2/15";
  }
}
