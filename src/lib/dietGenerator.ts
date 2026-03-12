export type MealItem = {
  alimento: string;
  qtd: string;
  cal: number;
  prot: number;
  carb: number;
  gord: number;
};

export type MealPlan = {
  refeicao: string;
  iconName: string;
  horario: string;
  itens: MealItem[];
};

export type DayPlan = {
  dia: string;
  refeicoes: MealPlan[];
};

export type WeekBlock = {
  weekNumber: number;
  label: string;
  targetCalories: number;
  estimatedWeight: number;
  days: DayPlan[];
};

export type DietMeta = {
  currentWeight: number;
  weightGoal: number | null;
  deadlineMonths: number | null;
  preferencias: string | null;
  weeklyTargets?: { week: number; calories: number; estimatedWeight: number }[];
  monthlyRate?: number;
};

export type PlanPeriod = "hoje" | "semana" | "mes";

type Objective = "emagrecer" | "massa" | "manter";
type ActivityLevel = "sedentario" | "leve" | "moderado" | "intenso";

const activityMultiplier: Record<string, number> = {
  sedentario: 1.2,
  leve: 1.375,
  moderado: 1.55,
  intenso: 1.725,
};

function calcTDEE(weight: number, height: number, age: number, gender: string, activity: string): number {
  const s = gender === "feminino" ? -161 : 5;
  const bmr = 10 * weight + 6.25 * height - 5 * (age || 25) + s;
  return Math.round(bmr * (activityMultiplier[activity] || 1.55));
}

function getCalorieTarget(
  tdee: number,
  objective: Objective,
  weightGoal?: number,
  currentWeight?: number,
  deadlineMonths?: number
): number {
  if (!weightGoal || !currentWeight || weightGoal === currentWeight) {
    if (objective === "emagrecer") return Math.round(tdee * 0.8);
    if (objective === "massa") return Math.round(tdee * 1.15);
    return tdee;
  }

  const weightDiff = weightGoal - currentWeight;
  
  if (!deadlineMonths || deadlineMonths <= 0) {
    const weeklyRate = weightDiff < 0 ? -0.5 : 0.3;
    const dailyChange = Math.round((weeklyRate * 7700) / 7);
    const clampedDaily = Math.max(-800, Math.min(700, dailyChange));
    const target = tdee + clampedDaily;
    return Math.max(1200, Math.round(target));
  }
  
  const days = deadlineMonths * 30;
  const totalKcalChange = weightDiff * 7700;
  const dailyChange = Math.round(totalKcalChange / days);
  const clampedDaily = Math.max(-1200, Math.min(1000, dailyChange));
  const target = tdee + clampedDaily;
  return Math.max(1200, Math.round(target));
}

/**
 * Calculate progressive weekly calorie targets.
 * Instead of one flat target, each week ramps up (or down) progressively.
 */
function getProgressiveWeeklyTargets(
  tdee: number,
  objective: Objective,
  currentWeight: number,
  weightGoal: number,
  deadlineMonths: number,
  totalWeeks: number
): { week: number; calories: number; estimatedWeight: number }[] {
  const weightDiff = weightGoal - currentWeight;
  const weeklyWeightChange = weightDiff / totalWeeks;
  
  // Progressive: start closer to TDEE and ramp toward full target
  const finalDailyChange = (weightDiff * 7700) / (deadlineMonths * 30);
  const clampedFinal = Math.max(-1200, Math.min(1000, finalDailyChange));
  
  // Start at 40% intensity, end at 130% intensity (average ~85% = close to flat)
  // This creates a natural ramp
  const targets: { week: number; calories: number; estimatedWeight: number }[] = [];
  
  for (let w = 0; w < totalWeeks; w++) {
    // Linear ramp from 50% to 150% of average change
    const progressRatio = totalWeeks > 1 ? w / (totalWeeks - 1) : 1;
    const intensityFactor = 0.5 + progressRatio * 1.0; // 0.5 → 1.5
    const weeklyDailyChange = clampedFinal * intensityFactor;
    const weekCalories = Math.max(1200, Math.round(tdee + weeklyDailyChange));
    const estimatedWeight = Math.round((currentWeight + weeklyWeightChange * (w + 1)) * 10) / 10;
    
    targets.push({ week: w + 1, calories: weekCalories, estimatedWeight });
  }
  
  return targets;
}

