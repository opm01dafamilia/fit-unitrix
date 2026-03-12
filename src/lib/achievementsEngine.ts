// Achievement definitions and unlock logic with dynamic phase evolution

export type AchievementTier = "small" | "medium" | "large" | "extreme";
export type AchievementPhase = 1 | 2 | 3 | 4;

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "streak" | "volume" | "progression" | "milestone" | "diet" | "social";
  tier: AchievementTier;
  xp: number;
  requirement: number;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  currentValue: number;
  phase: AchievementPhase;
};

type AchievementDef = {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "streak" | "volume" | "progression" | "milestone" | "diet" | "social";
  tier: AchievementTier;
  requirement: number;
  phase: AchievementPhase;
  getValue: (stats: UserStats) => number;
};

// XP per tier
export const XP_PER_TIER: Record<AchievementTier, number> = {
  small: 10,
  medium: 25,
  large: 50,
  extreme: 150,
};

// Rank tiers
export type RankTier = "bronze" | "prata" | "ouro" | "elite";

export const RANK_THRESHOLDS: { tier: RankTier; minXP: number; label: string; icon: string; color: string }[] = [
  { tier: "elite", minXP: 2500, label: "Elite", icon: "👑", color: "text-purple-400" },
  { tier: "ouro", minXP: 1000, label: "Ouro", icon: "🥇", color: "text-yellow-400" },
  { tier: "prata", minXP: 300, label: "Prata", icon: "🥈", color: "text-gray-300" },
  { tier: "bronze", minXP: 0, label: "Bronze", icon: "🥉", color: "text-amber-600" },
];

export function getRankForXP(xp: number): typeof RANK_THRESHOLDS[0] {
  return RANK_THRESHOLDS.find(r => xp >= r.minXP) || RANK_THRESHOLDS[RANK_THRESHOLDS.length - 1];
}

export function getNextRank(xp: number): { nextRank: typeof RANK_THRESHOLDS[0]; xpNeeded: number } | null {
  const currentIdx = RANK_THRESHOLDS.findIndex(r => xp >= r.minXP);
  if (currentIdx <= 0) return null;
  const next = RANK_THRESHOLDS[currentIdx - 1];
  return { nextRank: next, xpNeeded: next.minXP - xp };
}

export type UserStats = {
  totalWorkouts: number;
  currentStreak: number;
  maxStreak: number;
  totalProgressions: number;
  totalExercisesCompleted: number;
  daysActive: number;
  dietStreak: number;
  dietMaxStreak: number;
  dietPerfectDays: number;
  dietWeeklyAdherence: number;
  weeksAboveRhythm?: number;
  firstWeekWorkout?: boolean;
  isTop10?: boolean;
  challengesCompleted?: number;
};

// Phase unlock threshold: 65% of current phase achievements must be unlocked
const PHASE_UNLOCK_THRESHOLD = 0.65;

