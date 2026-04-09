import { memo, useState, useEffect } from "react";
import { CheckCircle2, Circle, Gift, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export type DailyMission = {
  id: string;
  label: string;
  icon: string;
  xp: number;
  completed: boolean;
  action?: () => void;
};

interface DailyMissionsCardProps {
  missions: DailyMission[];
  bonusXP?: number;
}

const BONUS_KEY = "fitpulse_daily_bonus_claimed";

function isBonusClaimed(): boolean {
  try {
    const stored = localStorage.getItem(BONUS_KEY);
    if (!stored) return false;
    return stored === new Date().toISOString().split("T")[0];
  } catch { return false; }
}

function claimBonus() {
  localStorage.setItem(BONUS_KEY, new Date().toISOString().split("T")[0]);
}

const DailyMissionsCard = memo(({ missions, bonusXP = 10 }: DailyMissionsCardProps) => {
  const completed = missions.filter(m => m.completed).length;
  const total = missions.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const allDone = completed === total && total > 0;
  const [bonusClaimed, setBonusClaimed] = useState(isBonusClaimed());
  const [expanded, setExpanded] = useState(true);
  const [showBonus, setShowBonus] = useState(false);

  useEffect(() => {
    if (allDone && !bonusClaimed) {
      setShowBonus(true);
    }
  }, [allDone, bonusClaimed]);

  const handleClaimBonus = () => {
    claimBonus();
    setBonusClaimed(true);
    setShowBonus(false);
  };

  return (
    <div className="glass-card p-5 lg:p-6 relative overflow-hidden">
      {/* Subtle glow when all done */}
      {allDone && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
      )}

      <div className="relative z-10">
        {/* Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between mb-3"
        >
          <h3 className="font-display font-semibold text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Missões do Dia
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold">
              {completed}/{total}
            </span>
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </div>
        </button>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="h-2 bg-secondary/50 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-muted-foreground">
              {allDone ? "Todas concluídas! 🎉" : `${total - completed} restante(s)`}
            </span>
            <span className="text-[10px] font-bold text-primary">{progress}%</span>
          </div>
        </div>

        {/* Mission list */}
        {expanded && (
          <div className="space-y-1.5 animate-fade-in">
            {missions.map((mission) => (
              <button
                key={mission.id}
                onClick={mission.action}
                disabled={mission.completed}
                className={cn(
                  "w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left group",
                  mission.completed
                    ? "bg-primary/5 border border-primary/10"
                    : "bg-secondary/30 border border-border/30 hover:bg-secondary/50 hover:border-primary/15"
                )}
              >
                {mission.completed ? (
                  <CheckCircle2 className="w-4.5 h-4.5 text-primary shrink-0" />
                ) : (
                  <Circle className="w-4.5 h-4.5 text-muted-foreground shrink-0 group-hover:text-primary/50 transition-colors" />
                )}
                <span className="text-lg shrink-0">{mission.icon}</span>
                <span
                  className={cn(
                    "text-sm font-medium flex-1",
                    mission.completed ? "text-primary/70 line-through" : "text-foreground"
                  )}
                >
                  {mission.label}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                    mission.completed
                      ? "bg-primary/10 text-primary"
                      : "bg-secondary/60 text-muted-foreground"
                  )}
                >
                  +{mission.xp} XP
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Bonus reward */}
        {showBonus && !bonusClaimed && (
          <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <Gift className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Bônus desbloqueado!</p>
                <p className="text-[10px] text-muted-foreground">
                  Você completou todas as missões do dia
                </p>
              </div>
              <button
                onClick={handleClaimBonus}
                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity"
              >
                +{bonusXP} XP
              </button>
            </div>
          </div>
        )}

        {/* Already claimed */}
        {allDone && bonusClaimed && (
          <div className="mt-3 flex items-center gap-2 text-[11px] text-primary/70 italic">
            <Gift className="w-3.5 h-3.5" />
            Bônus do dia já coletado ✓
          </div>
        )}
      </div>
    </div>
  );
});

DailyMissionsCard.displayName = "DailyMissionsCard";
export default DailyMissionsCard;
