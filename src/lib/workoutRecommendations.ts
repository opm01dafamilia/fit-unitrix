// === Stretching recommendations per muscle group ===
export const stretchingDB: Record<string, { nome: string; duracao: string; desc: string }[]> = {
  peito: [
    { nome: "Mobilidade de Ombro", duracao: "1min", desc: "Rotações amplas com os braços." },
    { nome: "Alongamento de Peitoral", duracao: "30s cada lado", desc: "Braço apoiado na parede, gire o tronco." },
    { nome: "Alongamento de Tríceps", duracao: "30s cada lado", desc: "Braço atrás da cabeça, pressione o cotovelo." },
  ],
  costas: [
    { nome: "Cat-Cow", duracao: "1min", desc: "De quatro apoios, alterne arredondando e estendendo a coluna." },
    { nome: "Alongamento de Dorsal", duracao: "30s cada lado", desc: "Pendure-se lateralmente em uma barra ou porta." },
    { nome: "Rotação Torácica", duracao: "30s cada lado", desc: "De quatro apoios, gire o tronco abrindo o braço." },
  ],
  pernas: [
    { nome: "Alongamento de Quadríceps", duracao: "30s cada lado", desc: "Em pé, puxe o pé em direção ao glúteo." },
    { nome: "Alongamento de Posterior", duracao: "30s cada lado", desc: "Perna estendida sobre um banco, incline o tronco." },
    { nome: "Mobilidade de Quadril", duracao: "1min", desc: "Círculos amplos com o quadril, agachamento profundo." },
    { nome: "Alongamento de Panturrilha", duracao: "30s cada lado", desc: "Apoie o pé na parede e pressione o calcanhar." },
  ],
  ombros: [
    { nome: "Rotação de Ombro", duracao: "1min", desc: "Braços estendidos, faça círculos crescentes." },
    { nome: "Alongamento de Deltóide", duracao: "30s cada lado", desc: "Cruze o braço na frente do peito." },
    { nome: "Banda Elástica Pull-Apart", duracao: "30s", desc: "Puxe a banda para os lados na altura do peito." },
  ],
  biceps: [
    { nome: "Alongamento de Bíceps", duracao: "30s cada lado", desc: "Braço estendido na parede, palma para cima, gire." },
    { nome: "Mobilidade de Punho", duracao: "30s", desc: "Círculos com os punhos em ambas direções." },
  ],
  triceps: [
    { nome: "Alongamento de Tríceps", duracao: "30s cada lado", desc: "Braço atrás da cabeça, pressione o cotovelo." },
    { nome: "Mobilidade de Ombro", duracao: "30s", desc: "Rotações amplas para aquecer a articulação." },
  ],
  abdomen: [
    { nome: "Cobra (Yoga)", duracao: "30s", desc: "Deitado de barriga para baixo, estenda os braços elevando o tronco." },
    { nome: "Rotação de Tronco", duracao: "30s cada lado", desc: "Sentado, gire o tronco segurando o joelho oposto." },
  ],
  hiit: [
    { nome: "Polichinelos Leves", duracao: "1min", desc: "Versão suave para aquecer o corpo todo." },
    { nome: "Mobilidade Geral", duracao: "1min", desc: "Círculos de braços, quadril e tornozelos." },
    { nome: "Agachamento Bodyweight", duracao: "30s", desc: "Agachamentos sem peso para ativar as pernas." },
  ],
  cardio: [
    { nome: "Caminhada Leve", duracao: "2min", desc: "Comece devagar para aquecer o corpo." },
    { nome: "Mobilidade de Tornozelo", duracao: "30s cada lado", desc: "Círculos com os tornozelos." },
  ],
};

// === Cardio recommendations per objective ===
export type CardioRecommendation = {
  titulo: string;
  duracao: string;
  desc: string;
  intensidade: string;
  objetivo?: string;
  tipo?: string;
};

// === SMART CARDIO PRESCRIPTION ENGINE ===
export type CardioLevel = "iniciante" | "intermediario" | "avancado";

export interface SmartCardioSession {
  titulo: string;
  duracao: string;
  duracaoMinutos: number;
  desc: string;
  intensidade: "Baixa" | "Moderada" | "Alta";
  tipo: string;
  objetivo: string;
  momento: "pos-treino" | "dia-descanso" | "qualquer";
  emoji: string;
}

// Duration ranges by level (in minutes)
const cardioDurationRange: Record<CardioLevel, [number, number]> = {
  iniciante: [10, 15],
  intermediario: [15, 25],
  avancado: [25, 40],
};

