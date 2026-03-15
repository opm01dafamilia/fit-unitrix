/**
 * ExerciseDB API integration for anatomical exercise GIFs
 * API: https://exercisedb-api.vercel.app
 * Free, open-source, 1500+ exercises with professional anatomical GIFs
 */

const EXERCISEDB_API = "https://exercisedb-api.vercel.app/api/v1";
const CACHE_KEY = "fitpulse_exercise_gifs_v3";
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

let memoryCache: GifCache | null = null;
const pendingRequests = new Map<string, Promise<string | null>>();

// Maps exercise IDs to ExerciseDB search queries
export const exerciseSearchMap: Record<string, string> = {
  // PEITO
  "supino-reto": "barbell bench press",
  "supino-inclinado-halteres": "dumbbell incline bench press",
  "supino-maquina": "machine chest press",
  "crucifixo": "dumbbell fly",
  "crucifixo-maquina": "pec deck fly",
  "cross-over": "cable crossover",
  "flexao": "push up",
  "crucifixo-inclinado": "dumbbell incline fly",
  "supino-inclinado-barra": "barbell incline bench press",
  "supino-declinado": "barbell decline bench press",

  // COSTAS
  "barra-fixa": "pull up",
  "pulldown": "lat pulldown",
  "pulldown-fechado": "close grip lat pulldown",
  "remada-curvada": "barbell bent over row",
  "remada-maquina": "machine seated row",
  "remada-unilateral": "dumbbell one arm row",
  "remada-baixa": "cable seated row",
  "remada-cavaleiro": "t bar row",
  "pullover-cabo": "cable pullover",
  "remada-invertida": "inverted row",

  // QUADRÍCEPS
  "agachamento-livre": "barbell full squat",
  "leg-press": "leg press",
  "agachamento-bulgaro": "dumbbell bulgarian split squat",
  "agachamento-goblet": "dumbbell goblet squat",
  "cadeira-extensora": "leg extension",
  "hack-squat": "hack squat machine",
  "agachamento-smith": "smith machine squat",
  "passada": "dumbbell lunge",
  "agachamento-frontal": "barbell front squat",
  "sissy-squat": "sissy squat",

  // POSTERIOR
  "stiff": "barbell stiff leg deadlift",
  "mesa-flexora": "lying leg curl",
  "hip-thrust": "barbell hip thrust",
  "elevacao-pelvica": "glute bridge",
  "stiff-unilateral": "single leg deadlift",
  "bom-dia": "barbell good morning",
  "cadeira-abdutora": "hip abduction machine",
  "kickback-cabo": "cable kickback",
  "flexao-pernas-pe": "standing leg curl",
  "passada-lateral": "dumbbell lateral lunge",

  // PANTURRILHA
  "panturrilha-pe": "standing calf raise",
  "panturrilha-sentado": "seated calf raise",
  "panturrilha-leg-press": "calf press on leg press",
  "panturrilha-smith": "smith machine calf raise",
  "panturrilha-unilateral": "single leg calf raise",
  "panturrilha-hack": "hack machine calf raise",
  "panturrilha-burro": "donkey calf raise",
  "panturrilha-escada": "bodyweight standing calf raise",
  "panturrilha-pliometrica": "jump squat",
  "panturrilha-elastico": "band calf raise",

  // OMBROS
  "desenvolvimento-militar": "barbell overhead press",
  "desenvolvimento-arnold": "dumbbell arnold press",
  "desenvolvimento-maquina": "machine shoulder press",
  "desenvolvimento-halteres": "dumbbell shoulder press",
  "elevacao-lateral": "dumbbell lateral raise",
  "elevacao-lateral-cabo": "cable lateral raise",
  "elevacao-lateral-maquina": "machine lateral raise",
  "elevacao-frontal": "dumbbell front raise",
  "face-pull": "cable face pull",
  "crucifixo-inverso": "reverse machine fly",

  // BÍCEPS
  "rosca-direta": "barbell curl",
  "rosca-martelo": "dumbbell hammer curl",
  "rosca-scott": "barbell preacher curl",
  "rosca-alternada": "dumbbell alternate bicep curl",
  "rosca-concentrada": "dumbbell concentration curl",
  "rosca-cabo": "cable curl",
  "rosca-inclinada": "dumbbell incline curl",
  "rosca-21": "ez bar curl",
  "rosca-spider": "spider curl",
  "rosca-corda": "cable rope curl",

  // TRÍCEPS
  "triceps-corda": "cable rope pushdown",
  "triceps-testa": "barbell lying triceps extension",
  "mergulho-paralelas": "dips",
  "triceps-barra": "cable straight bar pushdown",
  "triceps-frances": "dumbbell overhead triceps extension",
  "triceps-banco": "bench dip",
  "triceps-kickback": "dumbbell kickback",
  "triceps-mergulho-maquina": "machine dip",
  "triceps-overhead-cabo": "cable overhead triceps extension",
  "triceps-diamante": "diamond push up",

  // ANTEBRAÇO
  "rosca-punho": "barbell wrist curl",
  "rosca-punho-inversa": "barbell reverse wrist curl",
  "rosca-inversa": "barbell reverse curl",
  "wrist-roller": "wrist roller",
  "farmer-walk": "farmer walk",
  "dead-hang": "dead hang",
  "finger-curl": "barbell finger curl",
  "hand-gripper": "gripper",
  "pronacao-supinacao": "dumbbell pronation",
  "plate-pinch": "plate pinch",

  // ABDÔMEN
  "prancha-frontal": "front plank",
  "abdominal-crunch": "crunch",
  "abdominal-bicicleta": "bicycle crunch",
  "elevacao-pernas": "lying leg raise",

  // CARDIO
  "corrida-esteira": "treadmill running",
  "bicicleta-ergometrica": "stationary bike",
  "caminhada-inclinada": "incline treadmill walk",
  "burpees": "burpee",

  // ALONGAMENTO
  "along-peitoral": "chest stretch",
  "along-triceps": "triceps stretch",
  "mob-ombro": "shoulder circle",
  "along-quadriceps": "quadriceps stretch",
  "along-isquiotibiais": "hamstring stretch",
  "mob-quadril": "hip flexor stretch",
  "along-dorsal": "back stretch",
  "mob-tornozelo": "ankle mobility",
  "mob-coluna": "thoracic rotation",
};

