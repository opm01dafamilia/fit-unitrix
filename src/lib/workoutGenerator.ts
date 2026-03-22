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

type SplitEntry = string[];
type SplitEntry7 = { groups: string[]; intensity: DayIntensity };

const splitTemplates: Record<Objective, Record<number, SplitEntry[]>> = {
  emagrecer: {
    3: [["peito", "costas", "hiit"], ["quadriceps", "panturrilha", "cardio"], ["ombros", "triceps", "biceps", "hiit"]],
    4: [["peito", "triceps", "hiit"], ["quadriceps", "panturrilha"], ["costas", "biceps", "hiit"], ["posterior", "gluteos", "cardio"]],
    5: [["peito", "triceps"], ["quadriceps", "panturrilha"], ["hiit", "abdomen", "cardio"], ["posterior", "gluteos"], ["costas", "biceps", "ombros"]],
    6: [["peito", "triceps"], ["quadriceps", "panturrilha"], ["costas", "biceps"], ["posterior", "gluteos"], ["ombros", "abdomen"], ["hiit", "cardio"]],
  },
  massa: {
    3: [["peito", "triceps"], ["quadriceps", "posterior", "panturrilha"], ["costas", "biceps", "ombros"]],
    4: [["peito", "triceps"], ["quadriceps", "panturrilha"], ["costas", "biceps"], ["posterior", "gluteos", "abdomen"]],
    5: [["peito", "ombros"], ["quadriceps", "panturrilha"], ["costas", "biceps"], ["posterior", "gluteos"], ["triceps", "ombros", "abdomen"]],
    6: [["peito", "triceps"], ["quadriceps", "panturrilha"], ["costas", "biceps"], ["posterior", "gluteos"], ["ombros", "abdomen"], ["pernas", "panturrilha"]],
  },
  condicionamento: {
    3: [["hiit", "peito", "costas"], ["quadriceps", "panturrilha", "cardio"], ["ombros", "triceps", "hiit"]],
    4: [["hiit", "peito", "triceps"], ["quadriceps", "cardio"], ["costas", "biceps", "hiit"], ["posterior", "gluteos", "cardio"]],
    5: [["hiit", "peito"], ["quadriceps", "panturrilha"], ["costas", "cardio"], ["posterior", "gluteos", "hiit"], ["ombros", "abdomen", "cardio"]],
    6: [["hiit", "peito"], ["quadriceps", "panturrilha"], ["costas", "hiit"], ["posterior", "gluteos", "cardio"], ["ombros", "abdomen"], ["hiit", "cardio"]],
  },
};

const splitTemplates7: Record<Objective, SplitEntry7[]> = {
  emagrecer: [
    { groups: ["peito", "triceps"], intensity: "pesado" },
    { groups: ["quadriceps", "panturrilha"], intensity: "pesado" },
    { groups: ["hiit", "abdomen"], intensity: "moderado" },
    { groups: ["posterior", "gluteos"], intensity: "pesado" },
    { groups: ["costas", "biceps", "ombros"], intensity: "pesado" },
    { groups: ["hiit", "cardio"], intensity: "moderado" },
    { groups: ["mobilidade", "recuperacao"], intensity: "leve" },
  ],
  massa: [
    { groups: ["peito", "triceps"], intensity: "pesado" },
    { groups: ["quadriceps", "panturrilha"], intensity: "pesado" },
    { groups: ["costas", "biceps"], intensity: "pesado" },
    { groups: ["posterior", "gluteos"], intensity: "pesado" },
    { groups: ["ombros", "abdomen"], intensity: "moderado" },
    { groups: ["pernas", "panturrilha"], intensity: "moderado" },
    { groups: ["mobilidade", "recuperacao"], intensity: "leve" },
  ],
  condicionamento: [
    { groups: ["hiit", "peito"], intensity: "pesado" },
    { groups: ["quadriceps", "panturrilha", "cardio"], intensity: "pesado" },
    { groups: ["costas", "hiit"], intensity: "pesado" },
    { groups: ["posterior", "gluteos"], intensity: "pesado" },
    { groups: ["ombros", "abdomen", "cardio"], intensity: "moderado" },
    { groups: ["mobilidade", "recuperacao"], intensity: "leve" },
    { groups: ["hiit", "cardio"], intensity: "moderado" },
  ],
};

