export type MuscleGroup = "peito" | "costas" | "pernas" | "ombros" | "biceps" | "triceps" | "abdomen" | "cardio" | "alongamento" | "quadriceps" | "posterior" | "panturrilha" | "antebraco";

export type ExerciseType = "musculação" | "cardio" | "alongamento" | "mobilidade";

export type MuscleId =
  | "peitoral" | "peitoral-superior"
  | "dorsal" | "trapezio" | "lombar"
  | "deltoide-anterior" | "deltoide-lateral" | "deltoide-posterior"
  | "biceps" | "triceps" | "antebraco"
  | "quadriceps" | "isquiotibiais" | "gluteos" | "panturrilha" | "adutor"
  | "reto-abdominal" | "obliquos" | "core"
  | "corpo-inteiro";

export type ExerciseDetail = {
  id: string;
  nome: string;
  grupo: MuscleGroup;
  grupoLabel: string;
  musculos: string[];
  musculosDestacados: MuscleId[];
  instrucoes: string[];
  dicas: string[];
  equipamento: string;
  dificuldade: "iniciante" | "intermediário" | "avançado";
  tipo: "composto" | "isolado";
  tipoExercicio: ExerciseType;
  alternativas: string[];
  animacao: {
    frames: string[];
    cor: string;
  };
};

const muscleGroupLabels: Record<MuscleGroup, string> = {
  peito: "Peito",
  costas: "Costas",
  pernas: "Pernas",
  ombros: "Ombros",
  biceps: "Bíceps",
  triceps: "Tríceps",
  abdomen: "Abdômen",
  cardio: "Cardio",
  alongamento: "Alongamento",
  quadriceps: "Quadríceps",
  posterior: "Posterior",
  panturrilha: "Panturrilha",
  antebraco: "Antebraço",
};

export const muscleGroupIcons: Record<MuscleGroup, string> = {
  peito: "💪",
  costas: "🔙",
  pernas: "🦵",
  ombros: "🏋️",
  biceps: "💪",
  triceps: "💪",
  abdomen: "🎯",
  cardio: "❤️",
  alongamento: "🧘",
  quadriceps: "🦵",
  posterior: "🍑",
  panturrilha: "🦶",
  antebraco: "🤜",
};

export const exerciseTypeIcons: Record<ExerciseType, string> = {
  "musculação": "🏋️",
  "cardio": "❤️",
  "alongamento": "🧘",
  "mobilidade": "🔄",
};

export const exerciseTypeLabels: ExerciseType[] = ["musculação", "cardio", "alongamento", "mobilidade"];

export const allMuscleGroups: { key: MuscleGroup; label: string }[] = [
  { key: "peito", label: "Peito" },
  { key: "costas", label: "Costas" },
  { key: "ombros", label: "Ombros" },
  { key: "quadriceps", label: "Quadríceps" },
  { key: "posterior", label: "Posterior" },
  { key: "panturrilha", label: "Panturrilha" },
  { key: "biceps", label: "Bíceps" },
  { key: "triceps", label: "Tríceps" },
  { key: "antebraco", label: "Antebraço" },
  { key: "abdomen", label: "Abdômen" },
  { key: "cardio", label: "Cardio" },
  { key: "alongamento", label: "Alongamento" },
];

// Helper to build exercise entries efficiently
function ex(
  id: string, nome: string, grupo: MuscleGroup, musculos: string[],
  musculosDestacados: MuscleId[], dificuldade: "iniciante" | "intermediário" | "avançado",
  tipo: "composto" | "isolado", equipamento: string, alternativas: string[],
  instrucoes: string[], dicas: string[], cor: string
): ExerciseDetail {
  return {
    id, nome, grupo, grupoLabel: muscleGroupLabels[grupo],
    musculos, musculosDestacados, instrucoes, dicas, equipamento,
    dificuldade, tipo, tipoExercicio: "musculação", alternativas,
    animacao: { frames: ["🏋️ ↑", "🏋️ ↓"], cor },
  };
}

const COR_PEITO = "hsl(152 69% 46%)";
const COR_COSTAS = "hsl(199 89% 48%)";
const COR_OMBROS = "hsl(280 65% 60%)";
const COR_QUAD = "hsl(45 93% 47%)";
const COR_POST = "hsl(330 70% 55%)";
const COR_PANT = "hsl(20 80% 50%)";
const COR_BICEPS = "hsl(152 69% 46%)";
const COR_TRICEPS = "hsl(0 72% 51%)";
const COR_ANTE = "hsl(35 80% 50%)";
const COR_ABDOMEN = "hsl(45 93% 47%)";
const COR_CARDIO = "hsl(0 72% 51%)";
const COR_ALONG = "hsl(199 89% 48%)";

