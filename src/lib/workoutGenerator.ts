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
// REGRA: alternância estrita SUPERIOR → INFERIOR → SUPERIOR
// Nunca repetir mesma região em dias consecutivos
// =====================================================
const splitTemplates: Record<Objective, Record<number, SplitEntry[]>> = {
  emagrecer: {
    // 3d: Superior → Inferior → Superior (com cardio/HIIT integrado)
    3: [["peito", "costas", "hiit"], ["quadriceps", "panturrilha", "cardio"], ["ombros", "triceps", "biceps", "hiit"]],
    // 4d: Superior → Inferior → Superior → Inferior
    4: [["peito", "triceps", "hiit"], ["quadriceps", "panturrilha"], ["costas", "biceps", "hiit"], ["posterior", "gluteos", "cardio"]],
    // 5d: Superior → Inferior → Cardio/Core → Inferior(diff) → Superior(diff)
    5: [["peito", "triceps"], ["quadriceps", "panturrilha"], ["hiit", "abdomen", "cardio"], ["posterior", "gluteos"], ["costas", "biceps", "ombros"]],
    // 6d: Sup → Inf → Sup → Inf → Sup → Cardio
    6: [["peito", "triceps"], ["quadriceps", "panturrilha"], ["costas", "biceps"], ["posterior", "gluteos"], ["ombros", "abdomen"], ["hiit", "cardio"]],
  },
  massa: {
    // 3d: Superior → Inferior → Superior
    3: [["peito", "triceps"], ["quadriceps", "posterior", "panturrilha"], ["costas", "biceps", "ombros"]],
    // 4d: Sup → Inf → Sup → Inf
    4: [["peito", "triceps"], ["quadriceps", "panturrilha"], ["costas", "biceps"], ["posterior", "gluteos", "abdomen"]],
    // 5d: Sup → Inf → Sup → Inf → Sup
    5: [["peito", "ombros"], ["quadriceps", "panturrilha"], ["costas", "biceps"], ["posterior", "gluteos"], ["triceps", "ombros", "abdomen"]],
    // 6d: Sup → Inf → Sup → Inf → Sup → Inf(leve)
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
    { groups: ["peito", "triceps"], intensity: "pesado" },        // Seg: Superior
    { groups: ["quadriceps", "panturrilha"], intensity: "pesado" }, // Ter: Inferior
    { groups: ["hiit", "abdomen"], intensity: "moderado" },        // Qua: Cardio/Core
    { groups: ["posterior", "gluteos"], intensity: "pesado" },      // Qui: Inferior (diff)
    { groups: ["costas", "biceps", "ombros"], intensity: "pesado" }, // Sex: Superior (diff)
    { groups: ["hiit", "cardio"], intensity: "moderado" },          // Sab: Cardio
    { groups: ["mobilidade", "recuperacao"], intensity: "leve" },   // Dom: Descanso
  ],
  massa: [
    { groups: ["peito", "triceps"], intensity: "pesado" },          // Seg: Superior
    { groups: ["quadriceps", "panturrilha"], intensity: "pesado" }, // Ter: Inferior
    { groups: ["costas", "biceps"], intensity: "pesado" },          // Qua: Superior (diff)
    { groups: ["posterior", "gluteos"], intensity: "pesado" },      // Qui: Inferior (diff)
    { groups: ["ombros", "abdomen"], intensity: "moderado" },       // Sex: Superior (leve)
    { groups: ["pernas", "panturrilha"], intensity: "moderado" },   // Sab: Inferior (leve)
    { groups: ["mobilidade", "recuperacao"], intensity: "leve" },   // Dom: Descanso
  ],
  condicionamento: [
    { groups: ["hiit", "peito"], intensity: "pesado" },             // Seg: Superior
    { groups: ["quadriceps", "panturrilha", "cardio"], intensity: "pesado" }, // Ter: Inferior
    { groups: ["costas", "hiit"], intensity: "pesado" },            // Qua: Superior (diff)
    { groups: ["posterior", "gluteos"], intensity: "pesado" },      // Qui: Inferior (diff)
    { groups: ["ombros", "abdomen", "cardio"], intensity: "moderado" }, // Sex: Superior
    { groups: ["mobilidade", "recuperacao"], intensity: "leve" },   // Sab: Descanso
    { groups: ["hiit", "cardio"], intensity: "moderado" },          // Dom: Cardio ativo
  ],
};

