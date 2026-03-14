// Anti-Fake System — Smart validation for workouts and diet
// Prevents false progress while keeping UX positive

// ─── CONSTANTS ───
export const MIN_WORKOUT_SECONDS = 480; // 8 minutes minimum
export const MIN_REST_STARTS_PCT = 0.6; // 60% of rests must be started
export const MIN_SERIES_COMPLETED_PCT = 0.7; // 70% of series must be completed
export const XP_THROTTLE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
export const XP_THROTTLE_MAX_ACHIEVEMENTS = 3; // Max achievements in window
export const XP_THROTTLE_PENALTY = 0.5; // 50% XP reduction
export const MIN_MEALS_FOR_STREAK = 3; // Minimum meals marked for diet streak

// ─── STORAGE KEYS ───
const HONESTY_MODE_KEY = "fitpulse_honesty_mode";
const VALIDATION_LOG_KEY = "fitpulse_validation_log";
const XP_TIMESTAMPS_KEY = "fitpulse_xp_timestamps";
const DAILY_VALIDATED_KEY = "fitpulse_daily_validated";

// ─── TYPES ───
export type WorkoutValidation = {
  isValid: boolean;
  reasons: string[];
  totalSeconds: number;
  restStartsPct: number;
  seriesCompletedPct: number;
  isExtra: boolean; // Already validated one today
};

export type ValidationLogEntry = {
  date: string;
  timestamp: string;
  type: "treino_validado" | "treino_nao_validado" | "treino_extra" | "dieta_validada" | "streak_real" | "xp_throttled";
  details: string;
};

// ─── HONESTY MODE ───
export function getHonestyMode(): boolean {
  try {
    const val = localStorage.getItem(HONESTY_MODE_KEY);
    if (val === null) return true; // Default: enabled
    return JSON.parse(val);
  } catch {
    return true;
  }
}

export function setHonestyMode(enabled: boolean): void {
  localStorage.setItem(HONESTY_MODE_KEY, JSON.stringify(enabled));
  logValidation({
    type: enabled ? "treino_validado" : "treino_nao_validado",
    details: enabled ? "Modo Honesto ativado" : "Modo Honesto desativado — ranking não contabiliza",
  });
}

// ─── DAILY VALIDATED WORKOUT ───
function getTodayKey(): string {
  return new Date().toISOString().split("T")[0];
}

export function hasValidatedWorkoutToday(): boolean {
  try {
    const data = localStorage.getItem(DAILY_VALIDATED_KEY);
    if (!data) return false;
    const parsed = JSON.parse(data);
    return parsed.date === getTodayKey() && parsed.validated === true;
  } catch {
    return false;
  }
}

export function markWorkoutValidatedToday(): void {
  localStorage.setItem(DAILY_VALIDATED_KEY, JSON.stringify({
    date: getTodayKey(),
    validated: true,
  }));
}

// ─── WORKOUT VALIDATION ───
export function validateWorkout(params: {
  totalSeconds: number;
  totalRestsStarted: number;
  totalRestsPossible: number;
  seriesCompleted: number;
  totalSeriesTarget: number;
}): WorkoutValidation {
  const reasons: string[] = [];
  const isExtra = hasValidatedWorkoutToday();

  // Check minimum time (8 minutes)
  if (params.totalSeconds < MIN_WORKOUT_SECONDS) {
    reasons.push(`Tempo mínimo: ${Math.ceil(MIN_WORKOUT_SECONDS / 60)} minutos (atual: ${Math.floor(params.totalSeconds / 60)}min)`);
  }

  // Check rest starts (60%)
  const restPct = params.totalRestsPossible > 0
    ? params.totalRestsStarted / params.totalRestsPossible
    : 1;
  if (restPct < MIN_REST_STARTS_PCT && params.totalRestsPossible > 0) {
    reasons.push(`Descansos iniciados: ${Math.round(restPct * 100)}% (mínimo ${Math.round(MIN_REST_STARTS_PCT * 100)}%)`);
  }

  // Check series completed (70%)
  const seriesPct = params.totalSeriesTarget > 0
    ? params.seriesCompleted / params.totalSeriesTarget
    : 0;
  if (seriesPct < MIN_SERIES_COMPLETED_PCT) {
    reasons.push(`Séries concluídas: ${Math.round(seriesPct * 100)}% (mínimo ${Math.round(MIN_SERIES_COMPLETED_PCT * 100)}%)`);
  }

  const isValid = reasons.length === 0 && !isExtra;

  return {
    isValid,
    reasons,
    totalSeconds: params.totalSeconds,
    restStartsPct: Math.round(restPct * 100),
    seriesCompletedPct: Math.round(seriesPct * 100),
    isExtra,
  };
}

