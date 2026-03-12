/**
 * ExerciseDB API integration for anatomical exercise GIFs
 * API: https://exercisedb-api.vercel.app
 * Free, open-source, 1500+ exercises with professional anatomical GIFs
 */

const EXERCISEDB_API = "https://exercisedb-api.vercel.app/api/v1";
const CACHE_KEY = "fitpulse_exercise_gifs_v2";
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// Maps our exercise IDs to ExerciseDB search queries for best match
export const exerciseSearchMap: Record<string, string> = {
  // PEITO
  "supino-reto": "barbell bench press",
  "supino-inclinado-halteres": "dumbbell incline bench press",
  "supino-maquina": "machine chest press",
  "crucifixo": "dumbbell fly",
  "crucifixo-maquina": "pec deck fly",
  "cross-over": "cable crossover",
  "flexao": "push up",

  // COSTAS
  "barra-fixa": "pull up",
  "pulldown": "lat pulldown",
  "pulldown-fechado": "close grip lat pulldown",
  "remada-curvada": "barbell bent over row",
  "remada-maquina": "machine seated row",
  "remada-unilateral": "dumbbell one arm row",
  "remada-baixa": "cable seated row",

  // PERNAS
  "agachamento-livre": "barbell full squat",
  "leg-press": "leg press",
  "agachamento-bulgaro": "dumbbell bulgarian split squat",
  "agachamento-goblet": "dumbbell goblet squat",
  "cadeira-extensora": "leg extension",
  "mesa-flexora": "lying leg curl",
  "stiff": "barbell stiff leg deadlift",
  "panturrilha-pe": "standing calf raise",
  "panturrilha-sentado": "seated calf raise",

  // OMBROS
  "desenvolvimento-militar": "barbell overhead press",
  "desenvolvimento-arnold": "dumbbell arnold press",
  "desenvolvimento-maquina": "machine shoulder press",
  "elevacao-lateral": "dumbbell lateral raise",
  "elevacao-frontal": "dumbbell front raise",
  "face-pull": "cable face pull",

  // BÍCEPS
  "rosca-direta": "barbell curl",
  "rosca-martelo": "dumbbell hammer curl",
  "rosca-scott": "barbell preacher curl",

  // TRÍCEPS
  "triceps-corda": "cable rope pushdown",
  "triceps-testa": "barbell lying triceps extension",
  "mergulho-paralelas": "dips",

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

// Name-based search map for exercises not in the library by ID
// Maps exercise display names to ExerciseDB search queries
export const exerciseNameSearchMap: Record<string, string> = {
  // Peito extras
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
  "Peck Deck": "pec deck fly",
  "Crucifixo Inclinado": "dumbbell incline fly",

  // Costas extras
  "Barra Fixa Supinada": "chin up",
  "Remada Alta": "barbell upright row",
  "Remada Cavaleiro": "t bar row",
  "Remada Curvada Pronada": "barbell pronated bent over row",
  "Pullover Cabo": "cable pullover",
  "Remada Invertida": "inverted row",

  // Pernas extras
  "Agachamento Smith": "smith machine squat",
  "Avanço": "dumbbell lunge",
  "Flexão de Pernas em Pé": "standing leg curl",
  "Boa Manhã": "barbell good morning",
  "Levantamento Terra": "barbell deadlift",
  "Hack Squat": "hack squat",
  "Panturrilha no Leg Press": "calf press on leg press",
  "Extensão de Pernas": "leg extension",
  "Agachamento Isométrico": "wall sit",
  "Elevação Pélvica": "barbell hip thrust",

  // Ombros extras
  "Desenvolvimento Halteres": "dumbbell shoulder press",
  "Elevação Lateral Cabo": "cable lateral raise",
  "Elevação Lateral Máquina": "machine lateral raise",
  "Crucifixo Inverso": "reverse machine fly",
  "Elevação Frontal com Barra": "barbell front raise",
  "Elevação Frontal Alternada": "dumbbell alternate front raise",

  // Bíceps extras
  "Rosca Alternada": "dumbbell alternate bicep curl",
  "Rosca Concentrada": "dumbbell concentration curl",
  "Rosca Direta Barra": "ez bar curl",

  // Tríceps extras
  "Tríceps Francês": "dumbbell overhead triceps extension",
  "Tríceps Barra": "cable straight bar pushdown",
  "Tríceps Banco": "bench dip",

  // Abdômen extras
  "Prancha Lateral": "side plank",
  "Prancha Dinâmica": "dynamic plank",
  "Abdominal Infra": "reverse crunch",
  "Abdominal na Roldana": "cable crunch",
  "Dragon Flag": "dragon flag",

  // Home alternatives
  "Pike Push-Up": "pike push up",
  "Remada com Elástico": "resistance band bent over row",
  "Ponte de Glúteo": "glute bridge",
};

interface CachedGif {
  gifUrl: string;
  exerciseName: string;
  timestamp: number;
}

type GifCache = Record<string, CachedGif>;

function getCache(): GifCache {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return {};
    const parsed = JSON.parse(cached) as GifCache;
    // Invalidate old entries
    const now = Date.now();
    const valid: GifCache = {};
    for (const [key, val] of Object.entries(parsed)) {
      if (now - val.timestamp < CACHE_DURATION) {
        valid[key] = val;
      }
    }
    return valid;
  } catch {
    return {};
  }
}