// Name-based search map for exercises referenced by name in workoutGenerator
export const exerciseNameSearchMap: Record<string, string> = {
  // Peito
  "Flexão com Peso": "weighted push up",
  "Flexão de Braço": "push up",
  "Flexão Inclinada": "incline push up",
  "Flexão Diamante": "diamond push up",
  "Flexão Aberta": "wide grip push up",
  "Flexão Declinada": "decline push up",
  "Supino com Halteres": "dumbbell bench press",
  "Supino Inclinado Barra": "barbell incline bench press",
  "Supino Inclinado Máquina": "machine incline chest press",
  "Supino Smith": "smith machine bench press",
  "Supino Máquina": "machine chest press",
  "Supino Inclinado": "incline bench press",
  "Supino Reto": "barbell bench press",
  "Supino Reto Máquina": "machine chest press",
  "Supino Declinado": "barbell decline bench press",
  "Supino Inclinado Halteres": "dumbbell incline bench press",
  "Peck Deck": "pec deck fly",
  "Crucifixo Inclinado": "dumbbell incline fly",
  "Crucifixo": "dumbbell fly",
  "Crucifixo Máquina": "pec deck fly",
  "Cross Over": "cable crossover",

  // Costas
  "Barra Fixa Supinada": "chin up",
  "Barra Fixa": "pull up",
  "Barra Fixa com Peso": "weighted pull up",
  "Remada Alta": "barbell upright row",
  "Remada Cavaleiro": "t bar row",
  "Remada Curvada Pronada": "barbell pronated bent over row",
  "Remada Curvada": "barbell bent over row",
  "Remada Máquina": "machine seated row",
  "Remada Unilateral": "dumbbell one arm row",
  "Remada Baixa": "cable seated row",
  "Remada Invertida": "inverted row",
  "Remada Invertida Supinada": "inverted row",
  "Remada Invertida Pronada": "inverted row",
  "Remada Sentado com Elástico": "resistance band seated row",
  "Pullover Cabo": "cable pullover",
  "Pulldown": "lat pulldown",
  "Pulldown Pegada Fechada": "close grip lat pulldown",

  // Quadríceps
  "Agachamento Smith": "smith machine squat",
  "Agachamento Livre": "barbell full squat",
  "Agachamento Búlgaro": "dumbbell bulgarian split squat",
  "Agachamento Goblet": "dumbbell goblet squat",
  "Agachamento Isométrico": "wall sit",
  "Agachamento com Mochila": "bodyweight squat",
  "Agachamento Frontal": "barbell front squat",
  "Agachamento Hack": "hack squat machine",
  "Avanço": "dumbbell lunge",
  "Passada / Avanço": "dumbbell lunge",
  "Passada Caminhando": "walking lunge",
  "Sissy Squat": "sissy squat",
  "Hack Squat": "hack squat machine",
  "Extensão de Pernas": "leg extension",
  "Cadeira Extensora": "leg extension",
  "Leg Press": "leg press",
  "Leg Press 45°": "leg press",
  "Leg Press Pés Baixos": "leg press",

  // Posterior
  "Stiff": "barbell stiff leg deadlift",
  "Stiff Unilateral": "single leg deadlift",
  "Stiff Romeno": "barbell romanian deadlift",
  "Mesa Flexora": "lying leg curl",
  "Mesa Flexora Unilateral": "single leg curl",
  "Flexão de Pernas em Pé": "standing leg curl",
  "Hip Thrust": "barbell hip thrust",
  "Hip Thrust Pesado": "barbell hip thrust",
  "Elevação Pélvica": "glute bridge",
  "Elevação Pélvica Unilateral": "single leg glute bridge",
  "Ponte de Glúteo": "glute bridge",
  "Bom Dia (Good Morning)": "barbell good morning",
  "Good Morning": "barbell good morning",
  "Boa Manhã": "barbell good morning",
  "Levantamento Terra": "barbell deadlift",
  "Cadeira Abdutora": "hip abduction machine",
  "Kickback Cabo": "cable kickback",
  "Kickback Cabo Pesado": "cable kickback",
  "Passada Reversa": "dumbbell reverse lunge",
  "Passada Lateral": "dumbbell lateral lunge",
  "Agachamento Sumô": "sumo squat",
  "Agachamento Sumô Barra": "barbell sumo squat",

  // Panturrilha
  "Panturrilha em Pé": "standing calf raise",
  "Panturrilha em Pé Unilateral": "single leg calf raise",
  "Panturrilha Sentado": "seated calf raise",
  "Panturrilha no Leg Press": "calf press on leg press",
  "Panturrilha no Smith": "smith machine calf raise",
  "Panturrilha Unilateral": "single leg calf raise",
  "Panturrilha no Hack": "hack machine calf raise",
  "Panturrilha Burro": "donkey calf raise",
  "Panturrilha na Escada": "bodyweight standing calf raise",
  "Panturrilha Pliométrica": "jump squat",
  "Panturrilha com Elástico": "band calf raise",
  "Elevação de Panturrilha": "standing calf raise",

  // Ombros
  "Desenvolvimento Halteres": "dumbbell shoulder press",
  "Desenvolvimento Militar": "barbell overhead press",
  "Desenvolvimento Arnold": "dumbbell arnold press",
  "Desenvolvimento Máquina": "machine shoulder press",
  "Elevação Lateral": "dumbbell lateral raise",
  "Elevação Lateral Cabo": "cable lateral raise",
  "Elevação Lateral Máquina": "machine lateral raise",
  "Elevação Frontal": "dumbbell front raise",
  "Elevação Frontal Alternada": "dumbbell alternate front raise",
  "Elevação Frontal com Barra": "barbell front raise",
  "Crucifixo Inverso": "reverse machine fly",
  "Face Pull": "cable face pull",

  // Bíceps
  "Rosca Direta": "barbell curl",
  "Rosca Direta Barra": "ez bar curl",
  "Rosca Alternada": "dumbbell alternate bicep curl",
  "Rosca Concentrada": "dumbbell concentration curl",
  "Rosca Martelo": "dumbbell hammer curl",
  "Rosca Scott": "barbell preacher curl",
  "Rosca no Cabo": "cable curl",
  "Rosca Inclinada": "dumbbell incline curl",
  "Rosca 21": "ez bar curl",
  "Rosca Spider": "spider curl",
  "Rosca Corda": "cable rope curl",
  "Rosca com Galão": "dumbbell curl",

  // Tríceps
  "Tríceps Francês": "dumbbell overhead triceps extension",
  "Tríceps Barra": "cable straight bar pushdown",
  "Tríceps Banco": "bench dip",
  "Tríceps Corda": "cable rope pushdown",
  "Tríceps Testa": "barbell lying triceps extension",
  "Tríceps Kickback": "dumbbell kickback",
  "Tríceps Overhead Cabo": "cable overhead triceps extension",
  "Flexão Diamante": "diamond push up",
  "Mergulho Paralelas": "dips",
  "Mergulho Máquina": "machine dip",
  "Mergulho em Cadeiras": "bench dip",
  "Tríceps no Banco": "bench dip",

  // Antebraço
  "Rosca de Punho": "barbell wrist curl",
  "Rosca de Punho Inversa": "barbell reverse wrist curl",
  "Rosca Inversa": "barbell reverse curl",
  "Wrist Roller": "wrist roller",
  "Farmer Walk": "farmer walk",
  "Dead Hang": "dead hang",
  "Finger Curl": "barbell finger curl",
  "Hand Gripper": "gripper",
  "Pronação/Supinação": "dumbbell pronation",
  "Plate Pinch": "plate pinch",

  // Abdômen
  "Prancha Frontal": "front plank",
  "Prancha Lateral": "side plank",
  "Prancha Dinâmica": "dynamic plank",
  "Abdominal Crunch": "crunch",
  "Abdominal Bicicleta": "bicycle crunch",
  "Abdominal Infra": "reverse crunch",
  "Abdominal na Roldana": "cable crunch",
  "Elevação de Pernas": "lying leg raise",
  "Dragon Flag": "dragon flag",

  // Funcional & home
  "Pike Push-Up": "pike push up",
  "Pike Push-Up com Rotação": "pike push up",
  "Remada com Elástico": "resistance band bent over row",
  "Rosca Martelo com Galão": "dumbbell hammer curl",
  "Remada Unilateral com Galão": "dumbbell one arm row",
  "Pullover com Galão": "dumbbell pullover",
  "Abdominal com Toalha": "ab wheel rollout",
  "Face Pull com Elástico": "face pull",
  "Remada com Galão de Água": "dumbbell bent over row",
  "Flexão com Elástico": "push up",
  "Elevação Lateral com Garrafas": "dumbbell lateral raise",
  "Elevação Frontal com Garrafas": "dumbbell front raise",

  // HIIT & Cardio
  "Jumping Jacks": "jumping jack",
  "Mountain Climbers": "mountain climber",
  "Agachamento com Salto": "jump squat",
  "Burpees": "burpee",
  "Burpees com Salto": "burpee",
  "Box Jump": "box jump",
  "Corda Naval": "battle rope",
  "Thruster": "barbell thruster",
  "Kettlebell Swing": "kettlebell swing",
  "Sprint": "sprint",
  "Corrida na Esteira": "treadmill running",
  "Bicicleta Ergométrica": "stationary bike",
  "Caminhada Inclinada": "incline treadmill walk",
  "Caminhada Leve": "walking",
  "Corrida Intervalada": "treadmill running",
  "HIIT Cardio": "stationary bike",

  // Mobilidade & Recuperação
  "Alongamento Dinâmico": "dynamic stretching",
  "Foam Roller": "foam roller",
  "Foam Roller Profundo": "foam roller",
  "Foam Roller + Lacrosse Ball": "foam roller",
  "Yoga Flow Básico": "yoga",
  "Yoga Flow": "yoga",
  "Yoga Flow Avançado": "yoga",
  "Mobilidade Articular": "shoulder circle",
  "Mobilidade Avançada": "shoulder circle",
  "Cardio Leve": "walking",
  "Cardio Regenerativo": "stationary bike",
  "Alongamento Estático": "stretching",
  "Alongamento Profundo": "stretching",
  "Alongamento + Respiração": "stretching",
};

