type Exercise = {
  nome: string;
  series: string;
  reps: string;
  desc: string;
  descanso: string;
};

export type DayIntensity = "pesado" | "moderado" | "leve";

type WorkoutDay = {
  dia: string;
  grupo: string;
  exercicios: Exercise[];
  intensidade?: DayIntensity;
};

const diasSemana = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

// Volume multiplier by level
const levelConfig = {
  iniciante: { seriesMultiplier: 0.75, note: "Foco em aprendizado motor" },
  intermediario: { seriesMultiplier: 1, note: "Volume moderado" },
  avancado: { seriesMultiplier: 1.25, note: "Alta intensidade" },
};

const exerciseDB: Record<string, Record<string, Exercise[]>> = {
  peito: {
    iniciante: [
      { nome: "Supino Reto Máquina", series: "3", reps: "12", desc: "Empurre a barra na máquina Smith mantendo cotovelos a 45°.", descanso: "60s" },
      { nome: "Crucifixo Máquina", series: "3", reps: "12", desc: "Junte os braços na frente do peito na máquina.", descanso: "60s" },
      { nome: "Flexão de Braço", series: "3", reps: "10", desc: "Mãos na largura dos ombros, desça controladamente.", descanso: "45s" },
    ],
    intermediario: [
      { nome: "Supino Reto", series: "4", reps: "10", desc: "Barra na linha dos mamilos, desça controladamente e empurre.", descanso: "90s" },
      { nome: "Supino Inclinado Halteres", series: "4", reps: "10", desc: "Banco a 30-45°, movimento de empurrar com halteres.", descanso: "90s" },
      { nome: "Crucifixo", series: "3", reps: "12", desc: "Braços abertos com halteres, junte na frente do peito.", descanso: "60s" },
      { nome: "Cross Over", series: "3", reps: "12", desc: "Cruze os cabos na frente do corpo, contraindo o peitoral.", descanso: "60s" },
    ],
    avancado: [
      { nome: "Supino Reto", series: "5", reps: "8", desc: "Carga pesada, controle a excêntrica em 3s.", descanso: "120s" },
      { nome: "Supino Inclinado Halteres", series: "4", reps: "10", desc: "Banco a 30°, amplitude completa.", descanso: "90s" },
      { nome: "Crucifixo Inclinado", series: "4", reps: "12", desc: "No banco inclinado, foque na contração máxima.", descanso: "60s" },
      { nome: "Cross Over", series: "3", reps: "15", desc: "Drop set na última série.", descanso: "60s" },
      { nome: "Flexão com Peso", series: "3", reps: "12", desc: "Com anilha nas costas para sobrecarga.", descanso: "60s" },
    ],
  },
  costas: {
    iniciante: [
      { nome: "Pulldown", series: "3", reps: "12", desc: "Puxe a barra até o peito, controlando a volta.", descanso: "60s" },
      { nome: "Remada Máquina", series: "3", reps: "12", desc: "Puxe em direção ao abdômen na máquina.", descanso: "60s" },
      { nome: "Remada Baixa", series: "3", reps: "12", desc: "Cabo baixo, puxe em direção ao umbigo.", descanso: "60s" },
    ],
    intermediario: [
      { nome: "Barra Fixa", series: "4", reps: "8", desc: "Pegada pronada, puxe até o queixo passar a barra.", descanso: "90s" },
      { nome: "Remada Curvada", series: "4", reps: "10", desc: "Incline a 45°, puxe a barra ao abdômen.", descanso: "90s" },
      { nome: "Pulldown", series: "3", reps: "12", desc: "Puxe a barra do cabo em direção ao peito.", descanso: "60s" },
      { nome: "Remada Unilateral", series: "3", reps: "12", desc: "Apoie um joelho no banco, remada com halter.", descanso: "60s" },
    ],
    avancado: [
      { nome: "Barra Fixa com Peso", series: "4", reps: "8", desc: "Com cinto de carga, pegada pronada.", descanso: "120s" },
      { nome: "Remada Cavaleiro", series: "4", reps: "10", desc: "No aparelho T-bar, carga pesada.", descanso: "90s" },
      { nome: "Pulldown Pegada Fechada", series: "4", reps: "10", desc: "Triângulo, foco no dorsal inferior.", descanso: "60s" },
      { nome: "Remada Curvada Pronada", series: "4", reps: "10", desc: "Barra com pegada pronada, costas superiores.", descanso: "90s" },
      { nome: "Pullover Cabo", series: "3", reps: "12", desc: "Estenda os braços mantendo cotovelos levemente flexionados.", descanso: "60s" },
    ],
  },
  pernas: {
    iniciante: [
      { nome: "Leg Press", series: "3", reps: "12", desc: "Pés na largura dos ombros, desça controlando.", descanso: "60s" },
      { nome: "Cadeira Extensora", series: "3", reps: "12", desc: "Estenda as pernas contra a resistência.", descanso: "60s" },
      { nome: "Mesa Flexora", series: "3", reps: "12", desc: "Flexione as pernas contra a resistência.", descanso: "60s" },
    ],
    intermediario: [
      { nome: "Agachamento Livre", series: "4", reps: "10", desc: "Barra nas costas, agache até paralelo.", descanso: "120s" },
      { nome: "Leg Press 45°", series: "4", reps: "12", desc: "Pés na plataforma, controle a descida.", descanso: "90s" },
      { nome: "Cadeira Extensora", series: "3", reps: "12", desc: "Estenda e segure 1s no topo.", descanso: "60s" },
      { nome: "Mesa Flexora", series: "3", reps: "12", desc: "Flexione mantendo quadril no banco.", descanso: "60s" },
      { nome: "Panturrilha em Pé", series: "4", reps: "15", desc: "Amplitude completa, segure 2s no topo.", descanso: "45s" },
    ],
    avancado: [
      { nome: "Agachamento Livre", series: "5", reps: "6-8", desc: "Carga pesada, profundidade total.", descanso: "180s" },
      { nome: "Agachamento Búlgaro", series: "4", reps: "10", desc: "Pé traseiro elevado, halter em cada mão.", descanso: "90s" },
      { nome: "Leg Press", series: "4", reps: "12", desc: "Alta carga, drop set na última série.", descanso: "90s" },
      { nome: "Stiff", series: "4", reps: "10", desc: "Barra, pernas quase estendidas, foco no posterior.", descanso: "90s" },
      { nome: "Cadeira Extensora", series: "3", reps: "15", desc: "Unilateral, pausa no topo.", descanso: "60s" },
      { nome: "Panturrilha Sentado", series: "5", reps: "15", desc: "Amplitude máxima, controle total.", descanso: "45s" },
    ],
  },
  ombros: {
    iniciante: [
      { nome: "Desenvolvimento Máquina", series: "3", reps: "12", desc: "Empurre acima da cabeça na máquina.", descanso: "60s" },
      { nome: "Elevação Lateral", series: "3", reps: "12", desc: "Eleve os halteres até a linha dos ombros.", descanso: "45s" },
    ],
    intermediario: [
      { nome: "Desenvolvimento Militar", series: "4", reps: "10", desc: "Barra ou halteres, empurre acima da cabeça.", descanso: "90s" },
      { nome: "Elevação Lateral", series: "4", reps: "12", desc: "Leve flexão de cotovelo, controle a descida.", descanso: "60s" },
      { nome: "Elevação Frontal", series: "3", reps: "12", desc: "Halteres à frente até linha dos ombros.", descanso: "60s" },
    ],
    avancado: [
      { nome: "Desenvolvimento Arnold", series: "4", reps: "10", desc: "Rotação durante o movimento, amplitude completa.", descanso: "90s" },
      { nome: "Elevação Lateral", series: "5", reps: "12", desc: "Drop set, manter tensão constante.", descanso: "60s" },
      { nome: "Elevação Frontal Alternada", series: "3", reps: "12", desc: "Halteres, foco na deltóide anterior.", descanso: "45s" },
      { nome: "Face Pull", series: "4", reps: "15", desc: "Cabo alto, rotação externa no final.", descanso: "45s" },
    ],
  },
  biceps: {
    iniciante: [
      { nome: "Rosca Direta Barra", series: "3", reps: "12", desc: "Flexione os cotovelos curvando a barra.", descanso: "60s" },
    ],
    intermediario: [
      { nome: "Rosca Direta", series: "3", reps: "12", desc: "Barra reta, cotovelos fixos.", descanso: "60s" },
      { nome: "Rosca Martelo", series: "3", reps: "12", desc: "Pegada neutra, alternando.", descanso: "60s" },
    ],
    avancado: [
      { nome: "Rosca Direta Barra", series: "4", reps: "10", desc: "Carga pesada, sem embalar.", descanso: "90s" },
      { nome: "Rosca Scott", series: "3", reps: "12", desc: "No banco Scott para isolamento.", descanso: "60s" },
      { nome: "Rosca Martelo", series: "3", reps: "12", desc: "Foco no braquial e braquiorradial.", descanso: "60s" },
    ],
  },
  triceps: {
    iniciante: [
      { nome: "Tríceps Corda", series: "3", reps: "12", desc: "Cabo, empurre para baixo estendendo cotovelos.", descanso: "60s" },
    ],
    intermediario: [
      { nome: "Tríceps Testa", series: "3", reps: "12", desc: "Barra EZ, estenda partindo da testa.", descanso: "60s" },
      { nome: "Tríceps Corda", series: "3", reps: "12", desc: "Cabo, abra a corda no final.", descanso: "60s" },
    ],
    avancado: [
      { nome: "Tríceps Testa", series: "4", reps: "10", desc: "Barra EZ, excêntrica lenta.", descanso: "90s" },
      { nome: "Tríceps Corda", series: "3", reps: "15", desc: "Drop set na última série.", descanso: "60s" },
      { nome: "Mergulho Paralelas", series: "3", reps: "12", desc: "Com peso adicional se necessário.", descanso: "90s" },
    ],
  },
  abdomen: {
    iniciante: [
      { nome: "Prancha Frontal", series: "3", reps: "30s", desc: "Mantenha corpo reto, abdômen contraído.", descanso: "45s" },
      { nome: "Abdominal Crunch", series: "3", reps: "15", desc: "Suba os ombros do chão, sem forçar pescoço.", descanso: "45s" },
    ],
    intermediario: [
      { nome: "Prancha Frontal", series: "3", reps: "45s", desc: "Corpo reto, sem elevar o quadril.", descanso: "45s" },
      { nome: "Abdominal Bicicleta", series: "3", reps: "20", desc: "Alterne cotovelo ao joelho oposto.", descanso: "45s" },
      { nome: "Elevação de Pernas", series: "3", reps: "12", desc: "Deitado, suba as pernas mantendo lombar no chão.", descanso: "60s" },
    ],
    avancado: [
      { nome: "Abdominal na Roldana", series: "4", reps: "15", desc: "Cabo alto, foco na contração.", descanso: "60s" },
      { nome: "Prancha Dinâmica", series: "3", reps: "45s", desc: "Alterne cotovelos e mãos.", descanso: "45s" },
      { nome: "Dragon Flag", series: "3", reps: "8", desc: "Movimento avançado, corpo reto como bandeira.", descanso: "90s" },
    ],
  },
  hiit: {
    iniciante: [
      { nome: "Jumping Jacks", series: "3", reps: "30s", desc: "Pule abrindo braços e pernas.", descanso: "30s" },
      { nome: "Mountain Climbers", series: "3", reps: "30s", desc: "Em prancha, alterne joelhos ao peito.", descanso: "30s" },
      { nome: "Agachamento com Salto", series: "3", reps: "10", desc: "Agache e salte explosivamente.", descanso: "45s" },
    ],
    intermediario: [
      { nome: "Burpees", series: "4", reps: "12", desc: "Em pé, agache, flexão, pule. Sem pausa.", descanso: "30s" },
      { nome: "Mountain Climbers", series: "4", reps: "30s", desc: "Velocidade máxima, core ativado.", descanso: "30s" },
      { nome: "Box Jump", series: "3", reps: "12", desc: "Saltos explosivos sobre caixa.", descanso: "45s" },
      { nome: "Corda Naval", series: "4", reps: "30s", desc: "Ondulações com máxima intensidade.", descanso: "30s" },
    ],
    avancado: [
      { nome: "Burpees com Salto", series: "5", reps: "15", desc: "Adicionando salto tuck no final.", descanso: "20s" },
      { nome: "Thruster", series: "4", reps: "12", desc: "Agachamento + desenvolvimento em sequência.", descanso: "30s" },
      { nome: "Kettlebell Swing", series: "5", reps: "15", desc: "Quadril explosivo, carga desafiadora.", descanso: "30s" },
      { nome: "Sprint", series: "8", reps: "20s", desc: "Sprint máximo com recuperação ativa.", descanso: "40s" },
    ],
  },
  cardio: {
    iniciante: [
      { nome: "Caminhada Inclinada", series: "1", reps: "20min", desc: "Esteira com 8-10% de inclinação, ritmo moderado.", descanso: "—" },
    ],
    intermediario: [
      { nome: "Corrida Intervalada", series: "1", reps: "25min", desc: "Alterne 1min intenso + 1min leve.", descanso: "—" },
    ],
    avancado: [
      { nome: "HIIT Cardio", series: "1", reps: "30min", desc: "30s sprint + 30s descanso. Bike ou esteira.", descanso: "—" },
    ],
  },
};

