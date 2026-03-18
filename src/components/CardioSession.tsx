import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Play, Pause, Square, Clock, Flame, MapPin, Zap, Trophy, Camera, ArrowLeft, Plus, Minus, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import cardioTreadmill from "@/assets/cardio-treadmill.png";
import cardioBike from "@/assets/cardio-bike.png";
import cardioOutdoor from "@/assets/cardio-outdoor.png";

type CardioModality = "esteira" | "bicicleta" | "rua";
type CardioPhase = "select" | "config" | "active" | "paused" | "completed";

interface CardioSessionProps {
  onFinish: () => void;
  onBack: () => void;
}

const MODALITIES: { id: CardioModality; label: string; emoji: string; image: string; paceLabel: string; defaultPace: string; calPerMin: number; distPerMin: number }[] = [
  { id: "esteira", label: "Esteira", emoji: "🏃", image: cardioTreadmill, paceLabel: "Velocidade sugerida", defaultPace: "8-10 km/h", calPerMin: 10, distPerMin: 0.15 },
  { id: "bicicleta", label: "Bicicleta", emoji: "🚴", image: cardioBike, paceLabel: "Cadência sugerida", defaultPace: "70-90 RPM", calPerMin: 8, distPerMin: 0.25 },
  { id: "rua", label: "Corrida ao ar livre", emoji: "🌤️", image: cardioOutdoor, paceLabel: "Ritmo sugerido", defaultPace: "6:00-7:00 min/km", calPerMin: 11, distPerMin: 0.14 },
];

const MOTIVATIONAL_PHRASES = [
  "💪 Cada minuto conta!",
  "🔥 Você está queimando gordura!",
  "⚡ Mantenha o ritmo!",
  "🚀 Mais forte a cada passo!",
  "🏆 Não pare agora!",
  "💥 Queime tudo!",
  "🎯 Foco no objetivo!",
  "✨ Você é imparável!",
  "🌟 Quase lá, continue!",
  "💎 Disciplina vence talento!",
  "🔥 A dor é temporária, o resultado é permanente!",
  "⚡ Supere seus limites!",
];