export const exerciseLibrary: ExerciseDetail[] = [
  // ========== PEITO (10) ==========
  ex("supino-reto", "Supino Reto", "peito",
    ["Peitoral Maior", "Tríceps", "Deltóide Anterior"], ["peitoral", "triceps", "deltoide-anterior"],
    "intermediário", "composto", "Barra e banco reto",
    ["supino-inclinado-halteres", "supino-maquina", "crucifixo", "cross-over", "flexao"],
    ["Deite no banco com os pés firmes no chão", "Segure a barra na largura dos ombros", "Desça a barra controladamente até o peito", "Empurre para cima até estender os braços"],
    ["Mantenha escápulas retraídas", "Não rebata no peito", "Pés firmes no chão"], COR_PEITO),

  ex("supino-inclinado-halteres", "Supino Inclinado Halteres", "peito",
    ["Peitoral Superior", "Tríceps", "Deltóide Anterior"], ["peitoral-superior", "triceps", "deltoide-anterior"],
    "intermediário", "composto", "Halteres e banco inclinável",
    ["supino-reto", "supino-maquina", "crucifixo-inclinado", "cross-over", "flexao"],
    ["Ajuste o banco a 30-45°", "Empurre os halteres para cima", "Desça controladamente até a linha do peito"],
    ["Cotovelos a 45° do corpo", "Controle a fase excêntrica"], COR_PEITO),

  ex("supino-maquina", "Supino Reto Máquina", "peito",
    ["Peitoral Maior", "Tríceps", "Deltóide Anterior"], ["peitoral", "triceps", "deltoide-anterior"],
    "iniciante", "composto", "Máquina de supino",
    ["supino-reto", "supino-inclinado-halteres", "crucifixo-maquina", "flexao"],
    ["Ajuste o assento na altura do peito", "Empurre para frente até estender", "Retorne controladamente"],
    ["Ideal para iniciantes", "Costas apoiadas no encosto"], COR_PEITO),

  ex("crucifixo", "Crucifixo", "peito",
    ["Peitoral Maior", "Deltóide Anterior"], ["peitoral", "deltoide-anterior"],
    "intermediário", "isolado", "Halteres e banco reto",
    ["cross-over", "crucifixo-maquina", "crucifixo-inclinado", "supino-reto"],
    ["Deite no banco com halteres acima", "Abra os braços lateralmente com leve flexão", "Junte novamente contraindo o peitoral"],
    ["Mantenha leve flexão nos cotovelos", "Foque na contração do peitoral"], COR_PEITO),

  ex("crucifixo-maquina", "Crucifixo Máquina", "peito",
    ["Peitoral Maior", "Deltóide Anterior"], ["peitoral", "deltoide-anterior"],
    "iniciante", "isolado", "Máquina peck deck",
    ["crucifixo", "cross-over", "supino-maquina", "flexao"],
    ["Sente-se com costas apoiadas", "Junte os braços na frente do peito", "Retorne controladamente"],
    ["Ótimo para sentir a contração", "Ajuste o assento corretamente"], COR_PEITO),

  ex("cross-over", "Cross Over", "peito",
    ["Peitoral Maior", "Deltóide Anterior"], ["peitoral", "deltoide-anterior"],
    "intermediário", "isolado", "Crossover / Cabos",
    ["crucifixo", "crucifixo-maquina", "supino-inclinado-halteres", "flexao"],
    ["Posicione-se entre as polias", "Cruze os braços na frente do corpo", "Retorne controladamente"],
    ["Tronco levemente inclinado", "Varie posição da polia"], COR_PEITO),

  ex("flexao", "Flexão de Braço", "peito",
    ["Peitoral Maior", "Tríceps", "Deltóide Anterior", "Core"], ["peitoral", "triceps", "deltoide-anterior", "core"],
    "iniciante", "composto", "Peso corporal",
    ["supino-reto", "supino-maquina", "crucifixo", "cross-over"],
    ["Mãos na largura dos ombros", "Corpo reto da cabeça aos pés", "Desça o peito até quase tocar o chão", "Empurre de volta"],
    ["Core ativado", "Não deixe o quadril cair"], COR_PEITO),

  ex("crucifixo-inclinado", "Crucifixo Inclinado", "peito",
    ["Peitoral Superior", "Deltóide Anterior"], ["peitoral-superior", "deltoide-anterior"],
    "intermediário", "isolado", "Halteres e banco inclinável",
    ["crucifixo", "cross-over", "supino-inclinado-halteres", "crucifixo-maquina"],
    ["Banco a 30-45°, halteres acima", "Abra lateralmente com leve flexão nos cotovelos", "Junte contraindo o peitoral superior"],
    ["Foco na porção clavicular", "Carga moderada"], COR_PEITO),

  ex("supino-inclinado-barra", "Supino Inclinado Barra", "peito",
    ["Peitoral Superior", "Tríceps", "Deltóide Anterior"], ["peitoral-superior", "triceps", "deltoide-anterior"],
    "intermediário", "composto", "Barra e banco inclinável",
    ["supino-reto", "supino-inclinado-halteres", "supino-maquina", "flexao"],
    ["Banco a 30-45°, segure a barra", "Desça até a parte superior do peito", "Empurre para cima"],
    ["Não incline demais", "Escápulas retraídas"], COR_PEITO),

  ex("supino-declinado", "Supino Declinado", "peito",
    ["Peitoral Inferior", "Tríceps", "Deltóide Anterior"], ["peitoral", "triceps", "deltoide-anterior"],
    "avançado", "composto", "Barra e banco declinado",
    ["supino-reto", "cross-over", "mergulho-paralelas", "crucifixo"],
    ["Deite no banco declinado", "Desça a barra até a parte inferior do peito", "Empurre para cima"],
    ["Foco na porção inferior do peitoral", "Use spotter se necessário"], COR_PEITO),

  // ========== COSTAS (10) ==========
  ex("barra-fixa", "Barra Fixa", "costas",
    ["Grande Dorsal", "Bíceps", "Trapézio Inferior", "Romboides"], ["dorsal", "biceps", "trapezio"],
    "intermediário", "composto", "Barra fixa",
    ["pulldown", "pulldown-fechado", "remada-curvada", "remada-baixa"],
    ["Pegada pronada na largura dos ombros", "Puxe até o queixo ultrapassar a barra", "Desça controladamente"],
    ["Inicie com as escápulas", "Evite balançar"], COR_COSTAS),

  ex("pulldown", "Pulldown", "costas",
    ["Grande Dorsal", "Bíceps", "Trapézio Inferior"], ["dorsal", "biceps", "trapezio"],
    "iniciante", "composto", "Máquina de pulldown",
    ["barra-fixa", "pulldown-fechado", "remada-baixa", "remada-curvada"],
    ["Sente-se e ajuste a almofada", "Puxe a barra até o peito", "Retorne controladamente"],
    ["Não incline demais o tronco", "Puxe com os cotovelos"], COR_COSTAS),

  ex("pulldown-fechado", "Pulldown Pegada Fechada", "costas",
    ["Grande Dorsal Inferior", "Bíceps", "Romboides"], ["dorsal", "biceps"],
    "intermediário", "composto", "Máquina com triângulo",
    ["pulldown", "barra-fixa", "remada-baixa", "remada-curvada"],
    ["Use triângulo ou pegada fechada", "Puxe em direção ao peito inferior", "Cotovelos próximos ao corpo"],
    ["Foco no dorsal inferior", "Aperte as escápulas"], COR_COSTAS),

  ex("remada-curvada", "Remada Curvada", "costas",
    ["Grande Dorsal", "Trapézio", "Romboides", "Bíceps"], ["dorsal", "trapezio", "biceps"],
    "intermediário", "composto", "Barra",
    ["remada-maquina", "remada-unilateral", "remada-baixa", "pulldown"],
    ["Incline o tronco a 45°", "Puxe a barra em direção ao abdômen", "Desça controladamente"],
    ["Coluna neutra", "Não use impulso com o tronco"], COR_COSTAS),

  ex("remada-maquina", "Remada Máquina", "costas",
    ["Grande Dorsal", "Trapézio", "Bíceps"], ["dorsal", "trapezio", "biceps"],
    "iniciante", "composto", "Máquina de remada",
    ["remada-curvada", "remada-unilateral", "remada-baixa", "pulldown"],
    ["Ajuste o apoio de peito", "Puxe em direção ao abdômen", "Retorne controladamente"],
    ["Peito apoiado no encosto", "Foque na contração das costas"], COR_COSTAS),

  ex("remada-unilateral", "Remada Unilateral", "costas",
    ["Grande Dorsal", "Romboides", "Bíceps"], ["dorsal", "biceps"],
    "intermediário", "composto", "Halter e banco",
    ["remada-curvada", "remada-maquina", "remada-baixa", "pulldown"],
    ["Apoie joelho e mão no banco", "Puxe o halter em direção ao quadril", "Desça controladamente"],
    ["Costas paralelas ao chão", "Puxe com o cotovelo"], COR_COSTAS),

  ex("remada-baixa", "Remada Baixa", "costas",
    ["Grande Dorsal", "Romboides", "Trapézio", "Bíceps"], ["dorsal", "trapezio", "biceps"],
    "iniciante", "composto", "Cabo baixo",
    ["remada-curvada", "remada-maquina", "remada-unilateral", "pulldown"],
    ["Sente-se com pés apoiados", "Puxe em direção ao umbigo", "Retorne controladamente"],
    ["Não balance o tronco", "Peito aberto"], COR_COSTAS),

  ex("remada-cavaleiro", "Remada Cavaleiro", "costas",
    ["Grande Dorsal", "Trapézio Médio", "Romboides", "Bíceps"], ["dorsal", "trapezio", "biceps"],
    "avançado", "composto", "Barra T",
    ["remada-curvada", "remada-unilateral", "remada-maquina", "pulldown"],
    ["Posicione-se sobre o aparelho T-bar", "Puxe a barra em direção ao peito", "Desça controladamente"],
    ["Mantenha coluna neutra", "Carga pesada, controle total"], COR_COSTAS),

  ex("pullover-cabo", "Pullover Cabo", "costas",
    ["Grande Dorsal", "Peitoral", "Tríceps"], ["dorsal", "peitoral", "triceps"],
    "intermediário", "isolado", "Cabo alto",
    ["pulldown", "barra-fixa", "remada-baixa", "remada-curvada"],
    ["Em pé, segure a barra reta no cabo alto", "Cotovelos levemente flexionados", "Puxe a barra até as coxas, arco amplo"],
    ["Foque no alongamento dorsal", "Excelente isolador de dorsal"], COR_COSTAS),

  ex("remada-invertida", "Remada Invertida", "costas",
    ["Grande Dorsal", "Romboides", "Bíceps", "Core"], ["dorsal", "biceps", "core"],
    "iniciante", "composto", "Barra fixa baixa / Smith",
    ["remada-maquina", "remada-curvada", "pulldown", "barra-fixa"],
    ["Deite sob a barra na altura da cintura", "Segure com pegada pronada", "Puxe o peito em direção à barra", "Desça controladamente"],
    ["Ótimo exercício com peso corporal", "Mantenha corpo reto como uma prancha"], COR_COSTAS),

  // ========== OMBROS (10) ==========
  ex("desenvolvimento-militar", "Desenvolvimento Militar", "ombros",
    ["Deltóide Anterior", "Deltóide Lateral", "Tríceps"], ["deltoide-anterior", "deltoide-lateral", "triceps"],
    "intermediário", "composto", "Barra ou halteres",
    ["desenvolvimento-arnold", "desenvolvimento-maquina", "desenvolvimento-halteres", "elevacao-lateral"],
    ["Segure na altura dos ombros", "Empurre acima da cabeça", "Desça controladamente"],
    ["Core ativado", "Não incline o tronco para trás"], COR_OMBROS),

  ex("desenvolvimento-arnold", "Desenvolvimento Arnold", "ombros",
    ["Deltóide Anterior", "Deltóide Lateral", "Deltóide Posterior"], ["deltoide-anterior", "deltoide-lateral", "deltoide-posterior"],
    "avançado", "composto", "Halteres",
    ["desenvolvimento-militar", "desenvolvimento-maquina", "desenvolvimento-halteres", "elevacao-lateral"],
    ["Halteres na frente do peito, palmas para você", "Rotacione enquanto empurra para cima", "Retorne fazendo o inverso"],
    ["Rotação trabalha todas as cabeças", "Carga moderada"], COR_OMBROS),

  ex("desenvolvimento-maquina", "Desenvolvimento Máquina", "ombros",
    ["Deltóide Anterior", "Deltóide Lateral", "Tríceps"], ["deltoide-anterior", "deltoide-lateral", "triceps"],
    "iniciante", "composto", "Máquina de desenvolvimento",
    ["desenvolvimento-militar", "desenvolvimento-arnold", "desenvolvimento-halteres", "elevacao-lateral"],
    ["Ajuste o assento na altura dos ombros", "Empurre acima da cabeça", "Retorne controladamente"],
    ["Ideal para iniciantes", "Costas apoiadas"], COR_OMBROS),

  ex("desenvolvimento-halteres", "Desenvolvimento Halteres", "ombros",
    ["Deltóide Anterior", "Deltóide Lateral", "Tríceps"], ["deltoide-anterior", "deltoide-lateral", "triceps"],
    "intermediário", "composto", "Halteres",
    ["desenvolvimento-militar", "desenvolvimento-arnold", "desenvolvimento-maquina", "elevacao-lateral"],
    ["Sentado ou em pé, halteres na altura dos ombros", "Empurre para cima até estender", "Desça controladamente"],
    ["Maior amplitude que barra", "Permite ajuste individual"], COR_OMBROS),

  ex("elevacao-lateral", "Elevação Lateral", "ombros",
    ["Deltóide Lateral"], ["deltoide-lateral"],
    "iniciante", "isolado", "Halteres",
    ["elevacao-lateral-cabo", "elevacao-lateral-maquina", "elevacao-frontal", "face-pull"],
    ["Halteres ao lado do corpo", "Eleve até a linha dos ombros", "Desça controladamente"],
    ["Não balance o corpo", "Cotovelos ligeiramente flexionados"], COR_OMBROS),

  ex("elevacao-lateral-cabo", "Elevação Lateral Cabo", "ombros",
    ["Deltóide Lateral"], ["deltoide-lateral"],
    "intermediário", "isolado", "Cabo baixo",
    ["elevacao-lateral", "elevacao-lateral-maquina", "elevacao-frontal", "face-pull"],
    ["Cabo baixo do lado oposto", "Eleve o braço lateralmente até o ombro", "Retorne controladamente"],
    ["Tensão constante durante todo o arco", "Excelente para isolar a cabeça lateral"], COR_OMBROS),

  ex("elevacao-lateral-maquina", "Elevação Lateral Máquina", "ombros",
    ["Deltóide Lateral"], ["deltoide-lateral"],
    "iniciante", "isolado", "Máquina de elevação lateral",
    ["elevacao-lateral", "elevacao-lateral-cabo", "elevacao-frontal", "face-pull"],
    ["Sente-se na máquina com braços nas almofadas", "Eleve lateralmente até a linha dos ombros", "Retorne controladamente"],
    ["Movimento guiado e seguro", "Ideal para iniciantes"], COR_OMBROS),

  ex("elevacao-frontal", "Elevação Frontal", "ombros",
    ["Deltóide Anterior"], ["deltoide-anterior"],
    "iniciante", "isolado", "Halteres",
    ["elevacao-lateral", "face-pull", "desenvolvimento-maquina", "desenvolvimento-halteres"],
    ["Halteres à frente das coxas", "Eleve até a linha dos ombros", "Desça controladamente"],
    ["Sem impulso", "Leve flexão nos cotovelos"], COR_OMBROS),

  ex("face-pull", "Face Pull", "ombros",
    ["Deltóide Posterior", "Trapézio", "Infraespinhal"], ["deltoide-posterior", "trapezio"],
    "intermediário", "isolado", "Cabo com corda",
    ["crucifixo-inverso", "elevacao-lateral", "elevacao-frontal", "desenvolvimento-maquina"],
    ["Cabo na altura do rosto", "Puxe em direção ao rosto", "Rotação externa no final"],
    ["Excelente para saúde dos ombros", "Carga leve a moderada"], COR_OMBROS),

  ex("crucifixo-inverso", "Crucifixo Inverso", "ombros",
    ["Deltóide Posterior", "Romboides", "Trapézio"], ["deltoide-posterior", "trapezio"],
    "intermediário", "isolado", "Máquina peck deck invertida",
    ["face-pull", "elevacao-lateral", "elevacao-frontal", "desenvolvimento-maquina"],
    ["Sente-se de frente para a máquina peck deck", "Abra os braços para trás", "Contraia escápulas e retorne"],
    ["Foco no deltóide posterior", "Não use carga excessiva"], COR_OMBROS),

  // ========== QUADRÍCEPS (10) ==========
  ex("agachamento-livre", "Agachamento Livre", "quadriceps",
    ["Quadríceps", "Glúteos", "Isquiotibiais", "Core"], ["quadriceps", "gluteos", "isquiotibiais", "core"],
    "intermediário", "composto", "Barra e rack",
    ["leg-press", "agachamento-bulgaro", "agachamento-goblet", "agachamento-smith", "hack-squat"],
    ["Barra nas costas nos trapézios", "Pés na largura dos ombros", "Agache até pelo menos o paralelo", "Empurre o chão para subir"],
    ["Coluna neutra", "Joelhos na direção dos pés"], COR_QUAD),

  ex("leg-press", "Leg Press 45°", "quadriceps",
    ["Quadríceps", "Glúteos", "Isquiotibiais"], ["quadriceps", "gluteos", "isquiotibiais"],
    "iniciante", "composto", "Máquina leg press",
    ["agachamento-livre", "agachamento-goblet", "hack-squat", "cadeira-extensora", "agachamento-smith"],
    ["Costas apoiadas, pés na plataforma", "Destrave e desça controladamente", "Empurre sem travar joelhos"],
    ["Não trave os joelhos", "Varie posição dos pés"], COR_QUAD),

  ex("agachamento-bulgaro", "Agachamento Búlgaro", "quadriceps",
    ["Quadríceps", "Glúteos", "Isquiotibiais"], ["quadriceps", "gluteos", "isquiotibiais"],
    "avançado", "composto", "Halteres e banco",
    ["agachamento-livre", "leg-press", "passada", "agachamento-goblet", "cadeira-extensora"],
    ["Pé traseiro elevado no banco", "Halteres em cada mão", "Desça até joelho quase tocar o chão", "Empurre com a perna da frente"],
    ["Tronco ereto", "Excelente para desequilíbrios"], COR_QUAD),

  ex("agachamento-goblet", "Agachamento Goblet", "quadriceps",
    ["Quadríceps", "Glúteos", "Core"], ["quadriceps", "gluteos", "core"],
    "iniciante", "composto", "Halter ou kettlebell",
    ["agachamento-livre", "leg-press", "cadeira-extensora", "agachamento-smith"],
    ["Segure halter na frente do peito", "Pés na largura dos ombros", "Agache controlando", "Suba empurrando o chão"],
    ["Ótimo para aprender agachamento", "Peito erguido"], COR_QUAD),

  ex("cadeira-extensora", "Cadeira Extensora", "quadriceps",
    ["Quadríceps"], ["quadriceps"],
    "iniciante", "isolado", "Cadeira extensora",
    ["agachamento-livre", "leg-press", "agachamento-goblet", "hack-squat", "passada"],
    ["Sente-se com costas apoiadas", "Rolo na frente dos tornozelos", "Estenda as pernas completamente", "Retorne controladamente"],
    ["Segure a contração 1s no topo", "Não use impulso"], COR_QUAD),

  ex("hack-squat", "Hack Squat", "quadriceps",
    ["Quadríceps", "Glúteos"], ["quadriceps", "gluteos"],
    "intermediário", "composto", "Máquina hack squat",
    ["agachamento-livre", "leg-press", "agachamento-bulgaro", "cadeira-extensora", "agachamento-smith"],
    ["Costas apoiadas na máquina", "Pés na plataforma", "Desça até 90° nos joelhos", "Empurre para cima"],
    ["Pés mais baixos = mais quadríceps", "Controle a descida"], COR_QUAD),

  ex("agachamento-smith", "Agachamento Smith", "quadriceps",
    ["Quadríceps", "Glúteos", "Core"], ["quadriceps", "gluteos", "core"],
    "iniciante", "composto", "Smith machine",
    ["agachamento-livre", "leg-press", "hack-squat", "agachamento-goblet"],
    ["Barra no Smith nas costas", "Pés levemente à frente", "Agache até paralelo", "Empurre para cima"],
    ["Movimento guiado", "Bom para iniciantes que buscam segurança"], COR_QUAD),

  ex("passada", "Passada / Avanço", "quadriceps",
    ["Quadríceps", "Glúteos", "Isquiotibiais"], ["quadriceps", "gluteos", "isquiotibiais"],
    "intermediário", "composto", "Halteres",
    ["agachamento-bulgaro", "agachamento-livre", "leg-press", "cadeira-extensora"],
    ["Halteres em cada mão", "Dê um passo à frente", "Desça até o joelho traseiro quase tocar o chão", "Empurre com a perna da frente para voltar"],
    ["Passos controlados", "Tronco ereto"], COR_QUAD),

  ex("agachamento-frontal", "Agachamento Frontal", "quadriceps",
    ["Quadríceps", "Core", "Glúteos"], ["quadriceps", "core", "gluteos"],
    "avançado", "composto", "Barra e rack",
    ["agachamento-livre", "hack-squat", "leg-press", "agachamento-goblet"],
    ["Barra na frente dos ombros", "Cotovelos altos", "Agache mantendo tronco ereto", "Suba empurrando o chão"],
    ["Maior ênfase em quadríceps", "Requer boa mobilidade de punho"], COR_QUAD),

  ex("sissy-squat", "Sissy Squat", "quadriceps",
    ["Quadríceps (reto femoral)"], ["quadriceps"],
    "avançado", "isolado", "Peso corporal / Máquina",
    ["cadeira-extensora", "agachamento-livre", "hack-squat", "leg-press"],
    ["Apoie-se em algo para equilíbrio", "Incline o tronco para trás", "Flexione os joelhos levando-os à frente", "Suba controladamente"],
    ["Isola muito o reto femoral", "Comece sem peso"], COR_QUAD),

  // ========== POSTERIOR (10) ==========
  ex("stiff", "Stiff", "posterior",
    ["Isquiotibiais", "Glúteos", "Eretores da Coluna"], ["isquiotibiais", "gluteos", "lombar"],
    "intermediário", "composto", "Barra",
    ["mesa-flexora", "stiff-unilateral", "hip-thrust", "bom-dia", "elevacao-pelvica"],
    ["Barra à frente das coxas", "Pernas quase estendidas, incline o tronco", "Desça até sentir o alongamento", "Retorne contraindo glúteos"],
    ["Barra próxima ao corpo", "Leve flexão nos joelhos"], COR_POST),

  ex("mesa-flexora", "Mesa Flexora", "posterior",
    ["Isquiotibiais"], ["isquiotibiais"],
    "iniciante", "isolado", "Mesa flexora",
    ["stiff", "flexao-pernas-pe", "hip-thrust", "elevacao-pelvica", "stiff-unilateral"],
    ["Deite de bruços na máquina", "Rolo atrás dos tornozelos", "Flexione os joelhos até os glúteos", "Retorne controladamente"],
    ["Quadril no banco", "Controle a excêntrica"], COR_POST),

  ex("hip-thrust", "Hip Thrust", "posterior",
    ["Glúteos", "Isquiotibiais"], ["gluteos", "isquiotibiais"],
    "intermediário", "composto", "Barra e banco",
    ["elevacao-pelvica", "stiff", "mesa-flexora", "cadeira-abdutora", "kickback-cabo"],
    ["Costas apoiadas no banco", "Barra no quadril", "Eleve o quadril até extensão total", "Contraia glúteos 2s no topo"],
    ["Exercício #1 para glúteos", "Queixo levemente para baixo"], COR_POST),

  ex("elevacao-pelvica", "Elevação Pélvica", "posterior",
    ["Glúteos", "Isquiotibiais"], ["gluteos", "isquiotibiais"],
    "iniciante", "composto", "Peso corporal / Anilha",
    ["hip-thrust", "stiff", "mesa-flexora", "cadeira-abdutora"],
    ["Deitado, pés apoiados no chão", "Eleve o quadril contraindo glúteos", "Segure 2s no topo", "Desça controladamente"],
    ["Versão mais acessível do hip thrust", "Adicione anilha no quadril para progressão"], COR_POST),

  ex("stiff-unilateral", "Stiff Unilateral", "posterior",
    ["Isquiotibiais", "Glúteos", "Core"], ["isquiotibiais", "gluteos", "core"],
    "avançado", "composto", "Halter",
    ["stiff", "mesa-flexora", "hip-thrust", "bom-dia"],
    ["Em pé com halter em uma mão", "Incline o tronco elevando a perna oposta", "Desça até sentir o alongamento", "Retorne à posição inicial"],
    ["Excelente para equilíbrio", "Trabalha estabilizadores"], COR_POST),

  ex("bom-dia", "Bom Dia (Good Morning)", "posterior",
    ["Isquiotibiais", "Glúteos", "Eretores da Coluna"], ["isquiotibiais", "gluteos", "lombar"],
    "avançado", "composto", "Barra",
    ["stiff", "stiff-unilateral", "hip-thrust", "mesa-flexora"],
    ["Barra nas costas", "Incline o tronco à frente mantendo costas retas", "Sinta o alongamento no posterior", "Retorne contraindo glúteos"],
    ["Carga moderada", "Coluna sempre neutra"], COR_POST),

  ex("cadeira-abdutora", "Cadeira Abdutora", "posterior",
    ["Glúteo Médio", "Glúteo Mínimo"], ["gluteos"],
    "iniciante", "isolado", "Cadeira abdutora",
    ["hip-thrust", "elevacao-pelvica", "kickback-cabo", "passada-lateral"],
    ["Sente-se na máquina", "Abra as pernas contra a resistência", "Retorne controladamente"],
    ["Foco no glúteo médio", "Incline o tronco para mais ativação do glúteo máximo"], COR_POST),

  ex("kickback-cabo", "Kickback Cabo", "posterior",
    ["Glúteos", "Isquiotibiais"], ["gluteos", "isquiotibiais"],
    "intermediário", "isolado", "Cabo baixo",
    ["hip-thrust", "elevacao-pelvica", "cadeira-abdutora", "passada-lateral"],
    ["Cabo baixo preso no tornozelo", "Estenda a perna para trás", "Contraia o glúteo no topo", "Retorne controladamente"],
    ["Foco na contração máxima", "Não use impulso"], COR_POST),

  ex("flexao-pernas-pe", "Flexão de Pernas em Pé", "posterior",
    ["Isquiotibiais"], ["isquiotibiais"],
    "iniciante", "isolado", "Máquina",
    ["mesa-flexora", "stiff", "hip-thrust", "elevacao-pelvica"],
    ["Em pé na máquina", "Rolo atrás do tornozelo", "Flexione o joelho trazendo o calcanhar ao glúteo", "Retorne controladamente"],
    ["Trabalha cada perna individualmente", "Ótimo para corrigir assimetrias"], COR_POST),

  ex("passada-lateral", "Passada Lateral", "posterior",
    ["Glúteo Médio", "Adutores", "Quadríceps"], ["gluteos", "adutor", "quadriceps"],
    "intermediário", "composto", "Halteres",
    ["cadeira-abdutora", "kickback-cabo", "agachamento-bulgaro", "hip-thrust"],
    ["Halteres em cada mão", "Dê um passo lateral amplo", "Agache sobre a perna que avançou", "Empurre para voltar à posição inicial"],
    ["Foco no glúteo médio", "Passos amplos e controlados"], COR_POST),

  // ========== PANTURRILHA (10) ==========
  ex("panturrilha-pe", "Panturrilha em Pé", "panturrilha",
    ["Gastrocnêmio", "Sóleo"], ["panturrilha"],
    "intermediário", "isolado", "Máquina de panturrilha",
    ["panturrilha-sentado", "panturrilha-leg-press", "panturrilha-smith", "panturrilha-unilateral"],
    ["Ombros sob as almofadas", "Pés na borda da plataforma", "Suba na ponta dos pés", "Desça até alongar"],
    ["Amplitude completa", "Segure 2s no topo"], COR_PANT),

  ex("panturrilha-sentado", "Panturrilha Sentado", "panturrilha",
    ["Sóleo"], ["panturrilha"],
    "intermediário", "isolado", "Máquina de panturrilha sentado",
    ["panturrilha-pe", "panturrilha-leg-press", "panturrilha-smith", "panturrilha-unilateral"],
    ["Joelhos sob a almofada", "Suba na ponta dos pés", "Desça controladamente"],
    ["Foco no sóleo", "Amplitude máxima"], COR_PANT),

  ex("panturrilha-leg-press", "Panturrilha no Leg Press", "panturrilha",
    ["Gastrocnêmio", "Sóleo"], ["panturrilha"],
    "intermediário", "isolado", "Máquina leg press",
    ["panturrilha-pe", "panturrilha-sentado", "panturrilha-smith"],
    ["Pontas dos pés na borda inferior da plataforma", "Empurre com as pontas dos pés", "Amplitude máxima"],
    ["Permite alta carga", "Controle o movimento"], COR_PANT),

  ex("panturrilha-smith", "Panturrilha no Smith", "panturrilha",
    ["Gastrocnêmio", "Sóleo"], ["panturrilha"],
    "iniciante", "isolado", "Smith machine e step",
    ["panturrilha-pe", "panturrilha-sentado", "panturrilha-leg-press", "panturrilha-unilateral"],
    ["Barra no Smith nos ombros", "Pontas dos pés no step", "Suba e desça com amplitude total"],
    ["Guiado pelo Smith", "Seguro para treinar solo"], COR_PANT),

  ex("panturrilha-unilateral", "Panturrilha Unilateral", "panturrilha",
    ["Gastrocnêmio", "Sóleo"], ["panturrilha"],
    "avançado", "isolado", "Halter e step",
    ["panturrilha-pe", "panturrilha-sentado", "panturrilha-smith"],
    ["Em pé em um step, segurando halter", "Uma perna de cada vez", "Amplitude completa", "Segure 2s no topo"],
    ["Corrige desequilíbrios", "Controle total do movimento"], COR_PANT),

  ex("panturrilha-hack", "Panturrilha no Hack", "panturrilha",
    ["Gastrocnêmio"], ["panturrilha"],
    "intermediário", "isolado", "Máquina hack squat",
    ["panturrilha-pe", "panturrilha-leg-press", "panturrilha-sentado"],
    ["Costas na máquina hack", "Pontas dos pés na plataforma", "Suba nas pontas dos pés", "Desça com amplitude"],
    ["Variação eficiente", "Amplitude completa"], COR_PANT),

  ex("panturrilha-burro", "Panturrilha Burro", "panturrilha",
    ["Gastrocnêmio", "Sóleo"], ["panturrilha"],
    "avançado", "isolado", "Máquina ou parceiro",
    ["panturrilha-pe", "panturrilha-sentado", "panturrilha-leg-press"],
    ["Incline-se à frente com apoio", "Peso nas costas/quadril", "Suba na ponta dos pés com amplitude máxima"],
    ["Exercício clássico de Arnold", "Excelente alongamento na excêntrica"], COR_PANT),

  ex("panturrilha-escada", "Panturrilha na Escada", "panturrilha",
    ["Gastrocnêmio", "Sóleo"], ["panturrilha"],
    "iniciante", "isolado", "Escada / Step",
    ["panturrilha-pe", "panturrilha-unilateral", "panturrilha-smith"],
    ["Na borda de um degrau", "Desça os calcanhares abaixo do degrau", "Suba na ponta dos pés", "Amplitude máxima"],
    ["Pode fazer em casa", "Sem equipamento necessário"], COR_PANT),

  ex("panturrilha-pliometrica", "Panturrilha Pliométrica", "panturrilha",
    ["Gastrocnêmio", "Sóleo"], ["panturrilha"],
    "avançado", "composto", "Peso corporal",
    ["panturrilha-pe", "panturrilha-unilateral", "panturrilha-escada"],
    ["Em pé, salte na ponta dos pés rapidamente", "Minimize o tempo de contato com o chão", "Mantenha os joelhos estendidos"],
    ["Trabalha potência e explosão", "Excelente para atletas"], COR_PANT),

  ex("panturrilha-elastico", "Panturrilha com Elástico", "panturrilha",
    ["Gastrocnêmio", "Sóleo"], ["panturrilha"],
    "iniciante", "isolado", "Elástico / Faixa",
    ["panturrilha-escada", "panturrilha-pe", "panturrilha-sentado"],
    ["Sentado com perna estendida", "Elástico na ponta do pé", "Empurre contra a resistência do elástico", "Retorne controladamente"],
    ["Ótimo para treinar em casa", "Tensão constante"], COR_PANT),

  // ========== BÍCEPS (10) ==========
  ex("rosca-direta", "Rosca Direta", "biceps",
    ["Bíceps Braquial", "Braquial"], ["biceps", "antebraco"],
    "iniciante", "isolado", "Barra reta ou EZ",
    ["rosca-martelo", "rosca-scott", "rosca-alternada", "rosca-concentrada", "rosca-cabo"],
    ["Barra com pegada supinada", "Cotovelos fixos ao lado do corpo", "Flexione até os ombros", "Desça controladamente"],
    ["Não balance o corpo", "Controle a excêntrica"], COR_BICEPS),

  ex("rosca-martelo", "Rosca Martelo", "biceps",
    ["Braquial", "Braquiorradial", "Bíceps Braquial"], ["biceps", "antebraco"],
    "iniciante", "isolado", "Halteres",
    ["rosca-direta", "rosca-scott", "rosca-alternada", "rosca-concentrada"],
    ["Pegada neutra (palmas uma para a outra)", "Flexione alternadamente", "Desça controladamente"],
    ["Trabalha braquial e braquiorradial", "Cotovelos fixos"], COR_BICEPS),

  ex("rosca-scott", "Rosca Scott", "biceps",
    ["Bíceps Braquial (porção curta)", "Braquial"], ["biceps"],
    "intermediário", "isolado", "Barra EZ e banco Scott",
    ["rosca-direta", "rosca-martelo", "rosca-concentrada", "rosca-cabo"],
    ["Braços apoiados no banco Scott", "Barra EZ com pegada supinada", "Flexione até contrair completamente", "Desça sem estender 100%"],
    ["Isola muito bem o bíceps", "Carga moderada"], COR_BICEPS),

  ex("rosca-alternada", "Rosca Alternada", "biceps",
    ["Bíceps Braquial", "Braquial"], ["biceps", "antebraco"],
    "iniciante", "isolado", "Halteres",
    ["rosca-direta", "rosca-martelo", "rosca-concentrada", "rosca-scott"],
    ["Halteres ao lado do corpo", "Flexione um braço de cada vez com supinação", "Desça controladamente"],
    ["Permite foco individual", "Supine durante o movimento"], COR_BICEPS),

  ex("rosca-concentrada", "Rosca Concentrada", "biceps",
    ["Bíceps Braquial"], ["biceps"],
    "intermediário", "isolado", "Halter",
    ["rosca-scott", "rosca-direta", "rosca-alternada", "rosca-martelo"],
    ["Sentado, cotovelo apoiado na coxa", "Flexione o halter até o ombro", "Desça controladamente"],
    ["Máximo isolamento do bíceps", "Sem impulso possível"], COR_BICEPS),

  ex("rosca-cabo", "Rosca no Cabo", "biceps",
    ["Bíceps Braquial", "Braquial"], ["biceps"],
    "intermediário", "isolado", "Cabo baixo com barra",
    ["rosca-direta", "rosca-scott", "rosca-martelo", "rosca-alternada"],
    ["Cabo baixo com barra reta ou EZ", "Cotovelos fixos", "Flexione até a contração máxima", "Retorne controladamente"],
    ["Tensão constante no arco todo", "Excelente para finalizar o treino"], COR_BICEPS),

  ex("rosca-inclinada", "Rosca Inclinada", "biceps",
    ["Bíceps Braquial (porção longa)"], ["biceps"],
    "intermediário", "isolado", "Halteres e banco inclinável",
    ["rosca-direta", "rosca-alternada", "rosca-scott", "rosca-concentrada"],
    ["Banco a 45°, braços pendentes", "Flexione os halteres", "Desça com alongamento completo"],
    ["Foco na porção longa do bíceps", "Amplitude máxima"], COR_BICEPS),

  ex("rosca-21", "Rosca 21", "biceps",
    ["Bíceps Braquial", "Braquial"], ["biceps", "antebraco"],
    "avançado", "isolado", "Barra EZ",
    ["rosca-direta", "rosca-scott", "rosca-cabo", "rosca-concentrada"],
    ["7 reps da metade inferior", "7 reps da metade superior", "7 reps completas"],
    ["Técnica de alta intensidade", "Excelente para bombeamento"], COR_BICEPS),

  ex("rosca-spider", "Rosca Spider", "biceps",
    ["Bíceps Braquial (porção curta)"], ["biceps"],
    "avançado", "isolado", "Halteres e banco inclinado",
    ["rosca-scott", "rosca-concentrada", "rosca-direta", "rosca-cabo"],
    ["Deite de bruços no banco inclinado", "Braços pendentes à frente", "Flexione os halteres", "Desça controladamente"],
    ["Sem impulso possível", "Foco na porção curta"], COR_BICEPS),

  ex("rosca-corda", "Rosca Corda", "biceps",
    ["Bíceps Braquial", "Braquial", "Braquiorradial"], ["biceps", "antebraco"],
    "intermediário", "isolado", "Cabo baixo com corda",
    ["rosca-martelo", "rosca-cabo", "rosca-direta", "rosca-alternada"],
    ["Cabo baixo com corda", "Pegada neutra", "Flexione e separe a corda no topo", "Desça controladamente"],
    ["Combina martelo + isolamento", "Tensão constante"], COR_BICEPS),

  // ========== TRÍCEPS (10) ==========
  ex("triceps-corda", "Tríceps Corda", "triceps",
    ["Tríceps (cabeça lateral e medial)"], ["triceps"],
    "iniciante", "isolado", "Cabo com corda",
    ["triceps-barra", "triceps-testa", "mergulho-paralelas", "triceps-banco", "triceps-frances"],
    ["Corda no cabo alto", "Cotovelos fixos", "Estenda empurrando para baixo", "Abra a corda no final"],
    ["Abra a corda para contração máxima", "Cotovelos fixos"], COR_TRICEPS),

  ex("triceps-testa", "Tríceps Testa", "triceps",
    ["Tríceps (cabeça longa)"], ["triceps"],
    "intermediário", "isolado", "Barra EZ e banco",
    ["triceps-corda", "triceps-barra", "mergulho-paralelas", "triceps-frances"],
    ["Deite no banco com barra EZ", "Flexione cotovelos descendo à testa", "Estenda retornando"],
    ["Cotovelos apontando para o teto", "Excêntrica lenta"], COR_TRICEPS),

  ex("mergulho-paralelas", "Mergulho Paralelas", "triceps",
    ["Tríceps", "Peitoral Inferior", "Deltóide Anterior"], ["triceps", "peitoral", "deltoide-anterior"],
    "avançado", "composto", "Barras paralelas",
    ["triceps-testa", "triceps-corda", "triceps-banco", "triceps-barra"],
    ["Braços estendidos nas barras", "Desça flexionando cotovelos até 90°", "Empurre para cima"],
    ["Tronco ereto = mais tríceps", "Adicione peso se necessário"], COR_TRICEPS),

  ex("triceps-barra", "Tríceps Barra", "triceps",
    ["Tríceps (cabeça lateral e medial)"], ["triceps"],
    "iniciante", "isolado", "Cabo com barra reta",
    ["triceps-corda", "triceps-testa", "mergulho-paralelas", "triceps-banco"],
    ["Barra reta no cabo alto", "Cotovelos fixos ao lado", "Empurre para baixo estendendo", "Retorne controladamente"],
    ["Pegada pronada para cabeça lateral", "Não mova os cotovelos"], COR_TRICEPS),

  ex("triceps-frances", "Tríceps Francês", "triceps",
    ["Tríceps (cabeça longa)"], ["triceps"],
    "intermediário", "isolado", "Halter",
    ["triceps-testa", "triceps-corda", "triceps-barra", "mergulho-paralelas"],
    ["Sentado, halter atrás da cabeça", "Cotovelos apontando para cima", "Estenda acima da cabeça", "Desça controladamente"],
    ["Foco na cabeça longa", "Cotovelos fixos e apontando para cima"], COR_TRICEPS),

  ex("triceps-banco", "Tríceps Banco", "triceps",
    ["Tríceps", "Deltóide Anterior"], ["triceps", "deltoide-anterior"],
    "iniciante", "composto", "Banco",
    ["mergulho-paralelas", "triceps-corda", "triceps-barra", "triceps-testa"],
    ["Mãos no banco atrás do corpo", "Pernas estendidas à frente", "Desça flexionando cotovelos", "Empurre para cima"],
    ["Exercício com peso corporal", "Pernas mais longe = mais difícil"], COR_TRICEPS),

  ex("triceps-kickback", "Tríceps Kickback", "triceps",
    ["Tríceps (cabeça lateral)"], ["triceps"],
    "intermediário", "isolado", "Halteres",
    ["triceps-corda", "triceps-barra", "triceps-testa", "triceps-frances"],
    ["Incline o tronco à frente", "Cotovelo fixo a 90°", "Estenda o braço para trás", "Contraia no topo 1s"],
    ["Foco na contração final", "Não use impulso"], COR_TRICEPS),

  ex("triceps-mergulho-maquina", "Mergulho Máquina", "triceps",
    ["Tríceps", "Peitoral"], ["triceps", "peitoral"],
    "iniciante", "composto", "Máquina de mergulho",
    ["mergulho-paralelas", "triceps-banco", "triceps-corda", "triceps-barra"],
    ["Sente-se na máquina", "Empurre as alças para baixo", "Retorne controladamente"],
    ["Versão guiada do mergulho", "Ideal para iniciantes"], COR_TRICEPS),

  ex("triceps-overhead-cabo", "Tríceps Overhead Cabo", "triceps",
    ["Tríceps (cabeça longa)"], ["triceps"],
    "intermediário", "isolado", "Cabo com corda",
    ["triceps-frances", "triceps-testa", "triceps-corda", "triceps-barra"],
    ["De costas para o cabo baixo com corda", "Incline levemente à frente", "Estenda os braços acima da cabeça", "Retorne controladamente"],
    ["Excelente para cabeça longa", "Tensão constante do cabo"], COR_TRICEPS),

  ex("triceps-diamante", "Flexão Diamante", "triceps",
    ["Tríceps", "Peitoral", "Deltóide Anterior"], ["triceps", "peitoral", "deltoide-anterior"],
    "intermediário", "composto", "Peso corporal",
    ["triceps-banco", "mergulho-paralelas", "triceps-corda", "flexao"],
    ["Mãos juntas formando um diamante", "Corpo reto como prancha", "Desça o peito até as mãos", "Empurre para cima"],
    ["Variação que isola mais o tríceps", "Mantenha core ativado"], COR_TRICEPS),

  // ========== ANTEBRAÇO (10) ==========
  ex("rosca-punho", "Rosca de Punho", "antebraco",
    ["Flexores do Antebraço"], ["antebraco"],
    "iniciante", "isolado", "Barra ou halteres",
    ["rosca-punho-inversa", "rosca-martelo", "wrist-roller", "farmer-walk"],
    ["Antebraços apoiados nas coxas, palmas para cima", "Flexione os punhos curvando a barra", "Desça controladamente"],
    ["Movimento curto e controlado", "Carga leve a moderada"], COR_ANTE),

  ex("rosca-punho-inversa", "Rosca de Punho Inversa", "antebraco",
    ["Extensores do Antebraço", "Braquiorradial"], ["antebraco"],
    "iniciante", "isolado", "Barra ou halteres",
    ["rosca-punho", "rosca-inversa", "wrist-roller", "farmer-walk"],
    ["Antebraços apoiados, palmas para baixo", "Estenda os punhos para cima", "Desça controladamente"],
    ["Fortalece extensores", "Previne lesões de cotovelo"], COR_ANTE),

  ex("rosca-inversa", "Rosca Inversa", "antebraco",
    ["Braquiorradial", "Extensores do Antebraço", "Bíceps"], ["antebraco", "biceps"],
    "intermediário", "isolado", "Barra EZ",
    ["rosca-punho-inversa", "rosca-martelo", "rosca-punho", "farmer-walk"],
    ["Pegada pronada na barra EZ", "Cotovelos fixos", "Flexione até os ombros", "Desça controladamente"],
    ["Trabalha braquiorradial intensamente", "Carga menor que rosca direta"], COR_ANTE),

  ex("wrist-roller", "Wrist Roller", "antebraco",
    ["Flexores do Antebraço", "Extensores do Antebraço"], ["antebraco"],
    "intermediário", "isolado", "Wrist roller / Bastão com corda",
    ["rosca-punho", "rosca-punho-inversa", "rosca-inversa", "farmer-walk"],
    ["Segure o bastão com braços estendidos à frente", "Enrole a corda com movimentos de punho", "Desenrole controladamente"],
    ["Trabalha flexores e extensores", "Queimação intensa garantida"], COR_ANTE),

  ex("farmer-walk", "Farmer Walk", "antebraco",
    ["Antebraço", "Trapézio", "Core", "Ombros"], ["antebraco", "trapezio", "core"],
    "iniciante", "composto", "Halteres pesados",
    ["rosca-punho", "rosca-inversa", "dead-hang", "wrist-roller"],
    ["Segure halteres pesados em cada mão", "Caminhe com passos curtos e controlados", "Mantenha postura ereta por 30-60s"],
    ["Fortalece grip, core e trapézio", "Excelente funcional"], COR_ANTE),

  ex("dead-hang", "Dead Hang", "antebraco",
    ["Flexores do Antebraço", "Grande Dorsal"], ["antebraco", "dorsal"],
    "iniciante", "isolado", "Barra fixa",
    ["farmer-walk", "rosca-punho", "wrist-roller", "finger-curl"],
    ["Pendure-se na barra fixa com braços estendidos", "Segure o máximo de tempo possível", "Desça controladamente"],
    ["Fortalece grip e descomprime coluna", "Progressão: uma mão de cada vez"], COR_ANTE),

  ex("finger-curl", "Finger Curl", "antebraco",
    ["Flexores dos Dedos", "Flexores do Antebraço"], ["antebraco"],
    "iniciante", "isolado", "Barra ou halteres",
    ["rosca-punho", "rosca-punho-inversa", "wrist-roller", "hand-gripper"],
    ["Segure a barra com as pontas dos dedos", "Deixe a barra rolar até as pontas", "Feche os dedos curvando a barra de volta"],
    ["Fortalece os flexores dos dedos", "Carga muito leve"], COR_ANTE),

  ex("hand-gripper", "Hand Gripper", "antebraco",
    ["Flexores do Antebraço", "Flexores dos Dedos"], ["antebraco"],
    "intermediário", "isolado", "Hand gripper",
    ["rosca-punho", "farmer-walk", "dead-hang", "finger-curl"],
    ["Segure o gripper em uma mão", "Feche completamente", "Segure 2-3s na contração", "Abra controladamente"],
    ["Progressão com grippers mais fortes", "Treino de grip portátil"], COR_ANTE),

  ex("pronacao-supinacao", "Pronação/Supinação", "antebraco",
    ["Pronadores", "Supinadores", "Braquiorradial"], ["antebraco"],
    "iniciante", "isolado", "Halter",
    ["rosca-punho", "rosca-punho-inversa", "rosca-inversa", "wrist-roller"],
    ["Cotovelo apoiado, segure halter pela ponta", "Gire o punho de palma para cima para baixo", "Retorne controladamente"],
    ["Fortalece rotadores do antebraço", "Previne lesões de cotovelo"], COR_ANTE),

  ex("plate-pinch", "Plate Pinch", "antebraco",
    ["Flexores dos Dedos", "Polegar"], ["antebraco"],
    "avançado", "isolado", "Anilhas",
    ["farmer-walk", "dead-hang", "hand-gripper", "finger-curl"],
    ["Segure duas anilhas lisas juntas com as pontas dos dedos", "Mantenha pelo máximo de tempo", "Desça controladamente"],
    ["Fortalece pinça dos dedos", "Progressão com mais anilhas"], COR_ANTE),

  // ========== ABDÔMEN (4) ==========
  {
    id: "prancha-frontal", nome: "Prancha Frontal", grupo: "abdomen", grupoLabel: "Abdômen",
    musculos: ["Reto Abdominal", "Transverso do Abdômen", "Oblíquos"],
    musculosDestacados: ["reto-abdominal", "obliquos", "core"],
    instrucoes: ["Apoie-se nos antebraços e pontas dos pés", "Corpo reto da cabeça aos pés", "Contraia o abdômen"],
    dicas: ["Não deixe o quadril cair", "Respire normalmente"],
    equipamento: "Peso corporal", dificuldade: "iniciante", tipo: "isolado", tipoExercicio: "musculação",
    alternativas: ["abdominal-crunch", "abdominal-bicicleta", "elevacao-pernas"],
    animacao: { frames: ["🧎 —", "🧎 —"], cor: COR_ABDOMEN },
  },
  {
    id: "abdominal-crunch", nome: "Abdominal Crunch", grupo: "abdomen", grupoLabel: "Abdômen",
    musculos: ["Reto Abdominal"], musculosDestacados: ["reto-abdominal"],
    instrucoes: ["Deite com joelhos flexionados", "Mãos atrás da cabeça", "Suba os ombros do chão", "Desça controladamente"],
    dicas: ["Não puxe o pescoço", "Expire ao subir"],
    equipamento: "Peso corporal", dificuldade: "iniciante", tipo: "isolado", tipoExercicio: "musculação",
    alternativas: ["prancha-frontal", "abdominal-bicicleta", "elevacao-pernas"],
    animacao: { frames: ["🧎 ↑", "🧎 ↓"], cor: COR_ABDOMEN },
  },
  {
    id: "abdominal-bicicleta", nome: "Abdominal Bicicleta", grupo: "abdomen", grupoLabel: "Abdômen",
    musculos: ["Reto Abdominal", "Oblíquos"], musculosDestacados: ["reto-abdominal", "obliquos"],
    instrucoes: ["Deite com mãos atrás da cabeça", "Eleve as pernas", "Alterne cotovelo ao joelho oposto"],
    dicas: ["Trabalha oblíquos", "Não apresse o movimento"],
    equipamento: "Peso corporal", dificuldade: "intermediário", tipo: "isolado", tipoExercicio: "musculação",
    alternativas: ["prancha-frontal", "abdominal-crunch", "elevacao-pernas"],
    animacao: { frames: ["🚴 ←", "🚴 →"], cor: COR_ABDOMEN },
  },
  {
    id: "elevacao-pernas", nome: "Elevação de Pernas", grupo: "abdomen", grupoLabel: "Abdômen",
    musculos: ["Reto Abdominal (inferior)", "Iliopsoas"], musculosDestacados: ["reto-abdominal"],
    instrucoes: ["Deite com mãos ao lado", "Pernas estendidas", "Eleve até 90°", "Desça sem tocar o chão"],
    dicas: ["Lombar no chão", "Flexione os joelhos se difícil"],
    equipamento: "Peso corporal", dificuldade: "intermediário", tipo: "isolado", tipoExercicio: "musculação",
    alternativas: ["abdominal-crunch", "prancha-frontal", "abdominal-bicicleta"],
    animacao: { frames: ["🦵 ↑", "🦵 ↓"], cor: COR_ABDOMEN },
  },

  // ========== CARDIO (4) ==========
  {
    id: "corrida-esteira", nome: "Corrida na Esteira", grupo: "cardio", grupoLabel: "Cardio",
    musculos: ["Quadríceps", "Isquiotibiais", "Panturrilha", "Core"],
    musculosDestacados: ["quadriceps", "isquiotibiais", "panturrilha", "core"],
    instrucoes: ["Ajuste velocidade ao seu nível", "Aquecimento 3-5min leve", "Aumente gradualmente", "Desaquecimento 3min"],
    dicas: ["Postura ereta", "Não segure nos apoios"],
    equipamento: "Esteira", dificuldade: "iniciante", tipo: "composto", tipoExercicio: "cardio",
    alternativas: ["bicicleta-ergometrica", "caminhada-inclinada"],
    animacao: { frames: ["🏃 →", "🏃 →→"], cor: COR_CARDIO },
  },
  {
    id: "bicicleta-ergometrica", nome: "Bicicleta Ergométrica", grupo: "cardio", grupoLabel: "Cardio",
    musculos: ["Quadríceps", "Isquiotibiais", "Panturrilha"],
    musculosDestacados: ["quadriceps", "isquiotibiais", "panturrilha"],
    instrucoes: ["Ajuste altura do banco", "Aqueça 3min", "Cadência 60-90 RPM", "Varie resistência"],
    dicas: ["Baixo impacto", "Bom para problemas nos joelhos"],
    equipamento: "Bicicleta ergométrica", dificuldade: "iniciante", tipo: "composto", tipoExercicio: "cardio",
    alternativas: ["corrida-esteira", "caminhada-inclinada"],
    animacao: { frames: ["🚴 ⟳", "🚴 ⟳⟳"], cor: COR_CARDIO },
  },
  {
    id: "caminhada-inclinada", nome: "Caminhada Inclinada", grupo: "cardio", grupoLabel: "Cardio",
    musculos: ["Quadríceps", "Glúteos", "Panturrilha"],
    musculosDestacados: ["quadriceps", "gluteos", "panturrilha"],
    instrucoes: ["Esteira 8-12% inclinação", "5-6 km/h", "Manter 20-30min"],
    dicas: ["Queima de gordura sem impacto", "Não segure nas barras"],
    equipamento: "Esteira", dificuldade: "iniciante", tipo: "composto", tipoExercicio: "cardio",
    alternativas: ["corrida-esteira", "bicicleta-ergometrica"],
    animacao: { frames: ["🚶 ↗", "🚶 ↗↗"], cor: COR_CARDIO },
  },
  {
    id: "burpees", nome: "Burpees", grupo: "cardio", grupoLabel: "Cardio",
    musculos: ["Corpo Inteiro"], musculosDestacados: ["corpo-inteiro"],
    instrucoes: ["Agache e mãos no chão", "Salte para prancha", "Flexão opcional", "Salte verticalmente"],
    dicas: ["Alta intensidade", "Comece devagar"],
    equipamento: "Peso corporal", dificuldade: "intermediário", tipo: "composto", tipoExercicio: "cardio",
    alternativas: ["corrida-esteira"],
    animacao: { frames: ["🧎 ↓", "🧍 ↑"], cor: COR_CARDIO },
  },

  // ========== ALONGAMENTO & MOBILIDADE (9) ==========
  {
    id: "along-peitoral", nome: "Alongamento de Peitoral", grupo: "alongamento", grupoLabel: "Alongamento",
    musculos: ["Peitoral Maior", "Deltóide Anterior"], musculosDestacados: ["peitoral", "deltoide-anterior"],
    instrucoes: ["Braço estendido contra parede", "Gire o tronco na direção oposta", "Mantenha 20-30s", "Repita do outro lado"],
    dicas: ["Sinta alongamento, não dor", "Varie altura do braço"],
    equipamento: "Parede", dificuldade: "iniciante", tipo: "isolado", tipoExercicio: "alongamento",
    alternativas: ["along-triceps", "mob-ombro"],
    animacao: { frames: ["🧘 ←", "🧘 →"], cor: COR_ALONG },
  },
  {
    id: "along-triceps", nome: "Alongamento de Tríceps", grupo: "alongamento", grupoLabel: "Alongamento",
    musculos: ["Tríceps", "Deltóide"], musculosDestacados: ["triceps", "deltoide-posterior"],
    instrucoes: ["Braço acima da cabeça", "Flexione cotovelo, mão nas costas", "Pressione o cotovelo com outra mão", "Mantenha 20-30s"],
    dicas: ["Tronco ereto", "Não force além do conforto"],
    equipamento: "Nenhum", dificuldade: "iniciante", tipo: "isolado", tipoExercicio: "alongamento",
    alternativas: ["along-peitoral", "mob-ombro"],
    animacao: { frames: ["🧘 ↑", "🧘 ↑"], cor: COR_ALONG },
  },
  {
    id: "mob-ombro", nome: "Mobilidade de Ombro", grupo: "alongamento", grupoLabel: "Alongamento",
    musculos: ["Deltóides", "Manguito Rotador", "Trapézio"],
    musculosDestacados: ["deltoide-anterior", "deltoide-lateral", "deltoide-posterior", "trapezio"],
    instrucoes: ["Círculos com braços estendidos", "Aumente amplitude", "Inverta direção", "Rotações internas/externas"],
    dicas: ["Antes de treinos de peito/ombro", "Movimentos lentos"],
    equipamento: "Nenhum", dificuldade: "iniciante", tipo: "isolado", tipoExercicio: "mobilidade",
    alternativas: ["along-peitoral", "along-triceps"],
    animacao: { frames: ["🔄 ⟳", "🔄 ⟲"], cor: COR_ALONG },
  },
  {
    id: "along-quadriceps", nome: "Alongamento de Quadríceps", grupo: "alongamento", grupoLabel: "Alongamento",
    musculos: ["Quadríceps", "Iliopsoas"], musculosDestacados: ["quadriceps"],
    instrucoes: ["Em pé, flexione joelho, segure o pé", "Joelhos juntos", "Quadril levemente à frente", "Mantenha 20-30s"],
    dicas: ["Apoie-se para equilíbrio", "Sinta na frente da coxa"],
    equipamento: "Nenhum", dificuldade: "iniciante", tipo: "isolado", tipoExercicio: "alongamento",
    alternativas: ["along-isquiotibiais", "mob-quadril"],
    animacao: { frames: ["🧘 ←", "🧘 →"], cor: COR_QUAD },
  },
  {
    id: "along-isquiotibiais", nome: "Alongamento de Isquiotibiais", grupo: "alongamento", grupoLabel: "Alongamento",
    musculos: ["Isquiotibiais", "Lombar"], musculosDestacados: ["isquiotibiais", "lombar"],
    instrucoes: ["Sente-se com perna estendida", "Incline tronco à frente", "Tente alcançar ponta do pé", "Mantenha 20-30s"],
    dicas: ["Não arredonde as costas", "Flexione o joelho se necessário"],
    equipamento: "Nenhum", dificuldade: "iniciante", tipo: "isolado", tipoExercicio: "alongamento",
    alternativas: ["along-quadriceps", "mob-quadril"],
    animacao: { frames: ["🧘 ↓", "🧘 ↓"], cor: COR_QUAD },
  },
  {
    id: "mob-quadril", nome: "Mobilidade de Quadril", grupo: "alongamento", grupoLabel: "Alongamento",
    musculos: ["Flexores do Quadril", "Glúteos", "Adutores"],
    musculosDestacados: ["gluteos", "adutor", "quadriceps"],
    instrucoes: ["Posição de avanço, joelho traseiro no chão", "Quadril à frente", "Círculos com o quadril", "Mantenha 15-20s"],
    dicas: ["Essencial para quem fica sentado", "Antes de treinos de pernas"],
    equipamento: "Nenhum", dificuldade: "iniciante", tipo: "isolado", tipoExercicio: "mobilidade",
    alternativas: ["along-quadriceps", "along-isquiotibiais"],
    animacao: { frames: ["🧘 ⟳", "🧘 ⟲"], cor: COR_QUAD },
  },
  {
    id: "along-dorsal", nome: "Alongamento Dorsal", grupo: "alongamento", grupoLabel: "Alongamento",
    musculos: ["Grande Dorsal", "Romboides", "Trapézio"], musculosDestacados: ["dorsal", "trapezio"],
    instrucoes: ["Cruze braços à frente", "Arredonde as costas", "Sinta entre as escápulas", "Mantenha 20-30s"],
    dicas: ["Respire profundamente", "Após treinos de costas"],
    equipamento: "Nenhum", dificuldade: "iniciante", tipo: "isolado", tipoExercicio: "alongamento",
    alternativas: ["mob-ombro"],
    animacao: { frames: ["🧘 →", "🧘 ←"], cor: COR_ALONG },
  },
  {
    id: "mob-tornozelo", nome: "Mobilidade de Tornozelo", grupo: "alongamento", grupoLabel: "Alongamento",
    musculos: ["Panturrilha", "Tibial Anterior"], musculosDestacados: ["panturrilha"],
    instrucoes: ["Pé à frente perto da parede", "Empurre joelho sem levantar calcanhar", "Mantenha 15-20s", "Troque de lado"],
    dicas: ["Melhora profundidade do agachamento", "Faça diariamente"],
    equipamento: "Parede", dificuldade: "iniciante", tipo: "isolado", tipoExercicio: "mobilidade",
    alternativas: ["along-isquiotibiais"],
    animacao: { frames: ["🦶 →", "🦶 →"], cor: COR_QUAD },
  },
  {
    id: "mob-coluna", nome: "Mobilidade de Coluna Torácica", grupo: "alongamento", grupoLabel: "Alongamento",
    musculos: ["Eretores da Coluna", "Oblíquos", "Trapézio"],
    musculosDestacados: ["lombar", "obliquos", "trapezio"],
    instrucoes: ["Quatro apoios, mão atrás da cabeça", "Rotacione abrindo cotovelo ao teto", "Repita 10x", "Troque de lado"],
    dicas: ["Fundamental para postura", "Quadril estável durante rotação"],
    equipamento: "Nenhum", dificuldade: "iniciante", tipo: "isolado", tipoExercicio: "mobilidade",
    alternativas: ["along-dorsal", "mob-ombro"],
    animacao: { frames: ["🔄 ↑", "🔄 ↓"], cor: COR_ALONG },
  },
];

