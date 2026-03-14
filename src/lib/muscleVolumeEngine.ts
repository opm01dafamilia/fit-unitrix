/**
 * Muscle Volume Engine — Etapa 5.9
 * Tracks and optimizes weekly training volume per muscle group.
 * Professional-level volume prescription based on user level, goal and recovery.
 */

import { loadAllPerformances, type ExercisePerformance } from "./smartProgressionEngine";

// ===== TYPES =====

export type MuscleGroup =
  | "peitoral" | "costas" | "ombros" | "biceps" | "triceps"
  | "quadriceps" | "posterior" | "gluteos" | "panturrilha" | "abdomen";

export const ALL_MUSCLE_GROUPS: MuscleGroup[] = [
  "peitoral", "costas", "ombros", "biceps", "triceps",
  "quadriceps", "posterior", "gluteos", "panturrilha", "abdomen",
];

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  peitoral: "Peitoral",
  costas: "Costas",
  ombros: "Ombros",
  biceps: "Bíceps",
  triceps: "Tríceps",
  quadriceps: "Quadríceps",
  posterior: "Posterior",
  gluteos: "Glúteos",
  panturrilha: "Panturrilha",
  abdomen: "Abdômen",
};

export const MUSCLE_GROUP_EMOJIS: Record<MuscleGroup, string> = {
  peitoral: "🫁",
  costas: "🔙",
  ombros: "💪",
  biceps: "💪",
  triceps: "🦾",
  quadriceps: "🦵",
  posterior: "🦵",
  gluteos: "🍑",
  panturrilha: "🦶",
  abdomen: "🧱",
};

export type VolumeStatus = "ideal" | "baixo" | "alto" | "excessivo";

export type MuscleVolumeData = {
  group: MuscleGroup;
  label: string;
  emoji: string;
  weeklySets: number;
  minSets: number;
  maxSets: number;
  status: VolumeStatus;
  statusEmoji: string;
  statusLabel: string;
  avgIntensity: number; // 1-3
  frequency: number; // times per week
  fatigueScore: number; // 0-100
  suggestion: string;
};

export type WeeklyVolumeReport = {
  groups: MuscleVolumeData[];
  totalSets: number;
  balanceScore: number; // 0-100
  alerts: VolumeAlert[];
  overallStatus: VolumeStatus;
};

export type VolumeAlert = {
  group: MuscleGroup;
  type: "excess" | "deficit" | "imbalance";
  message: string;
  emoji: string;
};

// ===== VOLUME RANGES =====

type VolumeRange = { min: number; max: number };

const BASE_RANGES: Record<string, Record<MuscleGroup, VolumeRange>> = {
  iniciante: {
    peitoral: { min: 8, max: 12 },
    costas: { min: 8, max: 12 },
    ombros: { min: 6, max: 10 },
    biceps: { min: 6, max: 10 },
    triceps: { min: 6, max: 10 },
    quadriceps: { min: 8, max: 12 },
    posterior: { min: 6, max: 10 },
    gluteos: { min: 6, max: 10 },
    panturrilha: { min: 6, max: 8 },
    abdomen: { min: 6, max: 10 },
  },
  intermediario: {
    peitoral: { min: 10, max: 16 },
    costas: { min: 10, max: 16 },
    ombros: { min: 8, max: 14 },
    biceps: { min: 8, max: 12 },
    triceps: { min: 8, max: 12 },
    quadriceps: { min: 10, max: 16 },
    posterior: { min: 8, max: 14 },
    gluteos: { min: 8, max: 14 },
    panturrilha: { min: 6, max: 10 },
    abdomen: { min: 8, max: 12 },
  },
  avancado: {
    peitoral: { min: 12, max: 20 },
    costas: { min: 14, max: 22 },
    ombros: { min: 10, max: 18 },
    biceps: { min: 10, max: 16 },
    triceps: { min: 10, max: 16 },
    quadriceps: { min: 12, max: 20 },
    posterior: { min: 10, max: 18 },
    gluteos: { min: 10, max: 18 },
    panturrilha: { min: 8, max: 14 },
    abdomen: { min: 10, max: 16 },
  },
};