const focusSplitTemplates: Record<BodyFocus, Record<Objective, Record<number, SplitEntry[]>>> = {
  superior: {
    emagrecer: {
      3: [["peito", "triceps", "hiit"], ["quadriceps", "panturrilha"], ["costas", "biceps", "ombros"]],
      4: [["peito", "triceps"], ["quadriceps", "panturrilha", "hiit"], ["costas", "biceps"], ["ombros", "abdomen"]],
      5: [["peito", "triceps"], ["quadriceps", "panturrilha"], ["costas", "biceps", "hiit"], ["posterior", "gluteos"], ["ombros", "abdomen"]],
      6: [["peito", "triceps"], ["quadriceps", "panturrilha"], ["costas", "biceps"], ["posterior", "gluteos"], ["ombros", "abdomen"], ["cardio", "hiit"]],
    },
    massa: {
      3: [["peito", "triceps"], ["quadriceps", "panturrilha"], ["costas", "biceps", "ombros"]],
      4: [["peito", "triceps"], ["quadriceps", "panturrilha"], ["costas", "biceps"], ["ombros", "abdomen"]],
      5: [["peito", "triceps"], ["quadriceps", "panturrilha"], ["costas", "biceps"], ["posterior", "gluteos"], ["ombros", "abdomen"]],
      6: [["peito", "triceps"], ["quadriceps", "panturrilha"], ["costas", "biceps"], ["posterior", "gluteos"], ["ombros"], ["peito", "costas", "abdomen"]],
    },
    condicionamento: {
      3: [["hiit", "peito", "costas"], ["quadriceps", "panturrilha"], ["ombros", "triceps", "biceps"]],
      4: [["hiit", "peito", "triceps"], ["quadriceps", "cardio"], ["costas", "biceps", "hiit"], ["posterior", "gluteos", "cardio"]],
      5: [["hiit", "peito"], ["quadriceps", "panturrilha"], ["costas", "cardio"], ["posterior", "gluteos", "hiit"], ["ombros", "abdomen", "cardio"]],
      6: [["hiit", "peito"], ["quadriceps", "panturrilha"], ["costas", "hiit"], ["posterior", "gluteos", "cardio"], ["ombros", "abdomen"], ["hiit", "cardio"]],
    },
  },
  inferior: {
    emagrecer: {
      3: [["quadriceps", "panturrilha", "hiit"], ["peito", "costas", "cardio"], ["posterior", "gluteos", "abdomen"]],
      4: [["quadriceps", "panturrilha", "hiit"], ["peito", "triceps"], ["posterior", "gluteos", "cardio"], ["costas", "biceps", "abdomen"]],
      5: [["quadriceps", "panturrilha"], ["peito", "triceps", "hiit"], ["posterior", "gluteos"], ["costas", "biceps", "abdomen"]],
      6: [["quadriceps", "panturrilha"], ["peito", "triceps", "hiit"], ["posterior", "gluteos"], ["costas", "biceps", "abdomen"], ["pernas", "abdomen", "cardio"]],
    },
    massa: {
      3: [["quadriceps", "panturrilha"], ["peito", "costas", "ombros"], ["posterior", "gluteos"]],
      4: [["quadriceps", "panturrilha"], ["peito", "triceps"], ["posterior", "gluteos"], ["costas", "biceps", "abdomen"]],
      5: [["quadriceps", "panturrilha"], ["peito", "triceps"], ["posterior", "gluteos"], ["costas", "biceps", "abdomen"]],
      6: [["quadriceps", "panturrilha"], ["peito", "triceps"], ["posterior", "gluteos"], ["costas", "biceps", "abdomen"]],
    },
    condicionamento: {
      3: [["quadriceps", "hiit", "panturrilha"], ["peito", "costas", "cardio"], ["posterior", "gluteos", "hiit"]],
      4: [["quadriceps", "hiit"], ["peito", "triceps", "cardio"], ["posterior", "gluteos", "hiit"], ["costas", "ombros", "cardio"]],
      5: [["quadriceps", "hiit"], ["peito", "triceps"], ["posterior", "gluteos", "cardio"], ["costas", "biceps", "hiit"], ["pernas", "abdomen", "cardio"]],
      6: [["quadriceps", "hiit"], ["peito", "triceps"], ["posterior", "gluteos", "cardio"], ["costas", "biceps", "hiit"], ["pernas", "abdomen", "cardio"]],
    },
  },
  completo: {
    emagrecer: splitTemplates.emagrecer,
    massa: splitTemplates.massa,
    condicionamento: splitTemplates.condicionamento,
  },
};

