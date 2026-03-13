// Micro-Victories System — psychological engagement engine
// Tracks small daily actions to build motivation and retention

export type MicroVictoryType =
  | "app_opened"
  | "workout_started"
  | "warmup_done"
  | "exercise_completed"
  | "cardio_done"
  | "meal_tracked"
  | "weight_logged"
  | "workout_completed";

export type MicroVictory = {
  type: MicroVictoryType;
  label: string;
  icon: string;
  xp: number;
  timestamp: string;
};

const VICTORY_DEFS: Record<MicroVictoryType, { label: string; icon: string; xp: number }> = {
  app_opened: { label: "Abriu o app hoje", icon: "📱", xp: 1 },
  workout_started: { label: "Iniciou um treino", icon: "🏋️", xp: 2 },
  warmup_done: { label: "Completou o aquecimento", icon: "🔥", xp: 2 },
  exercise_completed: { label: "Completou um exercício", icon: "💪", xp: 3 },
  cardio_done: { label: "Completou cardio", icon: "🏃", xp: 3 },
  meal_tracked: { label: "Marcou refeição", icon: "🍽️", xp: 2 },
  weight_logged: { label: "Registrou peso", icon: "⚖️", xp: 2 },
  workout_completed: { label: "Treino completo!", icon: "🏆", xp: 5 },
};

const STORAGE_KEY = "fitpulse_micro_victories";
const STREAK_KEY = "fitpulse_micro_streak";

type StoredData = {
  date: string;
  victories: MicroVictory[];
};

type StreakData = {
  current: number;
  lastActiveDate: string;
};

function getTodayKey(): string {
  return new Date().toISOString().split("T")[0];
}

function getStoredData(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: getTodayKey(), victories: [] };
    const data = JSON.parse(raw) as StoredData;
    // Reset if different day
    if (data.date !== getTodayKey()) {
      return { date: getTodayKey(), victories: [] };
    }
    return data;
  } catch {
    return { date: getTodayKey(), victories: [] };
  }
}

function saveStoredData(data: StoredData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getStreakData(): StreakData {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return { current: 0, lastActiveDate: "" };
    return JSON.parse(raw) as StreakData;
  } catch {
    return { current: 0, lastActiveDate: "" };
  }
}

function saveStreakData(data: StreakData) {
  localStorage.setItem(STREAK_KEY, JSON.stringify(data));
}

/**
 * Register a micro-victory. Returns the victory if new, null if already registered today.
 * For "exercise_completed" and "meal_tracked", allows multiple per day.
 */
export function registerMicroVictory(type: MicroVictoryType): MicroVictory | null {
  const data = getStoredData();
  const def = VICTORY_DEFS[type];

  // Allow multiples for repeatable types
  const repeatable: MicroVictoryType[] = ["exercise_completed", "meal_tracked"];
  if (!repeatable.includes(type)) {
    const exists = data.victories.find(v => v.type === type);
    if (exists) return null;
  }

  const victory: MicroVictory = {
    type,
    label: def.label,
    icon: def.icon,
    xp: def.xp,
    timestamp: new Date().toISOString(),
  };

  data.victories.push(victory);
  data.date = getTodayKey();
  saveStoredData(data);

  // Update streak
  updateStreak();

  return victory;
}

/**
 * Get all micro-victories for today
 */
export function getTodayVictories(): MicroVictory[] {
  return getStoredData().victories;
}

/**
 * Get daily progress percentage (0-100)
 * Based on unique victory types achieved today
 */
export function getDailyProgress(): { progress: number; completed: number; total: number; isComplete: boolean } {
  const data = getStoredData();
  const uniqueTypes = new Set(data.victories.map(v => v.type));
  // Core daily goals: app_opened, workout or exercise, meal
  const coreGoals: MicroVictoryType[] = [
    "app_opened",
    "workout_started",
    "exercise_completed",
    "meal_tracked",
  ];
  const completed = coreGoals.filter(g => uniqueTypes.has(g)).length;
  const total = coreGoals.length;
  const progress = Math.round((completed / total) * 100);
  return { progress, completed, total, isComplete: progress >= 100 };
}

/**
 * Get total XP earned today from micro-victories
 */
export function getTodayXP(): number {
  return getStoredData().victories.reduce((sum, v) => sum + v.xp, 0);
}

/**
 * Update psychological streak (resets only after 2 days of inactivity)
 */
function updateStreak() {
  const streak = getStreakData();
  const today = getTodayKey();

  if (streak.lastActiveDate === today) return; // Already counted today

  const lastDate = streak.lastActiveDate ? new Date(streak.lastActiveDate) : null;
  const todayDate = new Date(today);

  if (!lastDate) {
    saveStreakData({ current: 1, lastActiveDate: today });
    return;
  }

  const diffMs = todayDate.getTime() - lastDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 2) {
    // Continue or resume streak (tolerant: allows 1 day gap)
    saveStreakData({ current: streak.current + 1, lastActiveDate: today });
  } else {
    // Reset streak after 2+ days gap
    saveStreakData({ current: 1, lastActiveDate: today });
  }
}

/**
 * Get current psychological streak
 */
export function getMicroStreak(): number {
  const streak = getStreakData();
  const today = getTodayKey();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().split("T")[0];
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const twoDaysAgoKey = twoDaysAgo.toISOString().split("T")[0];

  // If last active is today, yesterday, or 2 days ago → streak is valid
  if (
    streak.lastActiveDate === today ||
    streak.lastActiveDate === yesterdayKey ||
    streak.lastActiveDate === twoDaysAgoKey
  ) {
    return streak.current;
  }
  return 0;
}

/**
 * Get daily summary card data
 */
export function getDailySummary(): {
  victories: MicroVictory[];
  uniqueCount: number;
  totalXP: number;
  streak: number;
  progress: ReturnType<typeof getDailyProgress>;
  message: string;
} {
  const victories = getTodayVictories();
  const uniqueTypes = new Set(victories.map(v => v.type));
  const totalXP = victories.reduce((s, v) => s + v.xp, 0);
  const streak = getMicroStreak();
  const progress = getDailyProgress();

  const messages = [
    "Você está no caminho certo! ✨",
    "Cada passo conta na sua evolução! 🌟",
    "Continue assim, você está evoluindo! 💫",
    "Sua dedicação faz a diferença! 🔥",
    "Progresso constante é progresso real! 💪",
  ];

  return {
    victories,
    uniqueCount: uniqueTypes.size,
    totalXP,
    streak,
    progress,
    message: messages[Math.floor(Math.random() * messages.length)],
  };
}

/**
 * Motivational messages for micro-victories (never negative)
 */
const VICTORY_MESSAGES = [
  "Você está no caminho certo.",
  "Mais uma conquista hoje!",
  "Evolução constante! 💫",
  "Cada ação importa.",
  "Seu esforço está valendo!",
];

export function getVictoryMessage(): string {
  return VICTORY_MESSAGES[Math.floor(Math.random() * VICTORY_MESSAGES.length)];
}