// Full cardio exercise database by objective
const smartCardioDB: Record<string, SmartCardioSession[]> = {
  emagrecer: [
    { titulo: "HIIT Esteira", duracao: "", duracaoMinutos: 0, desc: "30s sprint máximo + 30s caminhada. Máxima queima calórica em pouco tempo.", intensidade: "Alta", tipo: "HIIT", objetivo: "Queima intensa", momento: "pos-treino", emoji: "🔥" },
    { titulo: "Caminhada Inclinada", duracao: "", duracaoMinutos: 0, desc: "Esteira com 10-12% de inclinação, ritmo constante. Queima gordura sem impactar recuperação.", intensidade: "Moderada", tipo: "Steady State", objetivo: "Queima de gordura", momento: "qualquer", emoji: "🚶" },
    { titulo: "Bicicleta Moderada", duracao: "", duracaoMinutos: 0, desc: "Pedalada com resistência moderada, RPM entre 70-90.", intensidade: "Moderada", tipo: "Steady State", objetivo: "Resistência", momento: "qualquer", emoji: "🚴" },
    { titulo: "Escada (StairMaster)", duracao: "", duracaoMinutos: 0, desc: "Ritmo constante no StairMaster, nível 5-8.", intensidade: "Moderada", tipo: "Steady State", objetivo: "Queima + glúteos", momento: "pos-treino", emoji: "🪜" },
    { titulo: "Corrida Intervalada", duracao: "", duracaoMinutos: 0, desc: "Alterne 1min corrida forte + 1min trote leve.", intensidade: "Alta", tipo: "Intervalado", objetivo: "VO2max + queima", momento: "dia-descanso", emoji: "🏃" },
    { titulo: "Pular Corda", duracao: "", duracaoMinutos: 0, desc: "1min pulando + 30s descanso. Excelente para coordenação e queima.", intensidade: "Alta", tipo: "HIIT", objetivo: "Coordenação + queima", momento: "pos-treino", emoji: "⏭️" },
  ],
  massa: [
    { titulo: "Caminhada Leve", duracao: "", duracaoMinutos: 0, desc: "Caminhada em ritmo confortável para recuperação ativa sem comprometer ganhos.", intensidade: "Baixa", tipo: "Recuperação", objetivo: "Recuperação ativa", momento: "pos-treino", emoji: "🚶" },
    { titulo: "Bike Leve", duracao: "", duracaoMinutos: 0, desc: "Pedalada suave, resistência baixa. Mantém saúde cardiovascular.", intensidade: "Baixa", tipo: "Recuperação", objetivo: "Saúde cardio", momento: "pos-treino", emoji: "🚴" },
    { titulo: "Cardio Pós-Treino Curto", duracao: "", duracaoMinutos: 0, desc: "5-10min de esteira ou bike leve para auxiliar recuperação.", intensidade: "Baixa", tipo: "Recuperação", objetivo: "Cool down", momento: "pos-treino", emoji: "❄️" },
    { titulo: "Caminhada Inclinada Leve", duracao: "", duracaoMinutos: 0, desc: "Esteira 5-8% inclinação, ritmo leve. Não afeta hipertrofia.", intensidade: "Baixa", tipo: "Steady State", objetivo: "Manutenção cardio", momento: "dia-descanso", emoji: "🪜" },
  ],
  condicionamento: [
    { titulo: "HIIT Circuito", duracao: "", duracaoMinutos: 0, desc: "Circuito funcional: burpees, mountain climbers, box jump. 30s on/15s off.", intensidade: "Alta", tipo: "HIIT", objetivo: "Condicionamento geral", momento: "dia-descanso", emoji: "🔥" },
    { titulo: "Corrida Contínua", duracao: "", duracaoMinutos: 0, desc: "Corrida em ritmo constante, zona 2-3 de FC.", intensidade: "Moderada", tipo: "Steady State", objetivo: "Resistência aeróbia", momento: "qualquer", emoji: "🏃" },
    { titulo: "Bike Intensa", duracao: "", duracaoMinutos: 0, desc: "Pedalada com variação de intensidade: 2min forte + 1min leve.", intensidade: "Alta", tipo: "Intervalado", objetivo: "Potência aeróbia", momento: "dia-descanso", emoji: "🚴" },
    { titulo: "Circuito Funcional", duracao: "", duracaoMinutos: 0, desc: "Kettlebell swings, battle ropes, agachamento com salto. Sem pausa entre estações.", intensidade: "Alta", tipo: "Funcional", objetivo: "Condicionamento", momento: "dia-descanso", emoji: "💪" },
    { titulo: "Remo Ergométrico", duracao: "", duracaoMinutos: 0, desc: "Remada ritmada, foco em potência e resistência. 500m sprints.", intensidade: "Moderada", tipo: "Steady State", objetivo: "Full body cardio", momento: "qualquer", emoji: "🚣" },
    { titulo: "Pular Corda Intervalado", duracao: "", duracaoMinutos: 0, desc: "1min duplo + 30s simples + 30s descanso.", intensidade: "Alta", tipo: "HIIT", objetivo: "Agilidade", momento: "pos-treino", emoji: "⏭️" },
  ],
};