// ── Phase 1: Iniciante ──
const phase1Defs: AchievementDef[] = [
  { id: "first_workout", title: "Primeiro Passo", description: "Complete seu primeiro treino", icon: "🎯", category: "milestone", tier: "small", phase: 1, requirement: 1, getValue: (s) => s.totalWorkouts },
  { id: "10_workouts", title: "Dedicação", description: "Complete 10 treinos", icon: "💪", category: "milestone", tier: "medium", phase: 1, requirement: 10, getValue: (s) => s.totalWorkouts },
  { id: "25_workouts", title: "Consistente", description: "Complete 25 treinos", icon: "🏅", category: "milestone", tier: "large", phase: 1, requirement: 25, getValue: (s) => s.totalWorkouts },
  { id: "50_workouts", title: "Atleta", description: "Complete 50 treinos", icon: "🏆", category: "milestone", tier: "large", phase: 1, requirement: 50, getValue: (s) => s.totalWorkouts },
  { id: "100_workouts", title: "Lenda", description: "Complete 100 treinos", icon: "👑", category: "milestone", tier: "extreme", phase: 1, requirement: 100, getValue: (s) => s.totalWorkouts },
  { id: "streak_3", title: "Fogo Aceso", description: "Treine 3 dias seguidos", icon: "🔥", category: "streak", tier: "small", phase: 1, requirement: 3, getValue: (s) => s.maxStreak },
  { id: "streak_7", title: "Semana Perfeita", description: "Treine 7 dias seguidos", icon: "⚡", category: "streak", tier: "medium", phase: 1, requirement: 7, getValue: (s) => s.maxStreak },
  { id: "streak_14", title: "Imparável", description: "Treine 14 dias seguidos", icon: "💎", category: "streak", tier: "large", phase: 1, requirement: 14, getValue: (s) => s.maxStreak },
  { id: "streak_30", title: "Máquina", description: "Treine 30 dias seguidos", icon: "🌟", category: "streak", tier: "extreme", phase: 1, requirement: 30, getValue: (s) => s.maxStreak },
  { id: "first_progression", title: "Evolução", description: "Aumente a carga pela primeira vez", icon: "📈", category: "progression", tier: "small", phase: 1, requirement: 1, getValue: (s) => s.totalProgressions },
  { id: "10_progressions", title: "Em Ascensão", description: "Aumente a carga em 10 exercícios", icon: "🚀", category: "progression", tier: "medium", phase: 1, requirement: 10, getValue: (s) => s.totalProgressions },
  { id: "25_progressions", title: "Superação", description: "Aumente a carga em 25 exercícios", icon: "⭐", category: "progression", tier: "large", phase: 1, requirement: 25, getValue: (s) => s.totalProgressions },
  { id: "50_exercises", title: "Aquecendo", description: "Complete 50 exercícios no total", icon: "🏋️", category: "volume", tier: "small", phase: 1, requirement: 50, getValue: (s) => s.totalExercisesCompleted },
  { id: "200_exercises", title: "Guerreiro", description: "Complete 200 exercícios no total", icon: "⚔️", category: "volume", tier: "medium", phase: 1, requirement: 200, getValue: (s) => s.totalExercisesCompleted },
  { id: "500_exercises", title: "Titã", description: "Complete 500 exercícios no total", icon: "🔱", category: "volume", tier: "extreme", phase: 1, requirement: 500, getValue: (s) => s.totalExercisesCompleted },
  { id: "diet_first_day", title: "Dia Perfeito", description: "Complete todas as refeições de um dia", icon: "🍽️", category: "diet", tier: "small", phase: 1, requirement: 1, getValue: (s) => s.dietPerfectDays },
  { id: "diet_streak_3", title: "Consistência Alimentar", description: "3 dias seguidos com dieta completa", icon: "🥗", category: "diet", tier: "small", phase: 1, requirement: 3, getValue: (s) => s.dietMaxStreak },
  { id: "diet_streak_7", title: "Foco Extremo", description: "7 dias seguidos com dieta completa", icon: "🔥", category: "diet", tier: "medium", phase: 1, requirement: 7, getValue: (s) => s.dietMaxStreak },
  { id: "diet_streak_15", title: "Máquina da Dieta", description: "15 dias seguidos com dieta completa", icon: "⚡", category: "diet", tier: "large", phase: 1, requirement: 15, getValue: (s) => s.dietMaxStreak },
  { id: "diet_streak_30", title: "Transformação", description: "30 dias seguidos com dieta completa", icon: "🏆", category: "diet", tier: "extreme", phase: 1, requirement: 30, getValue: (s) => s.dietMaxStreak },
  { id: "diet_adherence_90", title: "Aderência 90%", description: "Atinja 90% de aderência na semana", icon: "💯", category: "diet", tier: "medium", phase: 1, requirement: 90, getValue: (s) => s.dietWeeklyAdherence },
  { id: "rhythm_above_2w", title: "Evolução Acelerada", description: "Ritmo acima do esperado por 2 semanas", icon: "🚀", category: "progression", tier: "medium", phase: 1, requirement: 2, getValue: (s) => s.weeksAboveRhythm || 0 },
  { id: "rhythm_above_4w", title: "Máquina de Resultados", description: "Ritmo acima do esperado por 4 semanas", icon: "⚡", category: "progression", tier: "large", phase: 1, requirement: 4, getValue: (s) => s.weeksAboveRhythm || 0 },
  { id: "social_first_week", title: "Primeiro da Semana", description: "Complete o primeiro treino da semana", icon: "🌅", category: "social", tier: "small", phase: 1, requirement: 1, getValue: (s) => s.firstWeekWorkout ? 1 : 0 },
  { id: "social_top10", title: "Top 10", description: "Fique entre os 10 primeiros do ranking", icon: "🏅", category: "social", tier: "large", phase: 1, requirement: 1, getValue: (s) => s.isTop10 ? 1 : 0 },
  { id: "social_challenge_complete", title: "Desafio Completo", description: "Complete um desafio semanal", icon: "⭐", category: "social", tier: "medium", phase: 1, requirement: 1, getValue: (s) => s.challengesCompleted || 0 },
];