// ========== BACKWARD COMPATIBILITY ==========
// Keep "pernas" working for existing workout plans
// Map "pernas" exercises to the new sub-groups
export function getExerciseById(id: string): ExerciseDetail | undefined {
  return exerciseLibrary.find((e) => e.id === id);
}

export function getExercisesByGroup(grupo: MuscleGroup): ExerciseDetail[] {
  // "pernas" returns all leg-related exercises for backward compat
  if (grupo === "pernas") {
    return exerciseLibrary.filter((e) =>
      e.grupo === "quadriceps" || e.grupo === "posterior" || e.grupo === "panturrilha" || e.grupo === "pernas"
    );
  }
  return exerciseLibrary.filter((e) => e.grupo === grupo);
}

export function getExercisesByType(tipo: ExerciseType): ExerciseDetail[] {
  return exerciseLibrary.filter((e) => e.tipoExercicio === tipo);
}

export function searchExercises(query: string): ExerciseDetail[] {
  const q = query.toLowerCase().trim();
  if (!q) return exerciseLibrary;
  return exerciseLibrary.filter(
    (e) =>
      e.nome.toLowerCase().includes(q) ||
      e.grupoLabel.toLowerCase().includes(q) ||
      e.musculos.some((m) => m.toLowerCase().includes(q)) ||
      e.tipoExercicio.toLowerCase().includes(q) ||
      e.equipamento.toLowerCase().includes(q)
  );
}

export function getRelatedExercises(exerciseId: string): ExerciseDetail[] {
  const exercise = getExerciseById(exerciseId);
  if (!exercise) return [];
  return exercise.alternativas
    .map((id) => getExerciseById(id))
    .filter(Boolean) as ExerciseDetail[];
}