interface CachedGif {
  gifUrl: string;
  exerciseName: string;
  timestamp: number;
}

type GifCache = Record<string, CachedGif>;

function getCache(): GifCache {
  if (memoryCache) return memoryCache;
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) { memoryCache = {}; return memoryCache; }
    const parsed = JSON.parse(cached) as GifCache;
    const now = Date.now();
    const valid: GifCache = {};
    for (const [key, val] of Object.entries(parsed)) {
      if (now - val.timestamp < CACHE_DURATION) valid[key] = val;
    }
    memoryCache = valid;
    return memoryCache;
  } catch { memoryCache = {}; return memoryCache; }
}

function setCache(cache: GifCache) {
  memoryCache = cache;
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); }
  catch { localStorage.removeItem(CACHE_KEY); }
}

async function fetchFromAPI(searchTerm: string, cacheKey: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(
      `${EXERCISEDB_API}/exercises/search?q=${encodeURIComponent(searchTerm)}&limit=1`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.success || !data.data?.length) return null;
    const exercise = data.data[0];
    const gifUrl = exercise.gifUrl;
    if (gifUrl) {
      const cache = getCache();
      cache[cacheKey] = { gifUrl, exerciseName: exercise.name, timestamp: Date.now() };
      setCache(cache);
    }
    return gifUrl || null;
  } catch (error) {
    if ((error as Error).name !== 'AbortError') {
      console.error(`Failed to fetch GIF for ${cacheKey}:`, error);
    }
    return null;
  }
}