// ===== OBJECTIVE MODIFIERS =====

function applyObjectiveModifier(range: VolumeRange, objective: string): VolumeRange {
  if (objective === "hipertrofia") {
    return { min: Math.round(range.min * 1.1), max: Math.round(range.max * 1.15) };
  }
  if (objective === "emagrecimento") {
    return { min: Math.round(range.min * 0.85), max: Math.round(range.max * 0.9) };
  }
  if (objective === "condicionamento") {
    return { min: Math.round(range.min * 0.9), max: Math.round(range.max * 0.95) };
  }
  return range;
}

// ===== BODY FOCUS MODIFIER =====

function applyFocusModifier(range: VolumeRange, group: MuscleGroup, bodyFocus: string): VolumeRange {
  const upperGroups: MuscleGroup[] = ["peitoral", "costas", "ombros", "biceps", "triceps"];
  const lowerGroups: MuscleGroup[] = ["quadriceps", "posterior", "gluteos", "panturrilha"];

  if (bodyFocus === "superior" && upperGroups.includes(group)) {
    return { min: Math.round(range.min * 1.15), max: Math.round(range.max * 1.1) };
  }
  if (bodyFocus === "superior" && lowerGroups.includes(group)) {
    return { min: Math.round(range.min * 0.85), max: range.max };
  }
  if (bodyFocus === "inferior" && lowerGroups.includes(group)) {
    return { min: Math.round(range.min * 1.15), max: Math.round(range.max * 1.1) };
  }
  if (bodyFocus === "inferior" && upperGroups.includes(group)) {
    return { min: Math.round(range.min * 0.85), max: range.max };
  }
  return range;
}

// ===== MAP EXERCISE GROUPS TO MUSCLE GROUPS =====

const GROUP_MAPPING: Record<string, MuscleGroup[]> = {
  peito: ["peitoral", "triceps"],
  costas: ["costas", "biceps"],
  pernas: ["quadriceps", "posterior", "gluteos", "panturrilha"],
  ombros: ["ombros"],
  biceps: ["biceps"],
  triceps: ["triceps"],
  abdomen: ["abdomen"],
  "corpo completo": ["peitoral", "costas", "quadriceps", "ombros", "abdomen"],
  hiit: ["quadriceps", "gluteos", "abdomen"],
  cardio: [],
  geral: ["peitoral", "costas", "quadriceps"],
};

function mapToMuscleGroups(exerciseGroup: string): MuscleGroup[] {
  const lower = exerciseGroup.toLowerCase();
  for (const [key, groups] of Object.entries(GROUP_MAPPING)) {
    if (lower.includes(key)) return groups;
  }
  return ["peitoral"]; // fallback
}

// ===== CHECK RECOVERY/PERIODIZATION STATE =====

function isInRecoveryMode(): boolean {
  try {
    const raw = localStorage.getItem("fitpulse_periodization");
    if (!raw) return false;
    const data = JSON.parse(raw);
    return data.currentPhase === "recuperacao";
  } catch { return false; }
}

function isInComebackMode(): boolean {
  try {
    const raw = localStorage.getItem("fitpulse_comeback");
    if (!raw) return false;
    const data = JSON.parse(raw);
    return data.isInComebackMode === true;
  } catch { return false; }
}

// ===== MAIN CALCULATION =====