const focusSplitTemplates7: Record<BodyFocus, Record<Objective, SplitEntry7[]>> = {
  superior: {
    emagrecer: [
      { groups: ["peito", "triceps"], intensity: "pesado" },
      { groups: ["quadriceps", "panturrilha"], intensity: "pesado" },
      { groups: ["costas", "biceps"], intensity: "pesado" },
      { groups: ["posterior", "gluteos"], intensity: "moderado" },
      { groups: ["ombros", "abdomen"], intensity: "moderado" },
      { groups: ["hiit", "cardio"], intensity: "leve" },
    ],
    massa: [
      { groups: ["peito", "triceps"], intensity: "pesado" },
      { groups: ["quadriceps", "panturrilha"], intensity: "pesado" },
      { groups: ["costas", "biceps"], intensity: "pesado" },
      { groups: ["posterior", "gluteos"], intensity: "moderado" },
      { groups: ["ombros", "abdomen"], intensity: "moderado" },
      { groups: ["hiit", "cardio"], intensity: "leve" },
    ],
    condicionamento: [
      { groups: ["hiit", "peito"], intensity: "pesado" },
      { groups: ["quadriceps", "panturrilha"], intensity: "pesado" },
      { groups: ["costas", "biceps"], intensity: "pesado" },
      { groups: ["posterior", "gluteos"], intensity: "moderado" },
      { groups: ["ombros", "abdomen"], intensity: "moderado" },
      { groups: ["hiit", "cardio"], intensity: "leve" },
    ],
  },
  inferior: {
    emagrecer: [
      { groups: ["quadriceps", "panturrilha"], intensity: "pesado" },
      { groups: ["peito", "costas"], intensity: "moderado" },
      { groups: ["posterior", "gluteos"], intensity: "pesado" },
      { groups: ["ombros", "abdomen"], intensity: "moderado" },
    ],
    massa: [
      { groups: ["quadriceps", "panturrilha"], intensity: "pesado" },
      { groups: ["peito", "costas"], intensity: "moderado" },
      { groups: ["posterior", "gluteos"], intensity: "pesado" },
      { groups: ["ombros", "abdomen"], intensity: "moderado" },
    ],
    condicionamento: [
      { groups: ["quadriceps", "panturrilha"], intensity: "pesado" },
      { groups: ["peito", "costas"], intensity: "moderado" },
      { groups: ["posterior", "gluteos"], intensity: "pesado" },
      { groups: ["ombros", "abdomen"], intensity: "moderado" },
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

function shuffleArray<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function selectExercises(
  pool: Exercise[], dayIndex: number, maxCount: number, usedNames: Set<string>, preferredNames?: Set<string>
): Exercise[] {
  if (pool.length === 0) return [];
  const shuffled = shuffleArray(pool, dayIndex * 7919 + pool.length * 31);
  const isPreferred = (ex: Exercise) => {
    if (!preferredNames || preferredNames.size === 0) return false;
    const nameLower = ex.nome.toLowerCase();
    for (const pref of preferredNames) {
      if (nameLower.includes(pref.toLowerCase()) || pref.toLowerCase().includes(nameLower)) return true;
    }
    return false;
  };
  const preferred = shuffled.filter(ex => isPreferred(ex) && !usedNames.has(ex.nome));
  const nonPreferred = shuffled.filter(ex => !isPreferred(ex) && !usedNames.has(ex.nome));
  const maxPreferred = Math.max(1, Math.ceil(maxCount * 0.5));
  const selected: Exercise[] = [];
  for (const ex of preferred) { if (selected.length >= maxPreferred) break; selected.push(ex); }
  for (const ex of nonPreferred) { if (selected.length >= maxCount) break; selected.push(ex); }
  for (const ex of shuffled) { if (selected.length >= maxCount) break; if (!selected.includes(ex)) selected.push(ex); }
  return selected;
}

function adjustRestForIntensity(exercise: Exercise, intensity: DayIntensity): Exercise {
  const restMap: Record<DayIntensity, Record<string, string>> = {
    pesado: { "30s": "60s", "45s": "90s", "60s": "90s", "90s": "120s", "120s": "180s" },
    moderado: { "120s": "90s", "180s": "120s", "90s": "75s" },
    leve: { "90s": "60s", "120s": "60s", "180s": "90s", "60s": "45s", "45s": "30s" },
  };
  return { ...exercise, descanso: restMap[intensity]?.[exercise.descanso] || exercise.descanso };
}

// ===== PROFESSIONAL RULES =====
// Defines which auxiliary groups are valid companions for each primary group
const VALID_PAIRINGS: Record<string, Set<string>> = {
  peito:      new Set(["triceps", "biceps", "ombros"]),
  costas:     new Set(["biceps", "triceps", "ombros"]),
  quadriceps: new Set(["panturrilha", "gluteos"]),
  posterior:  new Set(["panturrilha", "gluteos"]),
  gluteos:    new Set(["quadriceps", "posterior", "panturrilha"]),
  ombros:     new Set(["peito", "costas", "biceps", "triceps"]),
  biceps:     new Set(["costas", "peito", "triceps", "ombros"]),
  triceps:    new Set(["peito", "costas", "biceps", "ombros"]),
};

// Primary muscle groups that form the core of a workout day
const PRIMARY_MUSCLE_GROUPS = new Set(["quadriceps", "costas", "posterior", "gluteos", "peito", "ombros", "pernas"]);
const SECONDARY_MUSCLE_GROUPS = new Set(["panturrilha", "biceps", "triceps", "abdomen"]);

function getMaxExercisesForGroup(
  group: string,
  allGroupsInDay: string[],
  intensity: DayIntensity,
  level: Level
): number {
  if (intensity === "leve") return 1;

  const isPrimary = PRIMARY_MUSCLE_GROUPS.has(group);

  // Professional rules per group:
  // Peito/Costas as main → 3-5 exercises
  // Quadríceps/Posterior as main → 3-5 exercises
  // Glúteos as main → 3-4 exercises
  // Ombros as main → 3-4 exercises
  // Biceps/Triceps as auxiliary → 2-3 exercises
  // Panturrilha as auxiliary → 2-3 exercises
  // Abdomen as auxiliary → 1-2 exercises

  if (isPrimary) {
    const primaryGroups = allGroupsInDay.filter(g => PRIMARY_MUSCLE_GROUPS.has(g));

    if (group === "peito" || group === "costas") {
      // Main focus: 3-5 based on level
      if (primaryGroups.length <= 1) return level === "iniciante" ? 3 : level === "intermediario" ? 4 : 5;
      return level === "iniciante" ? 3 : 4;
    }

    if (group === "quadriceps" || group === "posterior") {
      if (primaryGroups.length <= 1) return level === "iniciante" ? 3 : level === "intermediario" ? 4 : 5;
      // Paired with another primary (e.g. posterior+gluteos)
      const idx = primaryGroups.indexOf(group);
      return idx === 0 ? (level === "iniciante" ? 3 : 4) : (level === "iniciante" ? 2 : 3);
    }

    if (group === "gluteos") {
      // Solo glute day: 3-4; paired: 2-3
      const otherPrimary = primaryGroups.filter(g => g !== "gluteos");
      if (otherPrimary.length === 0) return level === "iniciante" ? 3 : 4;
      return level === "iniciante" ? 2 : 3;
    }

    if (group === "ombros") {
      const otherPrimary = primaryGroups.filter(g => g !== "ombros");
      if (otherPrimary.length === 0) return level === "iniciante" ? 3 : 4;
      return level === "iniciante" ? 2 : 3;
    }

    if (group === "pernas") {
      return level === "iniciante" ? 3 : 4;
    }

    return 3;
  }

  // Secondary/auxiliary groups
  if (group === "panturrilha") return level === "iniciante" ? 2 : 3;
  if (group === "biceps" || group === "triceps") return level === "iniciante" ? 2 : 3;
  if (group === "abdomen") return level === "iniciante" ? 1 : 2;

  // HIIT, cardio, mobility
  return 2;
}

export type CardioFrequency = "0" | "1-2" | "3-4" | "daily";
export type IntensityLevel = "moderado" | "intenso";

type CardioType = "leve" | "moderado" | "intenso";
type CardioExerciseInfo = { nome: string; duracao: string; tipo: CardioType; desc: string };

const cardioByObjectiveGen: Record<Objective, Record<CardioType, CardioExerciseInfo>> = {
  emagrecer: {
    leve: { nome: "Caminhada Inclinada", duracao: "15min", tipo: "leve", desc: "Esteira com 8-10% de inclinação, ritmo confortável." },
    moderado: { nome: "Corrida Intervalada", duracao: "20min", tipo: "moderado", desc: "Alterne 1min forte + 1min leve." },
    intenso: { nome: "HIIT Queima", duracao: "12min", tipo: "intenso", desc: "30s sprint máximo + 30s descanso." },
  },
  massa: {
    leve: { nome: "Caminhada Leve", duracao: "10min", tipo: "leve", desc: "Caminhada em ritmo confortável." },
    moderado: { nome: "Bike Leve", duracao: "15min", tipo: "moderado", desc: "Pedalada em ritmo moderado." },
    intenso: { nome: "Cardio Controlado", duracao: "12min", tipo: "intenso", desc: "Sessão curta e controlada." },
  },
  condicionamento: {
    leve: { nome: "Caminhada Inclinada", duracao: "15min", tipo: "leve", desc: "Esteira com inclinação, ritmo confortável." },
    moderado: { nome: "Corrida Progressiva", duracao: "20min", tipo: "moderado", desc: "Comece leve e aumente a cada 5min." },
    intenso: { nome: "HIIT Cardio", duracao: "15min", tipo: "intenso", desc: "Circuito intenso: 40s esforço + 20s descanso." },
  },
};
const cardioDurationMultiplier: Record<Level, number> = { iniciante: 0.75, intermediario: 1, avancado: 1.25 };

function applyCardioToWeek(plan: WorkoutDay[], cardioFreq: CardioFrequency, level: Level, objective: Objective = "condicionamento", gender?: UserGender): WorkoutDay[] {
  if (cardioFreq === "0") {
    return plan.map(day => {
      const g = day.grupo.toLowerCase();
      if (!g.includes("mobilidade") && !g.includes("recuperacao")) return day;
      return { ...day, exercicios: [...day.exercicios, { nome: "Caminhada Leve (Opcional)", series: "1", reps: "10min", desc: "💡 Cardio opcional.", descanso: "—" }] };
    });
  }
  let cardioDays: number;
  switch (cardioFreq) { case "1-2": cardioDays = Math.min(2, plan.length); break; case "3-4": cardioDays = Math.min(4, plan.length); break; case "daily": cardioDays = plan.length; break; default: cardioDays = 0; }
  if (cardioDays === 0) return plan;
  const isLegDay = (grupo: string) => { const g = grupo.toLowerCase(); return g.includes("perna") || g.includes("quadriceps") || g.includes("posterior") || g.includes("gluteo") || g.includes("panturrilha"); };
  const hasExistingCardio = (day: WorkoutDay) => { const g = day.grupo.toLowerCase(); return g.includes("cardio") || g.includes("hiit") || day.exercicios.some(e => { const n = e.nome.toLowerCase(); return n.includes("cardio") || n.includes("corrida") || n.includes("caminhada") || n.includes("hiit") || n.includes("bike"); }); };
  function getCardioForDay(day: WorkoutDay, isLeg: boolean): CardioExerciseInfo {
    const pool = cardioByObjectiveGen[objective]; const mult = cardioDurationMultiplier[level];
    if (isLeg) { const info = { ...pool.leve, nome: "Caminhada Leve", desc: "🦵 Cardio leve pós-treino de perna." }; info.duracao = `${Math.round(Math.min(parseInt(info.duracao), 12) * mult)}min`; return info; }
    if (day.intensidade === "pesado") { const info = { ...pool.leve }; info.duracao = `${Math.round(parseInt(info.duracao) * mult)}min`; return info; }
    if (objective === "massa") { const info = { ...pool.leve }; info.duracao = `${Math.round(parseInt(info.duracao) * mult)}min`; return info; }
    const info = { ...pool.moderado }; info.duracao = `${Math.round(parseInt(info.duracao) * mult)}min`; return info;
  }
  if (cardioFreq === "daily") {
    return plan.map(day => {
      if (hasExistingCardio(day)) return day;
      const isLeg = isLegDay(day.grupo); const cardioInfo = getCardioForDay(day, isLeg);
      const cardioEx: Exercise = { nome: cardioInfo.nome, series: "1", reps: cardioInfo.duracao, desc: cardioInfo.desc, descanso: "—" };
      const exercicios = day.exercicios.length >= 5 ? [...day.exercicios.slice(0, -1), cardioEx] : [...day.exercicios, cardioEx];
      return { ...day, grupo: day.grupo + ` + Cardio ${cardioInfo.tipo === "leve" ? "Leve" : "Moderado"}`, exercicios };
    });
  }
  const dayAnalysis = plan.map((day, idx) => ({ idx, intensity: day.intensidade || "moderado" as DayIntensity, hasCardio: hasExistingCardio(day), isLeg: isLegDay(day.grupo), isRest: day.grupo.toLowerCase().includes("mobilidade") || day.grupo.toLowerCase().includes("recuperacao") }));
  const sorted = [...dayAnalysis].filter(d => !d.hasCardio).sort((a, b) => { if (a.isRest && !b.isRest) return -1; if (!a.isRest && b.isRest) return 1; if (a.isLeg && !b.isLeg) return 1; if (!a.isLeg && b.isLeg) return -1; return 0; });
  const selectedIndices: number[] = [];
  for (const c of sorted) { if (selectedIndices.length >= cardioDays) break; const hasAdj = selectedIndices.some(si => Math.abs(si - c.idx) <= 1); if (!hasAdj || selectedIndices.length >= sorted.length - 1) selectedIndices.push(c.idx); }
  for (const c of sorted) { if (selectedIndices.length >= cardioDays) break; if (!selectedIndices.includes(c.idx)) selectedIndices.push(c.idx); }
  return plan.map((day, idx) => {
    if (!selectedIndices.includes(idx)) return day;
    const isLeg = isLegDay(day.grupo); const cardioInfo = getCardioForDay(day, isLeg);
    const cardioEx: Exercise = { nome: cardioInfo.nome, series: "1", reps: cardioInfo.duracao, desc: cardioInfo.desc, descanso: "—" };
    return { ...day, grupo: day.grupo + ` + Cardio ${cardioInfo.tipo === "leve" ? "Leve" : "Moderado"}`, exercicios: [...day.exercicios, cardioEx] };
  });
}

function applyIntensityLevel(plan: WorkoutDay[], intensityLevel: IntensityLevel): WorkoutDay[] {
  if (intensityLevel === "moderado") {
    return plan.map(day => {
      const newIntensity: DayIntensity = day.intensidade === "pesado" ? "moderado" : day.intensidade || "moderado";
      const exercicios = day.exercicios.map(ex => { const series = Math.max(2, Number(ex.series) - (day.intensidade === "pesado" ? 1 : 0)); return adjustRestForIntensity({ ...ex, series: String(series) }, newIntensity); });
      return { ...day, exercicios, intensidade: newIntensity };
    });
  }
  return plan.map(day => {
    if (day.intensidade === "leve") return day;
    const exercicios = day.exercicios.map(ex => { const series = Math.min(6, Number(ex.series) + (day.intensidade === "moderado" ? 1 : 0)); return adjustRestForIntensity({ ...ex, series: String(series) }, "pesado"); });
    return { ...day, exercicios, intensidade: "pesado" };
  });
}

export type UserGender = "masculino" | "feminino" | string | null | undefined;
export type ExercisePreferences = { preferred: string[]; freeText?: string };

const femaleSplitOverrides: Record<Objective, Record<number, SplitEntry[]>> = {
  emagrecer: { 3: [["posterior","gluteos","panturrilha"],["peito","costas","ombros"],["quadriceps","gluteos","hiit"]], 4: [["posterior","gluteos","panturrilha"],["peito","triceps","hiit"],["quadriceps","gluteos"],["costas","biceps","abdomen"]], 5: [["posterior","gluteos"],["peito","triceps"],["quadriceps","panturrilha","hiit"],["costas","biceps"],["gluteos","posterior","abdomen"]], 6: [["posterior","gluteos"],["peito","triceps"],["quadriceps","panturrilha"],["costas","biceps","hiit"],["gluteos","abdomen"],["quadriceps","panturrilha","cardio"]] },
  massa: { 3: [["posterior","gluteos","panturrilha"],["peito","costas","ombros"],["quadriceps","gluteos"]], 4: [["posterior","gluteos","panturrilha"],["peito","triceps"],["quadriceps","gluteos"],["costas","biceps","abdomen"]], 5: [["posterior","gluteos"],["peito","triceps"],["quadriceps","panturrilha"],["costas","biceps"],["gluteos","posterior","abdomen"]], 6: [["posterior","gluteos"],["peito","triceps"],["quadriceps","panturrilha"],["costas","biceps"],["gluteos","abdomen"],["quadriceps","panturrilha"]] },
  condicionamento: { 3: [["posterior","gluteos","hiit"],["peito","costas","cardio"],["quadriceps","panturrilha","hiit"]], 4: [["posterior","gluteos","hiit"],["peito","triceps","cardio"],["quadriceps","panturrilha","hiit"],["costas","ombros","cardio"]], 5: [["posterior","gluteos","hiit"],["peito","triceps"],["quadriceps","panturrilha","cardio"],["costas","biceps","hiit"],["gluteos","abdomen","cardio"]], 6: [["posterior","gluteos"],["peito","triceps","hiit"],["quadriceps","panturrilha"],["costas","biceps","cardio"],["gluteos","abdomen","hiit"],["quadriceps","panturrilha","cardio"]] },
};
const maleSplitOverrides: Record<Objective, Record<number, SplitEntry[]>> = {
  emagrecer: { 3: [["peito","triceps","hiit"],["quadriceps","posterior","panturrilha"],["costas","biceps","ombros"]], 4: [["peito","triceps"],["quadriceps","panturrilha","hiit"],["costas","biceps"],["ombros","abdomen","cardio"]], 5: [["peito","triceps"],["quadriceps","panturrilha"],["costas","biceps","hiit"],["posterior","panturrilha"],["ombros","abdomen","cardio"]], 6: [["peito","triceps"],["quadriceps","panturrilha"],["costas","biceps","hiit"],["posterior","panturrilha"],["ombros","abdomen"],["peito","costas","cardio"]] },
  massa: { 3: [["peito","triceps"],["quadriceps","posterior","panturrilha"],["costas","biceps","ombros"]], 4: [["peito","triceps"],["quadriceps","panturrilha"],["costas","biceps"],["ombros","posterior","abdomen"]], 5: [["peito","triceps"],["quadriceps","panturrilha"],["costas","biceps"],["posterior","panturrilha"],["ombros","abdomen"]], 6: [["peito","triceps"],["quadriceps","panturrilha"],["costas","biceps"],["posterior","panturrilha"],["ombros","abdomen"],["peito","costas"]] },
  condicionamento: { 3: [["hiit","peito","costas"],["quadriceps","posterior","cardio"],["ombros","triceps","biceps"]], 4: [["hiit","peito","triceps"],["quadriceps","panturrilha","cardio"],["costas","biceps","hiit"],["posterior","ombros","cardio"]], 5: [["hiit","peito"],["quadriceps","panturrilha"],["costas","biceps","cardio"],["posterior","hiit"],["ombros","abdomen","cardio"]], 6: [["hiit","peito"],["quadriceps","panturrilha"],["costas","hiit"],["posterior","panturrilha","cardio"],["ombros","triceps"],["peito","biceps","cardio"]] },
};
const femaleSplit7Overrides: Record<Objective, SplitEntry7[]> = {
  emagrecer: [{ groups: ["posterior","gluteos"], intensity: "pesado" },{ groups: ["peito","triceps"], intensity: "moderado" },{ groups: ["quadriceps","panturrilha","hiit"], intensity: "pesado" },{ groups: ["costas","biceps"], intensity: "moderado" },{ groups: ["gluteos","posterior","abdomen"], intensity: "pesado" },{ groups: ["hiit","cardio"], intensity: "moderado" },{ groups: ["mobilidade","recuperacao"], intensity: "leve" }],
  massa: [{ groups: ["posterior","gluteos"], intensity: "pesado" },{ groups: ["peito","triceps"], intensity: "moderado" },{ groups: ["quadriceps","panturrilha"], intensity: "pesado" },{ groups: ["costas","biceps"], intensity: "moderado" },{ groups: ["gluteos","abdomen"], intensity: "pesado" },{ groups: ["quadriceps","panturrilha"], intensity: "moderado" },{ groups: ["mobilidade","recuperacao"], intensity: "leve" }],
  condicionamento: [{ groups: ["posterior","gluteos","hiit"], intensity: "pesado" },{ groups: ["peito","triceps","cardio"], intensity: "moderado" },{ groups: ["quadriceps","panturrilha"], intensity: "pesado" },{ groups: ["costas","biceps","hiit"], intensity: "moderado" },{ groups: ["gluteos","abdomen","cardio"], intensity: "pesado" },{ groups: ["mobilidade","recuperacao"], intensity: "leve" },{ groups: ["hiit","cardio"], intensity: "moderado" }],
};
const maleSplit7Overrides: Record<Objective, SplitEntry7[]> = {
  emagrecer: [{ groups: ["peito","triceps"], intensity: "pesado" },{ groups: ["quadriceps","panturrilha"], intensity: "pesado" },{ groups: ["costas","biceps"], intensity: "pesado" },{ groups: ["posterior","panturrilha"], intensity: "moderado" },{ groups: ["ombros","abdomen","hiit"], intensity: "pesado" },{ groups: ["hiit","cardio"], intensity: "moderado" },{ groups: ["mobilidade","recuperacao"], intensity: "leve" }],
  massa: [{ groups: ["peito","triceps"], intensity: "pesado" },{ groups: ["quadriceps","panturrilha"], intensity: "pesado" },{ groups: ["costas","biceps"], intensity: "pesado" },{ groups: ["posterior","panturrilha"], intensity: "moderado" },{ groups: ["ombros","abdomen"], intensity: "pesado" },{ groups: ["peito","costas"], intensity: "moderado" },{ groups: ["mobilidade","recuperacao"], intensity: "leve" }],
  condicionamento: [{ groups: ["hiit","peito","triceps"], intensity: "pesado" },{ groups: ["quadriceps","panturrilha","cardio"], intensity: "pesado" },{ groups: ["costas","biceps","hiit"], intensity: "pesado" },{ groups: ["posterior","panturrilha"], intensity: "moderado" },{ groups: ["ombros","abdomen","cardio"], intensity: "pesado" },{ groups: ["mobilidade","recuperacao"], intensity: "leve" },{ groups: ["hiit","cardio"], intensity: "moderado" }],
};

function applyGenderToSplit(split: SplitEntry[], gender: UserGender, objective: Objective): SplitEntry[] {
  if (!gender) return split;
  if (gender === "feminino") {
    return split.map((groups, dayIdx) => {
      const result = groups.map(g => g === "pernas" ? (dayIdx % 2 === 0 ? "posterior" : "quadriceps") : g);
      const hasLower = result.some(g => ["quadriceps","posterior","pernas"].includes(g));
      if (hasLower && !result.includes("gluteos") && result.length < 4) result.push("gluteos");
      if (hasLower && !result.includes("panturrilha") && result.length < 5) result.push("panturrilha");
      return result;
    });
  }
  if (gender === "masculino") {
    return split.map((groups, dayIdx) => {
      const result = groups.map(g => g === "pernas" ? (dayIdx % 2 === 0 ? "quadriceps" : "posterior") : g);
      const hasUpper = result.some(g => ["peito","costas","ombros"].includes(g));
      const hasLower = result.some(g => ["quadriceps","posterior","gluteos","pernas","panturrilha"].includes(g));
      const hasArms = result.some(g => ["biceps","triceps"].includes(g));
      if (hasUpper && !hasLower && !hasArms && result.length < 4) {
        if (result.includes("peito") || result.includes("ombros")) result.push("triceps");
        else result.push("biceps");
      }
      return result;
    });
  }
  return split;
}

function applyGenderTo7DaySplit(split: SplitEntry7[], gender: UserGender): SplitEntry7[] {
  if (!gender) return split;
  if (gender === "feminino") {
    return split.map((entry, i) => {
      const groups = entry.groups.map(g => g === "pernas" ? (i % 2 === 0 ? "posterior" : "quadriceps") : g);
      const hasLower = groups.some(g => ["quadriceps","posterior"].includes(g));
      if (hasLower && !groups.includes("gluteos") && groups.length < 4) groups.push("gluteos");
      return { ...entry, groups, intensity: hasLower && entry.intensity === "moderado" ? "pesado" as DayIntensity : entry.intensity };
    });
  }
  if (gender === "masculino") {
    return split.map((entry, i) => {
      const groups = entry.groups.map(g => g === "pernas" ? (i % 2 === 0 ? "quadriceps" : "posterior") : g);
      const hasUpper = groups.some(g => ["peito","costas","ombros"].includes(g));
      const hasLower = groups.some(g => ["quadriceps","posterior","gluteos","panturrilha"].includes(g));
      if (hasUpper && !hasLower && !groups.some(g => ["biceps","triceps"].includes(g)) && groups.length < 4) {
        if (groups.includes("peito") || groups.includes("ombros")) groups.push("triceps"); else groups.push("biceps");
      }
      return { ...entry, groups, intensity: hasUpper && !hasLower && entry.intensity === "moderado" ? "pesado" as DayIntensity : entry.intensity };
    });
  }
  return split;
}

const UPPER_KEYWORDS = ["peito","costas","ombro","biceps","triceps"];
const LOWER_KEYWORDS = ["perna","quadriceps","posterior","gluteos","gluteo","panturrilha"];
const NEUTRAL_KEYWORDS = ["hiit","cardio","mobilidade","recuperacao","abdomen"];

function classifyDayRegion(grupo: string): "upper"|"lower"|"neutral" {
  const g = grupo.toLowerCase();
  const hasUpper = UPPER_KEYWORDS.some(k => g.includes(k));
  const hasLower = LOWER_KEYWORDS.some(k => g.includes(k));
  if (hasUpper && hasLower) return "neutral";
  if (hasUpper) return "upper";
  if (hasLower) return "lower";
  return "neutral";
}

function enforceUpperLowerAlternation(plan: WorkoutDay[]): WorkoutDay[] {
  const result = [...plan];
  for (let i = 1; i < result.length; i++) {
    const prevRegion = classifyDayRegion(result[i-1].grupo);
    const currRegion = classifyDayRegion(result[i].grupo);
    if (prevRegion !== "neutral" && prevRegion === currRegion && (result[i-1].intensidade === "pesado" || result[i].intensidade === "pesado")) {
      result[i] = { ...result[i], intensidade: "moderado", exercicios: result[i].exercicios.map(ex => adjustRestForIntensity(ex, "moderado")) };
    }
  }
  return result;
}

function enrichFemaleExercises(plan: WorkoutDay[], gender: UserGender, level: Level): WorkoutDay[] {
  if (gender !== "feminino") return plan;
  return plan.map(day => {
    const g = day.grupo.toLowerCase();
    const isLowerDay = g.includes("posterior") || g.includes("quadriceps") || g.includes("perna") || g.includes("gluteo");
    if (!isLowerDay) return day;
    const exercicios = [...day.exercicios];
    const hasGlute = exercicios.some(ex => { const n = ex.nome.toLowerCase(); return n.includes("hip thrust") || n.includes("elevação pélvica") || n.includes("glute bridge") || n.includes("abdutora"); });
    if (!hasGlute) exercicios.push({ nome: "Hip Thrust", series: "4", reps: "12", desc: "Costas no banco, barra no quadril. Contraia forte no topo.", descanso: "60s" });
    return { ...day, exercicios: exercicios.map(ex => { if (ex.descanso === "120s") return { ...ex, descanso: "90s" }; if (ex.descanso === "180s") return { ...ex, descanso: "120s" }; return ex; }) };
  });
}

function enrichMaleExercises(plan: WorkoutDay[], gender: UserGender, level: Level): WorkoutDay[] {
  if (gender !== "masculino") return plan;
  return plan.map(day => {
    const g = day.grupo.toLowerCase();
    const isUpperDay = g.includes("peito") || g.includes("costas") || g.includes("ombro");
    const isLowerDay = g.includes("posterior") || g.includes("quadriceps") || g.includes("perna") || g.includes("gluteo");
    if (!isUpperDay || isLowerDay) return day;
    const exercicios = [...day.exercicios];
    if (g.includes("peito") && !exercicios.some(ex => ex.nome.toLowerCase().includes("supino")) && level !== "iniciante") {
      exercicios.unshift({ nome: "Supino Reto", series: "4", reps: "8", desc: "Carga pesada, controle excêntrico.", descanso: "120s" });
    }
    return { ...day, exercicios: exercicios.map(ex => { if (ex.descanso === "60s" && day.intensidade === "pesado") return { ...ex, descanso: "90s" }; return ex; }) };
  });
}

// Auxiliary exercises ordering + cap at 4-5
function isAuxiliaryExercise(nome: string): boolean {
  const n = nome.toLowerCase();
  return ["panturrilha","rosca","bíceps","biceps","tríceps","triceps","prancha","abdominal","crunch","elevação de pernas","dragon flag"].some(k => n.includes(k));
}

function reorderAndCapExercises(plan: WorkoutDay[]): WorkoutDay[] {
  const MAX_EXERCISES = 6;
  return plan.map(day => {
    const g = day.grupo.toLowerCase();
    if (g.includes("mobilidade") || g.includes("recuperacao")) return day;
    if (g.includes("hiit") && !g.includes("peito") && !g.includes("costas") && !g.includes("quadriceps") && !g.includes("posterior") && !g.includes("ombros")) return day;
    const main: Exercise[] = [];
    const aux: Exercise[] = [];
    for (const ex of day.exercicios) { if (isAuxiliaryExercise(ex.nome)) aux.push(ex); else main.push(ex); }
    return { ...day, exercicios: [...main, ...aux].slice(0, MAX_EXERCISES) };
  });
}

// =====================================================
// MAIN GENERATOR
// =====================================================
export function generateWorkoutPlan(
  objective: Objective,
  level: Level,
  daysPerWeek: number,
  bodyFocus: BodyFocus = "completo",
  cardioFreq: CardioFrequency = "0",
  intensityLevel: IntensityLevel = "intenso",
  preferences?: ExercisePreferences,
  gender?: UserGender
): WorkoutDay[] {
  const days = Math.max(3, Math.min(7, daysPerWeek));
  const config = levelConfig[level];

  const preferredNames = new Set(preferences?.preferred || []);
  const prevDayExercises: Set<string> = new Set();

  let plan: WorkoutDay[];

  if (days === 7) {
    let split7: SplitEntry7[];

    if (bodyFocus === "completo" && gender === "feminino") {
      split7 = femaleSplit7Overrides[objective] || femaleSplit7Overrides.condicionamento;
    } else if (bodyFocus === "completo" && gender === "masculino") {
      split7 = maleSplit7Overrides[objective] || maleSplit7Overrides.condicionamento;
    } else {
      const focusTemplates7 = focusSplitTemplates7[bodyFocus] || focusSplitTemplates7.completo;
      split7 = focusTemplates7[objective] || splitTemplates7[objective];
      split7 = applyGenderTo7DaySplit(split7, gender);
    }

    plan = split7.map((entry, i) => {
      const grupo = entry.groups.map(g => groupLabels[g] || g).join(" + ");
      const exercicios: Exercise[] = [];
      const volumeMultiplier = entry.intensity === "leve" ? 0.5 : entry.intensity === "moderado" ? 0.75 : 1;

      entry.groups.forEach(group => {
        const pool = exerciseDB[group]?.[level] || exerciseDB[group]?.intermediario || [];
        const maxPerGroup = getMaxExercisesForGroup(group, entry.groups, entry.intensity, level);
        const selected = selectExercises(pool, i, maxPerGroup, prevDayExercises, preferredNames);
        selected.forEach(ex => {
          const adjustedSeries = Math.max(1, Math.round(Number(ex.series) * config.seriesMultiplier * volumeMultiplier));
          const adjusted = adjustRestForIntensity({ ...ex, series: String(adjustedSeries) }, entry.intensity);
          exercicios.push(adjusted);
        });
      });

      prevDayExercises.clear();
      exercicios.forEach(ex => prevDayExercises.add(ex.nome));

      return {
        dia: diasSemana[i] || `Dia ${i + 1}`,
        grupo,
        exercicios,
        intensidade: entry.intensity,
      };
    });
  } else {
    let split: SplitEntry[];
    if (bodyFocus === "completo" && gender === "feminino") {
      split = femaleSplitOverrides[objective]?.[days] || femaleSplitOverrides[objective]?.[3];
    } else if (bodyFocus === "completo" && gender === "masculino") {
      split = maleSplitOverrides[objective]?.[days] || maleSplitOverrides[objective]?.[3];
    } else {
      const focusTemplates = focusSplitTemplates[bodyFocus] || focusSplitTemplates.completo;
      split = focusTemplates[objective]?.[days] || focusTemplates[objective]?.[3] || splitTemplates[objective][3];
      split = applyGenderToSplit(split, gender, objective);
    }

    const intensityPatterns: Record<number, DayIntensity[]> = {
      3: ["pesado", "moderado", "pesado"],
      4: ["pesado", "moderado", "pesado", "moderado"],
      5: ["pesado", "moderado", "pesado", "moderado", "pesado"],
      6: ["pesado", "moderado", "pesado", "moderado", "pesado", "moderado"],
    };
    const intensities = intensityPatterns[days] || intensityPatterns[3];

    plan = split.map((muscleGroups, i) => {
      const grupo = muscleGroups.map(g => groupLabels[g] || g).join(" + ");
      const exercicios: Exercise[] = [];
      const dayIntensity = intensities[i] || "pesado";

      muscleGroups.forEach(group => {
        const pool = exerciseDB[group]?.[level] || exerciseDB[group]?.intermediario || [];
        const maxPerGroup = getMaxExercisesForGroup(group, muscleGroups, dayIntensity, level);
        const selected = selectExercises(pool, i, maxPerGroup, prevDayExercises, preferredNames);
        selected.forEach(ex => {
          const adjustedSeries = Math.max(2, Math.round(Number(ex.series) * config.seriesMultiplier));
          const adjusted = adjustRestForIntensity({ ...ex, series: String(adjustedSeries) }, dayIntensity);
          exercicios.push(adjusted);
        });
      });

      prevDayExercises.clear();
      exercicios.forEach(ex => prevDayExercises.add(ex.nome));

      return {
        dia: diasSemana[i] || `Dia ${i + 1}`,
        grupo,
        exercicios,
        intensidade: dayIntensity,
      };
    });
  }

  // Post-processing pipeline
  plan = applyIntensityLevel(plan, intensityLevel);
  plan = applyCardioToWeek(plan, cardioFreq, level, objective, gender);
  plan = enrichFemaleExercises(plan, gender, level);
  plan = enrichMaleExercises(plan, gender, level);
  plan = enforceUpperLowerAlternation(plan);
  // NEW: reorder auxiliary exercises to end + cap at 4-5 exercises per day
  plan = reorderAndCapExercises(plan);

  return plan;
}