// ── Phase 2: Intermediário ──
const phase2Defs: AchievementDef[] = [
  { id: "p2_150_workouts", title: "Veterano", description: "Complete 150 treinos", icon: "🎖️", category: "milestone", tier: "large", phase: 2, requirement: 150, getValue: (s) => s.totalWorkouts },
  { id: "p2_200_workouts", title: "Incansável", description: "Complete 200 treinos", icon: "💫", category: "milestone", tier: "extreme", phase: 2, requirement: 200, getValue: (s) => s.totalWorkouts },
  { id: "p2_streak_21", title: "3 Semanas de Fogo", description: "Treine 21 dias seguidos", icon: "🔥", category: "streak", tier: "large", phase: 2, requirement: 21, getValue: (s) => s.maxStreak },
  { id: "p2_streak_45", title: "Disciplina de Ferro", description: "Treine 45 dias seguidos", icon: "⛓️", category: "streak", tier: "extreme", phase: 2, requirement: 45, getValue: (s) => s.maxStreak },
  { id: "p2_50_progressions", title: "Mestre da Carga", description: "Aumente a carga em 50 exercícios", icon: "🏗️", category: "progression", tier: "large", phase: 2, requirement: 50, getValue: (s) => s.totalProgressions },
  { id: "p2_1000_exercises", title: "Guerreiro Supremo", description: "Complete 1000 exercícios", icon: "⚔️", category: "volume", tier: "large", phase: 2, requirement: 1000, getValue: (s) => s.totalExercisesCompleted },
  { id: "p2_2000_exercises", title: "Colosso", description: "Complete 2000 exercícios", icon: "🗿", category: "volume", tier: "extreme", phase: 2, requirement: 2000, getValue: (s) => s.totalExercisesCompleted },
  { id: "p2_diet_streak_45", title: "Nutrição Impecável", description: "45 dias seguidos com dieta completa", icon: "🥇", category: "diet", tier: "extreme", phase: 2, requirement: 45, getValue: (s) => s.dietMaxStreak },
  { id: "p2_diet_perfect_30", title: "30 Dias Perfeitos", description: "30 dias perfeitos de dieta no total", icon: "🌟", category: "diet", tier: "large", phase: 2, requirement: 30, getValue: (s) => s.dietPerfectDays },
  { id: "p2_days_active_60", title: "60 Dias Ativos", description: "Treine em 60 dias diferentes", icon: "📅", category: "milestone", tier: "medium", phase: 2, requirement: 60, getValue: (s) => s.daysActive },
];