// ─── XP THROTTLE ───
function getXPTimestamps(): number[] {
  try {
    const raw = localStorage.getItem(XP_TIMESTAMPS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveXPTimestamps(timestamps: number[]): void {
  localStorage.setItem(XP_TIMESTAMPS_KEY, JSON.stringify(timestamps));
}

/**
 * Check if XP should be throttled (too many achievements in a short window).
 * Returns the multiplier (1.0 = normal, 0.5 = throttled).
 */
export function checkXPThrottle(): { multiplier: number; isThrottled: boolean } {
  const now = Date.now();
  const timestamps = getXPTimestamps().filter(t => now - t < XP_THROTTLE_WINDOW_MS);

  if (timestamps.length >= XP_THROTTLE_MAX_ACHIEVEMENTS) {
    return { multiplier: XP_THROTTLE_PENALTY, isThrottled: true };
  }
  return { multiplier: 1.0, isThrottled: false };
}

/**
 * Record an achievement unlock timestamp for throttle tracking.
 */
export function recordAchievementUnlock(): void {
  const now = Date.now();
  const timestamps = getXPTimestamps().filter(t => now - t < XP_THROTTLE_WINDOW_MS);
  timestamps.push(now);
  saveXPTimestamps(timestamps);
}

// ─── STREAK VALIDATION ───
/**
 * Check if today qualifies for a real streak increment.
 * Requires: validated workout OR 3+ meals marked.
 */
export function isStreakDayValid(hasValidatedWorkout: boolean, mealsMarkedToday: number): boolean {
  return hasValidatedWorkout || mealsMarkedToday >= MIN_MEALS_FOR_STREAK;
}

// ─── DIET VALIDATION ───
/**
 * For a meal to count, user must have explicitly opened and marked it (done/failed).
 * Unmarked meals don't count for streak or achievements.
 */
export function validateDietDay(mealsMarked: number, mealsTotal: number): {
  isValid: boolean;
  markedPct: number;
} {
  const markedPct = mealsTotal > 0 ? Math.round((mealsMarked / mealsTotal) * 100) : 0;
  return {
    isValid: mealsMarked >= MIN_MEALS_FOR_STREAK,
    markedPct,
  };
}

// ─── VALIDATION LOG ───
function getValidationLog(): ValidationLogEntry[] {
  try {
    const raw = localStorage.getItem(VALIDATION_LOG_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveValidationLog(log: ValidationLogEntry[]): void {
  // Keep last 100 entries
  const trimmed = log.slice(-100);
  localStorage.setItem(VALIDATION_LOG_KEY, JSON.stringify(trimmed));
}

export function logValidation(entry: Omit<ValidationLogEntry, "date" | "timestamp">): void {
  const log = getValidationLog();
  log.push({
    ...entry,
    date: getTodayKey(),
    timestamp: new Date().toISOString(),
  });
  saveValidationLog(log);
}

export function getValidationHistory(): ValidationLogEntry[] {
  return getValidationLog();
}

/**
 * Get validation stats summary
 */
export function getValidationStats(): {
  totalValidated: number;
  totalNotValidated: number;
  totalExtra: number;
  totalDietValidated: number;
  totalStreakReal: number;
  totalXPThrottled: number;
} {
  const log = getValidationLog();
  return {
    totalValidated: log.filter(e => e.type === "treino_validado").length,
    totalNotValidated: log.filter(e => e.type === "treino_nao_validado").length,
    totalExtra: log.filter(e => e.type === "treino_extra").length,
    totalDietValidated: log.filter(e => e.type === "dieta_validada").length,
    totalStreakReal: log.filter(e => e.type === "streak_real").length,
    totalXPThrottled: log.filter(e => e.type === "xp_throttled").length,
  };
}
