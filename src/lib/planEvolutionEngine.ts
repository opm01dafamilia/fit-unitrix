/**
 * Plan Evolution Engine — Professional Personal Trainer Intelligence
 * 
 * Coordinates all existing progression engines into a unified evolution system:
 * - Tracks plan age and proactively swaps exercises for variety
 * - Applies progressive overload based on user performance
 * - Detects stale plans and suggests refreshing
 * - Manages adaptation periods for new plans
 * - Provides coach-like feedback on evolution
 */

import { getCycleStatus, type CycleStatus, type CyclePhase } from "./progressionCycleEngine";
import { loadTrainerState, type TrainerState } from "./aiPersonalTrainerEngine";
import { loadAllPerformances, getMuscleGroupEvolution, type MuscleGroupEvolution } from "./smartProgressionEngine";

// ===== TYPES =====

export type PlanMaturity = "new" | "adapting" | "progressing" | "mature" | "stale";

export type ExerciseSwapRecommendation = {
  dayIndex: number;
  originalExercise: string;
  suggestedExercise: string;
  reason: string;
  muscleGroup: string;
  priority: "low" | "medium" | "high";
};

export type EvolutionRecommendation = {
  type: "volume" | "intensity" | "swap" | "deload" | "adaptation" | "progression";
  title: string;
  description: string;
  emoji: string;
  impact: "positive" | "neutral" | "protective";
};

export type PlanEvolutionStatus = {
  planAge: number; // days
  planWeeks: number;
  maturity: PlanMaturity;
  maturityLabel: string;
  maturityEmoji: string;
  cycleStatus: CycleStatus;
  trainerState: TrainerState;
  muscleEvolutions: MuscleGroupEvolution[];
  swapRecommendations: ExerciseSwapRecommendation[];
  evolutionRecommendations: EvolutionRecommendation[];
  coachMessage: string;
  shouldRefreshPlan: boolean;
  nextMilestone: string;
  overallProgressPct: number; // 0-100
};

// ===== CONSTANTS =====

const PLAN_MATURITY_THRESHOLDS = {
  new: 3,         // 0-3 days
  adapting: 14,   // 4-14 days (2 weeks)
  progressing: 42, // 15-42 days (6 weeks)
  mature: 70,     // 43-70 days (10 weeks)
  stale: 999,     // 70+ days
};

const SWAP_INTERVAL_WEEKS = 3; // Swap exercises every 3 weeks for variety