/**
 * Get a smart cardio prescription for a specific workout day
 */
export function getSmartCardio(
  objective: string | undefined,
  level: string | undefined,
  dayIntensity: string | undefined,
  isLegDay: boolean,
  cardioFreq: string,
): SmartCardioSession | null {
  if (!objective || cardioFreq === "0") return null;
  
  const obj = objective.toLowerCase();
  const lvl = (level?.toLowerCase() || "intermediario") as CardioLevel;
  const pool = smartCardioDB[obj] || smartCardioDB.condicionamento;
  
  // Duration based on level
  const [minDur, maxDur] = cardioDurationRange[lvl] || cardioDurationRange.intermediario;
  
  // Filter: if leg day, only allow low intensity cardio
  let filtered = pool;
  if (isLegDay) {
    filtered = pool.filter(c => c.intensidade === "Baixa");
    if (filtered.length === 0) {
      // Fallback: create a light version
      filtered = [{ 
        titulo: "Caminhada Leve", duracao: "", duracaoMinutos: 0, 
        desc: "Caminhada leve pós-treino de perna para recuperação.", 
        intensidade: "Baixa", tipo: "Recuperação", objetivo: "Recuperação", 
        momento: "pos-treino", emoji: "🚶" 
      }];
    }
  }
  
  // If day is intense, prefer post-workout or lower intensity
  if (dayIntensity === "pesado" && !isLegDay) {
    const moderate = filtered.filter(c => c.intensidade !== "Alta");
    if (moderate.length > 0) filtered = moderate;
  }
  
  // Pick a random session
  const session = filtered[Math.floor(Math.random() * filtered.length)];
  
  // Calculate duration
  const dur = isLegDay 
    ? Math.min(minDur, 15) // Cap leg day cardio at 15min
    : Math.round(minDur + Math.random() * (maxDur - minDur));
  
  return {
    ...session,
    duracao: `${dur} min`,
    duracaoMinutos: dur,
  };
}

// Legacy export for backward compat
export const cardioByObjective: Record<string, CardioRecommendation[]> = {
  emagrecer: [
    { titulo: "Corrida Leve", duracao: "20 min", desc: "Ritmo confortável para queima de gordura.", intensidade: "Moderada" },
    { titulo: "HIIT Rápido", duracao: "10 min", desc: "30s sprint + 30s descanso. Alta queima calórica.", intensidade: "Alta" },
    { titulo: "Caminhada Inclinada", duracao: "15 min", desc: "Esteira com 10% de inclinação, ritmo constante.", intensidade: "Moderada" },
  ],
  massa: [
    { titulo: "Caminhada Leve", duracao: "10 min", desc: "Pós-treino para recuperação ativa.", intensidade: "Baixa" },
    { titulo: "Bike Leve", duracao: "10 min", desc: "Pedalada suave para manter saúde cardiovascular.", intensidade: "Baixa" },
  ],
  condicionamento: [
    { titulo: "Corrida Moderada", duracao: "20 min", desc: "Ritmo constante, melhora resistência.", intensidade: "Moderada" },
    { titulo: "Bicicleta", duracao: "25 min", desc: "Pedalada com variação de intensidade.", intensidade: "Moderada" },
    { titulo: "Pular Corda", duracao: "10 min", desc: "Intervalos de 1min ativo + 30s descanso.", intensidade: "Alta" },
  ],
};