// ── Phase 3: Avançado ──
const phase3Defs: AchievementDef[] = [
  { id: "p3_300_workouts", title: "Máquina Humana", description: "Complete 300 treinos", icon: "🤖", category: "milestone", tier: "extreme", phase: 3, requirement: 300, getValue: (s) => s.totalWorkouts },
  { id: "p3_streak_60", title: "2 Meses Imparável", description: "Treine 60 dias seguidos", icon: "💎", category: "streak", tier: "extreme", phase: 3, requirement: 60, getValue: (s) => s.maxStreak },
  { id: "p3_streak_90", title: "Trimestre de Aço", description: "Treine 90 dias seguidos", icon: "🏛️", category: "streak", tier: "extreme", phase: 3, requirement: 90, getValue: (s) => s.maxStreak },
  { id: "p3_100_progressions", title: "Centurião da Carga", description: "Aumente a carga em 100 exercícios", icon: "⚡", category: "progression", tier: "extreme", phase: 3, requirement: 100, getValue: (s) => s.totalProgressions },
  { id: "p3_5000_exercises", title: "Titã Imortal", description: "Complete 5000 exercícios", icon: "🔱", category: "volume", tier: "extreme", phase: 3, requirement: 5000, getValue: (s) => s.totalExercisesCompleted },
  { id: "p3_diet_streak_60", title: "Dieta Lendária", description: "60 dias seguidos com dieta completa", icon: "👑", category: "diet", tier: "extreme", phase: 3, requirement: 60, getValue: (s) => s.dietMaxStreak },
  { id: "p3_days_active_120", title: "120 Dias Ativos", description: "Treine em 120 dias diferentes", icon: "🗓️", category: "milestone", tier: "large", phase: 3, requirement: 120, getValue: (s) => s.daysActive },
  { id: "p3_diet_perfect_60", title: "60 Dias Perfeitos", description: "60 dias perfeitos de dieta", icon: "💯", category: "diet", tier: "extreme", phase: 3, requirement: 60, getValue: (s) => s.dietPerfectDays },
];

// ── Phase 4: Elite ──
const phase4Defs: AchievementDef[] = [
  { id: "p4_500_workouts", title: "Lenda Viva", description: "Complete 500 treinos", icon: "🌌", category: "milestone", tier: "extreme", phase: 4, requirement: 500, getValue: (s) => s.totalWorkouts },
  { id: "p4_streak_180", title: "Semestre Invicto", description: "Treine 180 dias seguidos", icon: "🔥", category: "streak", tier: "extreme", phase: 4, requirement: 180, getValue: (s) => s.maxStreak },
  { id: "p4_streak_365", title: "Ano Perfeito", description: "Treine 365 dias seguidos", icon: "🌟", category: "streak", tier: "extreme", phase: 4, requirement: 365, getValue: (s) => s.maxStreak },
  { id: "p4_10000_exercises", title: "Deus do Volume", description: "Complete 10000 exercícios", icon: "⚡", category: "volume", tier: "extreme", phase: 4, requirement: 10000, getValue: (s) => s.totalExercisesCompleted },
  { id: "p4_200_progressions", title: "Força Absoluta", description: "Aumente a carga em 200 exercícios", icon: "💪", category: "progression", tier: "extreme", phase: 4, requirement: 200, getValue: (s) => s.totalProgressions },
  { id: "p4_diet_streak_90", title: "Disciplina Suprema", description: "90 dias seguidos com dieta completa", icon: "🏆", category: "diet", tier: "extreme", phase: 4, requirement: 90, getValue: (s) => s.dietMaxStreak },
  { id: "p4_days_active_250", title: "250 Dias Ativos", description: "Treine em 250 dias diferentes", icon: "📅", category: "milestone", tier: "extreme", phase: 4, requirement: 250, getValue: (s) => s.daysActive },
  { id: "p4_diet_perfect_100", title: "100 Dias Perfeitos", description: "100 dias perfeitos de dieta", icon: "🌈", category: "diet", tier: "extreme", phase: 4, requirement: 100, getValue: (s) => s.dietPerfectDays },
];

const allPhaseDefs: AchievementDef[][] = [phase1Defs, phase2Defs, phase3Defs, phase4Defs];

