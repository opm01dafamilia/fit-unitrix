// Smart Behavioral Notifications Engine — Etapa 5.10

export type NotificationType = "treino" | "dieta" | "ranking" | "recuperacao" | "meta" | "conquista" | "social";

export interface SmartNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  icon: string;
  priority: "high" | "medium" | "low";
  createdAt: string;
  read: boolean;
  actionRoute?: string;
}

export interface NotificationPreferences {
  enabled: boolean;
  types: Record<NotificationType, boolean>;
  maxPerDay: number;
  soundEnabled: boolean;
}

const DEFAULT_PREFS: NotificationPreferences = {
  enabled: true,
  types: {
    treino: true,
    dieta: true,
    ranking: true,
    recuperacao: true,
    meta: true,
    conquista: true,
    social: true,
  },
  maxPerDay: 3,
  soundEnabled: true,
};

const STORAGE_KEY = "fitpulse_notifications";
const PREFS_KEY = "fitpulse_notif_prefs";
const DAILY_COUNT_KEY = "fitpulse_notif_daily";

// --- Preferences ---
export function getNotificationPreferences(): NotificationPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch { }
  return { ...DEFAULT_PREFS };
}

export function saveNotificationPreferences(prefs: NotificationPreferences) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

// --- Notification Store ---
export function getNotifications(): SmartNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { }
  return [];
}

function saveNotifications(notifs: SmartNotification[]) {
  // Keep max 50
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs.slice(0, 50)));
}

export function markAsRead(id: string) {
  const notifs = getNotifications().map(n => n.id === id ? { ...n, read: true } : n);
  saveNotifications(notifs);
}

export function markAllAsRead() {
  const notifs = getNotifications().map(n => ({ ...n, read: true }));
  saveNotifications(notifs);
}

export function getUnreadCount(): number {
  return getNotifications().filter(n => !n.read).length;
}

function getDailyCount(): number {
  try {
    const raw = localStorage.getItem(DAILY_COUNT_KEY);
    if (raw) {
      const { date, count } = JSON.parse(raw);
      if (date === new Date().toISOString().slice(0, 10)) return count;
    }
  } catch { }
  return 0;
}

function incrementDailyCount() {
  const today = new Date().toISOString().slice(0, 10);
  const current = getDailyCount();
  localStorage.setItem(DAILY_COUNT_KEY, JSON.stringify({ date: today, count: current + 1 }));
}

function canSendNotification(type: NotificationType): boolean {
  const prefs = getNotificationPreferences();
  if (!prefs.enabled) return false;
  if (!prefs.types[type]) return false;
  if (getDailyCount() >= prefs.maxPerDay) return false;
  return true;
}

function addNotification(notif: Omit<SmartNotification, "id" | "createdAt" | "read">): SmartNotification | null {
  if (!canSendNotification(notif.type)) return null;

  // Deduplicate: don't repeat same title today
  const today = new Date().toISOString().slice(0, 10);
  const existing = getNotifications();
  if (existing.some(n => n.title === notif.title && n.createdAt.startsWith(today))) return null;

  const newNotif: SmartNotification = {
    ...notif,
    id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
    createdAt: new Date().toISOString(),
    read: false,
  };

  saveNotifications([newNotif, ...existing]);
  incrementDailyCount();
  return newNotif;
}

// --- Behavioral Analysis & Generation ---

export interface BehavioralContext {
  // Treino
  totalWorkoutsThisWeek: number;
  daysPerWeek: number;
  trainedToday: boolean;
  workoutStreak: number;
  lastWorkoutDate?: string;

  // Dieta
  mealsCompletedToday: number;
  mealsTotalToday: number;
  mealsFailedThisWeek: number;
  dietStreak: number;

  // Ranking
  rankPosition?: number;
  rankChange?: number; // positive = went up, negative = went down

  // Recovery
  fatigueLevel?: "low" | "moderate" | "high" | "extreme";
  currentCycle?: string;

  // Goals
  activeGoals: { title: string; progress: number; target: number }[];

  // Achievements
  nearAchievementName?: string;
  newAchievementUnlocked?: string;

  // Social
  friendCompletedWorkout?: string;
  pendingInvites?: number;
}