// === Home alternatives for gym exercises ===
export const homeAlternatives: Record<string, { nome: string; desc: string }> = {
  "Supino Reto": { nome: "Flexão de Braço", desc: "Mãos na largura dos ombros, desça até o peito quase tocar o chão." },
  "Supino Reto Máquina": { nome: "Flexão de Braço", desc: "Mãos na largura dos ombros, corpo reto." },
  "Supino Inclinado Halteres": { nome: "Flexão Inclinada (pés elevados)", desc: "Pés em um banco/cadeira, mãos no chão." },
  "Crucifixo": { nome: "Flexão Aberta", desc: "Mãos mais abertas que os ombros para foco no peitoral." },
  "Crucifixo Máquina": { nome: "Flexão Aberta", desc: "Mãos afastadas, foco na contração do peito." },
  "Cross Over": { nome: "Flexão com Elástico", desc: "Elástico nas costas, empurre para frente." },
  "Crucifixo Inclinado": { nome: "Flexão Declinada", desc: "Mãos no chão, pés elevados, amplitude total." },
  "Pulldown": { nome: "Remada com Elástico Alto", desc: "Elástico preso acima da cabeça, puxe para baixo." },
  "Barra Fixa": { nome: "Barra Fixa (porta)", desc: "Use barra de porta. Pegada pronada." },
  "Barra Fixa com Peso": { nome: "Barra Fixa (porta)", desc: "Barra de porta, máximo de repetições." },
  "Remada Curvada": { nome: "Remada com Galão de Água", desc: "Galão cheio em cada mão, incline 45° e puxe." },
  "Remada Máquina": { nome: "Remada com Elástico", desc: "Elástico preso à frente, puxe ao abdômen." },
  "Remada Unilateral": { nome: "Remada Unilateral com Galão", desc: "Apoie-se na cadeira, reme com um galão." },
  "Remada Baixa": { nome: "Remada Sentado com Elástico", desc: "Sentado no chão, elástico nos pés, puxe." },
  "Remada Cavaleiro": { nome: "Remada Invertida (mesa)", desc: "Deite sob uma mesa firme e puxe o corpo." },
  "Pulldown Pegada Fechada": { nome: "Remada Invertida Supinada", desc: "Sob mesa, pegada supinada, puxe o corpo." },
  "Pullover Cabo": { nome: "Pullover com Galão", desc: "Deitado, segure um galão atrás da cabeça e traga à frente." },
  "Leg Press": { nome: "Agachamento Livre", desc: "Pés na largura dos ombros, desça até paralelo." },
  "Leg Press 45°": { nome: "Agachamento Búlgaro", desc: "Pé traseiro em cadeira, agache com a perna da frente." },
  "Cadeira Extensora": { nome: "Agachamento Isométrico (parede)", desc: "Costas na parede, desça até 90° e segure." },
  "Mesa Flexora": { nome: "Ponte de Glúteo", desc: "Deitado, eleve o quadril contraindo glúteos e posteriores." },
  "Stiff": { nome: "Stiff Unilateral", desc: "Em pé, incline com uma perna, outra estendida atrás." },
  "Panturrilha em Pé": { nome: "Elevação de Panturrilha (degrau)", desc: "Em um degrau, eleve os calcanhares." },
  "Panturrilha Sentado": { nome: "Elevação de Panturrilha Sentado", desc: "Sentado, peso nos joelhos, eleve calcanhares." },
  "Desenvolvimento Máquina": { nome: "Pike Push-Up", desc: "Em V invertido, flexione empurrando a cabeça ao chão." },
  "Desenvolvimento Militar": { nome: "Pike Push-Up", desc: "Posição de V invertido, empurre o corpo para cima." },
  "Desenvolvimento Arnold": { nome: "Pike Push-Up com Rotação", desc: "Pike push-up adicionando rotação dos punhos." },
  "Elevação Lateral": { nome: "Elevação Lateral com Garrafas", desc: "Garrafas de 2L em cada mão, eleve lateralmente." },
  "Elevação Frontal": { nome: "Elevação Frontal com Garrafas", desc: "Garrafas à frente até a linha dos ombros." },
  "Elevação Frontal Alternada": { nome: "Elevação Frontal Alternada com Garrafas", desc: "Alternando garrafas à frente." },
  "Face Pull": { nome: "Face Pull com Elástico", desc: "Elástico preso à frente, puxe ao rosto abrindo cotovelos." },
  "Rosca Direta": { nome: "Rosca com Galão", desc: "Galão cheio, flexione os cotovelos." },
  "Rosca Direta Barra": { nome: "Rosca com Galão", desc: "Galão de água, curl controlado." },
  "Rosca Martelo": { nome: "Rosca Martelo com Galão", desc: "Pegada neutra no galão, alternando braços." },
  "Rosca Scott": { nome: "Rosca Concentrada", desc: "Sentado, cotovelo no joelho, flexione com garrafa." },
  "Tríceps Testa": { nome: "Flexão Diamante", desc: "Mãos juntas formando diamante, foco no tríceps." },
  "Tríceps Corda": { nome: "Tríceps no Banco", desc: "Mãos no banco atrás, estenda os braços." },
  "Mergulho Paralelas": { nome: "Mergulho em Cadeiras", desc: "Entre duas cadeiras, mergulhe estendendo os braços." },
  "Abdominal na Roldana": { nome: "Abdominal com Toalha", desc: "Joelhos no chão, deslize toalha à frente e volte." },
  "Agachamento Livre": { nome: "Agachamento com Mochila", desc: "Mochila com peso nas costas, agache profundo." },
  "Agachamento Búlgaro": { nome: "Agachamento Búlgaro", desc: "Pé traseiro na cadeira, agache com peso corporal." },
  "Remada Curvada Pronada": { nome: "Remada Invertida Pronada", desc: "Sob mesa, pegada pronada, puxe o corpo." },
};

