// Smart Replanning Engine — Etapa 5.14
// Analyzes user state and generates strategic plan adjustments

export interface ReplanningContext {
  // Plateau
  plateauDetected: boolean;
  plateauTypes: string[];
  plateauSeverity: "leve" | "moderada" | "alta";

  // Score
  currentScore: number;
  scoreDropLast2Weeks: number; // positive = dropped

  // Training
  workoutsLast2Weeks: number;
  targetWorkoutsPerWeek: number;
  currentStreak: number;
  daysInactive: number;
  exerciseFailRate: number; // 0-1

  // Diet
  dietAdherencePct: number; // 0-100
  mealsFailedLast2Weeks: number;

  // Body
  weightStagnant: boolean; // no change in 3+ weeks
  bodyProgressDirection: "improving" | "stable" | "declining" | "unknown";

  // Fatigue & Recovery
  fatigueLevel: "low" | "moderate" | "high" | "extreme";
  currentCycle: string;

  // User context
  objective: string;
  experienceLevel: string;
  daysPerWeek: number;
}

export type ReplanScope = "treino" | "dieta" | "cardio" | "recuperacao";

export interface ReplanChange {
  scope: ReplanScope;
  area: string;
  before: string;
  after: string;
  icon: string;
}

export interface ReplanResult {
  shouldReplan: boolean;
  isTotal: boolean; // total vs partial
  triggers: string[];
  changes: ReplanChange[];
  message: string;
  benefitMessage: string;
  newCycleSuggestion: string | null;
}

const STORAGE_KEY = "fitpulse_replan_state";

interface ReplanState {
  lastReplan: string;
  acknowledged: boolean;
  triggers: string[];
}