// Exercise variation map for proactive swaps (professional variety)
const VARIATION_MAP: Record<string, string[]> = {
  // Peito
  "Supino Reto": ["Supino Reto Máquina", "Supino com Halteres"],
  "Supino Reto Máquina": ["Supino Reto", "Supino Inclinado Halteres"],
  "Supino Inclinado Halteres": ["Supino Inclinado Barra", "Supino Reto"],
  "Crucifixo": ["Crucifixo Inclinado", "Cross Over", "Peck Deck"],
  "Crucifixo Inclinado": ["Crucifixo", "Cross Over"],
  "Cross Over": ["Crucifixo", "Crucifixo Inclinado", "Peck Deck"],
  "Flexão de Braço": ["Flexão com Peso", "Flexão Declinada"],
  "Flexão com Peso": ["Flexão de Braço", "Supino Reto"],
  // Costas
  "Barra Fixa": ["Barra Fixa com Peso", "Pulldown"],
  "Barra Fixa com Peso": ["Barra Fixa", "Pulldown Pegada Fechada"],
  "Pulldown": ["Pulldown Pegada Fechada", "Barra Fixa"],
  "Pulldown Pegada Fechada": ["Pulldown", "Barra Fixa"],
  "Remada Curvada": ["Remada Cavaleiro", "Remada Curvada Pronada", "Remada Unilateral"],
  "Remada Cavaleiro": ["Remada Curvada", "Remada Curvada Pronada"],
  "Remada Curvada Pronada": ["Remada Curvada", "Remada Cavaleiro"],
  "Remada Unilateral": ["Remada Curvada", "Remada Baixa"],
  "Remada Máquina": ["Remada Curvada", "Remada Unilateral"],
  "Remada Baixa": ["Remada Unilateral", "Remada Máquina"],
  "Pullover Cabo": ["Pulldown Pegada Fechada", "Remada Unilateral"],
  // Quadríceps
  "Agachamento Livre": ["Agachamento Frontal", "Agachamento Hack"],
  "Agachamento Frontal": ["Agachamento Livre", "Agachamento Hack"],
  "Agachamento Hack": ["Agachamento Livre", "Agachamento Búlgaro"],
  "Agachamento Búlgaro": ["Passada Caminhando", "Agachamento Hack"],
  "Agachamento Goblet": ["Agachamento Livre", "Agachamento Búlgaro"],
  "Leg Press": ["Leg Press 45°", "Leg Press Pés Baixos"],
  "Leg Press 45°": ["Leg Press", "Leg Press Pés Baixos"],
  "Leg Press Pés Baixos": ["Leg Press", "Agachamento Hack"],
  "Cadeira Extensora": ["Passada Caminhando", "Agachamento Búlgaro"],
  "Passada Caminhando": ["Agachamento Búlgaro", "Cadeira Extensora"],
  // Posterior
  "Stiff": ["Stiff Romeno", "Good Morning"],
  "Stiff Romeno": ["Stiff", "Good Morning"],
  "Good Morning": ["Stiff", "Stiff Romeno"],
  "Mesa Flexora": ["Mesa Flexora Unilateral", "Cadeira Flexora"],
  "Mesa Flexora Unilateral": ["Mesa Flexora", "Cadeira Flexora"],
  // Glúteos
  "Hip Thrust": ["Hip Thrust Pesado", "Elevação Pélvica"],
  "Hip Thrust Pesado": ["Hip Thrust", "Elevação Pélvica Unilateral"],
  "Elevação Pélvica": ["Hip Thrust", "Elevação Pélvica Unilateral"],
  "Elevação Pélvica Unilateral": ["Hip Thrust", "Elevação Pélvica"],
  "Kickback Cabo": ["Kickback Cabo Pesado", "Passada Reversa"],
  "Kickback Cabo Pesado": ["Kickback Cabo", "Passada Lateral"],
  "Cadeira Abdutora": ["Passada Lateral", "Kickback Cabo"],
  "Agachamento Sumô": ["Agachamento Sumô Barra", "Hip Thrust"],
  "Agachamento Sumô Barra": ["Agachamento Sumô", "Hip Thrust Pesado"],
  "Passada Reversa": ["Passada Lateral", "Agachamento Búlgaro"],
  "Passada Lateral": ["Passada Reversa", "Cadeira Abdutora"],
  // Ombros
  "Desenvolvimento Militar": ["Desenvolvimento Arnold", "Desenvolvimento Máquina"],
  "Desenvolvimento Arnold": ["Desenvolvimento Militar", "Desenvolvimento com Halteres"],
  "Desenvolvimento Máquina": ["Desenvolvimento Militar", "Desenvolvimento Arnold"],
  "Elevação Lateral": ["Elevação Frontal", "Elevação Frontal Alternada"],
  "Elevação Frontal": ["Elevação Lateral", "Elevação Frontal Alternada"],
  "Elevação Frontal Alternada": ["Elevação Frontal", "Elevação Lateral"],
  "Face Pull": ["Elevação Lateral", "Desenvolvimento Arnold"],
  // Bíceps
  "Rosca Direta": ["Rosca Direta Barra", "Rosca Scott"],
  "Rosca Direta Barra": ["Rosca Direta", "Rosca Scott"],
  "Rosca Scott": ["Rosca Direta Barra", "Rosca Martelo"],
  "Rosca Martelo": ["Rosca Alternada", "Rosca Scott"],
  "Rosca Alternada": ["Rosca Martelo", "Rosca Direta"],
  // Tríceps
  "Tríceps Testa": ["Tríceps Francês", "Tríceps Corda"],
  "Tríceps Corda": ["Tríceps Testa", "Mergulho Paralelas"],
  "Tríceps Francês": ["Tríceps Testa", "Tríceps Corda"],
  "Mergulho Paralelas": ["Tríceps Testa", "Tríceps Corda"],
  // Panturrilha
  "Panturrilha em Pé": ["Panturrilha em Pé Unilateral", "Panturrilha no Leg Press"],
  "Panturrilha em Pé Unilateral": ["Panturrilha em Pé", "Panturrilha Sentado"],
  "Panturrilha Sentado": ["Panturrilha em Pé", "Panturrilha no Leg Press"],
  "Panturrilha no Leg Press": ["Panturrilha em Pé", "Panturrilha Sentado"],
};

