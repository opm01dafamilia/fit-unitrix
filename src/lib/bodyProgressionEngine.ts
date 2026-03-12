// Intelligent Body Progression Engine
// Connects: Diet adherence, Training frequency, Goals, Body tracking

import { differenceInDays, format, subDays, startOfWeek, endOfWeek } from "date-fns";

export type ProgressionData = {
  // Goal data
  goalWeight: number;
  currentWeight: number;
  startWeight: number;
  targetDate: string | null;
  goalCreatedAt: string;
  // Diet adherence
  dietAdherencePct: number; // 0-100 weekly
  dietStreak: number;
  // Training
  weeklyWorkouts: number;
  totalSessions: number;
  totalSeriesCompleted: number;
  // Body tracking
  bodyRecords: { weight: number; created_at: string }[];
};

export type ProgressionAnalysis = {
  // Progress comparison
  expectedProgress: number; // kg expected by now
  realProgress: number; // kg actual
  progressDifference: number; // positive = ahead, negative = behind
  progressPercentage: number; // 0-100 toward goal
  expectedPercentage: number; // 0-100 expected by now
  // Status
  status: "ahead" | "on_track" | "behind" | "far_behind";
  statusMessage: string;
  statusEmoji: string;
  // Predictions
  daysToGoal: number | null; // estimated days at current pace
  predictedDate: string | null;
  monthlyRate: number; // kg/month at current pace
  // Recommendations
  caloricAdjustment: "increase" | "decrease" | "maintain";
  caloricSuggestion: string;
  // Weekly feedback
  weeklyFeedback: string;
  // Rhythm
  rhythmScore: number; // 0-100
};