function formatTimer(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

export default function CardioSession({ onFinish, onBack }: CardioSessionProps) {
  const [phase, setPhase] = useState<CardioPhase>("select");
  const [modality, setModality] = useState<CardioModality | null>(null);
  const [targetMinutes, setTargetMinutes] = useState(20);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedElapsedRef = useRef<number>(0);

  const modalityData = useMemo(() => MODALITIES.find(m => m.id === modality), [modality]);
  const targetSeconds = targetMinutes * 60;
  const progressPct = targetSeconds > 0 ? Math.min(100, (elapsedSeconds / targetSeconds) * 100) : 0;
  const estimatedCalories = modalityData ? Math.round((elapsedSeconds / 60) * modalityData.calPerMin) : 0;
  const estimatedDistance = modalityData ? ((elapsedSeconds / 60) * modalityData.distPerMin).toFixed(2) : "0.00";

  // Rotate motivational phrases
  useEffect(() => {
    if (phase !== "active") return;
    const interval = setInterval(() => {
      setPhraseIndex(i => (i + 1) % MOTIVATIONAL_PHRASES.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [phase]);

  // Timer with wall-clock accuracy
  useEffect(() => {
    if (phase === "active") {
      startTimeRef.current = Date.now() - pausedElapsedRef.current * 1000;
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsedSeconds(elapsed);
        if (elapsed >= targetSeconds) {
          clearInterval(timerRef.current!);
          setPhase("completed");
          try { if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]); } catch {}
        }
      }, 250);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, targetSeconds]);

  const handleStart = useCallback(() => {
    pausedElapsedRef.current = 0;
    setElapsedSeconds(0);
    setPhase("active");
  }, []);

  const handlePause = useCallback(() => {
    pausedElapsedRef.current = elapsedSeconds;
    setPhase("paused");
  }, [elapsedSeconds]);

  const handleResume = useCallback(() => {
    setPhase("active");
  }, []);

  const handleStop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("completed");
  }, []);

  // ===== SELECT MODALITY =====
  if (phase === "select") {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center animate-slide-up px-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-primary/5 blur-3xl animate-pulse" />
        </div>
        <div className="relative z-10 flex flex-col items-center max-w-sm w-full">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-500/20 to-red-500/10 flex items-center justify-center mb-4 shadow-2xl border border-orange-500/20">
            <Flame className="w-10 h-10 text-orange-400" />
          </div>
          <h1 className="font-display font-bold text-2xl text-center mb-1">Cardio Guiado</h1>
          <p className="text-muted-foreground text-sm text-center mb-6">Escolha sua modalidade</p>

          <div className="space-y-3 w-full">
            {MODALITIES.map(m => (
              <button
                key={m.id}
                onClick={() => { setModality(m.id); setPhase("config"); }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-secondary/40 border border-border/30 hover:border-primary/30 hover:bg-secondary/60 transition-all active:scale-[0.98]"
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-secondary to-muted/50 shrink-0">
                  <img src={m.image} alt={m.label} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 text-left">
                  <span className="text-base font-semibold flex items-center gap-2">{m.emoji} {m.label}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">{m.paceLabel}: {m.defaultPace}</p>
                </div>
                <Zap className="w-5 h-5 text-primary/50" />
              </button>
            ))}
          </div>

          <Button variant="ghost" className="mt-6 text-muted-foreground" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Pular cardio
          </Button>
        </div>
      </div>
    );
  }

  // ===== CONFIG TIME =====
  if (phase === "config" && modalityData) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center animate-slide-up px-4">
        <div className="relative z-10 flex flex-col items-center max-w-sm w-full">
          <div className="w-full h-48 rounded-2xl overflow-hidden mb-6 relative">
            <img src={modalityData.image} alt={modalityData.label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
            <div className="absolute bottom-3 left-4">
              <span className="text-lg font-display font-bold">{modalityData.emoji} {modalityData.label}</span>
            </div>
          </div>

          <h2 className="font-display font-bold text-xl mb-1">Tempo de Cardio</h2>
          <p className="text-muted-foreground text-sm mb-6">Ajuste a duração desejada</p>

          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-xl"
              onClick={() => setTargetMinutes(m => Math.max(5, m - 5))}
            >
              <Minus className="w-5 h-5" />
            </Button>
            <div className="text-center">
              <span className="text-5xl font-display font-bold text-primary">{targetMinutes}</span>
              <p className="text-xs text-muted-foreground mt-1">minutos</p>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-xl"
              onClick={() => setTargetMinutes(m => Math.min(60, m + 5))}
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>

          <div className="glass-card p-4 w-full mb-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{modalityData.paceLabel}</span>
              <span className="font-semibold">{modalityData.defaultPace}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Calorias estimadas</span>
              <span className="font-semibold text-orange-400">~{targetMinutes * modalityData.calPerMin} kcal</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Distância estimada</span>
              <span className="font-semibold text-primary">~{(targetMinutes * modalityData.distPerMin).toFixed(1)} km</span>
            </div>
          </div>

          <Button className="btn-premium w-full" onClick={handleStart}>
            <Play className="w-5 h-5 mr-2" /> Iniciar Cardio
          </Button>
          <Button variant="ghost" className="mt-3 text-muted-foreground" onClick={() => setPhase("select")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
        </div>
      </div>
    );
  }

  // ===== ACTIVE / PAUSED =====
  if ((phase === "active" || phase === "paused") && modalityData) {
    const remainingSeconds = Math.max(0, targetSeconds - elapsedSeconds);
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center animate-fade-in px-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/3 w-80 h-80 rounded-full bg-primary/3 blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-orange-500/3 blur-3xl animate-pulse" style={{ animationDelay: "1.5s" }} />
        </div>

        <div className="relative z-10 flex flex-col items-center max-w-sm w-full">
          {/* Modality badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold border border-primary/20">
              {modalityData.emoji} {modalityData.label}
            </span>
          </div>

          {/* Illustration */}
          <div className="w-32 h-32 rounded-3xl overflow-hidden mb-6 shadow-xl border border-border/20">
            <img src={modalityData.image} alt={modalityData.label} className="w-full h-full object-cover" />
          </div>

          {/* Giant timer */}
          <div className="mb-2">
            <span className="text-6xl font-display font-bold tracking-tight tabular-nums text-foreground">
              {formatTimer(elapsedSeconds)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Restante: {formatTimer(remainingSeconds)}
          </p>

          {/* Progress bar */}
          <div className="w-full mb-6">
            <Progress value={progressPct} className="h-3 rounded-full" />
            <p className="text-[10px] text-muted-foreground mt-1 text-center">{Math.round(progressPct)}% concluído</p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3 w-full mb-6">
            <div className="glass-card p-3 flex flex-col items-center">
              <Flame className="w-4 h-4 text-orange-400 mb-1" />
              <span className="text-lg font-display font-bold">{estimatedCalories}</span>
              <span className="text-[9px] text-muted-foreground">kcal</span>
            </div>
            <div className="glass-card p-3 flex flex-col items-center">
              <MapPin className="w-4 h-4 text-primary mb-1" />
              <span className="text-lg font-display font-bold">{estimatedDistance}</span>
              <span className="text-[9px] text-muted-foreground">km</span>
            </div>
            <div className="glass-card p-3 flex flex-col items-center">
              <Timer className="w-4 h-4 text-chart-4 mb-1" />
              <span className="text-lg font-display font-bold">{modalityData.defaultPace.split("-")[0]}</span>
              <span className="text-[9px] text-muted-foreground">ritmo</span>
            </div>
          </div>

          {/* Motivational phrase */}
          <div className="w-full rounded-xl bg-primary/5 border border-primary/10 p-3 mb-6 text-center transition-all">
            <p className="text-sm font-medium text-primary animate-fade-in" key={phraseIndex}>
              {MOTIVATIONAL_PHRASES[phraseIndex]}
            </p>
          </div>

          {/* Controls */}
          <div className="flex gap-3 w-full">
            {phase === "active" ? (
              <>
                <Button variant="outline" className="flex-1 h-14 text-base rounded-2xl" onClick={handlePause}>
                  <Pause className="w-5 h-5 mr-2" /> Pausar
                </Button>
                <Button variant="destructive" className="h-14 w-14 rounded-2xl" onClick={handleStop}>
                  <Square className="w-5 h-5" />
                </Button>
              </>
            ) : (
              <>
                <Button className="btn-premium flex-1" onClick={handleResume}>
                  <Play className="w-5 h-5 mr-2" /> Continuar
                </Button>
                <Button variant="destructive" className="h-14 w-14 rounded-2xl" onClick={handleStop}>
                  <Square className="w-5 h-5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ===== COMPLETED =====
  if (phase === "completed" && modalityData) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center animate-scale-in px-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/5 blur-3xl animate-pulse" />
          <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full bg-orange-500/5 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        </div>

        <div className="relative z-10 flex flex-col items-center max-w-sm w-full" id="cardio-completion">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-orange-500/20 to-red-500/10 flex items-center justify-center mb-4 shadow-2xl border border-orange-500/20">
            <Trophy className="w-12 h-12 text-orange-400" />
          </div>
          <h1 className="font-display font-bold text-2xl text-center mb-1">Cardio Concluído! 🔥</h1>
          <p className="text-muted-foreground text-sm text-center mb-6">Excelente trabalho! Você mandou muito bem.</p>

          <div className="grid grid-cols-2 gap-3 w-full mb-6">
            <div className="glass-card p-4 flex flex-col items-center">
              <Clock className="w-5 h-5 text-chart-2 mb-2" />
              <span className="text-2xl font-display font-bold">{formatTimer(elapsedSeconds)}</span>
              <span className="text-[10px] text-muted-foreground">Duração</span>
            </div>
            <div className="glass-card p-4 flex flex-col items-center">
              <Flame className="w-5 h-5 text-orange-400 mb-2" />
              <span className="text-2xl font-display font-bold">{estimatedCalories}</span>
              <span className="text-[10px] text-muted-foreground">Calorias</span>
            </div>
            <div className="glass-card p-4 flex flex-col items-center">
              <MapPin className="w-5 h-5 text-primary mb-2" />
              <span className="text-2xl font-display font-bold">{estimatedDistance}</span>
              <span className="text-[10px] text-muted-foreground">km</span>
            </div>
            <div className="glass-card p-4 flex flex-col items-center">
              <Zap className="w-5 h-5 text-chart-4 mb-2" />
              <span className="text-2xl font-display font-bold">{modalityData.emoji}</span>
              <span className="text-[10px] text-muted-foreground">{modalityData.label}</span>
            </div>
          </div>

          <div className="w-full rounded-xl bg-primary/5 border border-primary/10 p-3 mb-6 text-center">
            <p className="text-sm font-medium text-primary">🏆 Treino + Cardio = Resultado máximo!</p>
          </div>

          <div className="flex flex-col gap-3 w-full">
            <Button variant="outline" className="w-full h-12 rounded-2xl text-base" onClick={() => {
              const el = document.getElementById("cardio-completion");
              if (el) {
                el.classList.add("ring-2", "ring-primary/30");
                setTimeout(() => el.classList.remove("ring-2", "ring-primary/30"), 2000);
              }
              // Trigger native screenshot hint
              try { if (navigator.vibrate) navigator.vibrate(100); } catch {}
              // Note: actual screenshot requires native API, we provide visual cue
            }}>
              <Camera className="w-5 h-5 mr-2" /> Tirar Print do Cardio
            </Button>
            <Button className="btn-premium w-full" onClick={onFinish}>
              <Trophy className="w-5 h-5 mr-2" /> Finalizar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