type Objective = "emagrecer" | "massa" | "condicionamento";
type Level = "iniciante" | "intermediario" | "avancado";
export type BodyFocus = "superior" | "inferior" | "completo";

const upperGroups = ["peito", "costas", "ombros", "biceps", "triceps"];
const lowerGroups = ["pernas"];
const coreAndCardio = ["abdomen", "hiit", "cardio"];

const splitTemplates: Record<Objective, Record<number, string[][]>> = {
  emagrecer: {
    3: [["hiit", "abdomen"], ["pernas", "cardio"], ["peito", "costas", "hiit"]],
    4: [["hiit", "abdomen"], ["pernas"], ["peito", "triceps", "hiit"], ["costas", "biceps", "cardio"]],
    5: [["hiit", "abdomen"], ["pernas"], ["peito", "triceps"], ["costas", "biceps"], ["hiit", "ombros", "cardio"]],
    6: [["peito", "hiit"], ["costas", "abdomen"], ["pernas"], ["ombros", "hiit"], ["biceps", "triceps"], ["hiit", "cardio"]],
  },
  massa: {
    3: [["peito", "triceps"], ["costas", "biceps"], ["pernas", "ombros"]],
    4: [["peito", "triceps"], ["costas", "biceps"], ["pernas"], ["ombros", "abdomen"]],
    5: [["peito"], ["costas"], ["pernas"], ["ombros", "abdomen"], ["biceps", "triceps"]],
    6: [["peito"], ["costas"], ["pernas"], ["ombros"], ["biceps", "triceps"], ["pernas", "abdomen"]],
  },
  condicionamento: {
    3: [["hiit", "peito", "costas"], ["pernas", "cardio"], ["hiit", "ombros", "abdomen"]],
    4: [["hiit", "peito"], ["pernas", "cardio"], ["hiit", "costas"], ["ombros", "abdomen", "cardio"]],
    5: [["hiit", "peito"], ["pernas"], ["costas", "cardio"], ["hiit", "ombros"], ["abdomen", "cardio"]],
    6: [["hiit", "peito"], ["pernas"], ["costas", "hiit"], ["ombros", "cardio"], ["hiit", "abdomen"], ["pernas", "cardio"]],
  },
};