function getMacroSplit(calories: number, objective: Objective, weight: number) {
  let protPerKg = objective === "massa" ? 2.0 : objective === "emagrecer" ? 2.2 : 1.6;
  let protGrams = Math.round(protPerKg * weight);
  let fatPct = objective === "emagrecer" ? 0.25 : 0.3;
  let fatGrams = Math.round((calories * fatPct) / 9);
  let carbGrams = Math.round((calories - protGrams * 4 - fatGrams * 9) / 4);
  if (carbGrams < 50) carbGrams = 50;
  return { protGrams, carbGrams, fatGrams };
}

// Variation helpers for weekly/monthly plans
const proteinSwaps: Record<string, string[]> = {
  "Frango grelhado": ["Peito de peru", "Filé de tilápia", "Frango desfiado", "Coxa de frango s/ pele"],
  "Peixe grelhado": ["Tilápia grelhada", "Salmão grelhado", "Atum grelhado", "Filé de merluza"],
  "Carne vermelha magra": ["Patinho grelhado", "Lagarto", "Alcatra grelhada", "Maminha grelhada"],
  "Salmão grelhado": ["Truta grelhada", "Atum em posta", "Filé de tilápia", "Sardinha assada"],
  "Ovos mexidos": ["Omelete", "Ovos cozidos", "Ovos pochê", "Crepioca"],
};

const carbSwaps: Record<string, string[]> = {
  "Arroz integral": ["Quinoa", "Arroz 7 grãos", "Arroz integral", "Cuscuz"],
  "Arroz branco": ["Arroz integral", "Macarrão integral", "Batata inglesa", "Mandioca cozida"],
  "Batata doce": ["Inhame", "Mandioca cozida", "Batata inglesa", "Cará"],
  "Pão integral": ["Tapioca", "Wrap integral", "Torrada integral", "Crepioca"],
  "Macarrão integral": ["Nhoque de batata doce", "Espaguete de abobrinha", "Arroz integral", "Cuscuz"],
};

// Preference-based exclusion keywords
const preferenceExclusions: Record<string, string[]> = {
  "ovo": ["Ovos mexidos", "Omelete", "Ovos cozidos", "Ovos pochê", "Crepioca"],
  "peixe": ["Peixe grelhado", "Tilápia grelhada", "Salmão grelhado", "Atum grelhado", "Filé de merluza", "Salmão grelhado", "Truta grelhada", "Atum em posta", "Sardinha assada", "Filé de tilápia"],
  "carne vermelha": ["Carne vermelha magra", "Patinho grelhado", "Lagarto", "Alcatra grelhada", "Maminha grelhada"],
  "leite": ["Leite integral", "Café com leite", "Iogurte natural", "Iogurte grego zero"],
  "amendoim": ["Pasta de amendoim"],
  "glúten": ["Pão integral", "Macarrão integral", "Torrada integral", "Wrap integral", "Granola"],
};

const preferenceReplacements: Record<string, { alimento: string; cal: number; prot: number; carb: number; gord: number }> = {
  "Ovos mexidos": { alimento: "Frango desfiado", cal: 180, prot: 28, carb: 0, gord: 7 },
  "Peixe grelhado": { alimento: "Frango grelhado", cal: 165, prot: 31, carb: 0, gord: 4 },
  "Salmão grelhado": { alimento: "Frango grelhado", cal: 165, prot: 31, carb: 0, gord: 4 },
  "Carne vermelha magra": { alimento: "Peito de peru", cal: 135, prot: 30, carb: 0, gord: 2 },
  "Leite integral": { alimento: "Bebida vegetal", cal: 60, prot: 2, carb: 8, gord: 2 },
  "Iogurte natural": { alimento: "Iogurte de coco", cal: 100, prot: 1, carb: 12, gord: 5 },
  "Iogurte grego zero": { alimento: "Iogurte de coco", cal: 100, prot: 1, carb: 12, gord: 5 },
  "Pasta de amendoim": { alimento: "Pasta de castanha", cal: 100, prot: 3, carb: 5, gord: 8 },
  "Pão integral": { alimento: "Tapioca", cal: 68, prot: 0, carb: 17, gord: 0 },
  "Macarrão integral": { alimento: "Arroz integral", cal: 111, prot: 3, carb: 23, gord: 1 },
};