// === Enhanced alternative exercises with home/gym awareness ===
// Each exercise must have 3-5 alternatives with variety (machine, free weight, cable, bodyweight)
export const gymAlternatives: Record<string, string[]> = {
  // PEITO
  "Supino Reto": ["Supino com Halteres", "Supino Máquina", "Supino Inclinado", "Supino Smith", "Flexão com Peso"],
  "Supino Reto Máquina": ["Supino Reto", "Supino com Halteres", "Supino Smith", "Flexão de Braço", "Cross Over"],
  "Supino Inclinado Halteres": ["Supino Inclinado Barra", "Supino Inclinado Máquina", "Crucifixo Inclinado", "Cross Over", "Flexão Declinada"],
  "Supino com Halteres": ["Supino Reto", "Supino Máquina", "Crucifixo", "Cross Over", "Flexão de Braço"],
  "Crucifixo": ["Crucifixo Máquina", "Cross Over", "Peck Deck", "Crucifixo Inclinado", "Flexão Aberta"],
  "Crucifixo Máquina": ["Crucifixo", "Cross Over", "Peck Deck", "Crucifixo Inclinado", "Supino com Halteres"],
  "Cross Over": ["Crucifixo", "Crucifixo Máquina", "Peck Deck", "Crucifixo Inclinado", "Flexão Aberta"],
  "Crucifixo Inclinado": ["Crucifixo", "Cross Over", "Supino Inclinado Halteres", "Peck Deck", "Flexão Declinada"],
  "Flexão de Braço": ["Supino Reto", "Supino Máquina", "Flexão Inclinada", "Flexão Diamante", "Flexão com Peso"],
  "Flexão com Peso": ["Flexão de Braço", "Supino Reto", "Supino com Halteres", "Flexão Diamante", "Supino Máquina"],
  "Peck Deck": ["Crucifixo", "Cross Over", "Crucifixo Máquina", "Crucifixo Inclinado", "Flexão Aberta"],
  // COSTAS
  "Pulldown": ["Barra Fixa", "Pulldown Pegada Fechada", "Pullover Cabo", "Remada Alta", "Remada Invertida"],
  "Barra Fixa": ["Pulldown", "Pulldown Pegada Fechada", "Barra Fixa Supinada", "Remada Invertida", "Pullover Cabo"],
  "Barra Fixa com Peso": ["Barra Fixa", "Pulldown", "Pulldown Pegada Fechada", "Barra Fixa Supinada", "Remada Invertida"],
  "Barra Fixa Supinada": ["Barra Fixa", "Pulldown", "Pulldown Pegada Fechada", "Remada Invertida", "Pullover Cabo"],
  "Remada Curvada": ["Remada Máquina", "Remada Unilateral", "Remada Baixa", "Remada Cavaleiro", "Remada Invertida"],
  "Remada Máquina": ["Remada Curvada", "Remada Unilateral", "Remada Baixa", "Remada Cavaleiro", "Remada com Elástico"],
  "Remada Unilateral": ["Remada Curvada", "Remada Máquina", "Remada Baixa", "Remada Cavaleiro", "Remada Invertida"],
  "Remada Baixa": ["Remada Curvada", "Remada Máquina", "Remada Unilateral", "Remada Cavaleiro", "Remada com Elástico"],
  "Remada Cavaleiro": ["Remada Curvada", "Remada Máquina", "Remada Baixa", "Remada Unilateral", "Remada Invertida"],
  "Remada Curvada Pronada": ["Remada Curvada", "Remada Cavaleiro", "Remada Máquina", "Remada Baixa", "Remada Invertida"],
  "Pulldown Pegada Fechada": ["Pulldown", "Barra Fixa", "Pullover Cabo", "Barra Fixa Supinada", "Remada Invertida"],
  "Pullover Cabo": ["Pulldown", "Pulldown Pegada Fechada", "Barra Fixa", "Remada Alta", "Remada Invertida"],
  "Remada Alta": ["Face Pull", "Elevação Lateral", "Crucifixo Inverso", "Pulldown", "Remada Curvada"],
  "Remada Invertida": ["Barra Fixa", "Pulldown", "Remada Curvada", "Remada Máquina", "Remada Baixa"],
  // PERNAS
  "Agachamento Livre": ["Leg Press", "Agachamento Smith", "Agachamento Búlgaro", "Agachamento Goblet", "Hack Squat"],
  "Agachamento Búlgaro": ["Agachamento Livre", "Leg Press", "Avanço", "Agachamento Goblet", "Hack Squat"],
  "Agachamento Goblet": ["Agachamento Livre", "Leg Press", "Agachamento Búlgaro", "Avanço", "Agachamento com Mochila"],
  "Agachamento Smith": ["Agachamento Livre", "Leg Press", "Hack Squat", "Agachamento Goblet", "Agachamento Búlgaro"],
  "Leg Press": ["Leg Press 45°", "Agachamento Livre", "Agachamento Smith", "Hack Squat", "Agachamento Goblet"],
  "Leg Press 45°": ["Leg Press", "Agachamento Livre", "Agachamento Smith", "Hack Squat", "Agachamento Búlgaro"],
  "Hack Squat": ["Leg Press", "Agachamento Smith", "Agachamento Livre", "Agachamento Goblet", "Avanço"],
  "Cadeira Extensora": ["Extensão de Pernas", "Agachamento Goblet", "Leg Press", "Agachamento Isométrico", "Avanço"],
  "Extensão de Pernas": ["Cadeira Extensora", "Agachamento Goblet", "Leg Press", "Avanço", "Agachamento Livre"],
  "Mesa Flexora": ["Stiff", "Flexão de Pernas em Pé", "Boa Manhã", "Elevação Pélvica", "Ponte de Glúteo"],
  "Stiff": ["Mesa Flexora", "Levantamento Terra", "Boa Manhã", "Elevação Pélvica", "Stiff Unilateral"],
  "Stiff Unilateral": ["Stiff", "Mesa Flexora", "Levantamento Terra", "Boa Manhã", "Ponte de Glúteo"],
  "Levantamento Terra": ["Stiff", "Boa Manhã", "Mesa Flexora", "Agachamento Livre", "Elevação Pélvica"],
  "Boa Manhã": ["Stiff", "Mesa Flexora", "Levantamento Terra", "Elevação Pélvica", "Ponte de Glúteo"],
  "Avanço": ["Agachamento Búlgaro", "Agachamento Goblet", "Agachamento Livre", "Leg Press", "Hack Squat"],
  "Elevação Pélvica": ["Ponte de Glúteo", "Stiff", "Mesa Flexora", "Boa Manhã", "Agachamento Búlgaro"],
  "Ponte de Glúteo": ["Elevação Pélvica", "Stiff", "Mesa Flexora", "Agachamento Búlgaro", "Avanço"],
  "Panturrilha em Pé": ["Panturrilha Sentado", "Panturrilha no Leg Press", "Elevação de Panturrilha"],
  "Panturrilha Sentado": ["Panturrilha em Pé", "Panturrilha no Leg Press", "Elevação de Panturrilha"],
  "Panturrilha no Leg Press": ["Panturrilha em Pé", "Panturrilha Sentado", "Elevação de Panturrilha"],
  "Flexão de Pernas em Pé": ["Mesa Flexora", "Stiff", "Elevação Pélvica", "Ponte de Glúteo", "Boa Manhã"],
  // OMBROS
  "Desenvolvimento Máquina": ["Desenvolvimento Militar", "Desenvolvimento Arnold", "Desenvolvimento Halteres", "Pike Push-Up", "Elevação Frontal"],
  "Desenvolvimento Militar": ["Desenvolvimento Máquina", "Desenvolvimento Arnold", "Desenvolvimento Halteres", "Pike Push-Up", "Elevação Frontal"],
  "Desenvolvimento Arnold": ["Desenvolvimento Militar", "Desenvolvimento Máquina", "Desenvolvimento Halteres", "Elevação Lateral", "Pike Push-Up"],
  "Desenvolvimento Halteres": ["Desenvolvimento Militar", "Desenvolvimento Máquina", "Desenvolvimento Arnold", "Pike Push-Up", "Elevação Frontal"],
  "Elevação Lateral": ["Elevação Lateral Cabo", "Elevação Lateral Máquina", "Crucifixo Inverso", "Elevação Frontal", "Elevação Lateral com Garrafas"],
  "Elevação Lateral Cabo": ["Elevação Lateral", "Elevação Lateral Máquina", "Crucifixo Inverso", "Elevação Frontal", "Face Pull"],
  "Elevação Lateral Máquina": ["Elevação Lateral", "Elevação Lateral Cabo", "Crucifixo Inverso", "Face Pull", "Elevação Frontal"],
  "Elevação Frontal": ["Elevação Frontal Alternada", "Elevação Frontal com Barra", "Elevação Lateral", "Desenvolvimento Halteres", "Elevação Frontal com Garrafas"],
  "Elevação Frontal Alternada": ["Elevação Frontal", "Elevação Frontal com Barra", "Elevação Lateral", "Desenvolvimento Halteres", "Pike Push-Up"],
  "Elevação Frontal com Barra": ["Elevação Frontal", "Elevação Frontal Alternada", "Elevação Lateral", "Desenvolvimento Militar", "Pike Push-Up"],
  "Face Pull": ["Crucifixo Inverso", "Elevação Lateral Cabo", "Elevação Lateral", "Remada Alta", "Face Pull com Elástico"],
  "Crucifixo Inverso": ["Face Pull", "Elevação Lateral Cabo", "Elevação Lateral", "Remada Alta", "Face Pull com Elástico"],
  // BÍCEPS
  "Rosca Direta": ["Rosca Direta Barra", "Rosca Alternada", "Rosca Scott", "Rosca Martelo", "Rosca Concentrada"],
  "Rosca Direta Barra": ["Rosca Direta", "Rosca Alternada", "Rosca Scott", "Rosca Martelo", "Rosca Concentrada"],
  "Rosca Martelo": ["Rosca Alternada", "Rosca Concentrada", "Rosca Direta", "Rosca Scott", "Rosca Martelo com Galão"],
  "Rosca Scott": ["Rosca Direta", "Rosca Concentrada", "Rosca Alternada", "Rosca Martelo", "Rosca Direta Barra"],
  "Rosca Alternada": ["Rosca Direta", "Rosca Martelo", "Rosca Concentrada", "Rosca Scott", "Rosca com Galão"],
  "Rosca Concentrada": ["Rosca Scott", "Rosca Alternada", "Rosca Direta", "Rosca Martelo", "Rosca com Galão"],
  // TRÍCEPS
  "Tríceps Testa": ["Tríceps Corda", "Tríceps Francês", "Tríceps Barra", "Mergulho Paralelas", "Tríceps Banco"],
  "Tríceps Corda": ["Tríceps Testa", "Tríceps Barra", "Tríceps Francês", "Mergulho Paralelas", "Tríceps Banco"],
  "Tríceps Barra": ["Tríceps Corda", "Tríceps Testa", "Tríceps Francês", "Mergulho Paralelas", "Tríceps Banco"],
  "Tríceps Francês": ["Tríceps Testa", "Tríceps Corda", "Tríceps Barra", "Mergulho Paralelas", "Tríceps Banco"],
  "Mergulho Paralelas": ["Tríceps Banco", "Tríceps Corda", "Tríceps Testa", "Tríceps Francês", "Mergulho em Cadeiras"],
  "Tríceps Banco": ["Mergulho Paralelas", "Tríceps Corda", "Tríceps Testa", "Tríceps Francês", "Mergulho em Cadeiras"],
  // ABDÔMEN
  "Prancha Frontal": ["Prancha Lateral", "Prancha Dinâmica", "Abdominal Crunch", "Abdominal Bicicleta", "Elevação de Pernas"],
  "Prancha Lateral": ["Prancha Frontal", "Prancha Dinâmica", "Abdominal Bicicleta", "Abdominal Crunch", "Elevação de Pernas"],
  "Abdominal Crunch": ["Abdominal Bicicleta", "Prancha Frontal", "Abdominal Infra", "Elevação de Pernas", "Abdominal na Roldana"],
  "Abdominal Bicicleta": ["Abdominal Crunch", "Prancha Frontal", "Abdominal na Roldana", "Elevação de Pernas", "Prancha Dinâmica"],
  "Elevação de Pernas": ["Abdominal Infra", "Abdominal Bicicleta", "Prancha Frontal", "Abdominal na Roldana", "Dragon Flag"],
  "Abdominal Infra": ["Elevação de Pernas", "Abdominal Crunch", "Abdominal Bicicleta", "Prancha Frontal", "Abdominal na Roldana"],
  "Abdominal na Roldana": ["Abdominal Crunch", "Abdominal Bicicleta", "Prancha Frontal", "Elevação de Pernas", "Dragon Flag"],
  "Prancha Dinâmica": ["Prancha Frontal", "Prancha Lateral", "Abdominal Bicicleta", "Abdominal Crunch", "Elevação de Pernas"],
  "Dragon Flag": ["Abdominal na Roldana", "Elevação de Pernas", "Prancha Dinâmica", "Abdominal Bicicleta", "Abdominal Infra"],
  // CARDIO
  "Corrida na Esteira": ["Bicicleta Ergométrica", "Caminhada Inclinada", "Burpees", "Pular Corda"],
  "Bicicleta Ergométrica": ["Corrida na Esteira", "Caminhada Inclinada", "Burpees", "Pular Corda"],
  "Caminhada Inclinada": ["Corrida na Esteira", "Bicicleta Ergométrica", "Burpees"],
  "Burpees": ["Corrida na Esteira", "Bicicleta Ergométrica", "Pular Corda"],
};

