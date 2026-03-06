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

type Objective = "emagrecer" | "massa" | "manter";
type ActivityLevel = "sedentario" | "leve" | "moderado" | "intenso";

const activityMultiplier: Record<string, number> = {
  sedentario: 1.2,
  leve: 1.375,
  moderado: 1.55,
  intenso: 1.725,
};

function calcTDEE(weight: number, height: number, age: number, gender: string, activity: string): number {
  // Mifflin-St Jeor
  const s = gender === "feminino" ? -161 : 5;
  const bmr = 10 * weight + 6.25 * height - 5 * (age || 25) + s;
  return Math.round(bmr * (activityMultiplier[activity] || 1.55));
}

function getCalorieTarget(tdee: number, objective: Objective): number {
  if (objective === "emagrecer") return Math.round(tdee * 0.8);
  if (objective === "massa") return Math.round(tdee * 1.15);
  return tdee;
}

function getMacroSplit(calories: number, objective: Objective, weight: number) {
  // protein g/kg based on objective
  let protPerKg = objective === "massa" ? 2.0 : objective === "emagrecer" ? 2.2 : 1.6;
  let protGrams = Math.round(protPerKg * weight);
  let fatPct = objective === "emagrecer" ? 0.25 : 0.3;
  let fatGrams = Math.round((calories * fatPct) / 9);
  let carbGrams = Math.round((calories - protGrams * 4 - fatGrams * 9) / 4);
  if (carbGrams < 50) carbGrams = 50;
  return { protGrams, carbGrams, fatGrams };
}

