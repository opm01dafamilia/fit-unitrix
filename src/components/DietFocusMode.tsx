import { useState, useEffect, useCallback, useRef } from "react";
import { X, Share2, Camera, Check, X as XIcon, ChevronLeft, ChevronRight, Download, Flame, Target } from "lucide-react";
import { type MealPlan } from "@/lib/dietGenerator";
import { toast } from "@/components/ui/sonner";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/bodyScrollLock";

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
  "Alimentar-se bem é um ato de respeito próprio.",
];

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
      lockBodyScroll();
    } else {
      setStoryMode(false);
    }

    return () => {
      if (open) unlockBodyScroll();
    };
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
    if (!meal) return;
    try {
      const text = `🥗 ${meal.refeicao} - ${mealCal} kcal\n${meal.itens.map(i => `• ${i.alimento} (${i.qtd})`).join("\n")}\n\n💪 FitPulse`;
      if (navigator.share) {
        await navigator.share({ title: `FitPulse - ${meal.refeicao}`, text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Copiado para a área de transferência!");
      }
    } catch {
      toast.error("Não foi possível compartilhar");
    }
  };

  const handleDownload = async () => {
    if (!meal) return;
    try {
      const text = `🥗 ${meal.refeicao} - ${mealCal} kcal\nHorário: ${meal.horario}\n\n${meal.itens.map(i => `• ${i.alimento} (${i.qtd}) — ${i.cal}kcal`).join("\n")}\n\nTotal: ${mealCal}kcal | P:${mealProt}g C:${mealCarb}g G:${mealGord}g\n\n⚡ ${phrase}\n\n💪 FitPulse`;
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

  // Limit visible items to fit screen without scroll
  const maxVisibleItems = Math.min(meal.itens.length, 6);
  const visibleItems = meal.itens.slice(0, maxVisibleItems);
  const hiddenCount = meal.itens.length - maxVisibleItems;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center animate-in fade-in duration-200">
      {/* Blurred dark overlay — blocks interaction */}
      <div
        className="absolute inset-0 backdrop-blur-xl"
        style={{ background: "hsl(225 18% 4% / 0.92)" }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Full-screen container — no scroll */}
      <div
        className="relative z-10 w-full max-w-[400px] mx-auto px-4 sm:px-0 flex flex-col items-center justify-center"
        style={{
          height: "100dvh",
          maxHeight: "100dvh",
          overflow: "hidden",
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 8px)",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 8px)",
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:right-0 z-20 w-9 h-9 rounded-full bg-secondary/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          style={{ top: "calc(env(safe-area-inset-top, 12px) + 12px)" }}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Story mode toggle & share — top right */}
        {!storyMode && (
          <div
            className="absolute top-3 left-3 sm:left-0 z-20 flex items-center gap-2"
            style={{ top: "calc(env(safe-area-inset-top, 12px) + 12px)" }}
          >
            <button
              onClick={() => setStoryMode(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-secondary/70 backdrop-blur-sm text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            >
              <Camera className="w-3.5 h-3.5" />
              Story
            </button>
          </div>
        )}

        {/* Card */}
        <div
          ref={cardRef}
          className={`w-full overflow-hidden rounded-2xl ${
            slideDirection === "left" ? "animate-in slide-in-from-right-4 duration-300" :
            slideDirection === "right" ? "animate-in slide-in-from-left-4 duration-300" : "animate-in zoom-in-95 duration-300"
          }`}
          style={{
            background: "linear-gradient(145deg, hsl(225 16% 10%), hsl(225 16% 6%))",
            border: "1px solid hsl(225 12% 16% / 0.6)",
            boxShadow: "0 25px 80px -20px hsl(152 69% 46% / 0.08), 0 0 60px -15px hsl(225 18% 3% / 0.8)",
            maxHeight: "calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 56px)",
          }}
        >
          {storyMode ? (
            /* ——— Story Mode — compact for screenshot ——— */
            <div className="p-5 flex flex-col" style={{ maxHeight: "calc(100dvh - 80px)" }}>
              {/* Top bar */}
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setStoryMode(false)}
                  className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-secondary/50 text-[10px] text-muted-foreground hover:text-foreground transition-all border border-border/30"
                  >
                    <Download className="w-3 h-3" />
                    Baixar
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-primary/15 text-[10px] text-primary font-medium hover:bg-primary/25 transition-all border border-primary/20"
                  >
                    <Share2 className="w-3 h-3" />
                    Compartilhar
                  </button>
                </div>
              </div>

              {/* Brand + Goal */}
              <div className="text-center mb-3">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Flame className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-foreground tracking-wide">{userName || "FitPulse"}</span>
                </div>
                {currentGoal && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/15">
                    <Target className="w-3 h-3 text-primary" />
                    <span className="text-[10px] text-primary font-medium">{currentGoal}</span>
                  </div>
                )}
              </div>

              {/* Meal icon + name */}
              <div className="flex flex-col items-center gap-1 mb-3">
                <span className="text-4xl">{mealIcon}</span>
                <h2 className="text-lg font-display font-bold text-foreground">{meal.refeicao}</h2>
                <p className="text-xs text-muted-foreground">{meal.horario}</p>
              </div>

              {/* Macros row */}
              <div className="flex items-center justify-center gap-5 mb-3">
                {[
                  { label: "Cal", value: mealCal, color: "text-chart-3" },
                  { label: "P", value: `${mealProt}g`, color: "text-chart-2" },
                  { label: "C", value: `${mealCarb}g`, color: "text-primary" },
                  { label: "G", value: `${mealGord}g`, color: "text-chart-4" },
                ].map(m => (
                  <div key={m.label} className="text-center">
                    <p className={`text-base font-display font-bold ${m.color}`}>{m.value}</p>
                    <p className="text-[9px] text-muted-foreground">{m.label}</p>
                  </div>
                ))}
              </div>

              {/* Compact food list */}
              <div className="space-y-1 mb-3">
                {visibleItems.map((item, j) => (
                  <div key={j} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-secondary/20">
                    <span className="text-xs text-foreground truncate mr-2">{item.alimento}</span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{item.qtd}</span>
                  </div>
                ))}
                {hiddenCount > 0 && (
                  <p className="text-[10px] text-muted-foreground text-center">+{hiddenCount} item(ns)</p>
                )}
              </div>

              {/* Motivational + brand */}
              <div className="text-center mt-auto pt-2">
                <p className="text-[11px] text-muted-foreground italic mb-2">⚡ "{phrase}"</p>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-[9px] text-muted-foreground/60 tracking-wider uppercase">Powered by</span>
                  <span className="text-[9px] font-bold text-primary tracking-wider uppercase">FitPulse</span>
                </div>
              </div>
            </div>
          ) : (
            /* ——— Normal Focus View — compact, no scroll ——— */
            <div>
              {/* Header */}
              <div className="relative p-5 pb-3">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/8 to-transparent rounded-t-2xl" />
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full blur-3xl opacity-15"
                  style={{ background: "hsl(152 69% 46%)" }}
                />
                <div className="relative z-10 flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center border border-primary/15 shrink-0"
                    style={{ background: "linear-gradient(135deg, hsl(152 69% 46% / 0.15), hsl(152 69% 46% / 0.05))" }}
                  >
                    <span className="text-xl">{mealIcon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[9px] uppercase tracking-[0.12em] text-primary font-bold px-1.5 py-0.5 rounded bg-primary/10 border border-primary/15">
                        FitPulse
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {currentIndex + 1}/{meals.length}
                      </span>
                    </div>
                    <h2 className="font-display font-bold text-lg text-foreground leading-tight">{meal.refeicao}</h2>
                    <p className="text-xs text-muted-foreground">{meal.horario}</p>
                  </div>
                  <button
                    onClick={handleShare}
                    className="w-9 h-9 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all shrink-0"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Macro bar — compact */}
              <div className="grid grid-cols-4 gap-0 border-y border-border/30 mx-4 rounded-lg overflow-hidden" style={{ background: "hsl(225 14% 8% / 0.5)" }}>
                {[
                  { label: "Cal", value: mealCal, color: "text-chart-3" },
                  { label: "Prot", value: mealProt, color: "text-chart-2" },
                  { label: "Carb", value: mealCarb, color: "text-primary" },
                  { label: "Gord", value: mealGord, color: "text-chart-4" },
                ].map(m => (
                  <div key={m.label} className="py-2.5 text-center border-r border-border/15 last:border-0">
                    <p className={`text-sm font-display font-bold ${m.color}`}>{m.value}</p>
                    <p className="text-[9px] text-muted-foreground">{m.label}</p>
                  </div>
                ))}
              </div>

              {/* Food items — compact list */}
              <div className="px-4 py-3 space-y-1.5">
                {visibleItems.map((item, j) => (
                  <div
                    key={j}
                    className="flex items-center justify-between py-2 px-3 rounded-lg border border-border/15"
                    style={{ background: "hsl(225 14% 11% / 0.5)" }}
                  >
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="text-xs font-medium text-foreground truncate">{item.alimento}</p>
                      <p className="text-[10px] text-muted-foreground">{item.qtd}</p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] shrink-0">
                      <span className="text-chart-3 font-semibold">{item.cal}</span>
                      <span className="text-chart-2">{item.prot}g</span>
                    </div>
                  </div>
                ))}
                {hiddenCount > 0 && (
                  <p className="text-[10px] text-muted-foreground text-center py-1">+{hiddenCount} item(ns)</p>
                )}
              </div>

              {/* Action buttons — compact */}
              <div className="px-4 pb-4 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onSetMealStatus(currentIndex, status === "done" ? null : "done")}
                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      status === "done"
                        ? "bg-chart-2/20 border-2 border-chart-2/40 text-chart-2"
                        : "bg-chart-2/8 border border-chart-2/15 text-chart-2/60 hover:bg-chart-2/15 hover:text-chart-2"
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    {status === "done" ? "✅ Feito!" : "Feito"}
                  </button>
                  <button
                    onClick={() => onSetMealStatus(currentIndex, status === "failed" ? null : "failed")}
                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      status === "failed"
                        ? "bg-destructive/20 border-2 border-destructive/40 text-destructive"
                        : "bg-destructive/8 border border-destructive/15 text-destructive/60 hover:bg-destructive/15 hover:text-destructive"
                    }`}
                  >
                    <XIcon className="w-4 h-4" />
                    {status === "failed" ? "❌ Falhou" : "Falhou"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dot indicators */}
        {meals.length > 1 && !storyMode && (
          <div className="flex items-center gap-2 mt-3">
            {meals.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? "w-5 h-2 bg-primary"
                    : "w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DietFocusMode;
