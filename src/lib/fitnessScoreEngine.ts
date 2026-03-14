// Fitness Score Engine — Etapa 5.11
// Calculates a 0-100 adherence score from real user behavior

export interface FitnessScoreInput {
  // Treino
  workoutsThisWeek: number;
  targetWorkoutsPerWeek: number;
  workoutStreak: number;
  totalWorkouts: number;

  // Dieta
  mealsCompletedThisWeek: number;
  mealsTotalThisWeek: number;
  consecutiveDietFailures: number;

  // Corpo
  hasRecentBodyRecord: boolean; // within last 7 days
  bodyProgressDirection: "improving" | "stable" | "declining" | "unknown";

  // Metas
  activeGoalsCount: number;
  goalsOnTrack: number; // goals with progress >= 50%

  // Social
  challengesCompletedThisWeek: number;
  invitesSent: number;

  // Consistency
  daysActiveThisWeek: number;
  weeksConsecutivelyActive: number;
}

export interface FitnessScoreResult {
  score: number;
  tier: "baixa" | "media" | "alta" | "elite";
  tierLabel: string;
  trend: "subindo" | "estavel" | "caindo";
  message: string;
  breakdown: { label: string; value: number; max: number }[];
  xpMultiplier: number;
}

const STORAGE_KEY = "fitpulse_score_history";

function getScoreHistory(): { date: string; score: number }[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveScoreHistory(history: { date: string; score: number }[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 30)));
}

export function getScoreHistoryData(): { date: string; score: number }[] {
  return getScoreHistory();
}

export function calculateFitnessScore(input: FitnessScoreInput): FitnessScoreResult {
  const breakdown: { label: string; value: number; max: number }[] = [];

  // 1. Workout frequency (max 25)
  const workoutRatio = input.targetWorkoutsPerWeek > 0
    ? Math.min(input.workoutsThisWeek / input.targetWorkoutsPerWeek, 1)
    : 0;
  const workoutScore = Math.round(workoutRatio * 25);
  breakdown.push({ label: "Frequência de treino", value: workoutScore, max: 25 });

  // 2. Diet adherence (max 20)
  const dietRatio = input.mealsTotalThisWeek > 0
    ? Math.min(input.mealsCompletedThisWeek / input.mealsTotalThisWeek, 1)
    : 0;
  let dietScore = Math.round(dietRatio * 20);
  // Penalty for consecutive failures
  if (input.consecutiveDietFailures > 2) dietScore = Math.max(0, dietScore - input.consecutiveDietFailures * 2);
  breakdown.push({ label: "Aderência à dieta", value: dietScore, max: 20 });

  // 3. Streak & consistency (max 20)
  const streakPts = Math.min(input.workoutStreak, 14) / 14 * 10;
  const weeklyConsistency = Math.min(input.weeksConsecutivelyActive, 8) / 8 * 10;
  const consistencyScore = Math.round(streakPts + weeklyConsistency);
  breakdown.push({ label: "Consistência", value: consistencyScore, max: 20 });

  // 4. Body tracking (max 10)
  let bodyScore = 0;
  if (input.hasRecentBodyRecord) bodyScore += 4;
  if (input.bodyProgressDirection === "improving") bodyScore += 6;
  else if (input.bodyProgressDirection === "stable") bodyScore += 4;
  else if (input.bodyProgressDirection === "declining") bodyScore += 2;
  breakdown.push({ label: "Acompanhamento corporal", value: bodyScore, max: 10 });

  // 5. Goals (max 15)
  let goalScore = 0;
  if (input.activeGoalsCount > 0) {
    goalScore += 5; // has active goals
    const onTrackRatio = input.goalsOnTrack / input.activeGoalsCount;
    goalScore += Math.round(onTrackRatio * 10);
  }
  breakdown.push({ label: "Metas", value: goalScore, max: 15 });

  // 6. Social & challenges (max 10)
  let socialScore = 0;
  socialScore += Math.min(input.challengesCompletedThisWeek * 3, 6);
  socialScore += Math.min(input.invitesSent * 2, 4);
  breakdown.push({ label: "Social & desafios", value: socialScore, max: 10 });

  // Total
  const rawScore = workoutScore + dietScore + consistencyScore + bodyScore + goalScore + socialScore;
  const score = Math.min(100, Math.max(0, rawScore));

  // Tier
  const tier: FitnessScoreResult["tier"] =
    score >= 86 ? "elite" : score >= 61 ? "alta" : score >= 31 ? "media" : "baixa";

  const tierLabels = { baixa: "Aderência Baixa", media: "Aderência Média", alta: "Aderência Alta", elite: "Aderência Elite" };

  // Trend
  const history = getScoreHistory();
  const today = new Date().toISOString().slice(0, 10);
  let trend: FitnessScoreResult["trend"] = "estavel";

  if (history.length >= 2) {
    const recent = history.slice(0, 3);
    const avg = recent.reduce((a, h) => a + h.score, 0) / recent.length;
    if (score > avg + 3) trend = "subindo";
    else if (score < avg - 3) trend = "caindo";
  }

  // Save to history (once per day)
  if (!history.length || history[0].date !== today) {
    saveScoreHistory([{ date: today, score }, ...history]);
  } else {
    // Update today's entry
    history[0].score = score;
    saveScoreHistory(history);
  }

  // Message
  const messages: Record<string, string> = {
    elite: "Disciplina de elite! Você é referência de consistência 🏆",
    alta: "Você está consistente. Continue assim e os resultados virão 💪",
    media: "Bom progresso, mas há espaço para melhorar. Foco na constância!",
    baixa: "Hora de retomar o foco. Pequenas ações diárias fazem toda a diferença 🔄",
  };

  // XP multiplier based on score
  const xpMultiplier = score >= 86 ? 1.3 : score >= 61 ? 1.15 : score >= 31 ? 1.0 : 0.85;

  return {
    score,
    tier,
    tierLabel: tierLabels[tier],
    trend,
    message: messages[tier],
    breakdown,
    xpMultiplier,
  };
}