function applyPreferences(meals: MealPlan[], preferencias: string): MealPlan[] {
  if (!preferencias) return meals;
  const lower = preferencias.toLowerCase();
  
  // Find which foods to exclude
  const excludedFoods = new Set<string>();
  for (const [keyword, foods] of Object.entries(preferenceExclusions)) {
    if (lower.includes(keyword)) {
      foods.forEach(f => excludedFoods.add(f));
    }
  }
  
  if (excludedFoods.size === 0) return meals;
  
  return meals.map(meal => ({
    ...meal,
    itens: meal.itens.map(item => {
      if (excludedFoods.has(item.alimento)) {
        const replacement = preferenceReplacements[item.alimento];
        if (replacement) {
          return { ...item, ...replacement };
        }
      }
      return item;
    }),
  }));
}

function varyMeal(meal: MealPlan, dayIndex: number): MealPlan {
  const newItens = meal.itens.map((item) => {
    const protSwap = proteinSwaps[item.alimento];
    if (protSwap) {
      return { ...item, alimento: protSwap[dayIndex % protSwap.length] };
    }
    const cSwap = carbSwaps[item.alimento];
    if (cSwap) {
      return { ...item, alimento: cSwap[dayIndex % cSwap.length] };
    }
    return item;
  });
  return { ...meal, itens: newItens };
}

function scaleMeals(baseMeals: MealPlan[], baseCal: number, targetCal: number): MealPlan[] {
  if (baseCal <= 0 || targetCal <= 0) return baseMeals;
  const ratio = targetCal / baseCal;
  if (Math.abs(ratio - 1) < 0.03) return baseMeals;

  return baseMeals.map((meal) => ({
    ...meal,
    itens: meal.itens.map((item) => ({
      ...item,
      cal: Math.round(item.cal * ratio),
      prot: Math.round(item.prot * ratio),
      carb: Math.round(item.carb * ratio),
      gord: Math.round(item.gord * ratio),
      qtd: scaleQtd(item.qtd, ratio),
    })),
  }));
}

function scaleQtd(qtd: string, ratio: number): string {
  if (qtd === "à vontade") return qtd;
  const match = qtd.match(/^(\d+(?:\.\d+)?)\s*(.*)/);
  if (match) {
    const num = parseFloat(match[1]);
    const unit = match[2];
    const scaled = Math.round(num * ratio);
    return `${scaled}${unit ? " " + unit : ""}`;
  }
  return qtd;
}