// Meal templates for different objectives
const mealTemplates: Record<Objective, (macros: { protGrams: number; carbGrams: number; fatGrams: number }, cal: number) => MealPlan[]> = {
  emagrecer: (macros, cal) => {
    const mealCals = [cal * 0.25, cal * 0.1, cal * 0.3, cal * 0.1, cal * 0.25];
    return [
      { refeicao: "Café da Manhã", iconName: "Coffee", horario: "07:00", itens: [
        { alimento: "Ovos mexidos", qtd: "3 claras + 1 inteiro", cal: Math.round(mealCals[0] * 0.35), prot: 18, carb: 1, gord: 5 },
        { alimento: "Pão integral", qtd: "1 fatia", cal: 70, prot: 3, carb: 12, gord: 1 },
        { alimento: "Abacate", qtd: "30g", cal: 50, prot: 1, carb: 3, gord: 5 },
        { alimento: "Café preto", qtd: "1 xícara", cal: 5, prot: 0, carb: 1, gord: 0 },
      ]},
      { refeicao: "Lanche Manhã", iconName: "Apple", horario: "10:00", itens: [
        { alimento: "Iogurte grego zero", qtd: "170g", cal: 90, prot: 15, carb: 6, gord: 0 },
        { alimento: "Morangos", qtd: "100g", cal: 33, prot: 1, carb: 8, gord: 0 },
        { alimento: "Chia", qtd: "10g", cal: 49, prot: 2, carb: 4, gord: 3 },
      ]},
      { refeicao: "Almoço", iconName: "Sun", horario: "12:30", itens: [
        { alimento: "Arroz integral", qtd: "100g", cal: 111, prot: 3, carb: 23, gord: 1 },
        { alimento: "Frango grelhado", qtd: "150g", cal: 248, prot: 38, carb: 0, gord: 10 },
        { alimento: "Salada variada", qtd: "à vontade", cal: 30, prot: 2, carb: 5, gord: 0 },
        { alimento: "Azeite", qtd: "1 colher chá", cal: 45, prot: 0, carb: 0, gord: 5 },
        { alimento: "Legumes refogados", qtd: "100g", cal: 40, prot: 2, carb: 8, gord: 0 },
      ]},
      { refeicao: "Lanche Tarde", iconName: "Apple", horario: "16:00", itens: [
        { alimento: "Whey Protein", qtd: "1 scoop", cal: 120, prot: 24, carb: 3, gord: 1 },
        { alimento: "Maçã", qtd: "1 unidade", cal: 52, prot: 0, carb: 14, gord: 0 },
      ]},
      { refeicao: "Jantar", iconName: "Moon", horario: "19:30", itens: [
        { alimento: "Peixe grelhado", qtd: "150g", cal: 180, prot: 32, carb: 0, gord: 6 },
        { alimento: "Batata doce", qtd: "100g", cal: 86, prot: 2, carb: 20, gord: 0 },
        { alimento: "Brócolis", qtd: "150g", cal: 51, prot: 4, carb: 10, gord: 0 },
        { alimento: "Azeite", qtd: "1 colher chá", cal: 45, prot: 0, carb: 0, gord: 5 },
      ]},
    ];
  },
  massa: (macros, cal) => [
    { refeicao: "Café da Manhã", iconName: "Coffee", horario: "07:00", itens: [
      { alimento: "Ovos mexidos", qtd: "4 inteiros", cal: 280, prot: 24, carb: 2, gord: 20 },
      { alimento: "Pão integral", qtd: "3 fatias", cal: 210, prot: 9, carb: 36, gord: 3 },
      { alimento: "Banana", qtd: "1 grande", cal: 105, prot: 1, carb: 27, gord: 0 },
      { alimento: "Pasta de amendoim", qtd: "20g", cal: 117, prot: 5, carb: 4, gord: 10 },
      { alimento: "Leite integral", qtd: "200ml", cal: 120, prot: 6, carb: 10, gord: 7 },
    ]},
    { refeicao: "Lanche Manhã", iconName: "Apple", horario: "10:00", itens: [
      { alimento: "Iogurte natural", qtd: "200ml", cal: 120, prot: 8, carb: 10, gord: 5 },
      { alimento: "Granola", qtd: "50g", cal: 215, prot: 5, carb: 37, gord: 6 },
      { alimento: "Castanhas mistas", qtd: "30g", cal: 180, prot: 5, carb: 4, gord: 16 },
    ]},
    { refeicao: "Almoço", iconName: "Sun", horario: "12:30", itens: [
      { alimento: "Arroz branco", qtd: "200g", cal: 260, prot: 5, carb: 57, gord: 1 },
      { alimento: "Feijão", qtd: "150g", cal: 115, prot: 8, carb: 21, gord: 0 },
      { alimento: "Carne vermelha magra", qtd: "180g", cal: 340, prot: 42, carb: 0, gord: 18 },
      { alimento: "Salada verde", qtd: "à vontade", cal: 25, prot: 2, carb: 4, gord: 0 },
      { alimento: "Azeite", qtd: "1 colher sopa", cal: 90, prot: 0, carb: 0, gord: 10 },
    ]},
    { refeicao: "Lanche Tarde", iconName: "Apple", horario: "16:00", itens: [
      { alimento: "Whey Protein", qtd: "2 scoops", cal: 240, prot: 48, carb: 6, gord: 2 },
      { alimento: "Batata doce", qtd: "200g", cal: 172, prot: 3, carb: 40, gord: 0 },
      { alimento: "Banana", qtd: "1 unidade", cal: 89, prot: 1, carb: 23, gord: 0 },
    ]},
    { refeicao: "Jantar", iconName: "Moon", horario: "19:30", itens: [
      { alimento: "Salmão grelhado", qtd: "180g", cal: 340, prot: 36, carb: 0, gord: 22 },
      { alimento: "Macarrão integral", qtd: "150g cozido", cal: 175, prot: 7, carb: 36, gord: 1 },
      { alimento: "Brócolis", qtd: "100g", cal: 34, prot: 3, carb: 7, gord: 0 },
      { alimento: "Azeite", qtd: "1 colher sopa", cal: 90, prot: 0, carb: 0, gord: 10 },
    ]},
    { refeicao: "Ceia", iconName: "Moon", horario: "22:00", itens: [
      { alimento: "Caseína ou Whey", qtd: "1 scoop", cal: 120, prot: 24, carb: 3, gord: 1 },
      { alimento: "Pasta de amendoim", qtd: "15g", cal: 88, prot: 4, carb: 3, gord: 7 },
    ]},
  ],
  manter: (macros, cal) => [
    { refeicao: "Café da Manhã", iconName: "Coffee", horario: "07:00", itens: [
      { alimento: "Ovos mexidos", qtd: "3 unidades", cal: 210, prot: 18, carb: 2, gord: 15 },
      { alimento: "Pão integral", qtd: "2 fatias", cal: 140, prot: 6, carb: 24, gord: 2 },
      { alimento: "Banana", qtd: "1 unidade", cal: 89, prot: 1, carb: 23, gord: 0 },
      { alimento: "Café com leite", qtd: "1 xícara", cal: 60, prot: 3, carb: 5, gord: 3 },
    ]},
    { refeicao: "Lanche Manhã", iconName: "Apple", horario: "10:00", itens: [
      { alimento: "Iogurte natural", qtd: "200ml", cal: 120, prot: 8, carb: 10, gord: 5 },
      { alimento: "Granola", qtd: "30g", cal: 130, prot: 3, carb: 22, gord: 4 },
      { alimento: "Castanhas", qtd: "20g", cal: 120, prot: 4, carb: 3, gord: 10 },
    ]},
    { refeicao: "Almoço", iconName: "Sun", horario: "12:30", itens: [
      { alimento: "Arroz integral", qtd: "150g", cal: 170, prot: 4, carb: 35, gord: 1 },
      { alimento: "Feijão", qtd: "100g", cal: 77, prot: 5, carb: 14, gord: 0 },
      { alimento: "Frango grelhado", qtd: "150g", cal: 248, prot: 38, carb: 0, gord: 10 },
      { alimento: "Salada verde", qtd: "à vontade", cal: 25, prot: 2, carb: 4, gord: 0 },
      { alimento: "Azeite", qtd: "1 colher", cal: 90, prot: 0, carb: 0, gord: 10 },
    ]},
    { refeicao: "Lanche Tarde", iconName: "Apple", horario: "16:00", itens: [
      { alimento: "Whey Protein", qtd: "1 scoop", cal: 120, prot: 24, carb: 3, gord: 1 },
      { alimento: "Batata doce", qtd: "100g", cal: 86, prot: 2, carb: 20, gord: 0 },
    ]},
    { refeicao: "Jantar", iconName: "Moon", horario: "19:30", itens: [
      { alimento: "Salmão grelhado", qtd: "150g", cal: 280, prot: 30, carb: 0, gord: 18 },
      { alimento: "Batata doce", qtd: "150g", cal: 129, prot: 2, carb: 30, gord: 0 },
      { alimento: "Brócolis", qtd: "100g", cal: 34, prot: 3, carb: 7, gord: 0 },
      { alimento: "Azeite", qtd: "1 colher", cal: 90, prot: 0, carb: 0, gord: 10 },
    ]},
  ],
};

export function generateDietPlan(
  objective: Objective,
  weight: number,
  height: number,
  activityLevel: ActivityLevel | string,
  age?: number,
  gender?: string
): { plan: MealPlan[]; totalCalories: number; macros: { protGrams: number; carbGrams: number; fatGrams: number } } {
  const tdee = calcTDEE(weight, height, age || 25, gender || "masculino", activityLevel);
  const targetCal = getCalorieTarget(tdee, objective);
  const macros = getMacroSplit(targetCal, objective, weight);
  const plan = mealTemplates[objective]?.(macros, targetCal) || mealTemplates.manter(macros, targetCal);

  return { plan, totalCalories: targetCal, macros };
}