// ===== STORAGE =====

const EVOLUTION_KEY = "fitpulse_plan_evolution";

type StoredEvolution = {
  lastSwapDate: string | null;
  swappedExercises: Record<string, string>; // original → swapped
  totalSwapsPerformed: number;
  planStartDate: string | null;
};

function loadEvolutionState(): StoredEvolution {
  try {
    const raw = localStorage.getItem(EVOLUTION_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    lastSwapDate: null,
    swappedExercises: {},
    totalSwapsPerformed: 0,
    planStartDate: null,
  };
}

function saveEvolutionState(state: StoredEvolution): void {
  try {
    localStorage.setItem(EVOLUTION_KEY, JSON.stringify(state));
  } catch {}
}

// ===== MATURITY DETECTION =====

function getPlanMaturity(planAgeDays: number): PlanMaturity {
  if (planAgeDays <= PLAN_MATURITY_THRESHOLDS.new) return "new";
  if (planAgeDays <= PLAN_MATURITY_THRESHOLDS.adapting) return "adapting";
  if (planAgeDays <= PLAN_MATURITY_THRESHOLDS.progressing) return "progressing";
  if (planAgeDays <= PLAN_MATURITY_THRESHOLDS.mature) return "mature";
  return "stale";
}

const MATURITY_CONFIG: Record<PlanMaturity, { label: string; emoji: string }> = {
  new: { label: "Plano Novo", emoji: "🆕" },
  adapting: { label: "Em Adaptação", emoji: "🌱" },
  progressing: { label: "Evoluindo", emoji: "📈" },
  mature: { label: "Maduro", emoji: "💪" },
  stale: { label: "Necessita Renovação", emoji: "🔄" },
};

// ===== PROACTIVE EXERCISE SWAP RECOMMENDATIONS =====

function generateSwapRecommendations(
  planDays: Array<{ exercicios: Array<{ nome: string }>; grupo: string }>,
  planWeeks: number,
  muscleEvolutions: MuscleGroupEvolution[]
): ExerciseSwapRecommendation[] {
  const recommendations: ExerciseSwapRecommendation[] = [];
  
  if (planWeeks < SWAP_INTERVAL_WEEKS) return recommendations;
  
  const swapCycleNumber = Math.floor(planWeeks / SWAP_INTERVAL_WEEKS);
  const evolutionState = loadEvolutionState();
  
  for (let dayIdx = 0; dayIdx < planDays.length; dayIdx++) {
    const day = planDays[dayIdx];
    const grupo = day.grupo.toLowerCase();
    
    for (const exercise of day.exercicios) {
      const alternatives = VARIATION_MAP[exercise.nome];
      if (!alternatives || alternatives.length === 0) continue;
      
      // Only swap a subset of exercises per cycle (not all at once)
      const shouldSwapThisExercise = hashExerciseForSwap(exercise.nome, swapCycleNumber, dayIdx);
      if (!shouldSwapThisExercise) continue;
      
      // Don't re-recommend already swapped exercises
      if (evolutionState.swappedExercises[exercise.nome]) continue;
      
      // Check if the muscle group is stagnating
      const groupEvolution = muscleEvolutions.find(e => 
        grupo.includes(e.group.toLowerCase())
      );
      const isStagnant = groupEvolution?.trend === "stable" && (groupEvolution?.sessions || 0) >= 4;
      
      // Pick the best alternative (not already in the plan)
      const usedInPlan = new Set(planDays.flatMap(d => d.exercicios.map(e => e.nome)));
      const available = alternatives.filter(a => !usedInPlan.has(a));
      if (available.length === 0) continue;
      
      const suggested = available[swapCycleNumber % available.length];
      
      let reason: string;
      let priority: "low" | "medium" | "high";
      
      if (isStagnant) {
        reason = `Estímulo estagnado — nova variação para quebrar platô`;
        priority = "high";
      } else if (planWeeks >= 6) {
        reason = `${planWeeks} semanas com o mesmo exercício — hora de variar`;
        priority = "medium";
      } else {
        reason = `Variação inteligente para manter a evolução`;
        priority = "low";
      }
      
      recommendations.push({
        dayIndex: dayIdx,
        originalExercise: exercise.nome,
        suggestedExercise: suggested,
        reason,
        muscleGroup: grupo,
        priority,
      });
    }
  }
  
  // Limit: max 2-3 swaps per cycle to avoid overwhelming changes
  return recommendations
    .sort((a, b) => {
      const prio = { high: 0, medium: 1, low: 2 };
      return prio[a.priority] - prio[b.priority];
    })
    .slice(0, 3);
}

function hashExerciseForSwap(name: string, cycle: number, dayIdx: number): boolean {
  // Deterministic selection: ~30% of exercises per cycle
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i) + cycle * 7 + dayIdx * 13;
    hash |= 0;
  }
  return Math.abs(hash) % 3 === 0;
}

