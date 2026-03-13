// ============================================================
// INTENSITY TECHNIQUES ENGINE
// Drop Set, Bi-Set, Rest Pause, Pyramid
// ============================================================

export type IntensityTechniqueType = "drop_set" | "bi_set" | "rest_pause" | "piramide_crescente" | "piramide_regressiva";

export interface IntensityTechnique {
  type: IntensityTechniqueType;
  label: string;
  emoji: string;
  shortLabel: string;
  description: string;
  tooltip: string;
  /** Instructions shown during workout */
  instructions: string[];
  /** Color classes for badge */
  badgeClass: string;
}

export const TECHNIQUES: Record<IntensityTechniqueType, IntensityTechnique> = {
  drop_set: {
    type: "drop_set",
    label: "Drop Set",
    emoji: "🔥",
    shortLabel: "DROP SET",
    description: "Após a última série, reduza o peso 20-30% e continue até a falha.",
    tooltip: "Técnica que aumenta a intensidade ao reduzir o peso e continuar o exercício até a falha muscular, recrutando mais fibras.",
    instructions: [
      "Complete sua última série normalmente",
      "Reduza o peso em 20-30%",
      "Continue até a falha muscular",
      "Repita mais uma redução se possível",
    ],
    badgeClass: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  },
  bi_set: {
    type: "bi_set",
    label: "Bi-Set",
    emoji: "⚡",
    shortLabel: "BI-SET",
    description: "Execute dois exercícios consecutivos sem descanso entre eles.",
    tooltip: "Combinar dois exercícios do mesmo grupo sem descanso aumenta o tempo sob tensão e estimula hipertrofia.",
    instructions: [
      "Execute o primeiro exercício normalmente",
      "Passe imediatamente para o segundo exercício",
      "Sem descanso entre os dois",
      "Descanse apenas após completar ambos",
    ],
    badgeClass: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  },
  rest_pause: {
    type: "rest_pause",
    label: "Rest Pause",
    emoji: "💀",
    shortLabel: "REST PAUSE",
    description: "Faça a série até quase falhar, descanse 15s, e continue por mais repetições.",
    tooltip: "Técnica avançada que permite mais repetições totais, maximizando o estímulo muscular em menos tempo.",
    instructions: [
      "Execute até quase atingir a falha",
      "Pare e descanse apenas 15 segundos",
      "Continue com mais repetições",
      "Repita o ciclo 1-2 vezes",
    ],
    badgeClass: "text-red-400 bg-red-500/10 border-red-500/20",
  },
  piramide_crescente: {
    type: "piramide_crescente",
    label: "Pirâmide Crescente",
    emoji: "📈",
    shortLabel: "PIRÂMIDE ↑",
    description: "Aumente o peso a cada série, reduzindo as repetições progressivamente.",
    tooltip: "A pirâmide crescente prepara o músculo gradualmente para cargas mais pesadas, reduzindo risco de lesão.",
    instructions: [
      "Série 1: peso leve → mais repetições (ex: 15 reps)",
      "Série 2: peso médio → repetições moderadas (ex: 12 reps)",
      "Série 3: peso pesado → menos repetições (ex: 8 reps)",
      "Série 4 (opcional): peso máximo → 6 reps",
    ],
    badgeClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  piramide_regressiva: {
    type: "piramide_regressiva",
    label: "Pirâmide Regressiva",
    emoji: "📉",
    shortLabel: "PIRÂMIDE ↓",
    description: "Comece com carga pesada e reduza a cada série, aumentando as repetições.",
    tooltip: "Começar pesado maximiza o recrutamento de fibras quando o músculo está fresco, gerando mais força e hipertrofia.",
    instructions: [
      "Série 1: peso pesado → menos repetições (ex: 6 reps)",
      "Série 2: peso médio → repetições moderadas (ex: 10 reps)",
      "Série 3: peso leve → mais repetições (ex: 15 reps)",
    ],
    badgeClass: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  },
};

// ============================================================
// EXERCISE SAFETY — exercises that should NOT get Drop Set or Rest Pause
// ============================================================
const UNSAFE_FOR_DROPSET = [
  "agachamento livre", "levantamento terra", "stiff romeno", "good morning",
  "agachamento frontal", "barra fixa com peso", "desenvolvimento militar",
];

const UNSAFE_FOR_REST_PAUSE = [
  "agachamento livre", "levantamento terra", "stiff romeno", "good morning",
  "agachamento frontal",
];

// ============================================================
// BI-SET PAIRS — predefined exercise combinations
// ============================================================
const BI_SET_PAIRS: Record<string, string[]> = {
  // Peito
  "supino reto": ["crucifixo", "cross over", "crucifixo máquina"],
  "supino inclinado halteres": ["crucifixo inclinado", "cross over"],
  "supino reto máquina": ["crucifixo máquina", "cross over"],
  // Costas
  "barra fixa": ["remada curvada", "pulldown"],
  "pulldown": ["remada unilateral", "remada baixa"],
  "remada curvada": ["pulldown pegada fechada"],
  // Pernas
  "leg press": ["cadeira extensora"],
  "leg press 45°": ["cadeira extensora"],
  "agachamento livre": ["cadeira extensora"],
  "mesa flexora": ["stiff", "elevação pélvica"],
  "hip thrust": ["cadeira abdutora"],
  // Ombros
  "desenvolvimento militar": ["elevação lateral"],
  "desenvolvimento arnold": ["elevação lateral"],
  "desenvolvimento máquina": ["elevação lateral"],
  // Bíceps
  "rosca direta": ["rosca martelo"],
  "rosca direta barra": ["rosca scott"],
  // Tríceps
  "tríceps testa": ["tríceps corda"],
};

// ============================================================
// DISTRIBUTION LOGIC
// ============================================================

export interface ExerciseTechniqueAssignment {
  exerciseIndex: number;
  exerciseName: string;
  technique: IntensityTechnique;
  /** For bi-set: the paired exercise name */
  pairedWith?: string;
}

/**
 * Assigns intensity techniques to exercises in a workout day.
 * Rules:
 * - Max 2 techniques per workout day
 * - 1 technique per muscle group
 * - Iniciante: rarely (10% chance per exercise)
 * - Intermediário: moderate (30%)
 * - Avançado: frequent (50%)
 * - Never on all exercises
 * - Never on exercises unsafe for that technique
 * - Respects day intensity (leve = no techniques)
 */
export function assignIntensityTechniques(
  exercises: { nome: string; series: string; reps: string; desc: string; descanso: string }[],
  experienceLevel: string,
  dayIntensity?: string,
  muscleGroup?: string,
): ExerciseTechniqueAssignment[] {
  // No techniques for light days or beginners in light/moderate days
  if (dayIntensity === "leve") return [];
  
  const level = experienceLevel?.toLowerCase() || "intermediario";
  
  // Probability per exercise based on level
  const probMap: Record<string, number> = {
    iniciante: 0.08,
    intermediario: 0.30,
    avancado: 0.50,
  };
  const prob = probMap[level] || 0.25;
  
  const assignments: ExerciseTechniqueAssignment[] = [];
  const maxTechniques = 2;
  const usedGroups = new Set<string>();
  
  // Shuffle exercise indices for randomness
  const indices = exercises.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  
  for (const idx of indices) {
    if (assignments.length >= maxTechniques) break;
    
    const ex = exercises[idx];
    const nameLower = ex.nome.toLowerCase();
    
    // Skip if random doesn't hit
    if (Math.random() > prob) continue;
    
    // Determine which techniques are safe for this exercise
    const safeTechniques: IntensityTechniqueType[] = [];
    
    // Drop Set: safe for machines, cables, dumbbells
    if (!UNSAFE_FOR_DROPSET.some(u => nameLower.includes(u))) {
      safeTechniques.push("drop_set");
    }
    
    // Bi-Set: only if we have a known pair
    const biSetKey = Object.keys(BI_SET_PAIRS).find(k => nameLower.includes(k));
    if (biSetKey) {
      safeTechniques.push("bi_set");
    }
    
    // Rest Pause: only for intermediate+ and intense mode
    if (level !== "iniciante" && !UNSAFE_FOR_REST_PAUSE.some(u => nameLower.includes(u))) {
      safeTechniques.push("rest_pause");
    }
    
    // Pyramids: generally safe for compound movements
    safeTechniques.push("piramide_crescente");
    if (level !== "iniciante") {
      safeTechniques.push("piramide_regressiva");
    }
    
    if (safeTechniques.length === 0) continue;
    
    // Pick a random technique
    const chosen = safeTechniques[Math.floor(Math.random() * safeTechniques.length)];
    const technique = TECHNIQUES[chosen];
    
    const assignment: ExerciseTechniqueAssignment = {
      exerciseIndex: idx,
      exerciseName: ex.nome,
      technique,
    };
    
    // For bi-set, find a paired exercise
    if (chosen === "bi_set" && biSetKey) {
      const pairs = BI_SET_PAIRS[biSetKey];
      // Find if any pair exists in the current workout
      const pairInWorkout = exercises.find((e, i) => 
        i !== idx && pairs.some(p => e.nome.toLowerCase().includes(p))
      );
      if (pairInWorkout) {
        assignment.pairedWith = pairInWorkout.nome;
      } else {
        assignment.pairedWith = pairs[0]; // suggest the pair even if not in workout
      }
    }
    
    assignments.push(assignment);
    if (muscleGroup) usedGroups.add(muscleGroup);
  }
  
  return assignments;
}

/**
 * Get a pyramid rep scheme for a given exercise's target reps and series
 */
export function getPyramidScheme(
  type: "piramide_crescente" | "piramide_regressiva",
  targetReps: string,
  targetSeries: number,
): { reps: number; loadPct: number; label: string }[] {
  const baseReps = parseInt(targetReps) || 10;
  const scheme: { reps: number; loadPct: number; label: string }[] = [];
  
  if (type === "piramide_crescente") {
    for (let i = 0; i < targetSeries; i++) {
      const pct = i / Math.max(1, targetSeries - 1);
      const reps = Math.round(baseReps + 4 - pct * 8); // 14 → 6
      const loadPct = 60 + pct * 35; // 60% → 95%
      scheme.push({
        reps: Math.max(4, reps),
        loadPct: Math.round(loadPct),
        label: i === targetSeries - 1 ? "Pesado" : i === 0 ? "Leve" : "Médio",
      });
    }
  } else {
    for (let i = 0; i < targetSeries; i++) {
      const pct = i / Math.max(1, targetSeries - 1);
      const reps = Math.round(baseReps - 4 + pct * 8); // 6 → 14
      const loadPct = 95 - pct * 35; // 95% → 60%
      scheme.push({
        reps: Math.max(4, reps),
        loadPct: Math.round(loadPct),
        label: i === 0 ? "Pesado" : i === targetSeries - 1 ? "Leve" : "Médio",
      });
    }
  }
  
  return scheme;
}