export function getReplanState(): ReplanState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveReplanState(state: ReplanState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function acknowledgeReplan() {
  const state = getReplanState();
  if (state) {
    state.acknowledged = true;
    saveReplanState(state);
  }
}

export function analyzeReplanning(ctx: ReplanningContext): ReplanResult {
  const triggers: string[] = [];
  const changes: ReplanChange[] = [];

  // Check cooldown — don't replan more than once every 10 days
  const state = getReplanState();
  if (state) {
    const daysSince = (Date.now() - new Date(state.lastReplan).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 10) {
      return { shouldReplan: false, isTotal: false, triggers: [], changes: [], message: "", benefitMessage: "", newCycleSuggestion: null };
    }
  }

  // --- TRIGGER DETECTION ---

  // 1. Plateau prolongado
  if (ctx.plateauDetected && ctx.plateauSeverity !== "leve") {
    triggers.push("Estagnação física detectada");
  }

  // 2. Score drop
  if (ctx.scoreDropLast2Weeks > 15) {
    triggers.push("Queda significativa no Score Fitness");
  }

  // 3. Excess failures
  if (ctx.exerciseFailRate > 0.3) {
    triggers.push("Taxa alta de falhas nos exercícios");
  }

  // 4. Training abandonment
  const trainingRate = ctx.targetWorkoutsPerWeek > 0
    ? ctx.workoutsLast2Weeks / (ctx.targetWorkoutsPerWeek * 2)
    : 0;
  if (trainingRate < 0.5 && ctx.targetWorkoutsPerWeek >= 3) {
    triggers.push("Frequência de treino abaixo do esperado");
  }

  // 5. Overtraining / extreme fatigue
  if (ctx.fatigueLevel === "extreme") {
    triggers.push("Fadiga extrema detectada");
  }

  // 6. Diet without adherence
  if (ctx.dietAdherencePct < 40) {
    triggers.push("Baixa aderência à dieta");
  }

  // 7. Return after long pause
  if (ctx.daysInactive >= 7) {
    triggers.push("Retorno após pausa prolongada");
  }

  // 8. Body stagnation
  if (ctx.weightStagnant && ctx.bodyProgressDirection !== "improving") {
    triggers.push("Composição corporal estagnada");
  }

  // Not enough triggers
  if (triggers.length === 0) {
    return { shouldReplan: false, isTotal: false, triggers: [], changes: [], message: "", benefitMessage: "", newCycleSuggestion: null };
  }

  const isTotal = triggers.length >= 3;

  // --- GENERATE CHANGES ---

  // Training changes
  if (ctx.plateauDetected || ctx.exerciseFailRate > 0.3 || trainingRate < 0.5) {
    if (ctx.exerciseFailRate > 0.3) {
      changes.push({
        scope: "treino", area: "Intensidade",
        before: "Volume e carga atuais", after: "Redução de 15% na carga com foco em técnica",
        icon: "💪"
      });
    }

    if (ctx.plateauDetected) {
      changes.push({
        scope: "treino", area: "Exercícios",
        before: "Rotina atual", after: "Variação de exercícios para novo estímulo muscular",
        icon: "🔄"
      });
    }

    if (trainingRate < 0.5 && ctx.daysPerWeek > 3) {
      changes.push({
        scope: "treino", area: "Frequência",
        before: `${ctx.daysPerWeek}x por semana`,
        after: `${Math.max(3, ctx.daysPerWeek - 1)}x por semana (temporário)`,
        icon: "📅"
      });
    }
  }

  // Diet changes
  if (ctx.dietAdherencePct < 50 || (ctx.weightStagnant && ctx.objective !== "manter")) {
    if (ctx.dietAdherencePct < 50) {
      changes.push({
        scope: "dieta", area: "Simplificação",
        before: "Plano alimentar atual", after: "Refeições mais práticas e flexíveis",
        icon: "🍽️"
      });
    }

    if (ctx.weightStagnant && ctx.objective === "emagrecer") {
      changes.push({
        scope: "dieta", area: "Calorias",
        before: "Meta calórica atual", after: "Ajuste de -10% nas calorias diárias",
        icon: "📉"
      });
    } else if (ctx.weightStagnant && ctx.objective === "massa") {
      changes.push({
        scope: "dieta", area: "Calorias",
        before: "Meta calórica atual", after: "Ajuste de +10% nas calorias diárias",
        icon: "📈"
      });
    }
  }

  // Cardio changes
  if (ctx.plateauDetected && ctx.plateauTypes.includes("metabolica")) {
    changes.push({
      scope: "cardio", area: "Estratégia",
      before: "Cardio atual", after: "Alternar entre HIIT e cardio moderado",
      icon: "🏃"
    });
  }

  // Recovery changes
  if (ctx.fatigueLevel === "extreme" || ctx.fatigueLevel === "high") {
    changes.push({
      scope: "recuperacao", area: "Descanso",
      before: "Plano normal", after: "Semana de deload com volume reduzido em 40%",
      icon: "😴"
    });
  }

  if (ctx.daysInactive >= 7) {
    changes.push({
      scope: "recuperacao", area: "Retomada",
      before: "Intensidade anterior", after: "Plano adaptado com 70% da intensidade por 1 semana",
      icon: "🌱"
    });
  }

  // Limit changes to avoid overwhelming
  const limitedChanges = changes.slice(0, 4);

  // Generate messages
  const message = isTotal
    ? "Detectamos múltiplos sinais de que seu plano precisa de ajustes. Replanejamos estrategicamente para destravar sua evolução."
    : "Identificamos oportunidades de melhoria no seu plano. Fizemos ajustes pontuais para otimizar seus resultados.";

  const benefitMessages: Record<string, string> = {
    emagrecer: "Esperamos retomar a perda de gordura em 7 a 14 dias com as novas estratégias.",
    massa: "O novo estímulo deve reativar o ganho muscular nas próximas 2 semanas.",
    condicionamento: "Seu condicionamento deve melhorar visivelmente em 10 dias.",
    manter: "Os ajustes vão manter sua forma sem sobrecarregar o corpo.",
  };

  const benefitMessage = benefitMessages[ctx.objective] || "Os ajustes devem trazer resultados visíveis em 2 semanas.";

  // Suggest new cycle
  let newCycleSuggestion: string | null = null;
  if (ctx.fatigueLevel === "extreme" || ctx.fatigueLevel === "high") {
    newCycleSuggestion = "recuperacao";
  } else if (isTotal) {
    newCycleSuggestion = "adaptacao";
  }

  // Save state
  if (triggers.length > 0) {
    saveReplanState({
      lastReplan: new Date().toISOString(),
      acknowledged: false,
      triggers,
    });
  }

  return {
    shouldReplan: true,
    isTotal,
    triggers,
    changes: limitedChanges,
    message,
    benefitMessage,
    newCycleSuggestion,
  };
}
