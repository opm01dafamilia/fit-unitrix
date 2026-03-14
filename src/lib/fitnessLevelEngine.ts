/**
 * Fitness Level Engine - Visual evolution system based on XP.
 * Provides levels, aura colors, status titles, and level-up detection.
 */

export type FitnessLevel = {
  level: number;
  title: string;
  minXP: number;
  auraColor: string;       // HSL for CSS glow
  auraGradient: string;    // Gradient for ring/border
  auraBorderClass: string; // Tailwind border color
  auraGlowClass: string;   // Tailwind shadow glow
};

export const FITNESS_LEVELS: FitnessLevel[] = [
  {
    level: 1, title: "Iniciante", minXP: 0,
    auraColor: "220 10% 50%",
    auraGradient: "linear-gradient(135deg, hsl(220 10% 40%), hsl(220 10% 55%))",
    auraBorderClass: "border-muted-foreground/30",
    auraGlowClass: "shadow-[0_0_20px_-4px_hsl(220_10%_50%_/_0.3)]",
  },
  {
    level: 2, title: "Consistente", minXP: 50,
    auraColor: "210 80% 55%",
    auraGradient: "linear-gradient(135deg, hsl(210 80% 45%), hsl(220 85% 60%))",
    auraBorderClass: "border-blue-400/40",
    auraGlowClass: "shadow-[0_0_24px_-4px_hsl(210_80%_55%_/_0.35)]",
  },
  {
    level: 3, title: "Evoluindo", minXP: 120,
    auraColor: "152 69% 46%",
    auraGradient: "linear-gradient(135deg, hsl(152 69% 38%), hsl(168 80% 42%))",
    auraBorderClass: "border-primary/40",
    auraGlowClass: "shadow-[0_0_28px_-4px_hsl(152_69%_46%_/_0.4)]",
  },
  {
    level: 4, title: "Focado", minXP: 250,
    auraColor: "45 95% 55%",
    auraGradient: "linear-gradient(135deg, hsl(40 95% 48%), hsl(50 90% 55%))",
    auraBorderClass: "border-yellow-400/40",
    auraGlowClass: "shadow-[0_0_28px_-4px_hsl(45_95%_55%_/_0.35)]",
  },
  {
    level: 5, title: "Determinado", minXP: 450,
    auraColor: "25 90% 55%",
    auraGradient: "linear-gradient(135deg, hsl(20 90% 48%), hsl(30 85% 55%))",
    auraBorderClass: "border-orange-400/40",
    auraGlowClass: "shadow-[0_0_30px_-4px_hsl(25_90%_55%_/_0.4)]",
  },
  {
    level: 6, title: "Avançado", minXP: 700,
    auraColor: "0 75% 55%",
    auraGradient: "linear-gradient(135deg, hsl(355 75% 48%), hsl(5 80% 55%))",
    auraBorderClass: "border-red-400/40",
    auraGlowClass: "shadow-[0_0_32px_-4px_hsl(0_75%_55%_/_0.4)]",
  },
  {
    level: 7, title: "Dominante", minXP: 1200,
    auraColor: "280 70% 55%",
    auraGradient: "linear-gradient(135deg, hsl(270 70% 48%), hsl(290 75% 55%))",
    auraBorderClass: "border-purple-400/40",
    auraGlowClass: "shadow-[0_0_34px_-4px_hsl(280_70%_55%_/_0.4)]",
  },
  {
    level: 8, title: "Elite Fitness", minXP: 2000,
    auraColor: "42 90% 58%",
    auraGradient: "linear-gradient(135deg, hsl(38 85% 50%), hsl(48 95% 60%))",
    auraBorderClass: "border-yellow-300/50",
    auraGlowClass: "shadow-[0_0_40px_-4px_hsl(42_90%_58%_/_0.5)]",
  },
];

/** Get the user's fitness level based on XP */
export function getFitnessLevel(totalXP: number): FitnessLevel {
  for (let i = FITNESS_LEVELS.length - 1; i >= 0; i--) {
    if (totalXP >= FITNESS_LEVELS[i].minXP) return FITNESS_LEVELS[i];
  }
  return FITNESS_LEVELS[0];
}

/** Get next level info */
export function getNextLevel(totalXP: number): { next: FitnessLevel; xpNeeded: number; progress: number } | null {
  const current = getFitnessLevel(totalXP);
  const nextIdx = FITNESS_LEVELS.findIndex(l => l.level === current.level + 1);
  if (nextIdx < 0) return null;
  const next = FITNESS_LEVELS[nextIdx];
  const xpNeeded = next.minXP - totalXP;
  const range = next.minXP - current.minXP;
  const progress = Math.min(100, Math.round(((totalXP - current.minXP) / range) * 100));
  return { next, xpNeeded, progress };
}

/** Detect if the user just leveled up (compare previous XP) */
const LEVEL_CACHE_KEY = "fitpulse_last_level";

export function checkLevelUp(totalXP: number): FitnessLevel | null {
  try {
    const stored = localStorage.getItem(LEVEL_CACHE_KEY);
    const currentLevel = getFitnessLevel(totalXP);
    const previousLevel = stored ? parseInt(stored) : 0;
    
    localStorage.setItem(LEVEL_CACHE_KEY, String(currentLevel.level));
    
    if (previousLevel > 0 && currentLevel.level > previousLevel) {
      return currentLevel;
    }
    return null;
  } catch {
    return null;
  }
}

/** Get a dynamic status title based on user behavior */
export function getStatusTitle(params: {
  streak: number;
  totalWorkouts: number;
  goalsCompleted: number;
  totalXP: number;
  dietStreak: number;
}): { title: string; emoji: string } {
  const { streak, totalWorkouts, goalsCompleted, totalXP, dietStreak } = params;

  if (totalXP >= 2000 && streak >= 14) return { title: "Elite Fitness", emoji: "👑" };
  if (streak >= 30) return { title: "Consistência Lendária", emoji: "🏛️" };
  if (goalsCompleted >= 10) return { title: "Destruidor de Metas", emoji: "💥" };
  if (totalWorkouts >= 200) return { title: "Máquina de Resultados", emoji: "⚙️" };
  if (streak >= 14 && dietStreak >= 7) return { title: "Disciplina Total", emoji: "⛓️" };
  if (totalXP >= 1000) return { title: "Evolução Constante", emoji: "📈" };
  if (streak >= 7) return { title: "Modo Foco Ativado", emoji: "🎯" };
  if (dietStreak >= 7) return { title: "Nutrição em Dia", emoji: "🥗" };
  if (totalWorkouts >= 50) return { title: "Em Ascensão", emoji: "🚀" };
  if (totalWorkouts >= 10) return { title: "Construindo Base", emoji: "🧱" };
  if (streak >= 3) return { title: "Ganhando Ritmo", emoji: "⚡" };
  return { title: "Começando a Jornada", emoji: "🌱" };
}
