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

/**
 * Calculate calorie target based on weight goal, deadline, and objective.
 * Uses the energy balance: 1 kg of body weight ≈ 7700 kcal.
 * Calculates the daily surplus/deficit needed to reach the goal in the given deadline,
 * clamped to safe ranges.
 */
function getCalorieTarget(
  tdee: number,
  objective: Objective,
  weightGoal?: number,
  currentWeight?: number,
  deadlineMonths?: number
): number {
  if (!weightGoal || !currentWeight || weightGoal === currentWeight) {
    // No specific goal — use simple percentage
    if (objective === "emagrecer") return Math.round(tdee * 0.8);
    if (objective === "massa") return Math.round(tdee * 1.15);
    return tdee;
  }

  const weightDiff = weightGoal - currentWeight; // negative = lose, positive = gain
  
  // If no deadline provided, use moderate defaults based on objective
  if (!deadlineMonths || deadlineMonths <= 0) {
    // Use a comfortable rate: ~0.5kg/week for loss, ~0.3kg/week for gain
    const weeklyRate = weightDiff < 0 ? -0.5 : 0.3;
    const dailyChange = Math.round((weeklyRate * 7700) / 7);
    const clampedDaily = Math.max(-800, Math.min(700, dailyChange));
    const target = tdee + clampedDaily;
    return Math.max(1200, Math.round(target));
  }
  
  const months = deadlineMonths;
  const days = months * 30;

  // 1 kg ≈ 7700 kcal
  const totalKcalChange = weightDiff * 7700;
  const dailyChange = Math.round(totalKcalChange / days);

  // Clamp to safe ranges: max deficit -1200 kcal/day, max surplus +1000 kcal/day
  const clampedDaily = Math.max(-1200, Math.min(1000, dailyChange));

  const target = tdee + clampedDaily;

  // Never go below 1200 kcal (safety floor)
  return Math.max(1200, Math.round(target));
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

/**
 * Scale meal item quantities proportionally to match a calorie target.
 */
function scaleMeals(baseMeals: MealPlan[], baseCal: number, targetCal: number): MealPlan[] {
  if (baseCal <= 0 || targetCal <= 0) return baseMeals;
  const ratio = targetCal / baseCal;
  if (Math.abs(ratio - 1) < 0.03) return baseMeals; // within 3%, no change

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
  // Try to scale numeric portion
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

export function generateDietPlan(
  objective: Objective,
  weight: number,
  height: number,
  activityLevel: ActivityLevel | string,
  age?: number,
  gender?: string,
  weightGoal?: number,
  period?: PlanPeriod,
  deadlineMonths?: number
): { plan: MealPlan[]; weekPlan?: DayPlan[]; totalCalories: number; macros: { protGrams: number; carbGrams: number; fatGrams: number }; period: PlanPeriod } {
  const tdee = calcTDEE(weight, height, age || 25, gender || "masculino", activityLevel);
  const targetCal = getCalorieTarget(tdee, objective, weightGoal, weight, deadlineMonths);
  const macros = getMacroSplit(targetCal, objective, weight);
  const basePlan = mealTemplates[objective]?.(macros, targetCal) || mealTemplates.manter(macros, targetCal);
  const usedPeriod = period || "hoje";

  if (usedPeriod === "hoje") {
    return { plan: basePlan, totalCalories: targetCal, macros, period: usedPeriod };
  }

  // Generate weekly plan with variations
  const days = usedPeriod === "semana" ? 7 : 28;
  const dayPlans: DayPlan[] = [];

  for (let d = 0; d < days; d++) {
    const dayLabel = usedPeriod === "semana"
      ? weekDays[d]
      : `Semana ${Math.floor(d / 7) + 1} — ${weekDays[d % 7]}`;
    
    const refeicoes = basePlan.map((meal) => varyMeal(meal, d));
    dayPlans.push({ dia: dayLabel, refeicoes });
  }

  return { plan: basePlan, weekPlan: dayPlans, totalCalories: targetCal, macros, period: usedPeriod };
}