// =====================================================
// SPLIT TEMPLATES — FOCO SUPERIOR
// Prioriza peito, costas, ombros, braços
// Mantém estímulo leve/moderado de inferiores para equilíbrio
// Alterna empurrar/puxar
// =====================================================
// =====================================================
// SPLIT TEMPLATES — FOCO SUPERIOR
// Mais dias de superior, mas NUNCA consecutivos sem buffer inferior/cardio
// =====================================================
const focusSplitTemplates: Record<BodyFocus, Record<Objective, Record<number, SplitEntry[]>>> = {
  superior: {
    emagrecer: {
      3: [["peito", "triceps", "hiit"], ["quadriceps", "panturrilha"], ["costas", "biceps", "ombros"]],
      4: [["peito", "triceps"], ["quadriceps", "panturrilha", "hiit"], ["costas", "biceps"], ["ombros", "abdomen", "cardio"]],
      5: [["peito", "triceps"], ["quadriceps", "panturrilha"], ["costas", "biceps", "hiit"], ["posterior", "gluteos"], ["ombros", "abdomen", "cardio"]],
      6: [["peito", "triceps"], ["quadriceps", "panturrilha"], ["costas", "biceps"], ["posterior", "gluteos", "hiit"], ["ombros", "abdomen"], ["cardio", "hiit"]],
    },
    massa: {
      3: [["peito", "triceps"], ["quadriceps", "panturrilha"], ["costas", "biceps", "ombros"]],
      4: [["peito", "triceps"], ["quadriceps", "panturrilha"], ["costas", "biceps"], ["ombros", "abdomen"]],
      5: [["peito", "triceps"], ["quadriceps", "panturrilha"], ["costas", "biceps"], ["posterior", "gluteos"], ["ombros", "abdomen"]],
      6: [["peito", "triceps"], ["quadriceps", "panturrilha"], ["costas", "biceps"], ["posterior", "gluteos"], ["ombros"], ["peito", "costas", "abdomen"]],
    },
    condicionamento: {
      3: [["hiit", "peito", "costas"], ["quadriceps", "panturrilha", "cardio"], ["ombros", "triceps", "biceps"]],
      4: [["hiit", "peito", "triceps"], ["quadriceps", "cardio"], ["costas", "biceps", "hiit"], ["posterior", "ombros", "cardio"]],
      5: [["hiit", "peito"], ["quadriceps", "panturrilha"], ["costas", "biceps", "cardio"], ["posterior", "gluteos", "hiit"], ["ombros", "abdomen", "cardio"]],
      6: [["hiit", "peito"], ["quadriceps", "panturrilha"], ["costas", "hiit"], ["posterior", "gluteos", "cardio"], ["ombros", "triceps"], ["hiit", "cardio"]],
    },
  },
  inferior: {
    emagrecer: {
      3: [["quadriceps", "panturrilha", "hiit"], ["peito", "costas", "cardio"], ["posterior", "gluteos", "abdomen"]],
      4: [["quadriceps", "panturrilha", "hiit"], ["peito", "triceps"], ["posterior", "gluteos", "cardio"], ["costas", "biceps", "abdomen"]],
      5: [["quadriceps", "panturrilha"], ["peito", "triceps", "hiit"], ["posterior", "gluteos"], ["costas", "biceps", "cardio"], ["pernas", "abdomen"]],
      6: [["quadriceps", "panturrilha"], ["peito", "triceps", "hiit"], ["posterior", "gluteos"], ["costas", "biceps"], ["pernas", "abdomen", "cardio"], ["ombros", "hiit"]],
    },
    massa: {
      3: [["quadriceps", "panturrilha"], ["peito", "costas", "ombros"], ["posterior", "gluteos"]],
      4: [["quadriceps", "panturrilha"], ["peito", "triceps"], ["posterior", "gluteos"], ["costas", "biceps", "abdomen"]],
      5: [["quadriceps", "panturrilha"], ["peito", "triceps"], ["posterior", "gluteos"], ["costas", "biceps"], ["pernas", "abdomen"]],
      6: [["quadriceps", "panturrilha"], ["peito", "triceps"], ["posterior", "gluteos"], ["costas", "biceps"], ["pernas", "abdomen"], ["ombros", "panturrilha"]],
    },
    condicionamento: {
      3: [["quadriceps", "hiit", "panturrilha"], ["peito", "costas", "cardio"], ["posterior", "gluteos", "hiit"]],
      4: [["quadriceps", "hiit"], ["peito", "triceps", "cardio"], ["posterior", "gluteos", "hiit"], ["costas", "ombros", "cardio"]],
      5: [["quadriceps", "hiit"], ["peito", "triceps"], ["posterior", "gluteos", "cardio"], ["costas", "biceps", "hiit"], ["pernas", "abdomen", "cardio"]],
      6: [["quadriceps", "hiit"], ["peito", "triceps"], ["posterior", "gluteos", "cardio"], ["costas", "biceps", "hiit"], ["pernas", "abdomen"], ["ombros", "cardio"]],
    },
  },
  completo: {
    emagrecer: splitTemplates.emagrecer,
    massa: splitTemplates.massa,
    condicionamento: splitTemplates.condicionamento,
  },
};

