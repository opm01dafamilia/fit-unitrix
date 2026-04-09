/**
 * Smart Goals Engine
 * Generates automatic weight goals based on user's diet plan, profile data, and training frequency.
 */

export interface SmartGoal {
  id: string;
  title: string;
  description: string;
  goalType: "massa" | "emagrecer" | "manutencao";
  currentValue: number;
  targetValue: number;
  unit: string;
  targetDate: string;
  progress: number;
  icon: string;
  source: "auto";
}

interface UserData {
  weight: number | null;
  objective: string | null;
  activityLevel: string | null;
}

interface DietData {
  objective: string;
  weight: number;
  plan_data: any;
}

interface BodyData {
  weight: number;
  created_at: string;
}

function getObjectiveType(objective: string | null): "massa" | "emagrecer" | "manutencao" {
  if (!objective) return "manutencao";
  const lower = objective.toLowerCase();
  if (lower.includes("massa") || lower.includes("ganho") || lower.includes("hipertrofia") || lower.includes("bulking")) return "massa";
  if (lower.includes("emagrecer") || lower.includes("perda") || lower.includes("definição") || lower.includes("cutting") || lower.includes("definicao")) return "emagrecer";
  return "manutencao";
}

function addMonthsToDate(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function generateSmartGoals(
  profile: UserData,
  dietPlan: DietData | null,
  bodyHistory: BodyData[],
  workoutCount: number
): SmartGoal[] {
  const goals: SmartGoal[] = [];
  const currentWeight = profile.weight;
  if (!currentWeight) return goals;

  // Determine objective from diet plan or profile
  const objectiveSource = dietPlan?.objective || profile.objective;
  const type = getObjectiveType(objectiveSource);

  if (type === "manutencao") {
    goals.push({
      id: "auto-manter",
      title: "Manter peso atual",
      description: "Manter seu peso estável com variação máxima de 1kg",
      goalType: "manutencao",
      currentValue: currentWeight,
      targetValue: currentWeight,
      unit: "kg",
      targetDate: formatDate(addMonthsToDate(new Date(), 3)),
      progress: 100,
      icon: "⚖️",
      source: "auto",
    });
    return goals;
  }

  // Calculate target based on objective and timeline
  const isGain = type === "massa";
  const monthlyRate = isGain ? 0.5 : 1.0; // kg/month realistic rate
  const targetMonths = 3;
  const totalChange = monthlyRate * targetMonths;
  const targetWeight = isGain
    ? Math.round((currentWeight + totalChange) * 10) / 10
    : Math.round((currentWeight - totalChange) * 10) / 10;

  // Calculate progress from body history
  let progress = 0;
  if (bodyHistory.length > 0) {
    const latestWeight = bodyHistory[0].weight;
    const totalDiff = Math.abs(targetWeight - currentWeight);
    if (totalDiff > 0) {
      const achieved = isGain
        ? Math.max(0, latestWeight - currentWeight)
        : Math.max(0, currentWeight - latestWeight);
      progress = Math.min(100, Math.round((achieved / totalDiff) * 100));
    }
  }

  // Primary weight goal
  goals.push({
    id: "auto-peso",
    title: isGain
      ? `Ganhar ${totalChange.toFixed(1)}kg de massa`
      : `Perder ${totalChange.toFixed(1)}kg`,
    description: isGain
      ? `Meta: chegar a ${targetWeight}kg com ganho gradual e saudável`
      : `Meta: chegar a ${targetWeight}kg com perda gradual e saudável`,
    goalType: type,
    currentValue: bodyHistory.length > 0 ? bodyHistory[0].weight : currentWeight,
    targetValue: targetWeight,
    unit: "kg",
    targetDate: formatDate(addMonthsToDate(new Date(), targetMonths)),
    progress,
    icon: isGain ? "💪" : "🔥",
    source: "auto",
  });

  // Training consistency goal
  const weeklyTarget = isGain ? 4 : 5;
  const trainingProgress = Math.min(100, Math.round((workoutCount / (weeklyTarget * 4)) * 100));
  goals.push({
    id: "auto-treino",
    title: `Treinar ${weeklyTarget}x por semana`,
    description: `Manter consistência de ${weeklyTarget} treinos semanais para alcançar seu objetivo`,
    goalType: type,
    currentValue: workoutCount,
    targetValue: weeklyTarget * 4,
    unit: "treinos/mês",
    targetDate: formatDate(addMonthsToDate(new Date(), 1)),
    progress: trainingProgress,
    icon: "🏋️",
    source: "auto",
  });

  // Diet adherence goal (if diet plan exists)
  if (dietPlan) {
    goals.push({
      id: "auto-dieta",
      title: "Seguir dieta com 80%+ de aderência",
      description: "Manter aderência alimentar acima de 80% para resultados consistentes",
      goalType: type,
      currentValue: 0,
      targetValue: 80,
      unit: "%",
      targetDate: formatDate(addMonthsToDate(new Date(), 1)),
      progress: 0,
      icon: "🍽️",
      source: "auto",
    });
  }

  return goals;
}