// ===== EVOLUTION RECOMMENDATIONS =====

function generateEvolutionRecommendations(
  maturity: PlanMaturity,
  cycleStatus: CycleStatus,
  trainerState: TrainerState,
  muscleEvolutions: MuscleGroupEvolution[],
  totalSessions: number
): EvolutionRecommendation[] {
  const recs: EvolutionRecommendation[] = [];
  
  // Adaptation period
  if (maturity === "new" || maturity === "adapting") {
    recs.push({
      type: "adaptation",
      title: "Período de Adaptação",
      description: "Foco na técnica e execução correta. A intensidade aumentará gradualmente.",
      emoji: "🌱",
      impact: "neutral",
    });
  }
  
  // Progression recommendations based on cycle phase
  if (cycleStatus.phase === "intenso") {
    recs.push({
      type: "intensity",
      title: "Semana de Pico",
      description: "Máximo esforço controlado — aproveite para bater recordes pessoais.",
      emoji: "🔥",
      impact: "positive",
    });
  } else if (cycleStatus.phase === "deload") {
    recs.push({
      type: "deload",
      title: "Semana de Recuperação",
      description: "Treino mais leve para seu corpo crescer. Essencial para evolução a longo prazo.",
      emoji: "🧘",
      impact: "protective",
    });
  }
  
  // Volume adjustment based on muscle group evolution
  const stagnantGroups = muscleEvolutions.filter(e => e.trend === "stable" && e.sessions >= 6);
  if (stagnantGroups.length > 0) {
    const groupNames = stagnantGroups.map(g => g.group).slice(0, 2).join(" e ");
    recs.push({
      type: "swap",
      title: "Variação de Estímulo",
      description: `${groupNames} está estagnando. Exercícios alternativos foram sugeridos.`,
      emoji: "🔄",
      impact: "neutral",
    });
  }
  
  // Progressive overload milestones
  const evolvingGroups = muscleEvolutions.filter(e => e.trend === "up");
  if (evolvingGroups.length >= 3) {
    recs.push({
      type: "progression",
      title: "Evolução Consistente",
      description: `${evolvingGroups.length} grupos musculares em evolução! Continue assim.`,
      emoji: "🚀",
      impact: "positive",
    });
  }
  
  // Maturity-based progression
  if (maturity === "progressing" && totalSessions >= 12) {
    recs.push({
      type: "volume",
      title: "Aumento de Volume",
      description: "Seu corpo já se adaptou. Volume e complexidade serão aumentados progressivamente.",
      emoji: "📈",
      impact: "positive",
    });
  }
  
  if (maturity === "stale") {
    recs.push({
      type: "swap",
      title: "Renovação do Plano",
      description: "Seu plano tem mais de 10 semanas. Considere gerar um novo para manter a evolução.",
      emoji: "🔄",
      impact: "neutral",
    });
  }
  
  return recs;
}

// ===== COACH MESSAGE GENERATION =====