export function calculateWeeklyVolume(
  level: string,
  objective: string,
  bodyFocus: string,
  weeklyPerformances?: ExercisePerformance[]
): WeeklyVolumeReport {
  const perfs = weeklyPerformances || getThisWeekPerformances();
  const ranges = BASE_RANGES[level] || BASE_RANGES.intermediario;
  const inRecovery = isInRecoveryMode();
  const inComeback = isInComebackMode();

  const groupData: Map<MuscleGroup, { sets: number; intensitySum: number; count: number; days: Set<string> }> = new Map();

  // Initialize all groups
  ALL_MUSCLE_GROUPS.forEach(g => groupData.set(g, { sets: 0, intensitySum: 0, count: 0, days: new Set() }));

  // Aggregate performances
  perfs.forEach(p => {
    const muscles = mapToMuscleGroups(p.muscle_group);
    const rpeValue = p.rpe === "leve" ? 1 : p.rpe === "moderado" ? 2 : 3;
    muscles.forEach(m => {
      const data = groupData.get(m)!;
      data.sets += p.sets_completed;
      data.intensitySum += rpeValue;
      data.count++;
      data.days.add(p.date);
    });
  });

  const results: MuscleVolumeData[] = [];
  const alerts: VolumeAlert[] = [];
  let totalSets = 0;

  ALL_MUSCLE_GROUPS.forEach(group => {
    let range = { ...ranges[group] };
    range = applyObjectiveModifier(range, objective);
    range = applyFocusModifier(range, group, bodyFocus);

    // Recovery/comeback reduces ranges
    if (inRecovery) {
      range = { min: Math.round(range.min * 0.6), max: Math.round(range.max * 0.7) };
    } else if (inComeback) {
      range = { min: Math.round(range.min * 0.8), max: Math.round(range.max * 0.85) };
    }

    const data = groupData.get(group)!;
    const weeklySets = data.sets;
    const avgIntensity = data.count > 0 ? Math.round((data.intensitySum / data.count) * 10) / 10 : 0;
    const frequency = data.days.size;
    totalSets += weeklySets;

    // Fatigue score: combination of volume ratio + intensity
    const volumeRatio = range.max > 0 ? weeklySets / range.max : 0;
    const fatigueScore = Math.min(100, Math.round(volumeRatio * 60 + avgIntensity * 13));

    // Status
    let status: VolumeStatus;
    let statusEmoji: string;
    let statusLabel: string;
    let suggestion: string;

    if (weeklySets === 0) {
      status = "baixo";
      statusEmoji = "⚪";
      statusLabel = "Sem treino";
      suggestion = `Inclua ${range.min}–${range.max} séries para estimular ${MUSCLE_GROUP_LABELS[group]}`;
    } else if (weeklySets < range.min) {
      status = "baixo";
      statusEmoji = "🟡";
      statusLabel = "Volume baixo";
      suggestion = `Adicione mais ${range.min - weeklySets} séries para atingir o mínimo recomendado`;
      alerts.push({ group, type: "deficit", message: `${MUSCLE_GROUP_LABELS[group]}: volume abaixo do ideal (${weeklySets}/${range.min} séries)`, emoji: "🟡" });
    } else if (weeklySets <= range.max) {
      status = "ideal";
      statusEmoji = "🟢";
      statusLabel = "Ideal";
      suggestion = "Volume adequado — mantenha essa frequência";
    } else if (weeklySets <= range.max * 1.2) {
      status = "alto";
      statusEmoji = "🟠";
      statusLabel = "Volume alto";
      suggestion = `Considere reduzir ${weeklySets - range.max} séries para evitar fadiga excessiva`;
      alerts.push({ group, type: "excess", message: `${MUSCLE_GROUP_LABELS[group]}: volume acima do ideal (${weeklySets}/${range.max} séries)`, emoji: "🟠" });
    } else {
      status = "excessivo";
      statusEmoji = "🔴";
      statusLabel = "Excesso!";
      suggestion = `Reduza ${weeklySets - range.max} séries — risco de overtraining para ${MUSCLE_GROUP_LABELS[group]}`;
      alerts.push({ group, type: "excess", message: `${MUSCLE_GROUP_LABELS[group]}: excesso de volume! (${weeklySets}/${range.max} séries)`, emoji: "🔴" });
    }

    results.push({
      group, label: MUSCLE_GROUP_LABELS[group], emoji: MUSCLE_GROUP_EMOJIS[group],
      weeklySets, minSets: range.min, maxSets: range.max,
      status, statusEmoji, statusLabel,
      avgIntensity, frequency, fatigueScore, suggestion,
    });
  });

  // Check for imbalances (upper vs lower)
  const upperSets = results.filter(r => ["peitoral", "costas", "ombros"].includes(r.group)).reduce((a, r) => a + r.weeklySets, 0);
  const lowerSets = results.filter(r => ["quadriceps", "posterior", "gluteos"].includes(r.group)).reduce((a, r) => a + r.weeklySets, 0);
  if (upperSets > 0 && lowerSets > 0) {
    const ratio = upperSets / lowerSets;
    if (ratio > 2) {
      alerts.push({ group: "costas" as MuscleGroup, type: "imbalance", message: "Desequilíbrio: volume superior muito maior que inferior", emoji: "⚖️" });
    } else if (ratio < 0.5) {
      alerts.push({ group: "quadriceps" as MuscleGroup, type: "imbalance", message: "Desequilíbrio: volume inferior muito maior que superior", emoji: "⚖️" });
    }
  }

  // Balance score
  const idealCount = results.filter(r => r.status === "ideal").length;
  const balanceScore = Math.round((idealCount / ALL_MUSCLE_GROUPS.length) * 100);

  // Overall status
  const excessCount = results.filter(r => r.status === "excessivo").length;
  const highCount = results.filter(r => r.status === "alto").length;
  const lowCount = results.filter(r => r.status === "baixo" && r.weeklySets > 0).length;
  let overallStatus: VolumeStatus = "ideal";
  if (excessCount > 0) overallStatus = "excessivo";
  else if (highCount > 2) overallStatus = "alto";
  else if (lowCount > 3) overallStatus = "baixo";

  return { groups: results, totalSets, balanceScore, alerts, overallStatus };
}

