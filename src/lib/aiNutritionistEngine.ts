// AI Nutritionist Engine — Intelligent Diet Evolution
// Analyzes weekly diet adherence + body progress and suggests automatic adjustments

export type NutritionistInput = {
  objective: "emagrecer" | "massa" | "manter";
  currentWeight: number;
  goalWeight: number | null;
  weeklyAdherencePct: number; // 0-100
  mealsDone: number;
  mealsFailed: number;
  mealsTotal: number;
  dietStreak: number;
  daysWithoutDiet: number;
  trainingIntensity: number; // 0-10 from personal trainer engine
  bodyRecords: { weight: number; created_at: string }[];
  currentCalories: number;
  currentProtein: number;
  currentCarbs: number;
  currentFat: number;
  deadlineMonths: number | null;
  lastAdjustmentDate: string | null; // ISO date of last adjustment
};

export type NutritionAdjustment = {
  type: "calories" | "protein" | "carbs" | "fat" | "add_snack" | "remove_snack" | "swap_food" | "recalculate_deadline";
  direction: "increase" | "decrease" | "swap" | "recalculate";
  amount: number; // kcal or grams
  reason: string;
};

export type NutritionistAnalysis = {
  canAdjust: boolean; // false if < 5 days since last adjustment
  daysSinceLastAdjust: number;
  adjustments: NutritionAdjustment[];
  newCalories: number;
  newProtein: number;
  newCarbs: number;
  newFat: number;
  coachMessage: string;
  weeklyWeightChange: number; // kg/week observed
  progressStatus: "stagnant" | "too_fast" | "too_slow" | "on_track";
  adherenceLevel: "excelente" | "boa" | "moderada" | "baixa";
  needsDeadlineRecalc: boolean;
  newDeadlineMonths: number | null;
};

const MIN_DAYS_BETWEEN_ADJUSTMENTS = 5;
const MAX_CALORIE_CHANGE = 300; // per adjustment
const MIN_CALORIES = 1200;
const MAX_CALORIES = 5000;

