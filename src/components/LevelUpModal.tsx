import { useState, useEffect, memo } from "react";
import { Sparkles, X } from "lucide-react";
import { type FitnessLevel } from "@/lib/fitnessLevelEngine";

interface LevelUpModalProps {
  level: FitnessLevel | null;
  onClose: () => void;
}

const LevelUpModal = memo(({ level, onClose }: LevelUpModalProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (level) {
      // Small delay for dramatic effect
      const t = setTimeout(() => setVisible(true), 200);
      // Haptic feedback if available
      try { navigator?.vibrate?.(80); } catch {}
      return () => clearTimeout(t);
    }
    setVisible(false);
  }, [level]);

  if (!level) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-xl transition-opacity duration-500"
        style={{ opacity: visible ? 1 : 0 }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-sm overflow-hidden rounded-3xl border border-border/50 transition-all duration-700"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1) translateY(0)" : "scale(0.9) translateY(20px)",
          background: `linear-gradient(145deg, hsl(225 16% 8%), hsl(225 16% 5%))`,
        }}
      >
        {/* Aura background glow */}
        <div
          className="absolute inset-0 opacity-20 blur-3xl"
          style={{ background: level.auraGradient }}
        />
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full opacity-15 blur-2xl"
          style={{ background: `radial-gradient(circle, hsl(${level.auraColor}), transparent)` }}
        />

        <div className="relative z-10 p-8 text-center">
          {/* Close */}
          <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>

          {/* Icon */}
          <div className="mx-auto mb-5 w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: level.auraGradient,
              boxShadow: `0 0 40px -8px hsl(${level.auraColor} / 0.5)`,
            }}
          >
            <span className="text-3xl">🔥</span>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-primary">Nível Alcançado</span>
          </div>

          {/* Level title */}
          <h2 className="font-display text-2xl font-bold text-foreground mb-1">
            Nível {level.level}
          </h2>
          <p className="text-lg font-semibold mb-2" style={{ color: `hsl(${level.auraColor})` }}>
            {level.title}
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Sua evolução fitness é visível. Continue assim!
          </p>

          {/* Aura preview */}
          <div className="mx-auto mb-6 w-16 h-16 rounded-2xl flex items-center justify-center border-2"
            style={{
              borderColor: `hsl(${level.auraColor} / 0.4)`,
              background: `linear-gradient(135deg, hsl(${level.auraColor} / 0.15), hsl(${level.auraColor} / 0.05))`,
              boxShadow: `0 0 30px -6px hsl(${level.auraColor} / 0.4)`,
            }}
          >
            <span className="text-2xl">✨</span>
          </div>

          {/* CTA */}
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-semibold text-sm text-primary-foreground transition-all hover:opacity-90"
            style={{ background: level.auraGradient }}
          >
            Continuar Evoluindo
          </button>
        </div>
      </div>
    </div>
  );
});

LevelUpModal.displayName = "LevelUpModal";
export default LevelUpModal;
