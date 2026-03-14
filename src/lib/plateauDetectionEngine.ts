// Plateau Detection Engine — Etapa 5.13
// Detects physical stagnation and suggests strategic adjustments

export type PlateauType = "forca" | "composicao" | "metabolica" | "comportamental";

export interface PlateauInput {
  // Strength - last 3 weeks of max weights per exercise
  weeklyMaxWeights: { week: number; avgMaxWeight: number }[]; // newest first

  // Body composition - last 4 weeks
  weeklyBodyWeight: { week: number; weight: number }[];
  weeklyBodyFat: { week: number; bodyFat: number | null }[];

  // Performance
  weeklyVolume: { week: number; totalSets: number }[]; // newest first
  currentStreak: number;
  previousStreak: number; // streak from 2 weeks ago

  // Score
  currentScore: number;
  previousScore: number; // score from 2 weeks ago

  // Diet
  mealsFailedLast2Weeks: number;
  mealsTotalLast2Weeks: number;

  // Training
  workoutsLast2Weeks: number;
  targetWorkoutsPerWeek: number;

  // Exercise failures
  exerciseFailuresLast2Weeks: number;
  totalSetsLast2Weeks: number;

  // Context
  currentCycle?: string;
  fatigueLevel?: "low" | "moderate" | "high" | "extreme";
}

export interface PlateauDetection {
  detected: boolean;
  types: PlateauType[];
  severity: "leve" | "moderada" | "alta";
  primaryType: PlateauType | null;
  message: string;
  adjustments: PlateauAdjustment[];
  estimatedRecoveryDays: number;
}

export interface PlateauAdjustment {
  area: string;
  action: string;
  icon: string;
}

const STORAGE_KEY = "fitpulse_plateau_state";

interface PlateauState {
  lastDetection: string;
  activeAdjustment: boolean;
  detectedTypes: PlateauType[];
  dismissedAt?: string;
}