export function generateSmartNotifications(ctx: BehavioralContext): SmartNotification[] {
  const generated: SmartNotification[] = [];

  // 1. TREINO NOTIFICATIONS
  if (!ctx.trainedToday && ctx.totalWorkoutsThisWeek < ctx.daysPerWeek) {
    const n = addNotification({
      type: "treino",
      title: "Treino pendente",
      message: ctx.workoutStreak > 3
        ? `Streak de ${ctx.workoutStreak} dias! Não quebre agora 🔥`
        : "Hoje ainda não teve treino. 20 minutos já fazem diferença 💪",
      icon: "🏋️",
      priority: ctx.workoutStreak > 5 ? "high" : "medium",
      actionRoute: "/treino",
    });
    if (n) generated.push(n);
  }

  if (ctx.trainedToday && ctx.workoutStreak > 0 && ctx.workoutStreak % 7 === 0) {
    const n = addNotification({
      type: "treino",
      title: "Streak semanal!",
      message: `${ctx.workoutStreak} dias consecutivos treinando! Você é imparável 🔥`,
      icon: "🔥",
      priority: "high",
    });
    if (n) generated.push(n);
  }

  // 2. DIETA NOTIFICATIONS
  if (ctx.mealsTotalToday > 0 && ctx.mealsCompletedToday === ctx.mealsTotalToday) {
    const n = addNotification({
      type: "dieta",
      title: "Dieta perfeita hoje!",
      message: "Todas as refeições concluídas. Seu resultado está sendo construído ✅",
      icon: "🥗",
      priority: "low",
    });
    if (n) generated.push(n);
  } else if (ctx.mealsFailedThisWeek > 3) {
    const n = addNotification({
      type: "dieta",
      title: "Atenção na dieta",
      message: "Seu corpo responde à constância. Vamos voltar ao plano hoje 🍎",
      icon: "⚠️",
      priority: "medium",
      actionRoute: "/dieta",
    });
    if (n) generated.push(n);
  }

  // 3. RANKING NOTIFICATIONS
  if (ctx.rankChange !== undefined) {
    if (ctx.rankChange < 0) {
      const n = addNotification({
        type: "ranking",
        title: "Posição no ranking",
        message: `Alguém passou você no ranking. Bora recuperar? 📊`,
        icon: "📉",
        priority: "medium",
        actionRoute: "/ranking",
      });
      if (n) generated.push(n);
    } else if (ctx.rankChange > 0) {
      const n = addNotification({
        type: "ranking",
        title: "Subiu no ranking!",
        message: `Você subiu ${ctx.rankChange} posição(ões) no ranking fitness! Continue assim 🏆`,
        icon: "📈",
        priority: "medium",
        actionRoute: "/ranking",
      });
      if (n) generated.push(n);
    }
  }

  // 4. RECUPERAÇÃO NOTIFICATIONS
  if (ctx.fatigueLevel === "high" || ctx.fatigueLevel === "extreme") {
    const n = addNotification({
      type: "recuperacao",
      title: "Dia de recuperação",
      message: "Hoje é dia de recuperação. Seu corpo precisa disso para evoluir 🧘",
      icon: "💆",
      priority: "high",
    });
    if (n) generated.push(n);
  }

  if (ctx.currentCycle === "recuperacao") {
    const n = addNotification({
      type: "recuperacao",
      title: "Ciclo de recuperação",
      message: "Você está em ciclo de recuperação. Respeite o descanso — ele é parte do resultado 🌿",
      icon: "🌿",
      priority: "low",
    });
    if (n) generated.push(n);
  }

  // 5. META NOTIFICATIONS
  for (const goal of ctx.activeGoals) {
    const pct = goal.target > 0 ? (goal.progress / goal.target) * 100 : 0;
    if (pct >= 80 && pct < 100) {
      const n = addNotification({
        type: "meta",
        title: "Meta quase lá!",
        message: `Você está a ${Math.round(100 - pct)}% de bater "${goal.title}". Continue! 🎯`,
        icon: "🎯",
        priority: "high",
        actionRoute: "/metas",
      });
      if (n) generated.push(n);
      break; // Only one goal notification per check
    }
  }

  // 6. CONQUISTA NOTIFICATIONS
  if (ctx.newAchievementUnlocked) {
    const n = addNotification({
      type: "conquista",
      title: "Nova conquista!",
      message: `Desbloqueada: "${ctx.newAchievementUnlocked}" 🏅`,
      icon: "🏅",
      priority: "high",
      actionRoute: "/conquistas",
    });
    if (n) generated.push(n);
  }

  if (ctx.nearAchievementName) {
    const n = addNotification({
      type: "conquista",
      title: "Conquista próxima",
      message: `Você está perto de desbloquear "${ctx.nearAchievementName}" ⭐`,
      icon: "⭐",
      priority: "low",
      actionRoute: "/conquistas",
    });
    if (n) generated.push(n);
  }

  // 7. SOCIAL NOTIFICATIONS
  if (ctx.friendCompletedWorkout) {
    const n = addNotification({
      type: "social",
      title: "Amigo treinou!",
      message: `${ctx.friendCompletedWorkout} completou o treino de hoje 💪`,
      icon: "👥",
      priority: "low",
      actionRoute: "/comunidade",
    });
    if (n) generated.push(n);
  }

  if (ctx.pendingInvites && ctx.pendingInvites > 0) {
    const n = addNotification({
      type: "social",
      title: "Convite fitness",
      message: `Você tem ${ctx.pendingInvites} convite(s) pendente(s) 📩`,
      icon: "📩",
      priority: "medium",
      actionRoute: "/convites",
    });
    if (n) generated.push(n);
  }

  return generated;
}

// Inactivity check — call periodically
export function checkInactivityNotification(lastWorkoutDate?: string): SmartNotification | null {
  if (!lastWorkoutDate) return null;
  const daysSince = Math.floor((Date.now() - new Date(lastWorkoutDate).getTime()) / (1000 * 60 * 60 * 24));

  if (daysSince >= 3 && daysSince < 7) {
    return addNotification({
      type: "treino",
      title: "Sentimos sua falta!",
      message: `Faz ${daysSince} dias sem treinar. Um treino curto já ajuda a manter o ritmo 💪`,
      icon: "😢",
      priority: "high",
      actionRoute: "/treino",
    });
  }

  if (daysSince >= 7) {
    return addNotification({
      type: "treino",
      title: "Hora de voltar!",
      message: "Uma semana sem treino. Que tal recomeçar com algo leve hoje? 🚀",
      icon: "🚀",
      priority: "high",
      actionRoute: "/treino",
    });
  }

  return null;
}