// Get alternatives based on training location
export function getAlternatives(exerciseName: string, trainingLocation?: string): { nome: string; desc?: string; tag?: string }[] {
  const results: { nome: string; desc?: string; tag?: string }[] = [];

  if (trainingLocation === "casa") {
    // Show home alternative first if available
    const homeAlt = homeAlternatives[exerciseName];
    if (homeAlt) {
      results.push({ nome: homeAlt.nome, desc: homeAlt.desc, tag: "🏠 Casa" });
    }
  }

  // Always show gym/general alternatives
  const alts = gymAlternatives[exerciseName] || [];
  alts.forEach(a => {
    if (!results.find(r => r.nome === a)) {
      results.push({ nome: a, tag: trainingLocation === "casa" ? "🏋️ Academia" : undefined });
    }
  });

  // If training at home, also add other home alternatives from same muscle group
  if (trainingLocation === "casa" && results.length < 5) {
    Object.entries(homeAlternatives).forEach(([key, val]) => {
      if (key !== exerciseName && !results.find(r => r.nome === val.nome) && results.length < 4) {
        // Only add if it's roughly the same muscle group area
        const sameGroup = gymAlternatives[exerciseName]?.some(a => gymAlternatives[key]?.includes(a));
        if (sameGroup) {
          results.push({ nome: val.nome, desc: val.desc, tag: "🏠 Casa" });
        }
      }
    });
  }

  if (results.length === 0) {
    results.push({ nome: "Exercício alternativo 1" }, { nome: "Exercício alternativo 2" });
  }

  return results.slice(0, 5);
}