function generateCoachMessage(
  maturity: PlanMaturity,
  cycleStatus: CycleStatus,
  totalSessions: number,
  muscleEvolutions: MuscleGroupEvolution[]
): string {
  const evolvingCount = muscleEvolutions.filter(e => e.trend === "up").length;
  const stagnantCount = muscleEvolutions.filter(e => e.trend === "stable" && e.sessions >= 4).length;
  
  if (maturity === "new") {
    return "🌟 Bem-vindo ao seu novo plano! Foque na execução correta — a intensidade virá naturalmente.";
  }
  
  if (maturity === "adapting") {
    if (totalSessions >= 3) {
      return "💪 Adaptação em progresso. Seu corpo está aprendendo os movimentos — continue assim!";
    }
    return "🌱 Período de adaptação ativo. Priorize a técnica e a consistência.";
  }
  
  if (cycleStatus.phase === "deload") {
    return "🧘 Semana de recuperação estratégica. Treino leve para seu corpo se regenerar e crescer.";
  }
  
  if (cycleStatus.phase === "intenso") {
    return "🔥 Semana de pico! Dê o máximo com controle — é hora de desafiar seus limites.";
  }
  
  if (evolvingCount >= 3) {
    return "🚀 Evolução incrível! Múltiplos grupos em progresso. Mantenha a consistência!";
  }
  
  if (stagnantCount >= 2 && maturity === "mature") {
    return "🔄 Detectei estagnação em alguns grupos. Exercícios alternativos foram sugeridos para novo estímulo.";
  }
  
  if (maturity === "stale") {
    return "📋 Seu plano tem bastante tempo. Gerar um novo plano pode reativar sua evolução.";
  }
  
  if (totalSessions >= 20) {
    return "💎 Veterano do treino! Sua consistência é admirável. Os resultados virão!";
  }
  
  return "📈 Evolução em andamento. Continue consistente e os resultados aparecerão!";
}

// ===== NEXT MILESTONE =====

function getNextMilestone(totalSessions: number, maturity: PlanMaturity, cycleStatus: CycleStatus): string {
  if (totalSessions < 3) return "Complete 3 treinos para iniciar a análise de progressão";
  if (totalSessions < 10) return `${10 - totalSessions} treinos para desbloquear análise avançada`;
  if (cycleStatus.phase !== "intenso" && cycleStatus.currentWeek <= 3) {
    return `Semana de pico em ${5 - cycleStatus.currentWeek} semana${5 - cycleStatus.currentWeek > 1 ? "s" : ""}`;
  }
  if (maturity === "progressing") return "Continue consistente — próximo ciclo trará mais desafio";
  if (maturity === "mature") return "Avalie gerar um novo plano para novos estímulos";
  return "Mantenha a consistência para evoluir";
}

// ===== APPLY SWAP TO PLAN =====

export function applyExerciseSwap(
  originalExercise: string,
  newExercise: string
): void {
  const state = loadEvolutionState();
  state.swappedExercises[originalExercise] = newExercise;
  state.totalSwapsPerformed++;
  state.lastSwapDate = new Date().toISOString().slice(0, 10);
  saveEvolutionState(state);
}

export function resetEvolutionForNewPlan(): void {
  const state = loadEvolutionState();
  state.swappedExercises = {};
  state.planStartDate = new Date().toISOString();
  saveEvolutionState(state);
}

// ===== MAIN: GET PLAN EVOLUTION STATUS =====

