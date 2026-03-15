import { useState, useEffect, useCallback, useRef } from "react";
import { X, Share2, Camera, Check, X as XIcon, ChevronLeft, ChevronRight, Download, Flame, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type MealPlan } from "@/lib/dietGenerator";
import { toast } from "@/components/ui/sonner";

const iconMap: Record<string, string> = {
  Coffee: "☕",
  Sun: "🌤️",
  Moon: "🌙",
  Apple: "🍎",
};

type MealStatus = "done" | "failed" | null;

const motivationalPhrases = [
  "Disciplina constrói resultados.",
  "Cada refeição conta.",
  "Consistência gera transformação.",
  "Foco no processo, não no resultado.",
  "Você é mais forte do que pensa.",
  "O progresso vem da repetição.",
  "Alimentar-se bem é um ato de respeito próprio.",
  "Um dia de cada vez, uma refeição de cada vez.",
];

// Floating particles background
const ParticlesBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-20"
          style={{
            width: `${Math.random() * 4 + 2}px`,
            height: `${Math.random() * 4 + 2}px`,
            background: `hsl(152 69% 46% / ${Math.random() * 0.3 + 0.1})`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float-particle ${Math.random() * 8 + 6}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}
    </div>
  );
};

interface DietFocusModeProps {
  open: boolean;
  onClose: () => void;
  meals: MealPlan[];
  initialIndex: number;
  mealStatuses: Record<string, MealStatus>;
  onSetMealStatus: (index: number, status: MealStatus) => void;
  userName?: string;
  currentGoal?: string;
}

