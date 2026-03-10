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