export const phaseLabels: Record<AchievementPhase, { label: string; icon: string; color: string }> = {
  1: { label: "Iniciante", icon: "🌱", color: "text-green-400" },
  2: { label: "Intermediário", icon: "⚡", color: "text-blue-400" },
  3: { label: "Avançado", icon: "🔥", color: "text-orange-400" },
  4: { label: "Elite", icon: "👑", color: "text-purple-400" },
};

/**
 * Determine which phases are unlocked based on stats.
 * Phase N+1 unlocks when >=65% of phase N achievements are completed.
 */
export function getUnlockedPhases(stats: UserStats): AchievementPhase[] {
  const phases: AchievementPhase[] = [1];

  for (let p = 0; p < allPhaseDefs.length - 1; p++) {
    const phaseDefs = allPhaseDefs[p];
    const unlockedCount = phaseDefs.filter(def => def.getValue(stats) >= def.requirement).length;
    const ratio = unlockedCount / phaseDefs.length;
    if (ratio >= PHASE_UNLOCK_THRESHOLD) {
      phases.push((p + 2) as AchievementPhase);
    } else {
      break;
    }
  }

  return phases;
}

/**
 * Get current phase (highest unlocked)
 */
export function getCurrentPhase(stats: UserStats): AchievementPhase {
  const phases = getUnlockedPhases(stats);
  return phases[phases.length - 1];
}

/**
 * Get unlock progress for next phase
 */
export function getNextPhaseProgress(stats: UserStats): { currentPhase: AchievementPhase; progress: number; unlocked: number; total: number; nextPhase: AchievementPhase | null } {
  const phases = getUnlockedPhases(stats);
  const currentPhase = phases[phases.length - 1];
  const currentPhaseDefs = allPhaseDefs[currentPhase - 1];
  const unlocked = currentPhaseDefs.filter(def => def.getValue(stats) >= def.requirement).length;
  const total = currentPhaseDefs.length;
  const progress = Math.round((unlocked / total) * 100);
  const nextPhase = currentPhase < 4 ? ((currentPhase + 1) as AchievementPhase) : null;

  return { currentPhase, progress, unlocked, total, nextPhase };
}

/**
 * Calculate all achievements across all unlocked phases.
 * Completed achievements from previous phases become "legendary".
 */
export function calculateAchievements(stats: UserStats): Achievement[] {
  const unlockedPhases = getUnlockedPhases(stats);

  const results: Achievement[] = [];
  for (const phase of unlockedPhases) {
    const defs = allPhaseDefs[phase - 1];
    for (const def of defs) {
      const currentValue = def.getValue(stats);
      const unlocked = currentValue >= def.requirement;
      const progress = Math.min(100, Math.round((currentValue / def.requirement) * 100));
      const xp = XP_PER_TIER[def.tier];
      results.push({
        id: def.id,
        title: def.title,
        description: def.description,
        icon: def.icon,
        category: def.category,
        tier: def.tier,
        xp,
        requirement: def.requirement,
        unlocked,
        progress,
        currentValue,
        phase: def.phase,
      });
    }
  }
  return results;
}

/**
 * Calculate total XP from ALL unlocked achievements (never resets).
 */
export function calculateTotalXP(stats: UserStats): number {
  // Include all phases the user has ever reached
  const allAchievements: Achievement[] = [];
  for (let p = 0; p < allPhaseDefs.length; p++) {
    for (const def of allPhaseDefs[p]) {
      const currentValue = def.getValue(stats);
      const unlocked = currentValue >= def.requirement;
      if (unlocked) {
        allAchievements.push({
          id: def.id, title: def.title, description: def.description,
          icon: def.icon, category: def.category, tier: def.tier,
          xp: XP_PER_TIER[def.tier], requirement: def.requirement,
          unlocked: true, progress: 100, currentValue, phase: def.phase,
        });
      }
    }
  }
  return allAchievements.reduce((total, a) => total + a.xp, 0);
}