export function getPlateauState(): PlateauState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function savePlateauState(state: PlateauState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function dismissPlateau() {
  const state = getPlateauState();
  if (state) {
    state.activeAdjustment = false;
    state.dismissedAt = new Date().toISOString();
    savePlateauState(state);
  }
}

export function detectPlateau(input: PlateauInput): PlateauDetection {
  const types: PlateauType[] = [];
  let totalSeverity = 0;

  // Don't detect plateau during recovery cycles or extreme fatigue
  if (input.currentCycle === "recuperacao" || input.fatigueLevel === "extreme") {
    return { detected: false, types: [], severity: "leve", primaryType: null, message: "", adjustments: [], estimatedRecoveryDays: 0 };
  }

  // Check if already dismissed recently (within 7 days)
  const state = getPlateauState();
  if (state?.dismissedAt) {
    const daysSinceDismiss = (Date.now() - new Date(state.dismissedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceDismiss < 7) {
      return { detected: false, types: [], severity: "leve", primaryType: null, message: "", adjustments: [], estimatedRecoveryDays: 0 };
    }
  }

  // 1. STRENGTH PLATEAU
  if (input.weeklyMaxWeights.length >= 2) {
    const recent = input.weeklyMaxWeights[0]?.avgMaxWeight || 0;
    const previous = input.weeklyMaxWeights[1]?.avgMaxWeight || 0;
    const older = input.weeklyMaxWeights[2]?.avgMaxWeight || previous;
    
    // No increase for 2+ weeks
    const changeRecent = recent - previous;
    const changeOlder = previous - older;
    
    if (Math.abs(changeRecent) < 0.5 && Math.abs(changeOlder) < 0.5 && recent > 0) {
      types.push("forca");
      totalSeverity += 2;
    } else if (changeRecent < -0.5) {
      // Force actually declining
      types.push("forca");
      totalSeverity += 3;
    }
  }

  // 2. BODY COMPOSITION PLATEAU
  if (input.weeklyBodyWeight.length >= 3) {
    const weights = input.weeklyBodyWeight.map(w => w.weight);
    const range = Math.max(...weights) - Math.min(...weights);
    
    // Less than 0.3kg variation over 3+ weeks
    if (range < 0.3) {
      types.push("composicao");
      totalSeverity += 2;
    }
  }

  // 3. METABOLIC PLATEAU  
  const dietFailRate = input.mealsTotalLast2Weeks > 0
    ? input.mealsFailedLast2Weeks / input.mealsTotalLast2Weeks
    : 0;
  const trainingRate = input.targetWorkoutsPerWeek > 0
    ? input.workoutsLast2Weeks / (input.targetWorkoutsPerWeek * 2)
    : 0;
  
  // High diet failure + stagnant weight = metabolic plateau
  if (dietFailRate > 0.3 && types.includes("composicao")) {
    types.push("metabolica");
    totalSeverity += 2;
  }

  // 4. BEHAVIORAL PLATEAU
  const scoreDrop = input.previousScore - input.currentScore;
  const streakDrop = input.previousStreak - input.currentStreak;
  const failRate = input.totalSetsLast2Weeks > 0
    ? input.exerciseFailuresLast2Weeks / input.totalSetsLast2Weeks
    : 0;

  if (
    (scoreDrop > 5) ||
    (streakDrop > 3) ||
    (trainingRate < 0.6 && input.targetWorkoutsPerWeek >= 3) ||
    (failRate > 0.25)
  ) {
    types.push("comportamental");
    totalSeverity += scoreDrop > 10 ? 3 : 2;
  }

  const detected = types.length > 0;
  const severity: PlateauDetection["severity"] = totalSeverity >= 7 ? "alta" : totalSeverity >= 4 ? "moderada" : "leve";
  const primaryType = types[0] || null;

  // Generate adjustments based on types
  const adjustments: PlateauAdjustment[] = [];

  if (types.includes("forca")) {
    adjustments.push(
      { area: "Treino", action: "Variar exercícios e incluir técnicas avançadas (drop-set, rest-pause)", icon: "💪" },
      { area: "Volume", action: "Redistribuir séries com foco em estímulo novo", icon: "📊" }
    );
  }

  if (types.includes("composicao")) {
    adjustments.push(
      { area: "Dieta", action: "Ajustar calorias em ±10% para quebrar adaptação", icon: "🍽️" },
      { area: "Cardio", action: "Alternar tipo e intensidade do cardio", icon: "🏃" }
    );
  }

  if (types.includes("metabolica")) {
    adjustments.push(
      { area: "Metabolismo", action: "Inserir dia de refeed ou ajuste calórico cíclico", icon: "🔄" },
      { area: "Descanso", action: "Considerar semana de deload para reset metabólico", icon: "😴" }
    );
  }

  if (types.includes("comportamental")) {
    adjustments.push(
      { area: "Rotina", action: "Simplificar o plano e focar em consistência básica", icon: "📋" },
      { area: "Motivação", action: "Ativar desafios curtos e metas de 7 dias", icon: "🎯" }
    );
  }

  // Limit to 3 adjustments max (avoid overwhelming)
  const limitedAdjustments = adjustments.slice(0, 3);

  const estimatedRecoveryDays = severity === "alta" ? 21 : severity === "moderada" ? 14 : 7;

  // Messages per primary type
  const typeMessages: Record<PlateauType, string> = {
    forca: "Sua força estagnou. Vamos variar os estímulos para destravar sua evolução.",
    composicao: "Sua composição corporal não está mudando. Hora de ajustar a estratégia.",
    metabolica: "Seu metabolismo pode estar adaptado. Vamos quebrar esse ciclo.",
    comportamental: "Sua consistência caiu. Vamos simplificar e retomar o ritmo.",
  };

  const message = primaryType ? typeMessages[primaryType] : "";

  // Save state
  if (detected) {
    savePlateauState({
      lastDetection: new Date().toISOString(),
      activeAdjustment: true,
      detectedTypes: types,
    });
  }

  return {
    detected,
    types,
    severity,
    primaryType,
    message,
    adjustments: limitedAdjustments,
    estimatedRecoveryDays,
  };
}