export function analyzeProgression(data: ProgressionData): ProgressionAnalysis {
  const totalGoalDiff = data.goalWeight - data.startWeight;
  const isGaining = totalGoalDiff > 0;
  const absTotalGoal = Math.abs(totalGoalDiff);

  // Real progress
  const realProgress = data.currentWeight - data.startWeight;
  const absRealProgress = isGaining ? realProgress : -realProgress;

  // Progress percentage
  const progressPercentage = absTotalGoal > 0
    ? Math.min(100, Math.max(0, (absRealProgress / absTotalGoal) * 100))
    : 0;

  // Expected progress based on time elapsed
  let expectedProgress = 0;
  let expectedPercentage = 0;
  let daysTotal = 0;
  let daysElapsed = 0;

  if (data.targetDate) {
    daysTotal = differenceInDays(new Date(data.targetDate), new Date(data.goalCreatedAt));
    daysElapsed = differenceInDays(new Date(), new Date(data.goalCreatedAt));
    if (daysTotal > 0) {
      const timeRatio = Math.min(1, daysElapsed / daysTotal);
      expectedProgress = totalGoalDiff * timeRatio;
      expectedPercentage = timeRatio * 100;
    }
  }

  const progressDifference = absRealProgress - Math.abs(expectedProgress);

  // Status determination
  let status: ProgressionAnalysis["status"];
  let statusMessage: string;
  let statusEmoji: string;

  const diffRatio = absTotalGoal > 0 ? progressDifference / absTotalGoal : 0;

  if (diffRatio > 0.05) {
    status = "ahead";
    statusMessage = "Você está acima do ritmo esperado! Continue assim!";
    statusEmoji = "🚀";
  } else if (diffRatio > -0.05) {
    status = "on_track";
    statusMessage = "Você está no ritmo ideal. Consistência é a chave!";
    statusEmoji = "✅";
  } else if (diffRatio > -0.15) {
    status = "behind";
    statusMessage = "Você está um pouco abaixo do ritmo esperado. Ajuste sua rotina!";
    statusEmoji = "⚠️";
  } else {
    status = "far_behind";
    statusMessage = "Você está bem abaixo do ritmo. Considere ajustar sua dieta e treino.";
    statusEmoji = "🔴";
  }

  // If no target date, use simpler status
  if (!data.targetDate) {
    if (absRealProgress > 0) {
      status = "on_track";
      statusMessage = "Você está evoluindo! Continue firme!";
      statusEmoji = "✅";
    } else {
      status = "behind";
      statusMessage = "Ainda sem progresso visível. Mantenha a consistência!";
      statusEmoji = "⚠️";
    }
  }

  // Monthly rate calculation from body records
  let monthlyRate = 0;
  if (data.bodyRecords.length >= 2) {
    const first = data.bodyRecords[0];
    const last = data.bodyRecords[data.bodyRecords.length - 1];
    const daysBetween = differenceInDays(new Date(last.created_at), new Date(first.created_at));
    if (daysBetween > 0) {
      const totalChange = last.weight - first.weight;
      monthlyRate = (totalChange / daysBetween) * 30;
    }
  }

  // Days to goal prediction
  let daysToGoal: number | null = null;
  let predictedDate: string | null = null;
  const remainingKg = data.goalWeight - data.currentWeight;

  if (monthlyRate !== 0 && ((isGaining && monthlyRate > 0) || (!isGaining && monthlyRate < 0))) {
    const remainingDays = Math.abs(remainingKg / monthlyRate) * 30;
    daysToGoal = Math.round(remainingDays);
    if (daysToGoal > 0 && daysToGoal < 3650) {
      const predicted = new Date();
      predicted.setDate(predicted.getDate() + daysToGoal);
      predictedDate = format(predicted, "yyyy-MM-dd");
    }
  }

  // Caloric adjustment suggestion
  let caloricAdjustment: ProgressionAnalysis["caloricAdjustment"] = "maintain";
  let caloricSuggestion = "Mantenha sua dieta atual.";

  if (status === "behind" || status === "far_behind") {
    if (isGaining) {
      caloricAdjustment = "increase";
      caloricSuggestion = "Considere aumentar 200-300kcal na dieta para acelerar o ganho.";
    } else {
      caloricAdjustment = "decrease";
      caloricSuggestion = "Considere reduzir 200-300kcal ou aumentar a atividade física.";
    }
  } else if (status === "ahead") {
    if (isGaining) {
      caloricAdjustment = "maintain";
      caloricSuggestion = "Ritmo excelente! Estabilize a dieta para manter o ganho saudável.";
    } else {
      caloricAdjustment = "maintain";
      caloricSuggestion = "Ótimo ritmo! Mantenha a dieta e evite reduzir demais.";
    }
  }

  // Weekly feedback
  const adherenceText = data.dietAdherencePct >= 90 ? "Excelente" :
    data.dietAdherencePct >= 70 ? "Boa" :
    data.dietAdherencePct >= 50 ? "Regular" : "Baixa";

  const workoutText = data.weeklyWorkouts >= 5 ? "impressionante" :
    data.weeklyWorkouts >= 3 ? "consistente" :
    data.weeklyWorkouts >= 1 ? "modesta" : "nenhuma";

  const weeklyFeedback = `Você treinou ${data.weeklyWorkouts} dia${data.weeklyWorkouts !== 1 ? 's' : ''} essa semana e completou ${data.dietAdherencePct}% da dieta. ${adherenceText} consistência${data.weeklyWorkouts >= 3 ? ' — continue assim!' : '. Tente aumentar sua frequência!'}`;

  // Rhythm score (0-100)
  const dietScore = data.dietAdherencePct * 0.4;
  const trainingScore = Math.min(100, (data.weeklyWorkouts / 5) * 100) * 0.35;
  const progressScore = progressPercentage * 0.25;
  const rhythmScore = Math.round(dietScore + trainingScore + progressScore);

  return {
    expectedProgress: Math.abs(expectedProgress),
    realProgress: absRealProgress,
    progressDifference,
    progressPercentage,
    expectedPercentage,
    status,
    statusMessage,
    statusEmoji,
    daysToGoal,
    predictedDate,
    monthlyRate,
    caloricAdjustment,
    caloricSuggestion,
    weeklyFeedback,
    rhythmScore,
  };
}

// Rhythm achievement check helpers
export function isRhythmAboveForWeeks(weeklyScores: number[], weeks: number, threshold: number = 70): boolean {
  if (weeklyScores.length < weeks) return false;
  const recent = weeklyScores.slice(-weeks);
  return recent.every(s => s >= threshold);
}
