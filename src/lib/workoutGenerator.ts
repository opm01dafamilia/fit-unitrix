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
  // Sub-grupos de pernas para foco inferior com variação
  quadriceps: {
    iniciante: [
      { nome: "Leg Press", series: "3", reps: "12", desc: "Pés na largura dos ombros, foco em empurrar com os calcanhares.", descanso: "60s" },
      { nome: "Cadeira Extensora", series: "3", reps: "12", desc: "Estenda completamente, segure 1s no topo.", descanso: "60s" },
      { nome: "Agachamento Goblet", series: "3", reps: "10", desc: "Segure halter no peito, agache controlando.", descanso: "60s" },
    ],
    intermediario: [
      { nome: "Agachamento Livre", series: "4", reps: "10", desc: "Barra nas costas, desça até paralelo ou abaixo.", descanso: "120s" },
      { nome: "Agachamento Frontal", series: "3", reps: "10", desc: "Barra na frente dos ombros, tronco ereto.", descanso: "90s" },
      { nome: "Leg Press Pés Baixos", series: "4", reps: "12", desc: "Pés na parte inferior da plataforma para ênfase em quadríceps.", descanso: "90s" },
      { nome: "Cadeira Extensora", series: "3", reps: "15", desc: "Unilateral, pausa no topo por 2s.", descanso: "60s" },
    ],
    avancado: [
      { nome: "Agachamento Livre", series: "5", reps: "6-8", desc: "Carga pesada, profundidade total, controle excêntrico.", descanso: "180s" },
      { nome: "Agachamento Hack", series: "4", reps: "10", desc: "Na máquina hack, pés juntos para ênfase no vasto lateral.", descanso: "90s" },
      { nome: "Agachamento Búlgaro", series: "4", reps: "10", desc: "Pé traseiro elevado, halter em cada mão.", descanso: "90s" },
      { nome: "Cadeira Extensora", series: "4", reps: "12", desc: "Drop set na última série.", descanso: "60s" },
      { nome: "Passada Caminhando", series: "3", reps: "12/perna", desc: "Com halteres, passos longos e controlados.", descanso: "60s" },
    ],
  },
  posterior: {
    iniciante: [
      { nome: "Mesa Flexora", series: "3", reps: "12", desc: "Flexione as pernas contra a resistência, mantenha quadril no banco.", descanso: "60s" },
      { nome: "Elevação Pélvica", series: "3", reps: "12", desc: "Deitado, eleve o quadril contraindo glúteos no topo.", descanso: "60s" },
      { nome: "Agachamento Sumô", series: "3", reps: "12", desc: "Pernas afastadas, pontas dos pés para fora, segure halter.", descanso: "60s" },
    ],
    intermediario: [
      { nome: "Stiff", series: "4", reps: "10", desc: "Barra, pernas quase estendidas, sinta o alongamento no posterior.", descanso: "90s" },
      { nome: "Mesa Flexora", series: "4", reps: "12", desc: "Unilateral para equilíbrio entre os lados.", descanso: "60s" },
      { nome: "Hip Thrust", series: "4", reps: "10", desc: "Costas apoiadas no banco, barra no quadril, contraia no topo.", descanso: "90s" },
      { nome: "Cadeira Abdutora", series: "3", reps: "15", desc: "Foco no glúteo médio, controle o retorno.", descanso: "45s" },
    ],
    avancado: [
      { nome: "Stiff Romeno", series: "4", reps: "10", desc: "Barra, descida lenta, alongamento máximo do posterior.", descanso: "90s" },
      { nome: "Hip Thrust", series: "5", reps: "8", desc: "Carga pesada, pausa de 2s no topo.", descanso: "90s" },
      { nome: "Good Morning", series: "3", reps: "12", desc: "Barra nas costas, incline o tronco mantendo costas retas.", descanso: "90s" },
      { nome: "Mesa Flexora Unilateral", series: "4", reps: "10", desc: "Uma perna por vez, excêntrica lenta.", descanso: "60s" },
      { nome: "Elevação Pélvica Unilateral", series: "3", reps: "12", desc: "Uma perna elevada, contraia glúteos no topo.", descanso: "60s" },
    ],
  },
  gluteos: {
    iniciante: [
      { nome: "Elevação Pélvica", series: "3", reps: "15", desc: "Deitado, eleve o quadril e contraia glúteos 2s no topo.", descanso: "45s" },
      { nome: "Agachamento Sumô", series: "3", reps: "12", desc: "Pés afastados, pontas para fora, foco em glúteos.", descanso: "60s" },
      { nome: "Cadeira Abdutora", series: "3", reps: "15", desc: "Abra as pernas contra a resistência.", descanso: "45s" },
    ],
    intermediario: [
      { nome: "Hip Thrust", series: "4", reps: "12", desc: "Costas no banco, barra no quadril, contraia forte no topo.", descanso: "90s" },
      { nome: "Passada Reversa", series: "3", reps: "12/perna", desc: "Passo para trás, joelho quase toca o chão.", descanso: "60s" },
      { nome: "Cadeira Abdutora", series: "4", reps: "15", desc: "Incline levemente o tronco para ativar glúteo máximo.", descanso: "45s" },
      { nome: "Kickback Cabo", series: "3", reps: "12", desc: "No cabo baixo, estenda a perna para trás.", descanso: "45s" },
    ],
    avancado: [
      { nome: "Hip Thrust Pesado", series: "5", reps: "8", desc: "Carga pesada, pausa de 3s no topo.", descanso: "120s" },
      { nome: "Agachamento Sumô Barra", series: "4", reps: "10", desc: "Barra nas costas, foco em glúteos e adutores.", descanso: "90s" },
      { nome: "Passada Lateral", series: "3", reps: "12/lado", desc: "Halteres, passo lateral amplo, foco em glúteo médio.", descanso: "60s" },
      { nome: "Kickback Cabo Pesado", series: "4", reps: "10", desc: "Carga desafiadora, contração máxima.", descanso: "60s" },
      { nome: "Elevação Pélvica Unilateral", series: "3", reps: "12", desc: "Uma perna, carga adicional no quadril.", descanso: "60s" },
    ],
  },
  panturrilha: {
    iniciante: [
      { nome: "Panturrilha em Pé", series: "3", reps: "15", desc: "Suba nas pontas dos pés, segure 1s no topo.", descanso: "30s" },
      { nome: "Panturrilha Sentado", series: "3", reps: "15", desc: "Na máquina sentado, amplitude completa.", descanso: "30s" },
    ],
    intermediario: [
      { nome: "Panturrilha em Pé", series: "4", reps: "15", desc: "Amplitude máxima, segure 2s no topo.", descanso: "45s" },
      { nome: "Panturrilha Sentado", series: "4", reps: "20", desc: "Foco no sóleo, excêntrica lenta.", descanso: "30s" },
    ],
    avancado: [
      { nome: "Panturrilha em Pé Unilateral", series: "4", reps: "12", desc: "Uma perna, carga pesada, pausa no topo.", descanso: "45s" },
      { nome: "Panturrilha Sentado", series: "5", reps: "20", desc: "Drop set na última série.", descanso: "30s" },
      { nome: "Panturrilha no Leg Press", series: "3", reps: "15", desc: "Pontas dos pés na plataforma, amplitude máxima.", descanso: "45s" },
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
  mobilidade: {
    iniciante: [
      { nome: "Alongamento Dinâmico", series: "1", reps: "10min", desc: "Movimentos articulares amplos para todo o corpo.", descanso: "—" },
      { nome: "Foam Roller", series: "1", reps: "10min", desc: "Liberação miofascial em quadríceps, costas e glúteos.", descanso: "—" },
      { nome: "Yoga Flow Básico", series: "1", reps: "10min", desc: "Sequência suave: gato-vaca, cachorro olhando para baixo, guerreiro.", descanso: "—" },
    ],
    intermediario: [
      { nome: "Mobilidade Articular", series: "1", reps: "12min", desc: "Círculos de ombro, quadril e tornozelo com progressão.", descanso: "—" },
      { nome: "Foam Roller Profundo", series: "1", reps: "12min", desc: "Liberação miofascial detalhada em todos os grupos.", descanso: "—" },
      { nome: "Yoga Flow", series: "1", reps: "15min", desc: "Sequência intermediária com foco em flexibilidade.", descanso: "—" },
    ],
    avancado: [
      { nome: "Mobilidade Avançada", series: "1", reps: "15min", desc: "Rotinas de mobilidade com banda elástica e progressão.", descanso: "—" },
      { nome: "Foam Roller + Lacrosse Ball", series: "1", reps: "12min", desc: "Liberação profunda com bola de lacrosse nos pontos-gatilho.", descanso: "—" },
      { nome: "Yoga Flow Avançado", series: "1", reps: "15min", desc: "Sequência avançada com inversões leves e torções.", descanso: "—" },
    ],
  },
  recuperacao: {
    iniciante: [
      { nome: "Caminhada Leve", series: "1", reps: "15min", desc: "Caminhada em ritmo confortável para circulação.", descanso: "—" },
      { nome: "Alongamento Estático", series: "1", reps: "10min", desc: "Segure cada posição por 30s nos principais grupos.", descanso: "—" },
    ],
    intermediario: [
      { nome: "Cardio Leve", series: "1", reps: "15min", desc: "Bike ou caminhada inclinada em ritmo leve.", descanso: "—" },
      { nome: "Alongamento Profundo", series: "1", reps: "12min", desc: "Foco em posterior de coxa, quadril e ombros.", descanso: "—" },
    ],
    avancado: [
      { nome: "Cardio Regenerativo", series: "1", reps: "20min", desc: "Bike leve ou natação com foco em recuperação.", descanso: "—" },
      { nome: "Alongamento + Respiração", series: "1", reps: "15min", desc: "Técnicas de respiração com alongamento profundo.", descanso: "—" },
    ],
  },
};

type Objective = "emagrecer" | "massa" | "condicionamento";
type Level = "iniciante" | "intermediario" | "avancado";
export type BodyFocus = "superior" | "inferior" | "completo";

// Each 7-day entry uses intensity metadata
type SplitEntry = string[];
type SplitEntry7 = { groups: string[]; intensity: DayIntensity };

// =====================================================
// SPLIT TEMPLATES — CORPO COMPLETO (default)
// =====================================================
const splitTemplates: Record<Objective, Record<number, SplitEntry[]>> = {
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

const splitTemplates7: Record<Objective, SplitEntry7[]> = {
  emagrecer: [
    { groups: ["peito", "triceps"], intensity: "pesado" },
    { groups: ["cardio", "abdomen"], intensity: "moderado" },
    { groups: ["costas", "biceps"], intensity: "pesado" },
    { groups: ["hiit", "abdomen"], intensity: "moderado" },
    { groups: ["pernas"], intensity: "pesado" },
    { groups: ["ombros", "hiit"], intensity: "pesado" },
    { groups: ["mobilidade", "recuperacao"], intensity: "leve" },
  ],
  massa: [
    { groups: ["peito", "triceps"], intensity: "pesado" },
    { groups: ["costas", "biceps"], intensity: "pesado" },
    { groups: ["abdomen", "cardio"], intensity: "moderado" },
    { groups: ["pernas"], intensity: "pesado" },
    { groups: ["ombros", "abdomen"], intensity: "moderado" },
    { groups: ["biceps", "triceps", "peito"], intensity: "pesado" },
    { groups: ["mobilidade", "recuperacao"], intensity: "leve" },
  ],
  condicionamento: [
    { groups: ["hiit", "peito"], intensity: "pesado" },
    { groups: ["cardio", "abdomen"], intensity: "moderado" },
    { groups: ["costas", "hiit"], intensity: "pesado" },
    { groups: ["mobilidade", "recuperacao"], intensity: "leve" },
    { groups: ["pernas", "cardio"], intensity: "pesado" },
    { groups: ["ombros", "abdomen", "cardio"], intensity: "moderado" },
    { groups: ["hiit", "pernas"], intensity: "pesado" },
  ],
};

// =====================================================
// SPLIT TEMPLATES — FOCO SUPERIOR
// Prioriza peito, costas, ombros, braços
// Mantém estímulo leve/moderado de inferiores para equilíbrio
// Alterna empurrar/puxar
// =====================================================
const focusSplitTemplates: Record<BodyFocus, Record<Objective, Record<number, SplitEntry[]>>> = {
  superior: {
    emagrecer: {
      // 3d: Empurrar + HIIT | Puxar + HIIT | Braços + Pernas leve
      3: [["peito", "ombros", "hiit"], ["costas", "biceps", "hiit"], ["triceps", "ombros", "pernas"]],
      // 4d: Empurrar | Puxar | Braços + HIIT | Ombros + Pernas leve
      4: [["peito", "triceps", "hiit"], ["costas", "biceps"], ["ombros", "hiit", "abdomen"], ["pernas", "triceps", "cardio"]],
      // 5d: Peito | Costas | Ombros + HIIT | Braços | Pernas leve + Cardio
      5: [["peito", "triceps"], ["costas", "biceps", "hiit"], ["ombros", "abdomen"], ["biceps", "triceps", "hiit"], ["pernas", "cardio"]],
      // 6d: Peito | Costas | Ombros | Braços | Pernas leve | HIIT
      6: [["peito", "hiit"], ["costas", "abdomen"], ["ombros", "triceps"], ["biceps", "peito", "hiit"], ["pernas", "cardio"], ["costas", "ombros"]],
    },
    massa: {
      3: [["peito", "triceps"], ["costas", "biceps"], ["ombros", "pernas"]],
      4: [["peito", "triceps"], ["costas", "biceps"], ["ombros", "abdomen"], ["peito", "costas", "pernas"]],
      5: [["peito"], ["costas", "biceps"], ["ombros", "triceps"], ["peito", "costas"], ["pernas", "abdomen"]],
      6: [["peito", "triceps"], ["costas", "biceps"], ["ombros"], ["peito", "ombros"], ["biceps", "triceps"], ["pernas", "abdomen"]],
    },
    condicionamento: {
      3: [["hiit", "peito", "costas"], ["ombros", "biceps", "cardio"], ["triceps", "pernas", "hiit"]],
      4: [["hiit", "peito", "triceps"], ["costas", "biceps", "cardio"], ["ombros", "hiit"], ["pernas", "abdomen", "cardio"]],
      5: [["hiit", "peito"], ["costas", "biceps"], ["ombros", "cardio"], ["triceps", "hiit", "abdomen"], ["pernas", "cardio"]],
      6: [["hiit", "peito"], ["costas", "biceps"], ["ombros", "hiit"], ["peito", "triceps", "cardio"], ["costas", "abdomen"], ["pernas", "cardio"]],
    },
  },
  // =====================================================
  // FOCO INFERIOR
  // Prioriza quadríceps, posterior, glúteos, panturrilha
  // Alterna: quadríceps-dominante / posterior-glúteo / perna completa
  // Mantém estímulo leve de superior para equilíbrio
  // =====================================================
  inferior: {
    emagrecer: {
      // 3d: Quad-dominante + HIIT | Posterior-Glúteo + Cardio | Perna completa + Superior leve
      3: [["quadriceps", "panturrilha", "hiit"], ["posterior", "gluteos", "cardio"], ["pernas", "ombros", "abdomen"]],
      4: [["quadriceps", "hiit"], ["posterior", "gluteos", "cardio"], ["pernas", "abdomen"], ["quadriceps", "panturrilha", "peito"]],
      5: [["quadriceps", "hiit"], ["posterior", "gluteos"], ["pernas", "cardio", "abdomen"], ["quadriceps", "panturrilha", "hiit"], ["peito", "costas", "cardio"]],
      6: [["quadriceps", "hiit"], ["posterior", "gluteos"], ["peito", "costas", "cardio"], ["pernas", "abdomen"], ["quadriceps", "panturrilha", "hiit"], ["gluteos", "posterior", "cardio"]],
    },
    massa: {
      // 3d: Quad-dominante | Posterior-Glúteo | Perna completa + Superior leve
      3: [["quadriceps", "panturrilha"], ["posterior", "gluteos"], ["pernas", "ombros"]],
      4: [["quadriceps", "panturrilha"], ["posterior", "gluteos"], ["pernas", "abdomen"], ["quadriceps", "peito", "costas"]],
      5: [["quadriceps"], ["posterior", "gluteos"], ["pernas", "panturrilha"], ["quadriceps", "abdomen"], ["peito", "costas", "ombros"]],
      6: [["quadriceps"], ["posterior", "gluteos"], ["panturrilha", "abdomen"], ["pernas"], ["quadriceps", "gluteos"], ["peito", "costas", "ombros"]],
    },
    condicionamento: {
      3: [["quadriceps", "hiit", "panturrilha"], ["posterior", "gluteos", "cardio"], ["pernas", "peito", "hiit"]],
      4: [["quadriceps", "hiit"], ["posterior", "gluteos", "cardio"], ["pernas", "hiit", "abdomen"], ["panturrilha", "peito", "costas", "cardio"]],
      5: [["quadriceps", "hiit"], ["posterior", "gluteos"], ["pernas", "cardio"], ["quadriceps", "hiit", "panturrilha"], ["peito", "costas", "abdomen", "cardio"]],
      6: [["quadriceps", "hiit"], ["posterior", "gluteos"], ["peito", "costas", "cardio"], ["pernas", "hiit"], ["quadriceps", "panturrilha", "abdomen"], ["gluteos", "cardio"]],
    },
  },
  completo: {
    emagrecer: splitTemplates.emagrecer,
    massa: splitTemplates.massa,
    condicionamento: splitTemplates.condicionamento,
  },
};

// =====================================================
// 7-DAY FOCUS OVERRIDES
// =====================================================
const focusSplitTemplates7: Record<BodyFocus, Record<Objective, SplitEntry7[]>> = {
  superior: {
    emagrecer: [
      { groups: ["peito", "triceps"], intensity: "pesado" },
      { groups: ["cardio", "abdomen"], intensity: "moderado" },
      { groups: ["costas", "biceps"], intensity: "pesado" },
      { groups: ["ombros", "hiit"], intensity: "pesado" },
      { groups: ["pernas", "cardio"], intensity: "moderado" },
      { groups: ["peito", "costas"], intensity: "pesado" },
      { groups: ["mobilidade", "recuperacao"], intensity: "leve" },
    ],
    massa: [
      { groups: ["peito", "triceps"], intensity: "pesado" },
      { groups: ["costas", "biceps"], intensity: "pesado" },
      { groups: ["pernas", "abdomen"], intensity: "moderado" },
      { groups: ["ombros"], intensity: "pesado" },
      { groups: ["biceps", "triceps"], intensity: "pesado" },
      { groups: ["peito", "costas", "abdomen"], intensity: "moderado" },
      { groups: ["mobilidade", "recuperacao"], intensity: "leve" },
    ],
    condicionamento: [
      { groups: ["hiit", "peito"], intensity: "pesado" },
      { groups: ["costas", "cardio"], intensity: "moderado" },
      { groups: ["ombros", "hiit"], intensity: "pesado" },
      { groups: ["mobilidade", "recuperacao"], intensity: "leve" },
      { groups: ["biceps", "triceps", "hiit"], intensity: "pesado" },
      { groups: ["pernas", "abdomen", "cardio"], intensity: "moderado" },
      { groups: ["peito", "costas"], intensity: "pesado" },
    ],
  },
  inferior: {
    emagrecer: [
      { groups: ["quadriceps", "panturrilha"], intensity: "pesado" },
      { groups: ["cardio", "abdomen"], intensity: "moderado" },
      { groups: ["posterior", "gluteos"], intensity: "pesado" },
      { groups: ["mobilidade", "recuperacao"], intensity: "leve" },
      { groups: ["pernas", "hiit"], intensity: "pesado" },
      { groups: ["peito", "costas", "cardio"], intensity: "moderado" },
      { groups: ["quadriceps", "gluteos", "hiit"], intensity: "pesado" },
    ],
    massa: [
      { groups: ["quadriceps", "panturrilha"], intensity: "pesado" },
      { groups: ["posterior", "gluteos"], intensity: "pesado" },
      { groups: ["peito", "costas", "abdomen"], intensity: "moderado" },
      { groups: ["pernas"], intensity: "pesado" },
      { groups: ["quadriceps", "gluteos"], intensity: "pesado" },
      { groups: ["ombros", "abdomen", "panturrilha"], intensity: "moderado" },
      { groups: ["mobilidade", "recuperacao"], intensity: "leve" },
    ],
    condicionamento: [
      { groups: ["quadriceps", "hiit"], intensity: "pesado" },
      { groups: ["cardio", "abdomen"], intensity: "moderado" },
      { groups: ["posterior", "gluteos"], intensity: "pesado" },
      { groups: ["mobilidade", "recuperacao"], intensity: "leve" },
      { groups: ["pernas", "hiit"], intensity: "pesado" },
      { groups: ["peito", "costas", "cardio"], intensity: "moderado" },
      { groups: ["quadriceps", "panturrilha", "cardio"], intensity: "pesado" },
    ],
  },
  completo: splitTemplates7,
};

const groupLabels: Record<string, string> = {
  peito: "Peito", costas: "Costas", pernas: "Pernas", ombros: "Ombros",
  biceps: "Bíceps", triceps: "Tríceps", abdomen: "Abdômen",
  hiit: "HIIT", cardio: "Cardio", mobilidade: "Mobilidade", recuperacao: "Recuperação",
  quadriceps: "Quadríceps", posterior: "Posterior", gluteos: "Glúteos", panturrilha: "Panturrilha",
};

export function generateWorkoutPlan(objective: Objective, level: Level, daysPerWeek: number, bodyFocus: BodyFocus = "completo"): WorkoutDay[] {
  const days = Math.max(3, Math.min(7, daysPerWeek));
  const config = levelConfig[level];

  // 7-day uses special templates with intensity metadata
  if (days === 7) {
    const focusTemplates7 = focusSplitTemplates7[bodyFocus] || focusSplitTemplates7.completo;
    const split7 = focusTemplates7[objective] || splitTemplates7[objective];

    return split7.map((entry, i) => {
      const grupo = entry.groups.map(g => groupLabels[g] || g).join(" + ");
      const exercicios: Exercise[] = [];

      // Reduce volume for moderate/light days
      const volumeMultiplier = entry.intensity === "leve" ? 0.5 : entry.intensity === "moderado" ? 0.75 : 1;

      entry.groups.forEach(group => {
        const pool = exerciseDB[group]?.[level] || exerciseDB[group]?.intermediario || [];
        pool.forEach(ex => {
          const adjustedSeries = Math.max(1, Math.round(Number(ex.series) * config.seriesMultiplier * volumeMultiplier));
          exercicios.push({ ...ex, series: String(adjustedSeries) });
        });
      });

      return {
        dia: diasSemana[i] || `Dia ${i + 1}`,
        grupo,
        exercicios,
        intensidade: entry.intensity,
      };
    });
  }

  // 3-6 day standard generation
  const focusTemplates = focusSplitTemplates[bodyFocus] || focusSplitTemplates.completo;
  const split = focusTemplates[objective]?.[days] || focusTemplates[objective]?.[3] || splitTemplates[objective][3];

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
      intensidade: "pesado" as DayIntensity,
    };
  });
}