export async function fetchExerciseGif(exerciseId: string): Promise<string | null> {
  const cache = getCache();
  if (cache[exerciseId]) return cache[exerciseId].gifUrl;
  const searchTerm = exerciseSearchMap[exerciseId];
  if (!searchTerm) return null;
  if (pendingRequests.has(exerciseId)) return pendingRequests.get(exerciseId)!;
  const promise = fetchFromAPI(searchTerm, exerciseId).finally(() => { pendingRequests.delete(exerciseId); });
  pendingRequests.set(exerciseId, promise);
  return promise;
}

export async function fetchExerciseGifByName(exerciseName: string): Promise<string | null> {
  const cacheKey = `name_${exerciseName}`;
  const cache = getCache();
  if (cache[cacheKey]) return cache[cacheKey].gifUrl;
  const searchTerm = exerciseNameSearchMap[exerciseName];
  if (!searchTerm) return fetchExerciseGifGeneric(exerciseName);
  if (pendingRequests.has(cacheKey)) return pendingRequests.get(cacheKey)!;
  const promise = fetchFromAPI(searchTerm, cacheKey).then(async (url) => {
    if (url) return url;
    return fetchExerciseGifGeneric(exerciseName);
  }).finally(() => { pendingRequests.delete(cacheKey); });
  pendingRequests.set(cacheKey, promise);
  return promise;
}