// Meal templates for different objectives
const mealTemplates: Record<Objective, (macros: { protGrams: number; carbGrams: number; fatGrams: number }, cal: number) => MealPlan[]> = {
  emagrecer: (macros, cal) => {
    const baseMeals: MealPlan[] = [
      { refeicao: "Café da Manhã", iconName: "Coffee", horario: "07:00", itens: [
        { alimento: "Ovos mexidos", qtd: "3 claras + 1 inteiro", cal: 120, prot: 18, carb: 1, gord: 5 },
        { alimento: "Pão integral", qtd: "1 fatia", cal: 70, prot: 3, carb: 12, gord: 1 },
        { alimento: "Abacate", qtd: "30 g", cal: 50, prot: 1, carb: 3, gord: 5 },
        { alimento: "Café preto", qtd: "1 xícara", cal: 5, prot: 0, carb: 1, gord: 0 },
      ]},
      { refeicao: "Lanche Manhã", iconName: "Apple", horario: "10:00", itens: [
        { alimento: "Iogurte grego zero", qtd: "170 g", cal: 90, prot: 15, carb: 6, gord: 0 },
        { alimento: "Morangos", qtd: "100 g", cal: 33, prot: 1, carb: 8, gord: 0 },
        { alimento: "Chia", qtd: "10 g", cal: 49, prot: 2, carb: 4, gord: 3 },
      ]},
      { refeicao: "Almoço", iconName: "Sun", horario: "12:30", itens: [
        { alimento: "Arroz integral", qtd: "100 g", cal: 111, prot: 3, carb: 23, gord: 1 },
        { alimento: "Frango grelhado", qtd: "150 g", cal: 248, prot: 38, carb: 0, gord: 10 },
        { alimento: "Salada variada", qtd: "à vontade", cal: 30, prot: 2, carb: 5, gord: 0 },
        { alimento: "Azeite", qtd: "1 colher chá", cal: 45, prot: 0, carb: 0, gord: 5 },
        { alimento: "Legumes refogados", qtd: "100 g", cal: 40, prot: 2, carb: 8, gord: 0 },
      ]},
      { refeicao: "Lanche Tarde", iconName: "Apple", horario: "16:00", itens: [
        { alimento: "Whey Protein", qtd: "1 scoop", cal: 120, prot: 24, carb: 3, gord: 1 },
        { alimento: "Maçã", qtd: "1 unidade", cal: 52, prot: 0, carb: 14, gord: 0 },
      ]},
      { refeicao: "Jantar", iconName: "Moon", horario: "19:30", itens: [
        { alimento: "Peixe grelhado", qtd: "150 g", cal: 180, prot: 32, carb: 0, gord: 6 },
        { alimento: "Batata doce", qtd: "100 g", cal: 86, prot: 2, carb: 20, gord: 0 },
        { alimento: "Brócolis", qtd: "150 g", cal: 51, prot: 4, carb: 10, gord: 0 },
        { alimento: "Azeite", qtd: "1 colher chá", cal: 45, prot: 0, carb: 0, gord: 5 },
      ]},
    ];
    const baseCal = baseMeals.reduce((a, m) => a + m.itens.reduce((s, i) => s + i.cal, 0), 0);
    return scaleMeals(baseMeals, baseCal, cal);
  },
  massa: (macros, cal) => {
    const baseMeals: MealPlan[] = [
      { refeicao: "Café da Manhã", iconName: "Coffee", horario: "07:00", itens: [
        { alimento: "Ovos mexidos", qtd: "4 inteiros", cal: 280, prot: 24, carb: 2, gord: 20 },
        { alimento: "Pão integral", qtd: "3 fatias", cal: 210, prot: 9, carb: 36, gord: 3 },
        { alimento: "Banana", qtd: "1 grande", cal: 105, prot: 1, carb: 27, gord: 0 },
        { alimento: "Pasta de amendoim", qtd: "20 g", cal: 117, prot: 5, carb: 4, gord: 10 },
        { alimento: "Leite integral", qtd: "200 ml", cal: 120, prot: 6, carb: 10, gord: 7 },
      ]},
      { refeicao: "Lanche Manhã", iconName: "Apple", horario: "10:00", itens: [
        { alimento: "Iogurte natural", qtd: "200 ml", cal: 120, prot: 8, carb: 10, gord: 5 },
        { alimento: "Granola", qtd: "50 g", cal: 215, prot: 5, carb: 37, gord: 6 },
        { alimento: "Castanhas mistas", qtd: "30 g", cal: 180, prot: 5, carb: 4, gord: 16 },
      ]},
      { refeicao: "Almoço", iconName: "Sun", horario: "12:30", itens: [
        { alimento: "Arroz branco", qtd: "200 g", cal: 260, prot: 5, carb: 57, gord: 1 },
        { alimento: "Feijão", qtd: "150 g", cal: 115, prot: 8, carb: 21, gord: 0 },
        { alimento: "Carne vermelha magra", qtd: "180 g", cal: 340, prot: 42, carb: 0, gord: 18 },
        { alimento: "Salada verde", qtd: "à vontade", cal: 25, prot: 2, carb: 4, gord: 0 },
        { alimento: "Azeite", qtd: "1 colher sopa", cal: 90, prot: 0, carb: 0, gord: 10 },
      ]},
      { refeicao: "Lanche Tarde", iconName: "Apple", horario: "16:00", itens: [
        { alimento: "Whey Protein", qtd: "2 scoops", cal: 240, prot: 48, carb: 6, gord: 2 },
        { alimento: "Batata doce", qtd: "200 g", cal: 172, prot: 3, carb: 40, gord: 0 },
        { alimento: "Banana", qtd: "1 unidade", cal: 89, prot: 1, carb: 23, gord: 0 },
      ]},
      { refeicao: "Jantar", iconName: "Moon", horario: "19:30", itens: [
        { alimento: "Salmão grelhado", qtd: "180 g", cal: 340, prot: 36, carb: 0, gord: 22 },
        { alimento: "Macarrão integral", qtd: "150 g cozido", cal: 175, prot: 7, carb: 36, gord: 1 },
        { alimento: "Brócolis", qtd: "100 g", cal: 34, prot: 3, carb: 7, gord: 0 },
        { alimento: "Azeite", qtd: "1 colher sopa", cal: 90, prot: 0, carb: 0, gord: 10 },
      ]},
      { refeicao: "Ceia", iconName: "Moon", horario: "22:00", itens: [
        { alimento: "Caseína ou Whey", qtd: "1 scoop", cal: 120, prot: 24, carb: 3, gord: 1 },
        { alimento: "Pasta de amendoim", qtd: "15 g", cal: 88, prot: 4, carb: 3, gord: 7 },
      ]},
    ];
    const baseCal = baseMeals.reduce((a, m) => a + m.itens.reduce((s, i) => s + i.cal, 0), 0);
    return scaleMeals(baseMeals, baseCal, cal);
  },
  manter: (macros, cal) => {
    const baseMeals: MealPlan[] = [
      { refeicao: "Café da Manhã", iconName: "Coffee", horario: "07:00", itens: [
        { alimento: "Ovos mexidos", qtd: "3 unidades", cal: 210, prot: 18, carb: 2, gord: 15 },
        { alimento: "Pão integral", qtd: "2 fatias", cal: 140, prot: 6, carb: 24, gord: 2 },
        { alimento: "Banana", qtd: "1 unidade", cal: 89, prot: 1, carb: 23, gord: 0 },
        { alimento: "Café com leite", qtd: "1 xícara", cal: 60, prot: 3, carb: 5, gord: 3 },
      ]},
      { refeicao: "Lanche Manhã", iconName: "Apple", horario: "10:00", itens: [
        { alimento: "Iogurte natural", qtd: "200 ml", cal: 120, prot: 8, carb: 10, gord: 5 },
        { alimento: "Granola", qtd: "30 g", cal: 130, prot: 3, carb: 22, gord: 4 },
        { alimento: "Castanhas", qtd: "20 g", cal: 120, prot: 4, carb: 3, gord: 10 },
      ]},
      { refeicao: "Almoço", iconName: "Sun", horario: "12:30", itens: [
        { alimento: "Arroz integral", qtd: "150 g", cal: 170, prot: 4, carb: 35, gord: 1 },
        { alimento: "Feijão", qtd: "100 g", cal: 77, prot: 5, carb: 14, gord: 0 },
        { alimento: "Frango grelhado", qtd: "150 g", cal: 248, prot: 38, carb: 0, gord: 10 },
        { alimento: "Salada verde", qtd: "à vontade", cal: 25, prot: 2, carb: 4, gord: 0 },
        { alimento: "Azeite", qtd: "1 colher", cal: 90, prot: 0, carb: 0, gord: 10 },
      ]},
      { refeicao: "Lanche Tarde", iconName: "Apple", horario: "16:00", itens: [
        { alimento: "Whey Protein", qtd: "1 scoop", cal: 120, prot: 24, carb: 3, gord: 1 },
        { alimento: "Batata doce", qtd: "100 g", cal: 86, prot: 2, carb: 20, gord: 0 },
      ]},
      { refeicao: "Jantar", iconName: "Moon", horario: "19:30", itens: [
        { alimento: "Salmão grelhado", qtd: "150 g", cal: 280, prot: 30, carb: 0, gord: 18 },
        { alimento: "Batata doce", qtd: "150 g", cal: 129, prot: 2, carb: 30, gord: 0 },
        { alimento: "Brócolis", qtd: "100 g", cal: 34, prot: 3, carb: 7, gord: 0 },
        { alimento: "Azeite", qtd: "1 colher", cal: 90, prot: 0, carb: 0, gord: 10 },
      ]},
    ];
    const baseCal = baseMeals.reduce((a, m) => a + m.itens.reduce((s, i) => s + i.cal, 0), 0);
    return scaleMeals(baseMeals, baseCal, cal);
  },
};