export function analyzeNutrition(input: NutritionistInput): NutritionistAnalysis {
  const adjustments: NutritionAdjustment[] = [];

  // Check if enough time has passed since last adjustment
  let daysSinceLastAdjust = 999;
  if (input.lastAdjustmentDate) {
    const lastDate = new Date(input.lastAdjustmentDate);
    daysSinceLastAdjust = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
  }
  const canAdjust = daysSinceLastAdjust >= MIN_DAYS_BETWEEN_ADJUSTMENTS;

  // Adherence level
  const adherenceLevel: NutritionistAnalysis["adherenceLevel"] =
    input.weeklyAdherencePct >= 90 ? "excelente" :
    input.weeklyAdherencePct >= 70 ? "boa" :
    input.weeklyAdherencePct >= 50 ? "moderada" : "baixa";

  // Calculate weekly weight change from body records
  let weeklyWeightChange = 0;
  if (input.bodyRecords.length >= 2) {
    const sorted = [...input.bodyRecords].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const recent = sorted.slice(-4); // last ~4 records
    if (recent.length >= 2) {
      const first = recent[0];
      const last = recent[recent.length - 1];
      const daysDiff = (new Date(last.created_at).getTime() - new Date(first.created_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff > 0) {
        weeklyWeightChange = ((last.weight - first.weight) / daysDiff) * 7;
      }
    }
  }

  // Determine progress status
  let progressStatus: NutritionistAnalysis["progressStatus"] = "on_track";
  const isGaining = input.objective === "massa";
  const isLosing = input.objective === "emagrecer";

  if (isLosing) {
    if (weeklyWeightChange >= -0.1) progressStatus = "stagnant";
    else if (weeklyWeightChange < -1.0) progressStatus = "too_fast";
    else if (weeklyWeightChange > -0.3) progressStatus = "too_slow";
  } else if (isGaining) {
    if (weeklyWeightChange <= 0.05) progressStatus = "stagnant";
    else if (weeklyWeightChange > 0.7) progressStatus = "too_fast";
    else if (weeklyWeightChange < 0.15) progressStatus = "too_slow";
  }

  // New values start from current
  let newCalories = input.currentCalories;
  let newProtein = input.currentProtein;
  let newCarbs = input.currentCarbs;
  let newFat = input.currentFat;

  if (canAdjust) {
    if (isLosing) {
      if (progressStatus === "stagnant" || progressStatus === "too_slow") {
        // Not losing: reduce calories, increase protein, reduce carbs
        const calReduction = Math.min(MAX_CALORIE_CHANGE, Math.round(input.currentCalories * 0.08));
        newCalories = Math.max(MIN_CALORIES, newCalories - calReduction);
        newProtein = Math.round(newProtein * 1.05);
        newCarbs = Math.max(50, Math.round(newCarbs * 0.92));
        adjustments.push(
          { type: "calories", direction: "decrease", amount: calReduction, reason: "Peso não está reduzindo como esperado" },
          { type: "protein", direction: "increase", amount: Math.round(newProtein - input.currentProtein), reason: "Aumentar proteína para preservar massa muscular" },
          { type: "carbs", direction: "decrease", amount: Math.round(input.currentCarbs - newCarbs), reason: "Reduzir carboidratos para acelerar deficit" }
        );
      } else if (progressStatus === "too_fast") {
        // Losing too fast: increase calories slightly
        const calIncrease = Math.min(200, Math.round(input.currentCalories * 0.05));
        newCalories = Math.min(MAX_CALORIES, newCalories + calIncrease);
        newProtein = Math.round(newProtein * 1.03);
        adjustments.push(
          { type: "calories", direction: "increase", amount: calIncrease, reason: "Perda muito rápida — evitar perda muscular" },
          { type: "protein", direction: "increase", amount: Math.round(newProtein - input.currentProtein), reason: "Manter proteína alta para proteger músculos" }
        );
      }
    } else if (isGaining) {
      if (progressStatus === "stagnant" || progressStatus === "too_slow") {
        const calIncrease = Math.min(MAX_CALORIE_CHANGE, Math.round(input.currentCalories * 0.08));
        newCalories = Math.min(MAX_CALORIES, newCalories + calIncrease);
        newCarbs = Math.round(newCarbs * 1.08);
        newProtein = Math.round(newProtein * 1.05);
        adjustments.push(
          { type: "calories", direction: "increase", amount: calIncrease, reason: "Ganho de peso abaixo do esperado" },
          { type: "carbs", direction: "increase", amount: Math.round(newCarbs - input.currentCarbs), reason: "Aumentar carboidratos para mais energia" },
          { type: "protein", direction: "increase", amount: Math.round(newProtein - input.currentProtein), reason: "Aumentar proteína para suportar crescimento" }
        );
      } else if (progressStatus === "too_fast") {
        const calReduction = Math.min(200, Math.round(input.currentCalories * 0.05));
        newCalories = Math.max(MIN_CALORIES, newCalories - calReduction);
        adjustments.push(
          { type: "calories", direction: "decrease", amount: calReduction, reason: "Ganho muito rápido — evitar acúmulo de gordura" }
        );
      }
    }

    // Low adherence: suggest snack changes
    if (adherenceLevel === "baixa" && input.mealsFailed > input.mealsDone) {
      adjustments.push(
        { type: "remove_snack", direction: "swap", amount: 0, reason: "Muitas refeições não cumpridas — simplificar plano" }
      );
    }

    // High training intensity + good adherence: add snack
    if (input.trainingIntensity >= 7 && adherenceLevel === "excelente" && isGaining) {
      adjustments.push(
        { type: "add_snack", direction: "increase", amount: 150, reason: "Treino intenso + boa aderência — adicionar lanche pós-treino" }
      );
    }
  }

  // Recalculate fat from remaining calories
  const protCal = newProtein * 4;
  const carbCal = newCarbs * 4;
  newFat = Math.max(20, Math.round((newCalories - protCal - carbCal) / 9));

  // Deadline recalculation
  let needsDeadlineRecalc = false;
  let newDeadlineMonths: number | null = input.deadlineMonths;

  if (input.goalWeight && input.deadlineMonths && progressStatus !== "on_track") {
    const remaining = Math.abs(input.goalWeight - input.currentWeight);
    if (weeklyWeightChange !== 0) {
      const weeksNeeded = remaining / Math.abs(weeklyWeightChange || 0.3);
      const monthsNeeded = Math.ceil(weeksNeeded / 4.3);
      if (monthsNeeded > input.deadlineMonths * 1.3) {
        needsDeadlineRecalc = true;
        newDeadlineMonths = monthsNeeded;
        adjustments.push(
          { type: "recalculate_deadline", direction: "recalculate", amount: monthsNeeded, reason: `Prazo ajustado para ${monthsNeeded} meses baseado no ritmo atual` }
        );
      }
    }
  }

  // Coach message
  const coachMessage = generateCoachMessage(progressStatus, adherenceLevel, adjustments.length, input.objective, canAdjust);

  return {
    canAdjust,
    daysSinceLastAdjust,
    adjustments,
    newCalories,
    newProtein,
    newCarbs,
    newFat,
    coachMessage,
    weeklyWeightChange: Math.round(weeklyWeightChange * 100) / 100,
    progressStatus,
    adherenceLevel,
    needsDeadlineRecalc,
    newDeadlineMonths,
  };
}

function generateCoachMessage(
  status: NutritionistAnalysis["progressStatus"],
  adherence: NutritionistAnalysis["adherenceLevel"],
  adjustCount: number,
  objective: string,
  canAdjust: boolean
): string {
  if (!canAdjust) {
    return "⏳ Aguardando pelo menos 5 dias desde o último ajuste para avaliar os resultados com precisão.";
  }

  if (adjustCount === 0 && status === "on_track") {
    return "✅ Seu plano alimentar está perfeito! Continue seguindo com consistência.";
  }

  const messages: Record<string, Record<string, string>> = {
    stagnant: {
      emagrecer: "🔄 Seu peso estagnou. Ajustei seu plano para reativar a perda de gordura de forma segura.",
      massa: "🔄 O ganho de peso está estagnado. Aumentei suas calorias e macros para retomar a evolução.",
      manter: "✅ Peso estável — exatamente o que queremos! Mantendo o plano.",
    },
    too_fast: {
      emagrecer: "⚠️ Você está perdendo peso rápido demais. Ajustei para preservar sua massa muscular.",
      massa: "⚠️ Ganho de peso muito acelerado pode gerar gordura. Fiz um ajuste leve para ganho limpo.",
      manter: "📊 Pequenas oscilações são normais. Mantenha o foco!",
    },
    too_slow: {
      emagrecer: "📉 A perda está mais lenta que o ideal. Fiz ajustes moderados para acelerar seus resultados.",
      massa: "📈 O ganho está um pouco abaixo. Aumentei levemente suas calorias para impulsionar.",
      manter: "✅ Tudo dentro do esperado. Continue assim!",
    },
    on_track: {
      emagrecer: "🎯 Ritmo perfeito de emagrecimento! Seu plano está funcionando.",
      massa: "🎯 Ganho de massa no ritmo ideal! Continue firme.",
      manter: "✅ Peso estável e controlado. Excelente trabalho!",
    },
  };

  const base = messages[status]?.[objective] || "📊 Seu plano alimentar foi ajustado para continuar sua evolução.";

  if (adherence === "baixa") {
    return base + " 💡 Tente manter mais refeições no plano para resultados melhores.";
  }

  return base;
}

// History entry type for storing adjustments
export type NutritionHistoryEntry = {
  date: string;
  adjustments: NutritionAdjustment[];
  caloriesBefore: number;
  caloriesAfter: number;
  proteinBefore: number;
  proteinAfter: number;
  carbsBefore: number;
  carbsAfter: number;
  fatBefore: number;
  fatAfter: number;
  progressStatus: NutritionistAnalysis["progressStatus"];
  adherenceLevel: NutritionistAnalysis["adherenceLevel"];
  coachMessage: string;
  weeklyWeightChange: number;
};
