import { memo } from "react";
import { Zap } from "lucide-react";
import { getFitnessLevel, getNextLevel } from "@/lib/fitnessLevelEngine";

interface FitnessProgressBarProps {
  totalXP: number;
  streak?: number;
  goalsCompleted?: number;
  compact?: boolean;
}

const FitnessProgressBar = memo(({
  totalXP,
  compact = false,
}: FitnessProgressBarProps) => {
  const level = getFitnessLevel(totalXP);
  const nextInfo = getNextLevel(totalXP);

  return (
    <div className={`glass-card overflow-hidden relative ${compact ? "p-3" : "p-4 lg:p-5"}`}>
      {/* Aura glow background */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ background: level.auraGradient }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, hsl(${level.auraColor} / 0.2), hsl(${level.auraColor} / 0.08))`,
                boxShadow: `0 0 16px -4px hsl(${level.auraColor} / 0.3)`,
              }}
            >
              <Zap className="w-3.5 h-3.5" style={{ color: `hsl(${level.auraColor})` }} />
            </div>
            <div>
              <span className="text-xs font-bold" style={{ color: `hsl(${level.auraColor})` }}>
                Nível {level.level} — {level.title}
              </span>
            </div>
          </div>
          <span className="text-[11px] font-display font-bold text-muted-foreground">
            {totalXP} XP
          </span>
        </div>

        {/* Progress bar */}
        {nextInfo ? (
          <div>
            <div className="h-2.5 bg-muted/50 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${nextInfo.progress}%`,
                  background: level.auraGradient,
                }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[10px] text-muted-foreground">
                {nextInfo.xpNeeded} XP para Nível {nextInfo.next.level}
              </span>
              <span className="text-[10px] font-bold" style={{ color: `hsl(${level.auraColor})` }}>
                {nextInfo.progress}%
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="h-2.5 flex-1 bg-muted/50 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full w-full"
                style={{ background: level.auraGradient }}
              />
            </div>
            <span className="text-[10px] font-bold" style={{ color: `hsl(${level.auraColor})` }}>
              MAX
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

FitnessProgressBar.displayName = "FitnessProgressBar";
export default FitnessProgressBar;