// Focus-specific split overrides
const focusSplitTemplates: Record<BodyFocus, Record<Objective, Record<number, string[][]>>> = {
  superior: {
    emagrecer: {
      3: [["peito", "costas", "hiit"], ["ombros", "biceps", "hiit"], ["triceps", "peito", "cardio"]],
      4: [["peito", "triceps", "hiit"], ["costas", "biceps"], ["ombros", "hiit"], ["peito", "costas", "cardio"]],
      5: [["peito", "hiit"], ["costas"], ["ombros", "triceps"], ["biceps", "peito", "hiit"], ["costas", "ombros", "cardio"]],
      6: [["peito", "hiit"], ["costas"], ["ombros"], ["biceps", "triceps", "hiit"], ["peito", "costas"], ["ombros", "cardio"]],
    },
    massa: {
      3: [["peito", "triceps"], ["costas", "biceps"], ["ombros", "peito"]],
      4: [["peito", "triceps"], ["costas", "biceps"], ["ombros"], ["peito", "costas", "abdomen"]],
      5: [["peito"], ["costas"], ["ombros"], ["biceps", "triceps"], ["peito", "costas", "abdomen"]],
      6: [["peito"], ["costas"], ["ombros"], ["biceps", "triceps"], ["peito", "costas"], ["ombros", "abdomen"]],
    },
    condicionamento: {
      3: [["hiit", "peito", "costas"], ["ombros", "biceps", "cardio"], ["hiit", "triceps", "abdomen"]],
      4: [["hiit", "peito"], ["costas", "biceps", "cardio"], ["hiit", "ombros"], ["triceps", "abdomen", "cardio"]],
      5: [["hiit", "peito"], ["costas"], ["ombros", "cardio"], ["hiit", "biceps", "triceps"], ["abdomen", "cardio"]],
      6: [["hiit", "peito"], ["costas"], ["ombros", "hiit"], ["biceps", "cardio"], ["triceps", "abdomen"], ["peito", "cardio"]],
    },
  },
  inferior: {
    emagrecer: {
      3: [["pernas", "hiit"], ["pernas", "abdomen", "cardio"], ["pernas", "hiit"]],
      4: [["pernas", "hiit"], ["pernas", "abdomen"], ["pernas", "cardio"], ["pernas", "hiit"]],
      5: [["pernas", "hiit"], ["pernas"], ["pernas", "abdomen", "cardio"], ["pernas", "hiit"], ["pernas", "cardio"]],
      6: [["pernas", "hiit"], ["pernas"], ["pernas", "abdomen"], ["pernas", "hiit"], ["pernas", "cardio"], ["pernas"]],
    },
    massa: {
      3: [["pernas"], ["pernas", "abdomen"], ["pernas"]],
      4: [["pernas"], ["pernas"], ["pernas", "abdomen"], ["pernas"]],
      5: [["pernas"], ["pernas"], ["pernas", "abdomen"], ["pernas"], ["pernas"]],
      6: [["pernas"], ["pernas"], ["pernas"], ["pernas", "abdomen"], ["pernas"], ["pernas"]],
    },
    condicionamento: {
      3: [["pernas", "hiit"], ["pernas", "cardio"], ["pernas", "hiit", "abdomen"]],
      4: [["pernas", "hiit"], ["pernas", "cardio"], ["pernas", "hiit"], ["pernas", "abdomen", "cardio"]],
      5: [["pernas", "hiit"], ["pernas"], ["pernas", "cardio"], ["pernas", "hiit"], ["pernas", "abdomen", "cardio"]],
      6: [["pernas", "hiit"], ["pernas"], ["pernas", "cardio"], ["pernas", "hiit"], ["pernas", "abdomen"], ["pernas", "cardio"]],
    },
  },
  completo: {
    emagrecer: splitTemplates.emagrecer,
    massa: splitTemplates.massa,
    condicionamento: splitTemplates.condicionamento,
  },
};