async function fetchExerciseGifGeneric(exerciseName: string): Promise<string | null> {
  const cacheKey = `generic_${exerciseName}`;
  const cache = getCache();
  if (cache[cacheKey]) return cache[cacheKey].gifUrl;
  if (pendingRequests.has(cacheKey)) return pendingRequests.get(cacheKey)!;
  const simplified = exerciseName
    .toLowerCase()
    .replace(/á|à|ã|â/g, 'a').replace(/é|ê/g, 'e').replace(/í/g, 'i')
    .replace(/ó|ô|õ/g, 'o').replace(/ú/g, 'u').replace(/ç/g, 'c');
  const keywordMap: Record<string, string> = {
    'supino': 'bench press', 'flexao': 'push up', 'agachamento': 'squat',
    'rosca': 'curl', 'triceps': 'triceps', 'remada': 'row',
    'elevacao': 'raise', 'prancha': 'plank', 'abdominal': 'crunch',
    'desenvolvimento': 'shoulder press', 'crucifixo': 'fly',
    'pulldown': 'pulldown', 'leg press': 'leg press', 'stiff': 'deadlift',
    'panturrilha': 'calf raise', 'mergulho': 'dip', 'barra fixa': 'pull up',
    'kickback': 'kickback', 'farmer': 'farmer walk', 'punho': 'wrist curl',
  };
  let searchTerm = '';
  for (const [pt, en] of Object.entries(keywordMap)) {
    if (simplified.includes(pt)) { searchTerm = en; break; }
  }
  if (!searchTerm) return null;
  const promise = fetchFromAPI(searchTerm, cacheKey).finally(() => { pendingRequests.delete(cacheKey); });
  pendingRequests.set(cacheKey, promise);
  return promise;
}

