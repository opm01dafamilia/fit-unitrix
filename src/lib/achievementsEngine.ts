// Achievement definitions and unlock logic

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "streak" | "volume" | "progression" | "milestone" | "diet" | "social";
  requirement: number; // threshold value
  unlocked: boolean;
  unlockedAt?: string;
  progress: number; // 0-100
  currentValue: number;
};

type AchievementDef = {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "streak" | "volume" | "progression" | "milestone" | "diet";
  requirement: number;
  getValue: (stats: UserStats) => number;
};

export type UserStats = {
  totalWorkouts: number;
  currentStreak: number;
  maxStreak: number;
  totalProgressions: number;
  totalExercisesCompleted: number;
  daysActive: number;
  // Diet stats
  dietStreak: number;
  dietMaxStreak: number;
  dietPerfectDays: number;
  dietWeeklyAdherence: number; // 0-100
  // Body progression stats
  weeksAboveRhythm?: number;
};

const achievementDefs: AchievementDef[] = [
  // Milestone achievements
  {
    id: "first_workout",
    title: "Primeiro Passo",
    description: "Complete seu primeiro treino",
    icon: "🎯",
    category: "milestone",
    requirement: 1,
    getValue: (s) => s.totalWorkouts,
  },
  {
    id: "10_workouts",
    title: "Dedicação",
    description: "Complete 10 treinos",
    icon: "💪",
    category: "milestone",
    requirement: 10,
    getValue: (s) => s.totalWorkouts,
  },
  {
    id: "25_workouts",
    title: "Consistente",
    description: "Complete 25 treinos",
    icon: "🏅",
    category: "milestone",
    requirement: 25,
    getValue: (s) => s.totalWorkouts,
  },
  {
    id: "50_workouts",
    title: "Atleta",
    description: "Complete 50 treinos",
    icon: "🏆",
    category: "milestone",
    requirement: 50,
    getValue: (s) => s.totalWorkouts,
  },
  {
    id: "100_workouts",
    title: "Lenda",
    description: "Complete 100 treinos",
    icon: "👑",
    category: "milestone",
    requirement: 100,
    getValue: (s) => s.totalWorkouts,
  },

  // Streak achievements
  {
    id: "streak_3",
    title: "Fogo Aceso",
    description: "Treine 3 dias seguidos",
    icon: "🔥",
    category: "streak",
    requirement: 3,
    getValue: (s) => s.maxStreak,
  },
  {
    id: "streak_7",
    title: "Semana Perfeita",
    description: "Treine 7 dias seguidos",
    icon: "⚡",
    category: "streak",
    requirement: 7,
    getValue: (s) => s.maxStreak,
  },
  {
    id: "streak_14",
    title: "Imparável",
    description: "Treine 14 dias seguidos",
    icon: "💎",
    category: "streak",
    requirement: 14,
    getValue: (s) => s.maxStreak,
  },
  {
    id: "streak_30",
    title: "Máquina",
    description: "Treine 30 dias seguidos",
    icon: "🌟",
    category: "streak",
    requirement: 30,
    getValue: (s) => s.maxStreak,
  },

  // Progression achievements
  {
    id: "first_progression",
    title: "Evolução",
    description: "Aumente a carga pela primeira vez",
    icon: "📈",
    category: "progression",
    requirement: 1,
    getValue: (s) => s.totalProgressions,
  },
  {
    id: "10_progressions",
    title: "Em Ascensão",
    description: "Aumente a carga em 10 exercícios",
    icon: "🚀",
    category: "progression",
    requirement: 10,
    getValue: (s) => s.totalProgressions,
  },
  {
    id: "25_progressions",
    title: "Superação",
    description: "Aumente a carga em 25 exercícios",
    icon: "⭐",
    category: "progression",
    requirement: 25,
    getValue: (s) => s.totalProgressions,
  },

  // Volume achievements
  {
    id: "50_exercises",
    title: "Aquecendo",
    description: "Complete 50 exercícios no total",
    icon: "🏋️",
    category: "volume",
    requirement: 50,
    getValue: (s) => s.totalExercisesCompleted,
  },
  {
    id: "200_exercises",
    title: "Guerreiro",
    description: "Complete 200 exercícios no total",
    icon: "⚔️",
    category: "volume",
    requirement: 200,
    getValue: (s) => s.totalExercisesCompleted,
  },
  {
    id: "500_exercises",
    title: "Titã",
    description: "Complete 500 exercícios no total",
    icon: "🔱",
    category: "volume",
    requirement: 500,
    getValue: (s) => s.totalExercisesCompleted,
  },

  // Diet achievements
  {
    id: "diet_first_day",
    title: "Dia Perfeito",
    description: "Complete todas as refeições de um dia",
    icon: "🍽️",
    category: "diet",
    requirement: 1,
    getValue: (s) => s.dietPerfectDays,
  },
  {
    id: "diet_streak_3",
    title: "Consistência Alimentar",
    description: "3 dias seguidos com dieta completa",
    icon: "🥗",
    category: "diet",
    requirement: 3,
    getValue: (s) => s.dietMaxStreak,
  },
  {
    id: "diet_streak_7",
    title: "Foco Extremo",
    description: "7 dias seguidos com dieta completa",
    icon: "🔥",
    category: "diet",
    requirement: 7,
    getValue: (s) => s.dietMaxStreak,
  },
  {
    id: "diet_streak_15",
    title: "Máquina da Dieta",
    description: "15 dias seguidos com dieta completa",
    icon: "⚡",
    category: "diet",
    requirement: 15,
    getValue: (s) => s.dietMaxStreak,
  },
  {
    id: "diet_streak_30",
    title: "Transformação",
    description: "30 dias seguidos com dieta completa",
    icon: "🏆",
    category: "diet",
    requirement: 30,
    getValue: (s) => s.dietMaxStreak,
  },
  {
    id: "diet_adherence_90",
    title: "Aderência 90%",
    description: "Atinja 90% de aderência na semana",
    icon: "💯",
    category: "diet",
    requirement: 90,
    getValue: (s) => s.dietWeeklyAdherence,
  },
  // Body progression achievements
  {
    id: "rhythm_above_2w",
    title: "Evolução Acelerada",
    description: "Ritmo acima do esperado por 2 semanas",
    icon: "🚀",
    category: "progression",
    requirement: 2,
    getValue: (s) => s.weeksAboveRhythm || 0,
  },
  {
    id: "rhythm_above_4w",
    title: "Máquina de Resultados",
    description: "Ritmo acima do esperado por 4 semanas",
    icon: "⚡",
    category: "progression",
    requirement: 4,
    getValue: (s) => s.weeksAboveRhythm || 0,
  },
];

export function calculateAchievements(stats: UserStats): Achievement[] {
  return achievementDefs.map((def) => {
    const currentValue = def.getValue(stats);
    const unlocked = currentValue >= def.requirement;
    const progress = Math.min(100, Math.round((currentValue / def.requirement) * 100));

    return {
      id: def.id,
      title: def.title,
      description: def.description,
      icon: def.icon,
      category: def.category,
      requirement: def.requirement,
      unlocked,
      progress,
      currentValue,
    };
  });
}

export function getNewlyUnlocked(
  prevStats: UserStats,
  newStats: UserStats
): Achievement[] {
  const prevAchievements = calculateAchievements(prevStats);
  const newAchievements = calculateAchievements(newStats);

  return newAchievements.filter((a, i) => a.unlocked && !prevAchievements[i].unlocked);
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
};

export const categoryIcons: Record<string, string> = {
  streak: "🔥",
  volume: "🏋️",
  progression: "📈",
  milestone: "🎯",
  diet: "🍽️",
};