// =====================================================
// 7-DAY FOCUS OVERRIDES — strict alternation
// =====================================================
const focusSplitTemplates7: Record<BodyFocus, Record<Objective, SplitEntry7[]>> = {
  superior: {
    emagrecer: [
      { groups: ["peito", "triceps"], intensity: "pesado" },
      { groups: ["quadriceps", "panturrilha"], intensity: "pesado" },
      { groups: ["costas", "biceps"], intensity: "pesado" },
      { groups: ["posterior", "gluteos"], intensity: "moderado" },
      { groups: ["ombros", "hiit"], intensity: "pesado" },
      { groups: ["cardio", "abdomen"], intensity: "moderado" },
      { groups: ["mobilidade", "recuperacao"], intensity: "leve" },
    ],
    massa: [
      { groups: ["peito", "triceps"], intensity: "pesado" },
      { groups: ["quadriceps", "panturrilha"], intensity: "moderado" },
      { groups: ["costas", "biceps"], intensity: "pesado" },
      { groups: ["posterior", "gluteos"], intensity: "moderado" },
      { groups: ["ombros"], intensity: "pesado" },
      { groups: ["peito", "costas", "abdomen"], intensity: "moderado" },
      { groups: ["mobilidade", "recuperacao"], intensity: "leve" },
    ],
    condicionamento: [
      { groups: ["hiit", "peito"], intensity: "pesado" },
      { groups: ["quadriceps", "cardio"], intensity: "moderado" },
      { groups: ["costas", "hiit"], intensity: "pesado" },
      { groups: ["posterior", "gluteos"], intensity: "moderado" },
      { groups: ["ombros", "triceps", "hiit"], intensity: "pesado" },
      { groups: ["cardio", "abdomen"], intensity: "moderado" },
      { groups: ["mobilidade", "recuperacao"], intensity: "leve" },
    ],
  },
  inferior: {
    emagrecer: [
      { groups: ["quadriceps", "panturrilha"], intensity: "pesado" },
      { groups: ["peito", "triceps", "hiit"], intensity: "moderado" },
      { groups: ["posterior", "gluteos"], intensity: "pesado" },
      { groups: ["costas", "biceps"], intensity: "moderado" },
      { groups: ["pernas", "hiit"], intensity: "pesado" },
      { groups: ["ombros", "abdomen", "cardio"], intensity: "moderado" },
      { groups: ["mobilidade", "recuperacao"], intensity: "leve" },
    ],
    massa: [
      { groups: ["quadriceps", "panturrilha"], intensity: "pesado" },
      { groups: ["peito", "costas"], intensity: "moderado" },
      { groups: ["posterior", "gluteos"], intensity: "pesado" },
      { groups: ["ombros", "abdomen"], intensity: "moderado" },
      { groups: ["pernas"], intensity: "pesado" },
      { groups: ["panturrilha", "gluteos"], intensity: "moderado" },
      { groups: ["mobilidade", "recuperacao"], intensity: "leve" },
    ],
    condicionamento: [
      { groups: ["quadriceps", "hiit"], intensity: "pesado" },
      { groups: ["peito", "costas", "cardio"], intensity: "moderado" },
      { groups: ["posterior", "gluteos"], intensity: "pesado" },
      { groups: ["ombros", "abdomen", "cardio"], intensity: "moderado" },
      { groups: ["pernas", "hiit"], intensity: "pesado" },
      { groups: ["cardio", "abdomen"], intensity: "moderado" },
      { groups: ["mobilidade", "recuperacao"], intensity: "leve" },
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

// =====================================================
// ROTATION & VARIATION ENGINE
// =====================================================

// Deterministic shuffle based on a seed (day index + group) for consistency per plan
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

// Select a varied subset from pool, ensuring rotation across days
// dayIndex shifts which exercises are picked, so consecutive days with same group get different exercises
// preferredNames: exercises the user prefers — they get priority but don't dominate
function selectExercises(
  pool: Exercise[],
  dayIndex: number,
  maxCount: number,
  usedNames: Set<string>,
  preferredNames?: Set<string>
): Exercise[] {
  if (pool.length === 0) return [];
  
  // Shuffle pool deterministically based on day index
  const shuffled = shuffleArray(pool, dayIndex * 7919 + pool.length * 31);
  
  // Separate preferred vs non-preferred
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
  
  // Rule: preferred can fill at most ~50% of slots to avoid domination
  const maxPreferred = Math.max(1, Math.ceil(maxCount * 0.5));
  
  const selected: Exercise[] = [];
  
  // First: add preferred exercises (capped)
  for (const ex of preferred) {
    if (selected.length >= maxPreferred) break;
    selected.push(ex);
  }
  
  // Then: fill with non-preferred
  for (const ex of nonPreferred) {
    if (selected.length >= maxCount) break;
    selected.push(ex);
  }
  
  // Fill remaining from any unused if needed
  for (const ex of shuffled) {
    if (selected.length >= maxCount) break;
    if (!selected.includes(ex)) {
      selected.push(ex);
    }
  }
  
  return selected;
}

// Adjust rest times based on day intensity
function adjustRestForIntensity(exercise: Exercise, intensity: DayIntensity): Exercise {
  const restMap: Record<DayIntensity, Record<string, string>> = {
    pesado: { "30s": "60s", "45s": "90s", "60s": "90s", "90s": "120s", "120s": "180s" },
    moderado: { "120s": "90s", "180s": "120s", "90s": "75s" },
    leve: { "90s": "60s", "120s": "60s", "180s": "90s", "60s": "45s", "45s": "30s" },
  };
  const mapping = restMap[intensity];
  const newDescanso = mapping?.[exercise.descanso] || exercise.descanso;
  return { ...exercise, descanso: newDescanso };
}

// Max exercises per muscle group per day, varies by intensity
function getMaxExercisesPerGroup(intensity: DayIntensity, level: Level): number {
  const base = level === "avancado" ? 4 : level === "intermediario" ? 3 : 2;
  if (intensity === "leve") return Math.max(1, base - 1);
  if (intensity === "moderado") return base;
  return base + 1; // pesado: allow more
}

export type CardioFrequency = "0" | "1-2" | "3-4" | "daily";
export type IntensityLevel = "moderado" | "intenso";

// Determine which days get cardio based on frequency and total training days
// SMART: considers leg days, day intensity, and objective-specific cardio types
function applyCardioToWeek(
  plan: WorkoutDay[],
  cardioFreq: CardioFrequency,
  level: Level
): WorkoutDay[] {
  if (cardioFreq === "0") return plan;

  const totalDays = plan.length;
  
  // Determine how many days get cardio
  let cardioDays: number;
  switch (cardioFreq) {
    case "1-2": cardioDays = Math.min(2, totalDays); break;
    case "3-4": cardioDays = Math.min(4, totalDays); break;
    case "daily": cardioDays = totalDays; break;
    default: cardioDays = 0;
  }
  if (cardioDays === 0) return plan;

  // Duration by level
  const durationMap: Record<Level, string> = {
    iniciante: "12min",
    intermediario: "20min",
    avancado: "30min",
  };
  const lightDuration: Record<Level, string> = {
    iniciante: "10min",
    intermediario: "12min",
    avancado: "15min",
  };

  // Helper: is this a leg-heavy day?
  const isLegDay = (grupo: string) => {
    const g = grupo.toLowerCase();
    return g.includes("perna") || g.includes("quadríceps") || g.includes("posterior") || g.includes("glúteo");
  };

  // Build cardio exercise pool per day
  const cardioPool = exerciseDB.cardio?.[level] || exerciseDB.cardio?.intermediario || [];
  const baseCardio = cardioPool[0];
  if (!baseCardio) return plan;

  // For "daily", add light cardio to every day
  if (cardioFreq === "daily") {
    return plan.map(day => {
      const hasCardio = day.exercicios.some(e => 
        e.nome.toLowerCase().includes("cardio") || e.nome.toLowerCase().includes("corrida") || 
        e.nome.toLowerCase().includes("caminhada") || e.nome.toLowerCase().includes("hiit cardio")
      );
      if (hasCardio) return day;
      
      const legDay = isLegDay(day.grupo);
      // Leg day or intense day: use light cardio
      const dur = legDay || day.intensidade === "pesado" ? lightDuration[level] : durationMap[level];
      const desc = legDay 
        ? "Cardio leve pós-treino de perna — baixo impacto para não comprometer recuperação."
        : "Cardio pós-treino para condicionamento e queima adicional.";
      
      const lightCardioEx: Exercise = {
        ...baseCardio,
        nome: legDay ? "Caminhada Leve" : baseCardio.nome,
        series: "1",
        reps: dur,
        desc,
        descanso: "—",
      };
      
      // Reduce volume: remove last exercise if day has 5+ exercises
      const exercicios = day.exercicios.length >= 5
        ? [...day.exercicios.slice(0, -1), lightCardioEx]
        : [...day.exercicios, lightCardioEx];
      return { ...day, exercicios };
    });
  }

  // For 1-2 or 3-4: pick specific days
  // Never put intense cardio on leg days
  const dayPriority = plan.map((day, idx) => ({
    idx,
    intensity: day.intensidade || "moderado" as DayIntensity,
    hasCardio: day.grupo.toLowerCase().includes("cardio") || day.grupo.toLowerCase().includes("hiit"),
    isLeg: isLegDay(day.grupo),
  }));

  // Sort by priority: prefer non-leg, non-heavy days
  const sorted = [...dayPriority]
    .filter(d => !d.hasCardio)
    .sort((a, b) => {
      // Leg days go last
      if (a.isLeg && !b.isLeg) return 1;
      if (!a.isLeg && b.isLeg) return -1;
      const order: Record<DayIntensity, number> = { leve: 0, moderado: 1, pesado: 2 };
      return (order[a.intensity] || 1) - (order[b.intensity] || 1);
    });

  const indicesToAddCardio = sorted.slice(0, cardioDays).map(d => d.idx);

  return plan.map((day, idx) => {
    if (!indicesToAddCardio.includes(idx)) return day;
    
    const legDay = isLegDay(day.grupo);
    const dur = legDay ? lightDuration[level] : (cardioFreq === "3-4" ? durationMap[level] : durationMap[level]);
    
    const cardioForDay: Exercise = {
      ...baseCardio,
      nome: legDay ? "Caminhada Leve" : baseCardio.nome,
      series: "1",
      reps: dur,
      desc: legDay 
        ? "Cardio leve — dia de perna, priorize recuperação."
        : "Cardio dedicado para condicionamento cardiovascular.",
      descanso: "—",
    };
    return {
      ...day,
      grupo: day.grupo + " + Cardio",
      exercicios: [...day.exercicios, cardioForDay],
    };
  });
}

// Apply global intensity level adjustments
function applyIntensityLevel(plan: WorkoutDay[], intensityLevel: IntensityLevel): WorkoutDay[] {
  if (intensityLevel === "moderado") {
    // Moderate: reduce pesado to moderado, keep others
    return plan.map(day => {
      const newIntensity: DayIntensity = day.intensidade === "pesado" ? "moderado" : day.intensidade || "moderado";
      const exercicios = day.exercicios.map(ex => {
        // Reduce volume slightly for moderate
        const series = Math.max(2, Number(ex.series) - (day.intensidade === "pesado" ? 1 : 0));
        return adjustRestForIntensity({ ...ex, series: String(series) }, newIntensity);
      });
      return { ...day, exercicios, intensidade: newIntensity };
    });
  }

  // Intenso: boost pesado days, convert moderado to pesado, keep leve
  return plan.map(day => {
    if (day.intensidade === "leve") return day;
    const newIntensity: DayIntensity = "pesado";
    const exercicios = day.exercicios.map(ex => {
      // Increase volume for intense
      const series = Math.min(6, Number(ex.series) + (day.intensidade === "moderado" ? 1 : 0));
      return adjustRestForIntensity({ ...ex, series: String(series) }, newIntensity);
    });
    return { ...day, exercicios, intensidade: newIntensity };
  });
}

// ensureNoConsecutiveHeavy is now replaced by enforceUpperLowerAlternation below

export type UserGender = "masculino" | "feminino" | string | null | undefined;

export type ExercisePreferences = {
  preferred: string[];
  freeText?: string;
};

// Gender-aware body focus override:
// If user picks "completo" and we know their gender, auto-adjust the focus distribution
function resolveGenderFocus(bodyFocus: BodyFocus, gender: UserGender): BodyFocus {
  // Only auto-adjust when focus is "completo" — if user explicitly picks upper/inferior, respect it
  if (bodyFocus !== "completo") return bodyFocus;
  if (!gender) return bodyFocus;
  return bodyFocus;
}

// =====================================================
// GENDER-SPECIFIC SPLIT MODIFICATIONS
// Female: emphasize posterior chain (glutes, hamstrings, calves)
//         add metabolic/resistance focus, reduce arm isolation volume
// Male:   emphasize compound upper body (chest, back, shoulders)
//         strategic arm training, strength/load focus
// ALWAYS respects user's explicit body focus choice
// =====================================================

function applyGenderToSplit(split: SplitEntry[], gender: UserGender, objective: Objective): SplitEntry[] {
  if (!gender) return split;

  if (gender === "feminino") {
    return split.map((groups, dayIdx) => {
      const result = groups.map(g => {
        // Generic "pernas" → alternate between posterior-focused and quad-focused
        if (g === "pernas") return dayIdx % 2 === 0 ? "posterior" : "quadriceps";
        return g;
      });

      // On lower-body days, ensure gluteos are included if not already
      const hasLower = result.some(g => ["quadriceps", "posterior", "pernas"].includes(g));
      const hasGluteos = result.includes("gluteos");
      if (hasLower && !hasGluteos && result.length < 4) {
        result.push("gluteos");
      }

      // On lower-body days, ensure panturrilha is included if not already
      const hasPanturrilha = result.includes("panturrilha");
      if (hasLower && !hasPanturrilha && result.length < 5) {
        result.push("panturrilha");
      }

      // On upper-body days for females: keep them but lighter (fewer arm isolation)
      // Remove standalone biceps if day already has 3+ groups (keep it lean)
      const isUpperOnly = result.some(g => ["peito", "costas", "ombros"].includes(g)) &&
                          !result.some(g => ["quadriceps", "posterior", "gluteos", "pernas"].includes(g));
      if (isUpperOnly && result.length >= 4) {
        const bicepsIdx = result.indexOf("biceps");
        if (bicepsIdx !== -1 && result.includes("costas")) {
          // Costas already trains biceps — remove isolation to reduce upper volume
          result.splice(bicepsIdx, 1);
        }
      }

      return result;
    });
  }

  if (gender === "masculino") {
    return split.map((groups, dayIdx) => {
      const result = [...groups];

      // Generic "pernas" → alternate quad-focused and posterior-focused
      for (let i = 0; i < result.length; i++) {
        if (result[i] === "pernas") {
          result[i] = dayIdx % 2 === 0 ? "quadriceps" : "posterior";
        }
      }

      // On upper-body days: ensure arm training is included
      const hasUpper = result.some(g => ["peito", "costas", "ombros"].includes(g));
      const hasLower = result.some(g => ["quadriceps", "posterior", "gluteos", "pernas", "panturrilha"].includes(g));
      const hasArms = result.some(g => ["biceps", "triceps"].includes(g));

      if (hasUpper && !hasLower && !hasArms && result.length < 4) {
        // Add strategic arm work: triceps with push days, biceps with pull days
        const hasPush = result.includes("peito") || result.includes("ombros");
        const hasPull = result.includes("costas");
        if (hasPush && !result.includes("triceps")) {
          result.push("triceps");
        } else if (hasPull && !result.includes("biceps")) {
          result.push("biceps");
        }
      }

      return result;
    });
  }

  return split;
}

// Gender-specific 7-day split overrides
function applyGenderTo7DaySplit(split: SplitEntry7[], gender: UserGender): SplitEntry7[] {
  if (!gender) return split;

  if (gender === "feminino") {
    return split.map((entry, i) => {
      const groups = entry.groups.map(g => {
        if (g === "pernas") return i % 2 === 0 ? "posterior" : "quadriceps";
        return g;
      });

      // Add gluteos to lower days that don't have it
      const hasLower = groups.some(g => ["quadriceps", "posterior"].includes(g));
      const hasGluteos = groups.includes("gluteos");
      if (hasLower && !hasGluteos && groups.length < 4) {
        groups.push("gluteos");
      }

      // Boost intensity on lower days (female priority)
      const isLowerDay = hasLower;
      const newIntensity = isLowerDay && entry.intensity === "moderado" ? "pesado" as DayIntensity : entry.intensity;

      return { ...entry, groups, intensity: newIntensity };
    });
  }

  if (gender === "masculino") {
    return split.map((entry, i) => {
      const groups = entry.groups.map(g => {
        if (g === "pernas") return i % 2 === 0 ? "quadriceps" : "posterior";
        return g;
      });

      // Add arm isolation to upper days that don't have it
      const hasUpper = groups.some(g => ["peito", "costas", "ombros"].includes(g));
      const hasLower = groups.some(g => ["quadriceps", "posterior", "gluteos", "panturrilha"].includes(g));
      const hasArms = groups.some(g => ["biceps", "triceps"].includes(g));
      if (hasUpper && !hasLower && !hasArms && groups.length < 4) {
        const hasPush = groups.includes("peito") || groups.includes("ombros");
        if (hasPush) groups.push("triceps");
        else groups.push("biceps");
      }

      // Boost intensity on upper days (male priority)
      const isUpperDay = hasUpper && !hasLower;
      const newIntensity = isUpperDay && entry.intensity === "moderado" ? "pesado" as DayIntensity : entry.intensity;

      return { ...entry, groups, intensity: newIntensity };
    });
  }

  return split;
}

// =====================================================
// STRICT UPPER/LOWER ALTERNATION ENFORCEMENT
// Classifies each day as UPPER, LOWER, or NEUTRAL (cardio/mobility/abs)
// If two consecutive days are the same region AND heavy, downgrade intensity
// Also prevents exact same primary muscle group on consecutive days
// =====================================================
type DayRegion = "upper" | "lower" | "neutral";

const UPPER_KEYWORDS = ["peito", "costas", "ombro", "bíceps", "tríceps", "biceps", "triceps"];
const LOWER_KEYWORDS = ["perna", "quadríceps", "quadriceps", "posterior", "glúteo", "gluteos", "gluteo", "panturrilha"];
const NEUTRAL_KEYWORDS = ["hiit", "cardio", "mobilidade", "recuperacao", "recuperação", "abdomen", "abdômen"];

function classifyDayRegion(grupo: string): DayRegion {
  const g = grupo.toLowerCase();
  
  // Check neutrals first (cardio-only, mobility, recovery)
  const neutralTokens = g.split(/[\s+,/]+/);
  const allNeutral = neutralTokens.every(t => 
    NEUTRAL_KEYWORDS.some(k => t.includes(k)) || t.trim() === ""
  );
  if (allNeutral && neutralTokens.length > 0) return "neutral";

  const hasUpper = UPPER_KEYWORDS.some(k => g.includes(k));
  const hasLower = LOWER_KEYWORDS.some(k => g.includes(k));

  if (hasUpper && hasLower) return "neutral"; // mixed = treat as neutral
  if (hasUpper) return "upper";
  if (hasLower) return "lower";
  return "neutral";
}

// Extract primary muscle groups from a day's grupo string
function extractPrimaryGroups(grupo: string): string[] {
  const g = grupo.toLowerCase();
  const found: string[] = [];
  const allKeywords = [...UPPER_KEYWORDS, ...LOWER_KEYWORDS];
  for (const k of allKeywords) {
    if (g.includes(k)) found.push(k);
  }
  return found;
}

function enforceUpperLowerAlternation(plan: WorkoutDay[]): WorkoutDay[] {
  const result = [...plan];
  
  for (let i = 1; i < result.length; i++) {
    const prev = result[i - 1];
    const curr = result[i];
    
    const prevRegion = classifyDayRegion(prev.grupo);
    const currRegion = classifyDayRegion(curr.grupo);
    
    // Rule 1: Two consecutive days of same region (both heavy) → downgrade current
    if (prevRegion !== "neutral" && prevRegion === currRegion) {
      if (prev.intensidade === "pesado" || curr.intensidade === "pesado") {
        result[i] = {
          ...curr,
          intensidade: "moderado",
          exercicios: curr.exercicios.map(ex => adjustRestForIntensity(ex, "moderado")),
        };
      }
    }
    
    // Rule 2: Exact same primary muscle group on consecutive days → downgrade to leve
    const prevGroups = extractPrimaryGroups(prev.grupo);
    const currGroups = extractPrimaryGroups(curr.grupo);
    const overlap = prevGroups.filter(g => currGroups.includes(g));
    
    if (overlap.length > 0 && !NEUTRAL_KEYWORDS.some(k => overlap.includes(k))) {
      // Same muscle on consecutive days — force leve intensity
      const currentIntensity = result[i].intensidade || "moderado";
      if (currentIntensity === "pesado") {
        result[i] = {
          ...result[i],
          intensidade: "moderado",
          exercicios: result[i].exercicios.map(ex => adjustRestForIntensity(ex, "moderado")),
        };
      }
    }
  }
  
  return result;
}

// Add gluteo-specific exercises for female users on lower body days
// Also adds metabolic finishers (short HIIT/burnout sets) for resistance training focus
function enrichFemaleExercises(plan: WorkoutDay[], gender: UserGender, level: Level): WorkoutDay[] {
  if (gender !== "feminino") return plan;
  
  return plan.map(day => {
    const g = day.grupo.toLowerCase();
    const isLowerDay = g.includes("posterior") || g.includes("quadríceps") || g.includes("quadriceps") ||
                       g.includes("perna") || g.includes("glúteo") || g.includes("gluteo");
    if (!isLowerDay) return day;

    const exercicios = [...day.exercicios];

    // 1) Ensure glute activation is present
    const hasGlute = exercicios.some(ex => 
      ex.nome.toLowerCase().includes("hip thrust") || 
      ex.nome.toLowerCase().includes("elevação pélvica") ||
      ex.nome.toLowerCase().includes("glúteo") ||
      ex.nome.toLowerCase().includes("abdutora") ||
      ex.nome.toLowerCase().includes("kickback")
    );
    if (!hasGlute) {
      const glutePool = exerciseDB.gluteos?.[level] || exerciseDB.gluteos?.intermediario || [];
      if (glutePool.length > 0) {
        const gluteEx = glutePool[Math.floor(Math.random() * glutePool.length)];
        exercicios.push({ ...gluteEx, series: "3", reps: "12" });
      }
    }

    // 2) Add panturrilha finisher if missing on quad days
    const isQuadDay = g.includes("quadríceps") || g.includes("quadriceps");
    const hasCalf = exercicios.some(ex => ex.nome.toLowerCase().includes("panturrilha"));
    if (isQuadDay && !hasCalf) {
      const calfPool = exerciseDB.panturrilha?.[level] || exerciseDB.panturrilha?.intermediario || [];
      if (calfPool.length > 0) {
        exercicios.push({ ...calfPool[0], series: "4", reps: "15" });
      }
    }

    return { ...day, exercicios };
  });
}

// Add compound strength emphasis for male users on upper body days
function enrichMaleExercises(plan: WorkoutDay[], gender: UserGender, level: Level): WorkoutDay[] {
  if (gender !== "masculino") return plan;

  return plan.map(day => {
    const g = day.grupo.toLowerCase();
    const isUpperDay = g.includes("peito") || g.includes("costas") || g.includes("ombro");
    const isLowerDay = g.includes("posterior") || g.includes("quadríceps") || g.includes("quadriceps") ||
                       g.includes("perna") || g.includes("glúteo") || g.includes("gluteo");
    if (!isUpperDay || isLowerDay) return day;

    const exercicios = [...day.exercicios];

    // Ensure compound movements are present on chest days
    if (g.includes("peito")) {
      const hasCompound = exercicios.some(ex => 
        ex.nome.toLowerCase().includes("supino") || ex.nome.toLowerCase().includes("desenvolvimento")
      );
      if (!hasCompound && level !== "iniciante") {
        const chestPool = exerciseDB.peito?.[level] || [];
        const compound = chestPool.find(ex => ex.nome.toLowerCase().includes("supino"));
        if (compound) exercicios.unshift({ ...compound });
      }
    }

    // Ensure compound movements are present on back days
    if (g.includes("costas")) {
      const hasCompound = exercicios.some(ex => 
        ex.nome.toLowerCase().includes("remada") || ex.nome.toLowerCase().includes("barra fixa")
      );
      if (!hasCompound && level !== "iniciante") {
        const backPool = exerciseDB.costas?.[level] || [];
        const compound = backPool.find(ex => ex.nome.toLowerCase().includes("remada") || ex.nome.toLowerCase().includes("barra fixa"));
        if (compound) exercicios.unshift({ ...compound });
      }
    }

    return { ...day, exercicios };
  });
}

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

  // Build preferred names set from preferences
  const preferredNames = new Set(preferences?.preferred || []);

  // Track used exercise names to avoid repetition on adjacent days
  const prevDayExercises: Set<string> = new Set();

  let plan: WorkoutDay[];

  // 7-day uses special templates with intensity metadata
  if (days === 7) {
    const focusTemplates7 = focusSplitTemplates7[bodyFocus] || focusSplitTemplates7.completo;
    let split7 = focusTemplates7[objective] || splitTemplates7[objective];
    split7 = applyGenderTo7DaySplit(split7, gender);

    plan = split7.map((entry, i) => {
      const grupo = entry.groups.map(g => groupLabels[g] || g).join(" + ");
      const exercicios: Exercise[] = [];
      const volumeMultiplier = entry.intensity === "leve" ? 0.5 : entry.intensity === "moderado" ? 0.75 : 1;
      const maxPerGroup = getMaxExercisesPerGroup(entry.intensity, level);

      entry.groups.forEach(group => {
        const pool = exerciseDB[group]?.[level] || exerciseDB[group]?.intermediario || [];
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
    // 3-6 day standard generation with rotation
    const focusTemplates = focusSplitTemplates[bodyFocus] || focusSplitTemplates.completo;
    let split = focusTemplates[objective]?.[days] || focusTemplates[objective]?.[3] || splitTemplates[objective][3];
    split = applyGenderToSplit(split, gender, objective);

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
      const maxPerGroup = getMaxExercisesPerGroup(dayIntensity, level);

      muscleGroups.forEach(group => {
        const pool = exerciseDB[group]?.[level] || exerciseDB[group]?.intermediario || [];
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
  plan = applyCardioToWeek(plan, cardioFreq, level);
  plan = enrichFemaleExercises(plan, gender, level);
  plan = enforceUpperLowerAlternation(plan);

  return plan;
}