export function getPlanEvolutionStatus(
  planCreatedAt: string,
  planDays: Array<{ exercicios: Array<{ nome: string }>; grupo: string }>,
  totalSessionsCompleted: number
): PlanEvolutionStatus {
  const created = new Date(planCreatedAt);
  const now = new Date();
  const planAgeDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  const planWeeks = Math.floor(planAgeDays / 7);
  const maturity = getPlanMaturity(planAgeDays);
  const maturityConfig = MATURITY_CONFIG[maturity];
  
  const cycleStatus = getCycleStatus(planCreatedAt);
  const trainerState = loadTrainerState();
  
  // Get muscle group evolution from performance data
  const muscleGroups = ["peito", "costas", "quadriceps", "posterior", "gluteos", "ombros", "biceps", "triceps", "panturrilha"];
  const muscleEvolutions = muscleGroups.map(g => getMuscleGroupEvolution(g));
  
  // Generate swap recommendations
  const swapRecommendations = generateSwapRecommendations(planDays, planWeeks, muscleEvolutions);
  
  // Generate evolution recommendations
  const evolutionRecommendations = generateEvolutionRecommendations(
    maturity, cycleStatus, trainerState, muscleEvolutions, totalSessionsCompleted
  );
  
  // Coach message
  const coachMessage = generateCoachMessage(maturity, cycleStatus, totalSessionsCompleted, muscleEvolutions);
  
  // Should refresh plan?
  const shouldRefreshPlan = maturity === "stale" || (
    maturity === "mature" && muscleEvolutions.filter(e => e.trend === "stable" && e.sessions >= 6).length >= 3
  );
  
  // Next milestone
  const nextMilestone = getNextMilestone(totalSessionsCompleted, maturity, cycleStatus);
  
  // Overall progress
  const evolvingGroups = muscleEvolutions.filter(e => e.trend === "up").length;
  const totalTracked = muscleEvolutions.filter(e => e.sessions > 0).length;
  const progressPct = totalTracked > 0
    ? Math.round((evolvingGroups / totalTracked) * 100)
    : Math.min(100, totalSessionsCompleted * 10);
  
  return {
    planAge: planAgeDays,
    planWeeks,
    maturity,
    maturityLabel: maturityConfig.label,
    maturityEmoji: maturityConfig.emoji,
    cycleStatus,
    trainerState,
    muscleEvolutions,
    swapRecommendations,
    evolutionRecommendations,
    coachMessage,
    shouldRefreshPlan,
    nextMilestone,
    overallProgressPct: Math.min(100, Math.max(0, progressPct)),
  };
}

// ===== APPLY EVOLUTION ADJUSTMENTS TO EXERCISES =====

/**
 * Adjusts exercise parameters based on plan maturity and cycle phase.
 * Called during workout execution to make exercises progressively harder/easier.
 */
export function getEvolutionAdjustments(
  exerciseName: string,
  baseSeries: number,
  baseReps: string,
  baseRest: string,
  planCreatedAt: string,
  experienceLevel: string
): {
  adjustedSeries: number;
  adjustedReps: string;
  adjustedRest: string;
  evolutionNote: string | null;
} {
  const cycleStatus = getCycleStatus(planCreatedAt);
  const maturity = getPlanMaturity(
    Math.floor((Date.now() - new Date(planCreatedAt).getTime()) / (1000 * 60 * 60 * 24))
  );
  
  let adjustedSeries = baseSeries;
  let adjustedReps = baseReps;
  let adjustedRest = baseRest;
  let evolutionNote: string | null = null;
  
  // Parse rest to number
  const restNum = parseInt(baseRest) || 60;
  const repsNum = parseInt(baseReps) || 10;
  
  // Adaptation period: keep everything moderate
  if (maturity === "new") {
    evolutionNote = "🌱 Fase de adaptação — foque na técnica";
    return { adjustedSeries, adjustedReps, adjustedRest, evolutionNote };
  }
  
  // Apply cycle-based adjustments
  if (cycleStatus.volumeAdjust !== 0) {
    const maxSeries = experienceLevel === "avancado" ? 6 : experienceLevel === "intermediario" ? 5 : 4;
    adjustedSeries = Math.max(2, Math.min(maxSeries, baseSeries + cycleStatus.volumeAdjust));
  }
  
  if (cycleStatus.repRangeShift !== 0) {
    const newReps = Math.max(4, repsNum + cycleStatus.repRangeShift);
    adjustedReps = String(newReps);
  }
  
  if (cycleStatus.restAdjust !== 0) {
    const newRest = Math.max(30, Math.min(180, restNum + cycleStatus.restAdjust));
    adjustedRest = `${newRest}s`;
  }
  
  // Generate evolution note based on phase
  switch (cycleStatus.phase) {
    case "aumento":
      evolutionNote = "📈 Progressão leve — carga ligeiramente maior";
      break;
    case "moderado":
      evolutionNote = "⚡ Volume crescente — mantenha a consistência";
      break;
    case "intenso":
      evolutionNote = "🔥 Semana de pico — máximo esforço";
      break;
    case "deload":
      evolutionNote = "🧘 Recuperação — treino leve e regenerativo";
      break;
    default:
      break;
  }
  
  return { adjustedSeries, adjustedReps, adjustedRest, evolutionNote };
}