function setCache(cache: GifCache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage full, clear old cache
    localStorage.removeItem(CACHE_KEY);
  }
}

export async function fetchExerciseGif(exerciseId: string): Promise<string | null> {
  // Check cache first
  const cache = getCache();
  if (cache[exerciseId]) {
    return cache[exerciseId].gifUrl;
  }

  const searchTerm = exerciseSearchMap[exerciseId];
  if (!searchTerm) return null;

  try {
    const response = await fetch(
      `${EXERCISEDB_API}/exercises/search?q=${encodeURIComponent(searchTerm)}&limit=1`
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (!data.success || !data.data?.length) return null;

    const exercise = data.data[0];
    const gifUrl = exercise.gifUrl;

    if (gifUrl) {
      // Cache the result
      cache[exerciseId] = {
        gifUrl,
        exerciseName: exercise.name,
        timestamp: Date.now(),
      };
      setCache(cache);
    }

    return gifUrl || null;
  } catch (error) {
    console.error(`Failed to fetch GIF for ${exerciseId}:`, error);
    return null;
  }
}

// Fetch GIF by exercise display name (for alternatives not in the library by ID)
export async function fetchExerciseGifByName(exerciseName: string): Promise<string | null> {
  const cacheKey = `name_${exerciseName}`;
  const cache = getCache();
  if (cache[cacheKey]) {
    return cache[cacheKey].gifUrl;
  }

  const searchTerm = exerciseNameSearchMap[exerciseName];
  if (!searchTerm) return null;

  try {
    const response = await fetch(
      `${EXERCISEDB_API}/exercises/search?q=${encodeURIComponent(searchTerm)}&limit=1`
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (!data.success || !data.data?.length) return null;

    const exercise = data.data[0];
    const gifUrl = exercise.gifUrl;

    if (gifUrl) {
      cache[cacheKey] = {
        gifUrl,
        exerciseName: exercise.name,
        timestamp: Date.now(),
      };
      setCache(cache);
    }

    return gifUrl || null;
  } catch (error) {
    console.error(`Failed to fetch GIF for ${exerciseName}:`, error);
    return null;
  }
}

// Preload all exercise GIFs in background
export function preloadExerciseGifs() {
  const cache = getCache();
  const uncached = Object.keys(exerciseSearchMap).filter((id) => !cache[id]);

  // Fetch in small batches to avoid overwhelming the API
  let index = 0;
  const batchSize = 3;
  const delay = 500;

  function fetchBatch() {
    const batch = uncached.slice(index, index + batchSize);
    if (batch.length === 0) return;

    batch.forEach((id) => fetchExerciseGif(id));
    index += batchSize;

    if (index < uncached.length) {
      setTimeout(fetchBatch, delay);
    }
  }

  // Start preloading after a short delay
  setTimeout(fetchBatch, 2000);
}