const DietFocusMode = ({
  open,
  onClose,
  meals,
  initialIndex,
  mealStatuses,
  onSetMealStatus,
  userName,
  currentGoal,
}: DietFocusModeProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [storyMode, setStoryMode] = useState(false);
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(null);
  const [phrase] = useState(() => motivationalPhrases[Math.floor(Math.random() * motivationalPhrases.length)]);
  const cardRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setStoryMode(false);
    }
    return () => { document.body.style.overflow = ""; };
  }, [open, initialIndex]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goTo(currentIndex - 1);
      if (e.key === "ArrowRight") goTo(currentIndex + 1);
    };
    if (open) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, currentIndex, onClose]);

  const goTo = useCallback((idx: number) => {
    if (idx < 0 || idx >= meals.length) return;
    setSlideDirection(idx > currentIndex ? "left" : "right");
    setCurrentIndex(idx);
    setTimeout(() => setSlideDirection(null), 300);
  }, [currentIndex, meals.length]);

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 60) {
      if (diff < 0) goTo(currentIndex + 1);
      else goTo(currentIndex - 1);
    }
    touchStartX.current = null;
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    try {
      // Try native share first
      if (navigator.share) {
        await navigator.share({
          title: `FitPulse - ${meal.refeicao}`,
          text: `${meal.refeicao} - ${mealCal} kcal | FitPulse`,
        });
      } else {
        // Fallback: copy text
        const text = `🥗 ${meal.refeicao} - ${mealCal} kcal\n${meal.itens.map(i => `• ${i.alimento} (${i.qtd})`).join("\n")}\n\n💪 FitPulse`;
        await navigator.clipboard.writeText(text);
        toast.success("Copiado para a área de transferência!");
      }
    } catch {
      toast.error("Não foi possível compartilhar");
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      // Use html2canvas-like approach — for now, text download
      const text = `🥗 ${meal.refeicao} - ${mealCal} kcal\nHorário: ${meal.horario}\n\n${meal.itens.map(i => `• ${i.alimento} (${i.qtd}) — ${i.cal}kcal | P:${i.prot}g C:${i.carb}g G:${i.gord}g`).join("\n")}\n\nTotal: ${mealCal}kcal | P:${mealProt}g C:${mealCarb}g G:${mealGord}g\n\n⚡ ${phrase}\n\n💪 FitPulse`;
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fitpulse-${meal.refeicao.toLowerCase().replace(/\s+/g, "-")}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Arquivo baixado!");
    } catch {
      toast.error("Erro ao baixar");
    }
  };

  if (!open || meals.length === 0) return null;

  const meal = meals[currentIndex];
  if (!meal) return null;

  const mealCal = meal.itens.reduce((a, i) => a + i.cal, 0);
  const mealProt = meal.itens.reduce((a, i) => a + i.prot, 0);
  const mealCarb = meal.itens.reduce((a, i) => a + i.carb, 0);
  const mealGord = meal.itens.reduce((a, i) => a + i.gord, 0);
  const mealIcon = iconMap[meal.iconName] || "🍽️";
  const status = mealStatuses[`today-${currentIndex}`] || null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center animate-in fade-in duration-200">
      {/* Dark gradient overlay with particles */}
      <div
        className="absolute inset-0 backdrop-blur-xl"
        style={{
          background: "linear-gradient(145deg, hsl(225 18% 4% / 0.97), hsl(225 16% 6% / 0.97), hsl(225 18% 4% / 0.97))",
        }}
        onClick={onClose}
      />
      <ParticlesBackground />

      {/* Top bar */}
      {!storyMode && (
        <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-4 sm:p-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-secondary/60 backdrop-blur-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all border border-border/30"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStoryMode(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-secondary/60 backdrop-blur-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all border border-border/30"
            >
              <Camera className="w-3.5 h-3.5" />
              Modo Story
            </button>
            <button
              onClick={handleShare}
              className="w-10 h-10 rounded-full bg-secondary/60 backdrop-blur-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all border border-border/30"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Navigation arrows — desktop */}
      {!storyMode && meals.length > 1 && (
        <>
          {currentIndex > 0 && (
            <button
              onClick={() => goTo(currentIndex - 1)}
              className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-secondary/50 backdrop-blur-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-all border border-border/30 hidden sm:flex"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          {currentIndex < meals.length - 1 && (
            <button
              onClick={() => goTo(currentIndex + 1)}
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-secondary/50 backdrop-blur-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-all border border-border/30 hidden sm:flex"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </>
      )}

      {/* Card container */}
      <div
        ref={cardRef}
        className={`relative z-20 w-full max-w-md mx-4 max-h-[90vh] overflow-hidden rounded-2xl animate-in zoom-in-95 duration-300 ${
          slideDirection === "left" ? "animate-in slide-in-from-right-4 duration-300" :
          slideDirection === "right" ? "animate-in slide-in-from-left-4 duration-300" : ""
        }`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          background: "linear-gradient(145deg, hsl(225 16% 10%), hsl(225 16% 6%))",
          border: "1px solid hsl(225 12% 16% / 0.6)",
          boxShadow: "0 25px 80px -20px hsl(152 69% 46% / 0.08), 0 0 60px -15px hsl(225 18% 3% / 0.8)",
        }}
      >
        {/* Story mode view */}
        {storyMode ? (
          <div className="p-6 space-y-5 min-h-[60vh] flex flex-col justify-between">
            {/* Close story mode */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setStoryMode(false)}
                className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 text-xs text-muted-foreground hover:text-foreground transition-all border border-border/30"
                >
                  <Download className="w-3.5 h-3.5" />
                  Baixar
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/15 text-xs text-primary font-medium hover:bg-primary/25 transition-all border border-primary/20"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Compartilhar
                </button>
              </div>
            </div>

            {/* User & goal header */}
            <div className="text-center space-y-3 pt-4">
              <div className="flex items-center justify-center gap-2">
                <Flame className="w-5 h-5 text-primary" />
                <span className="text-sm font-bold text-foreground tracking-wide">
                  {userName || "FitPulse"}
                </span>
              </div>
              {currentGoal && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/15 mx-auto">
                  <Target className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[11px] text-primary font-medium">{currentGoal}</span>
                </div>
              )}
            </div>

            {/* Meal content — clean */}
            <div className="flex-1 flex flex-col items-center justify-center space-y-6 py-4">
              <div className="text-5xl">{mealIcon}</div>
              <div className="text-center space-y-1">
                <h2 className="text-2xl font-display font-bold text-foreground">{meal.refeicao}</h2>
                <p className="text-sm text-muted-foreground">{meal.horario}</p>
              </div>

              {/* Macros row */}
              <div className="flex items-center gap-4">
                {[
                  { label: "Cal", value: mealCal, color: "text-chart-3" },
                  { label: "P", value: `${mealProt}g`, color: "text-chart-2" },
                  { label: "C", value: `${mealCarb}g`, color: "text-primary" },
                  { label: "G", value: `${mealGord}g`, color: "text-chart-4" },
                ].map(m => (
                  <div key={m.label} className="text-center">
                    <p className={`text-lg font-display font-bold ${m.color}`}>{m.value}</p>
                    <p className="text-[10px] text-muted-foreground">{m.label}</p>
                  </div>
                ))}
              </div>

              {/* Foods list — minimal */}
              <div className="w-full space-y-1.5 px-2">
                {meal.itens.map((item, j) => (
                  <div key={j} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-secondary/20">
                    <span className="text-sm text-foreground">{item.alimento}</span>
                    <span className="text-xs text-muted-foreground">{item.qtd}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Motivational phrase */}
            <div className="text-center space-y-4 pb-2">
              <p className="text-sm text-muted-foreground italic">⚡ "{phrase}"</p>
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-[10px] text-muted-foreground/60 tracking-wider uppercase">Powered by</span>
                <span className="text-[10px] font-bold text-primary tracking-wider uppercase">FitPulse</span>
              </div>
            </div>
          </div>
        ) : (
          /* Normal focus view */
          <div className="space-y-0">
            {/* Header with glow */}
            <div className="relative p-6 pb-5">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/8 to-transparent rounded-t-2xl" />
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full blur-3xl opacity-20"
                style={{ background: "hsl(152 69% 46%)" }}
              />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] uppercase tracking-[0.15em] text-primary font-bold px-2 py-0.5 rounded-md bg-primary/10 border border-primary/15">
                    FitPulse
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {currentIndex + 1} de {meals.length}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center border border-primary/15 shrink-0"
                    style={{ background: "linear-gradient(135deg, hsl(152 69% 46% / 0.15), hsl(152 69% 46% / 0.05))" }}
                  >
                    <span className="text-2xl">{mealIcon}</span>
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-xl text-foreground">{meal.refeicao}</h2>
                    <p className="text-sm text-muted-foreground">{meal.horario}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Macro bar */}
            <div className="grid grid-cols-4 gap-0 border-y border-border/30">
              {[
                { label: "Cal", value: mealCal, unit: "kcal", color: "text-chart-3" },
                { label: "Prot", value: mealProt, unit: "g", color: "text-chart-2" },
                { label: "Carb", value: mealCarb, unit: "g", color: "text-primary" },
                { label: "Gord", value: mealGord, unit: "g", color: "text-chart-4" },
              ].map(m => (
                <div key={m.label} className="p-3.5 text-center border-r border-border/20 last:border-0">
                  <p className={`text-lg font-display font-bold ${m.color}`}>{m.value}</p>
                  <p className="text-[10px] text-muted-foreground">{m.label}</p>
                </div>
              ))}
            </div>

            {/* Food items */}
            <div className="p-5 space-y-2">
              {meal.itens.map((item, j) => (
                <div
                  key={j}
                  className="flex items-center justify-between py-3 px-4 rounded-xl border border-border/20 transition-colors hover:border-border/40"
                  style={{ background: "hsl(225 14% 13% / 0.5)" }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.alimento}</p>
                    <p className="text-[11px] text-muted-foreground">{item.qtd}</p>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] shrink-0 ml-3">
                    <span className="text-chart-3 font-semibold">{item.cal}</span>
                    <span className="text-chart-2">{item.prot}g</span>
                    <span className="text-primary">{item.carb}g</span>
                    <span className="text-chart-4">{item.gord}g</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="px-5 pb-5 space-y-3">
              {/* Done / Failed buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => onSetMealStatus(currentIndex, status === "done" ? null : "done")}
                  className={`flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all ${
                    status === "done"
                      ? "bg-chart-2/20 border-2 border-chart-2/40 text-chart-2 shadow-lg"
                      : "bg-chart-2/8 border border-chart-2/15 text-chart-2/60 hover:bg-chart-2/15 hover:text-chart-2 hover:border-chart-2/25"
                  }`}
                  style={status === "done" ? { boxShadow: "0 0 20px -5px hsl(152 69% 46% / 0.2)" } : {}}
                >
                  <Check className="w-4.5 h-4.5" />
                  {status === "done" ? "✅ Feito!" : "Feito"}
                </button>
                <button
                  onClick={() => onSetMealStatus(currentIndex, status === "failed" ? null : "failed")}
                  className={`flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all ${
                    status === "failed"
                      ? "bg-destructive/20 border-2 border-destructive/40 text-destructive shadow-lg"
                      : "bg-destructive/8 border border-destructive/15 text-destructive/60 hover:bg-destructive/15 hover:text-destructive hover:border-destructive/25"
                  }`}
                >
                  <XIcon className="w-4.5 h-4.5" />
                  {status === "failed" ? "❌ Falhou" : "Falhou"}
                </button>
              </div>

              {/* FitPulse branding */}
              <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-secondary/20 border border-border/15">
                <span className="text-[10px] text-muted-foreground tracking-wider uppercase">Plano gerado por</span>
                <span className="text-[10px] font-bold text-primary tracking-wider uppercase">FitPulse</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dot indicators */}
      {meals.length > 1 && !storyMode && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {meals.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all duration-300 ${
                i === currentIndex
                  ? "w-6 h-2.5 bg-primary shadow-lg"
                  : "w-2.5 h-2.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              style={i === currentIndex ? { boxShadow: "0 0 12px hsl(152 69% 46% / 0.4)" } : {}}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DietFocusMode;