export function preloadGifImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });
}

export async function preloadAlternativeGifs(names: string[]): Promise<void> {
  const promises = names.map(async (name) => {
    const url = await fetchExerciseGifByName(name);
    if (url) await preloadGifImage(url);
  });
  await Promise.allSettled(promises);
}

const sessionImageCache = new Set<string>();

export async function preloadWorkoutDayGifs(exercises: { id?: string; nome?: string }[]): Promise<void> {
  const promises = exercises.map(async (ex) => {
    let url: string | null = null;
    if (ex.id && exerciseSearchMap[ex.id]) {
      url = await fetchExerciseGif(ex.id);
    } else if (ex.nome) {
      url = await fetchExerciseGifByName(ex.nome);
    }
    if (url && !sessionImageCache.has(url)) {
      await preloadGifImage(url);
      sessionImageCache.add(url);
    }
  });
  const immediate = promises.slice(0, 3);
  const lazy = promises.slice(3);
  await Promise.allSettled(immediate);
  if (lazy.length > 0) {
    setTimeout(() => Promise.allSettled(lazy), 1000);
  }
}

let preloadStarted = false;
export function preloadExerciseGifs() {
  // No-op - GIFs are loaded on demand
}

export function startLazyPreload() {
  if (preloadStarted) return;
  preloadStarted = true;
  const cache = getCache();
  const uncached = Object.keys(exerciseSearchMap).filter((id) => !cache[id]);
  if (uncached.length === 0) return;
  let index = 0;
  const batchSize = 2;
  const delay = 3000;
  function fetchBatch() {
    if (document.hidden) { setTimeout(fetchBatch, 5000); return; }
    const batch = uncached.slice(index, index + batchSize);
    if (batch.length === 0) return;
    batch.forEach((id) => fetchExerciseGif(id));
    index += batchSize;
    if (index < uncached.length) setTimeout(fetchBatch, delay);
  }
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => fetchBatch());
  } else {
    setTimeout(fetchBatch, 4000);
  }
}