export function getNewlyUnlocked(prevStats: UserStats, newStats: UserStats): Achievement[] {
  const prevAchievements = calculateAchievements(prevStats);
  const newAchievements = calculateAchievements(newStats);
  const prevIds = new Set(prevAchievements.filter(a => a.unlocked).map(a => a.id));
  return newAchievements.filter(a => a.unlocked && !prevIds.has(a.id));
}

/**
 * Get legendary achievements: completed from phases before the current highest.
 */
export function getLegendaryAchievements(stats: UserStats): Achievement[] {
  const currentPhase = getCurrentPhase(stats);
  if (currentPhase <= 1) return [];

  const legendary: Achievement[] = [];
  for (let p = 0; p < currentPhase - 1; p++) {
    for (const def of allPhaseDefs[p]) {
      const currentValue = def.getValue(stats);
      if (currentValue >= def.requirement) {
        legendary.push({
          id: def.id, title: def.title, description: def.description,
          icon: def.icon, category: def.category, tier: def.tier,
          xp: XP_PER_TIER[def.tier], requirement: def.requirement,
          unlocked: true, progress: 100, currentValue,
          phase: def.phase,
        });
      }
    }
  }
  return legendary;
}

// Motivational messages after workout
const motivationalMessages = [
  { emoji: "🔥", text: "Ótimo trabalho! Cada treino conta!" },
  { emoji: "💪", text: "Você está ficando mais forte a cada dia!" },
  { emoji: "🚀", text: "Superação é seu sobrenome!" },
  { emoji: "⚡", text: "Energia pura! Continue assim!" },
  { emoji: "🏆", text: "Campeão! Mais um treino concluído!" },
  { emoji: "🎯", text: "Foco total! Resultados vêm com consistência!" },
  { emoji: "💎", text: "Diamantes são feitos sob pressão. Você brilha!" },
  { emoji: "🌟", text: "Estrela! Seu esforço vai ser recompensado!" },
];

export function getMotivationalMessage(streak: number): { emoji: string; text: string; streakText: string } {
  const msg = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
  const streakText = streak > 1
    ? `Sua sequência agora é de ${streak} dias! 🔥`
    : streak === 1
    ? "Sequência iniciada! Treine amanhã para manter! 🔥"
    : "Comece uma nova sequência treinando amanhã!";
  return { ...msg, streakText };
}

// Diet-specific motivational messages
const dietMotivationalMessages = [
  { emoji: "🍽️", text: "Refeição feita! Seu corpo agradece!" },
  { emoji: "💪", text: "Alimentação é 70% do resultado!" },
  { emoji: "🔥", text: "Cada refeição te aproxima do objetivo!" },
  { emoji: "⚡", text: "Nutrição em dia! Resultados vêm!" },
  { emoji: "🥗", text: "Dieta certa = evolução garantida!" },
];

const dietFailMessages = [
  "Não desista hoje. Um erro não cancela sua evolução.",
  "Amanhã é uma nova oportunidade. Continue firme!",
  "Ninguém é perfeito. O importante é não parar.",
  "Uma refeição não define sua jornada. Siga em frente!",
  "Tropeçar faz parte. Levantar é o que importa.",
];

export function getDietMotivationalMessage(): { emoji: string; text: string } {
  return dietMotivationalMessages[Math.floor(Math.random() * dietMotivationalMessages.length)];
}

export function getDietFailMessage(): string {
  return dietFailMessages[Math.floor(Math.random() * dietFailMessages.length)];
}

export const categoryLabels: Record<string, string> = {
  streak: "Sequência",
  volume: "Volume",
  progression: "Progressão",
  milestone: "Marco",
  diet: "Dieta",
  social: "Social",
};

export const categoryIcons: Record<string, string> = {
  streak: "🔥",
  volume: "🏋️",
  progression: "📈",
  milestone: "🎯",
  diet: "🍽️",
  social: "👥",
};

export const tierLabels: Record<AchievementTier, string> = {
  small: "Pequena",
  medium: "Média",
  large: "Grande",
  extreme: "Extrema",
};
