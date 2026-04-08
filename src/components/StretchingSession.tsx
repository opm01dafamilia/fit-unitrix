import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Play, Pause, RotateCcw, ChevronRight, Check, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { stretchingDB } from "@/lib/workoutRecommendations";

const stretchIllustrations: Record<string, string> = {
  "Mobilidade de Ombro": "🤸",
  "Alongamento de Peitoral": "🙆",
  "Alongamento de Tríceps": "💪",
  "Cat-Cow": "🐱",
  "Alongamento de Dorsal": "🧘",
  "Rotação Torácica": "🔄",
  "Alongamento de Quadríceps": "🦵",
  "Alongamento de Posterior": "🦿",
  "Mobilidade de Quadril": "🏋️",
  "Alongamento de Panturrilha": "🦶",
  "Rotação de Ombro": "🔁",
  "Alongamento de Deltóide": "💪",
  "Banda Elástica Pull-Apart": "🏋️",
  "Alongamento de Bíceps": "💪",
  "Mobilidade de Punho": "✋",
  "Cobra (Yoga)": "🐍",
  "Rotação de Tronco": "🔄",
  "Polichinelos Leves": "🤸",
  "Mobilidade Geral": "🧘",
  "Agachamento Bodyweight": "🏋️",
  "Caminhada Leve": "🚶",
  "Mobilidade de Tornozelo": "🦶",
};

interface Props {
  muscleGroup: string;
  onBack: () => void;
  onFinish: () => void;
}

function parseDuration(dur: string): number {
  const match = dur.match(/(\d+)/);
  return match ? parseInt(match[1]) : 30;
}