const groupLabels: Record<string, string> = {
  peito: "Peito", costas: "Costas", pernas: "Pernas", ombros: "Ombros",
  biceps: "Bíceps", triceps: "Tríceps", abdomen: "Abdômen",
  hiit: "HIIT", cardio: "Cardio",
};

export function generateWorkoutPlan(objective: Objective, level: Level, daysPerWeek: number, bodyFocus: BodyFocus = "completo"): WorkoutDay[] {
  const days = Math.max(3, Math.min(6, daysPerWeek));
  const focusTemplates = focusSplitTemplates[bodyFocus] || focusSplitTemplates.completo;
  const split = focusTemplates[objective]?.[days] || focusTemplates[objective]?.[3] || splitTemplates[objective][3];
  const config = levelConfig[level];

  return split.map((muscleGroups, i) => {
    const grupo = muscleGroups.map(g => groupLabels[g] || g).join(" + ");
    const exercicios: Exercise[] = [];

    muscleGroups.forEach(group => {
      const pool = exerciseDB[group]?.[level] || exerciseDB[group]?.intermediario || [];
      pool.forEach(ex => {
        const adjustedSeries = Math.max(2, Math.round(Number(ex.series) * config.seriesMultiplier));
        exercicios.push({ ...ex, series: String(adjustedSeries) });
      });
    });

    return {
      dia: diasSemana[i] || `Dia ${i + 1}`,
      grupo,
      exercicios,
    };
  });
}