const weekDays = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"];

export type DietPlanResult = {
  plan: MealPlan[];
  weekPlan?: DayPlan[];
  weekBlocks?: WeekBlock[];
  totalCalories: number;
  macros: { protGrams: number; carbGrams: number; fatGrams: number };
  period: PlanPeriod;
  meta: DietMeta;
};

export function generateDietPlan(
  objective: Objective,
  weight: number,
  height: number,
  activityLevel: ActivityLevel | string,
  age?: number,
  gender?: string,
  weightGoal?: number,
  period?: PlanPeriod,
  deadlineMonths?: number,
  preferencias?: string
): DietPlanResult {
  const tdee = calcTDEE(weight, height, age || 25, gender || "masculino", activityLevel);
  const targetCal = getCalorieTarget(tdee, objective, weightGoal, weight, deadlineMonths);
  const macros = getMacroSplit(targetCal, objective, weight);
  let basePlan = mealTemplates[objective]?.(macros, targetCal) || mealTemplates.manter(macros, targetCal);
  const usedPeriod = period || "hoje";

  // Apply preference-based food swaps
  if (preferencias) {
    basePlan = applyPreferences(basePlan, preferencias);
  }

  const meta: DietMeta = {
    currentWeight: weight,
    weightGoal: weightGoal || null,
    deadlineMonths: deadlineMonths || null,
    preferencias: preferencias || null,
  };

  // Calculate progressive weekly targets if we have a weight goal + deadline
  const hasProgressive = weightGoal && weightGoal !== weight && deadlineMonths && deadlineMonths > 0;
  
  if (usedPeriod === "hoje") {
    if (hasProgressive) {
      const totalWeeks = deadlineMonths * 4;
      meta.weeklyTargets = getProgressiveWeeklyTargets(tdee, objective, weight, weightGoal, deadlineMonths, totalWeeks);
      meta.monthlyRate = Math.round(((weightGoal - weight) / deadlineMonths) * 10) / 10;
    }
    return { plan: basePlan, totalCalories: targetCal, macros, period: usedPeriod, meta };
  }

  if (usedPeriod === "semana") {
    // Simple week — use current target (week 1 of progressive plan)
    const dayPlans: DayPlan[] = [];
    for (let d = 0; d < 7; d++) {
      const refeicoes = basePlan.map((meal) => varyMeal(meal, d));
      dayPlans.push({ dia: weekDays[d], refeicoes });
    }
    if (hasProgressive) {
      const totalWeeks = deadlineMonths * 4;
      meta.weeklyTargets = getProgressiveWeeklyTargets(tdee, objective, weight, weightGoal, deadlineMonths, totalWeeks);
      meta.monthlyRate = Math.round(((weightGoal - weight) / deadlineMonths) * 10) / 10;
    }
    return { plan: basePlan, weekPlan: dayPlans, totalCalories: targetCal, macros, period: usedPeriod, meta };
  }

  // Monthly plan — generate progressive weekly blocks
  if (hasProgressive) {
    const totalWeeks = deadlineMonths * 4;
    const weeklyTargets = getProgressiveWeeklyTargets(tdee, objective, weight, weightGoal, deadlineMonths, totalWeeks);
    meta.weeklyTargets = weeklyTargets;
    meta.monthlyRate = Math.round(((weightGoal - weight) / deadlineMonths) * 10) / 10;

    // Generate 4 week blocks (for first month) with progressive calories
    const weekBlocks: WeekBlock[] = [];
    const allDays: DayPlan[] = [];

    for (let w = 0; w < 4; w++) {
      const weekTarget = weeklyTargets[w] || weeklyTargets[weeklyTargets.length - 1];
      const weekMacros = getMacroSplit(weekTarget.calories, objective, weight);
      let weekBasePlan = mealTemplates[objective]?.(weekMacros, weekTarget.calories) || mealTemplates.manter(weekMacros, weekTarget.calories);
      
      if (preferencias) {
        weekBasePlan = applyPreferences(weekBasePlan, preferencias);
      }

      const days: DayPlan[] = [];
      for (let d = 0; d < 7; d++) {
        const dayLabel = `Semana ${w + 1} — ${weekDays[d]}`;
        const refeicoes = weekBasePlan.map((meal) => varyMeal(meal, w * 7 + d));
        const dayPlan = { dia: dayLabel, refeicoes };
        days.push(dayPlan);
        allDays.push(dayPlan);
      }

      weekBlocks.push({
        weekNumber: w + 1,
        label: `Semana ${w + 1}`,
        targetCalories: weekTarget.calories,
        estimatedWeight: weekTarget.estimatedWeight,
        days,
      });
    }

    return {
      plan: basePlan,
      weekPlan: allDays,
      weekBlocks,
      totalCalories: targetCal,
      macros,
      period: usedPeriod,
      meta,
    };
  }

  // Non-progressive month plan (no weight goal or no deadline)
  const dayPlans: DayPlan[] = [];
  for (let d = 0; d < 28; d++) {
    const dayLabel = `Semana ${Math.floor(d / 7) + 1} — ${weekDays[d % 7]}`;
    const refeicoes = basePlan.map((meal) => varyMeal(meal, d));
    dayPlans.push({ dia: dayLabel, refeicoes });
  }

  return { plan: basePlan, weekPlan: dayPlans, totalCalories: targetCal, macros, period: usedPeriod, meta };
}