// Get stretching exercises for a workout day
export function getStretchingForDay(grupo: string): { nome: string; duracao: string; desc: string }[] {
  const grupoLower = grupo.toLowerCase();
  const stretches: { nome: string; duracao: string; desc: string }[] = [];
  const added = new Set<string>();

  for (const key of Object.keys(stretchingDB)) {
    if (grupoLower.includes(key)) {
      stretchingDB[key].forEach(s => {
        if (!added.has(s.nome)) {
          stretches.push(s);
          added.add(s.nome);
        }
      });
    }
  }

  // Limit to 4-5 stretches
  return stretches.slice(0, 5);
}

// Get cardio recommendation
export function getCardioRecommendation(objective?: string): CardioRecommendation | null {
  const key = objective === "manter" ? "condicionamento" : objective || "condicionamento";
  const options = cardioByObjective[key] || cardioByObjective.condicionamento;
  return options[0] || null;
}

// Inactivity suggestion
export type InactivitySuggestion = {
  titulo: string;
  desc: string;
  tipo: "cardio" | "treino_rapido" | "alongamento";
  icone: string;
};

export function getInactivitySuggestion(daysSinceLastWorkout: number): InactivitySuggestion | null {
  if (daysSinceLastWorkout < 2) return null;
  if (daysSinceLastWorkout <= 3) {
    return {
      titulo: "Cardio Leve",
      desc: "Que tal uma caminhada de 20 minutos para manter o ritmo?",
      tipo: "cardio",
      icone: "🚶",
    };
  }
  if (daysSinceLastWorkout <= 5) {
    return {
      titulo: "Treino Rápido",
      desc: "Faça um treino de 15 minutos para voltar à rotina!",
      tipo: "treino_rapido",
      icone: "⚡",
    };
  }
  return {
    titulo: "Hora de Voltar!",
    desc: `Você está há ${daysSinceLastWorkout} dias sem treinar. Comece com um alongamento leve!`,
    tipo: "alongamento",
    icone: "🧘",
  };
}