// ===== VOLUME ADJUSTMENT SUGGESTIONS =====

export type VolumeAdjustment = {
  group: MuscleGroup;
  action: "increase" | "decrease" | "maintain";
  deltaSets: number;
  reason: string;
};

export function getVolumeAdjustments(report: WeeklyVolumeReport): VolumeAdjustment[] {
  const inRecovery = isInRecoveryMode();
  const adjustments: VolumeAdjustment[] = [];

  report.groups.forEach(g => {
    if (inRecovery) {
      if (g.weeklySets > g.maxSets) {
        adjustments.push({ group: g.group, action: "decrease", deltaSets: g.weeklySets - g.maxSets, reason: "Ciclo de recuperação — reduzir volume" });
      }
      return;
    }

    if (g.status === "baixo" && g.weeklySets > 0) {
      const delta = Math.min(2, g.minSets - g.weeklySets);
      adjustments.push({ group: g.group, action: "increase", deltaSets: delta, reason: `Adicionar ${delta} séries para atingir estímulo mínimo` });
    } else if (g.status === "excessivo") {
      const delta = g.weeklySets - g.maxSets;
      adjustments.push({ group: g.group, action: "decrease", deltaSets: delta, reason: `Reduzir ${delta} séries para evitar overtraining` });
    } else if (g.status === "alto") {
      adjustments.push({ group: g.group, action: "decrease", deltaSets: 1, reason: "Reduzir levemente para manter zona ideal" });
    } else if (g.status === "ideal" && g.avgIntensity <= 1.5 && g.fatigueScore < 40) {
      adjustments.push({ group: g.group, action: "increase", deltaSets: 1, reason: "Respondendo bem — aumento gradual recomendado" });
    }
  });

  return adjustments;
}

// ===== HELPERS =====

function getThisWeekPerformances(): ExercisePerformance[] {
  const all = loadAllPerformances();
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startStr = startOfWeek.toISOString().slice(0, 10);
  return all.filter(p => p.date >= startStr);
}
