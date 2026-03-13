/**
 * ExerciseDB API integration for anatomical exercise GIFs
 * API: https://exercisedb-api.vercel.app
 * Free, open-source, 1500+ exercises with professional anatomical GIFs
 */

const EXERCISEDB_API = "https://exercisedb-api.vercel.app/api/v1";
const CACHE_KEY = "fitpulse_exercise_gifs_v3";
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days (extended from 7)

// In-memory cache to avoid repeated localStorage reads
let memoryCache: GifCache | null = null;

// Dedup in-flight requests
const pendingRequests = new Map<string, Promise<string | null>>();

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
export const exerciseNameSearchMap: Record<string, string> = {
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
  "Barra Fixa Supinada": "chin up",
  "Remada Alta": "barbell upright row",
  "Remada Cavaleiro": "t bar row",
  "Remada Curvada Pronada": "barbell pronated bent over row",
  "Pullover Cabo": "cable pullover",
  "Remada Invertida": "inverted row",
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
  "Desenvolvimento Halteres": "dumbbell shoulder press",
  "Elevação Lateral Cabo": "cable lateral raise",
  "Elevação Lateral Máquina": "machine lateral raise",
  "Crucifixo Inverso": "reverse machine fly",
  "Elevação Frontal com Barra": "barbell front raise",
  "Elevação Frontal Alternada": "dumbbell alternate front raise",
  "Rosca Alternada": "dumbbell alternate bicep curl",
  "Rosca Concentrada": "dumbbell concentration curl",
  "Rosca Direta Barra": "ez bar curl",
  "Tríceps Francês": "dumbbell overhead triceps extension",
  "Tríceps Barra": "cable straight bar pushdown",
  "Tríceps Banco": "bench dip",
  "Prancha Lateral": "side plank",
  "Prancha Dinâmica": "dynamic plank",
  "Abdominal Infra": "reverse crunch",
  "Abdominal na Roldana": "cable crunch",
  "Dragon Flag": "dragon flag",
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
  if (memoryCache) return memoryCache;
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) {
      memoryCache = {};
      return memoryCache;
    }
    const parsed = JSON.parse(cached) as GifCache;
    const now = Date.now();
    const valid: GifCache = {};
    for (const [key, val] of Object.entries(parsed)) {
      if (now - val.timestamp < CACHE_DURATION) {
        valid[key] = val;
      }
    }
    memoryCache = valid;
    return memoryCache;
  } catch {
    memoryCache = {};
    return memoryCache;
  }
}

function setCache(cache: GifCache) {
  memoryCache = cache;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    localStorage.removeItem(CACHE_KEY);
  }
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
      cache[cacheKey] = {
        gifUrl,
        exerciseName: exercise.name,
        timestamp: Date.now(),
      };
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

  // Dedup: if same request is already in flight, return the same promise
  if (pendingRequests.has(exerciseId)) {
    return pendingRequests.get(exerciseId)!;
  }

  const promise = fetchFromAPI(searchTerm, exerciseId).finally(() => {
    pendingRequests.delete(exerciseId);
  });
  pendingRequests.set(exerciseId, promise);
  return promise;
}

export async function fetchExerciseGifByName(exerciseName: string): Promise<string | null> {
  const cacheKey = `name_${exerciseName}`;
  const cache = getCache();
  if (cache[cacheKey]) return cache[cacheKey].gifUrl;

  const searchTerm = exerciseNameSearchMap[exerciseName];
  if (!searchTerm) return null;

  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey)!;
  }

  const promise = fetchFromAPI(searchTerm, cacheKey).finally(() => {
    pendingRequests.delete(cacheKey);
  });
  pendingRequests.set(cacheKey, promise);
  return promise;
}

/**
 * Preload a GIF URL into the browser's image cache
 */
export function preloadGifImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });
}

/**
 * Preload GIFs for a list of exercise names (used before swap)
 */
export async function preloadAlternativeGifs(names: string[]): Promise<void> {
  const promises = names.map(async (name) => {
    const url = await fetchExerciseGifByName(name);
    if (url) await preloadGifImage(url);
  });
  await Promise.allSettled(promises);
}

// Preload exercise GIFs on demand only (no longer on app start)
// Call this when the user navigates to a page that needs GIFs
let preloadStarted = false;
export function preloadExerciseGifs() {
  // No-op on app start - GIFs are loaded on demand per exercise
  // This prevents dozens of failing API calls on cold start
}

// Lazy preload: only called when user enters workout/library pages
export function startLazyPreload() {
  if (preloadStarted) return;
  preloadStarted = true;
  
  const cache = getCache();
  const uncached = Object.keys(exerciseSearchMap).filter((id) => !cache[id]);
  if (uncached.length === 0) return;

  let index = 0;
  const batchSize = 2;
  const delay = 2000;

  function fetchBatch() {
    if (document.hidden) {
      // Pause when tab is not visible
      setTimeout(fetchBatch, 5000);
      return;
    }
    const batch = uncached.slice(index, index + batchSize);
    if (batch.length === 0) return;

    batch.forEach((id) => fetchExerciseGif(id));
    index += batchSize;

    if (index < uncached.length) {
      setTimeout(fetchBatch, delay);
    }
  }

  // Start after page is interactive
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => fetchBatch());
  } else {
    setTimeout(fetchBatch, 3000);
  }
}