export default function StretchingSession({ muscleGroup, onBack, onFinish }: Props) {
  const grupo = muscleGroup.toLowerCase();
  let key = "pernas";
  for (const k of Object.keys(stretchingDB)) {
    if (grupo.includes(k)) { key = k; break; }
  }
  const stretches = stretchingDB[key] || stretchingDB.pernas;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);

  const current = stretches[currentIdx];
  const targetSeconds = parseDuration(current.duracao);
  const emoji = stretchIllustrations[current.nome] || "🧘";
  const totalCompleted = completed.size;
  const allDone = totalCompleted === stretches.length;

  const start = useCallback(() => {
    startTimeRef.current = Date.now() - elapsedRef.current * 1000;
    setRunning(true);
  }, []);

  const pause = useCallback(() => {
    elapsedRef.current = seconds;
    setRunning(false);
  }, [seconds]);

  const reset = useCallback(() => {
    setRunning(false);
    setSeconds(0);
    elapsedRef.current = 0;
    startTimeRef.current = 0;
  }, []);

  const markDone = useCallback(() => {
    setCompleted(prev => new Set(prev).add(currentIdx));
    setRunning(false);
    setSeconds(0);
    elapsedRef.current = 0;
    if (currentIdx < stretches.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  }, [currentIdx, stretches.length]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setSeconds(elapsed);
        if (elapsed >= targetSeconds) {
          // Auto-vibrate on complete
          try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch {}
        }
      }, 250);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, targetSeconds]);

  // Reset timer when switching exercise
  useEffect(() => {
    setSeconds(0);
    elapsedRef.current = 0;
    startTimeRef.current = 0;
    setRunning(false);
  }, [currentIdx]);

  const progress = Math.min(100, (seconds / targetSeconds) * 100);
  const isDone = seconds >= targetSeconds;
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  if (allDone) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center animate-scale-in px-4">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 flex items-center justify-center mb-4 shadow-2xl border border-green-500/20">
          <Check className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="font-display font-bold text-2xl text-center mb-2">Alongamento Concluído! 🎉</h1>
        <p className="text-muted-foreground text-sm text-center mb-1">
          {stretches.length} alongamentos realizados
        </p>
        <p className="text-muted-foreground text-xs text-center mb-6">Seu corpo está preparado!</p>
        <Button onClick={onFinish} className="w-full max-w-xs h-12 text-base font-semibold rounded-2xl bg-gradient-to-r from-primary to-chart-2 hover:opacity-90 shadow-lg">
          Voltar ao Treino
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-up pb-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="glass-card p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <p className="text-xs font-display font-bold text-primary">
                Alongamento {currentIdx + 1} de {stretches.length}
              </p>
              <p className="text-[10px] text-muted-foreground">{muscleGroup}</p>
            </div>
          </div>
          <span className="text-xs font-bold text-primary">{totalCompleted}/{stretches.length}</span>
        </div>
        {/* Progress bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden mt-2">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${(totalCompleted / stretches.length) * 100}%` }}
          />
        </div>
        {/* Dots */}
        <div className="flex gap-1 mt-2 justify-center">
          {stretches.map((_, i) => (
            <button
              key={i}
              onClick={() => { pause(); setCurrentIdx(i); }}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === currentIdx ? "bg-primary scale-125 shadow-[0_0_6px_hsl(var(--primary)/0.5)]" :
                completed.has(i) ? "bg-primary/50" : "bg-muted-foreground/20"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Illustration card */}
      <div className="glass-card p-6 flex flex-col items-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 opacity-50" />
        <div className="relative z-10 flex flex-col items-center w-full">
          <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-primary/15 to-primary/10 flex items-center justify-center mb-4 shadow-xl border border-primary/15">
            <span className="text-6xl">{emoji}</span>
          </div>
          <h2 className="font-display font-bold text-lg text-center">{current.nome}</h2>
          <p className="text-sm text-muted-foreground text-center mt-1.5 max-w-xs leading-relaxed">{current.desc}</p>
          <span className="mt-2 text-[10px] font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/15">
            {current.duracao}
          </span>
        </div>
      </div>

      {/* Timer */}
      <div className="glass-card p-6 flex flex-col items-center">
        <div className="relative w-32 h-32 mb-4">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
            <circle cx="64" cy="64" r="56" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
            <circle
              cx="64" cy="64" r="56" fill="none"
              stroke={isDone ? "hsl(var(--primary))" : "hsl(var(--primary))"}
              strokeWidth="6" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 56}`}
              strokeDashoffset={`${2 * Math.PI * 56 * (1 - progress / 100)}`}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`font-display font-bold text-2xl tabular-nums ${isDone ? "text-primary" : "text-foreground"}`}>
              {formatTime(seconds)}
            </span>
            <span className="text-[10px] text-muted-foreground">/ {formatTime(targetSeconds)}</span>
          </div>
        </div>

        {isDone && !completed.has(currentIdx) && (
          <div className="mb-3 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 animate-pulse">
            <span className="text-xs font-bold text-green-500">✅ Tempo atingido!</span>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-3 w-full max-w-xs">
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl" onClick={reset}>
            <RotateCcw className="w-5 h-5" />
          </Button>
          {!running ? (
            <Button
              onClick={start}
              className="flex-1 h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg"
            >
              <Play className="w-5 h-5 mr-2" /> {seconds > 0 ? "Continuar" : "Iniciar"}
            </Button>
          ) : (
            <Button
              onClick={pause}
              variant="outline"
              className="flex-1 h-12 text-base font-semibold rounded-xl border-2 border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
            >
              <Pause className="w-5 h-5 mr-2" /> Pausar
            </Button>
          )}
          {(isDone || completed.has(currentIdx)) ? (
            currentIdx < stretches.length - 1 ? (
              <Button onClick={markDone} className="h-12 px-4 rounded-xl bg-green-500 hover:bg-green-600 text-white">
                <ChevronRight className="w-5 h-5" />
              </Button>
            ) : (
              <Button onClick={markDone} className="h-12 px-4 rounded-xl bg-green-500 hover:bg-green-600 text-white">
                <Check className="w-5 h-5" />
              </Button>
            )
          ) : (
            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl text-muted-foreground" onClick={markDone}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Exercise list */}
      <div className="glass-card p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
          <Timer className="w-3.5 h-3.5 text-green-500" /> Sequência
        </h3>
        <div className="space-y-2">
          {stretches.map((s, i) => (
            <button
              key={i}
              onClick={() => { pause(); setCurrentIdx(i); }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                i === currentIdx
                  ? "bg-green-500/10 border border-green-500/20 shadow-[0_0_12px_hsl(152_69%_46%/0.1)]"
                  : completed.has(i)
                  ? "bg-secondary/30 opacity-60"
                  : "bg-secondary/40 hover:bg-secondary/60"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                completed.has(i)
                  ? "bg-green-500 text-white"
                  : i === currentIdx
                  ? "bg-green-500/15 text-green-500"
                  : "bg-muted text-muted-foreground"
              }`}>
                {completed.has(i) ? <Check className="w-4 h-4" /> : <span className="text-sm">{stretchIllustrations[s.nome] || "🧘"}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${i === currentIdx ? "text-green-500" : ""}`}>{s.nome}</p>
                <p className="text-[10px] text-muted-foreground truncate">{s.desc}</p>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0 px-2 py-1 rounded-md bg-secondary/60">{s.duracao}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
