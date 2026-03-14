import { useMemo, useState } from "react";
import { Clock, Zap, ChevronDown, ChevronUp, Dumbbell } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  getPeriodizationStatus,
  getCycleVisualConfig,
  type PeriodizationStatus,
  type PeriodCycle,
} from "@/lib/advancedPeriodizationEngine";

const CYCLE_ORDER: PeriodCycle[] = ["adaptacao", "progressao", "intensidade", "recuperacao", "consolidacao"];

const CYCLE_SHORT: Record<PeriodCycle, { emoji: string; label: string }> = {
  adaptacao: { emoji: "🌱", label: "Adaptação" },
  progressao: { emoji: "📈", label: "Progressão" },
  intensidade: { emoji: "🔥", label: "Intensidade" },
  recuperacao: { emoji: "🧘", label: "Recuperação" },
  consolidacao: { emoji: "💎", label: "Consolidação" },
};

export default function PeriodizationCycleCard() {
  const status = useMemo(() => getPeriodizationStatus(), []);
  const visual = getCycleVisualConfig(status.currentCycle);
  const [expanded, setExpanded] = useState(false);
  const progressPct = status.totalDuration > 0
    ? Math.round((status.daysElapsed / status.totalDuration) * 100) : 0;

  return (
    <div className={`glass-card relative overflow-hidden border ${visual.borderColor} animate-fade-in`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${visual.gradient} opacity-60`} />
      <div className="relative z-10 p-4 lg:p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${visual.gradient} flex items-center justify-center border ${visual.borderColor}`}>
              <span className="text-xl">{status.cycleEmoji}</span>
            </div>
            <div>
              <p className="text-sm font-bold flex items-center gap-2">
                Seu Ciclo Atual
                <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md border ${visual.bgColor} ${visual.borderColor} ${visual.textColor}`}>
                  {status.cycleLabel}
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{status.cycleObjective}</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className={`text-lg font-display font-bold ${visual.textColor}`}>{status.daysRemaining}</p>
            <p className="text-[9px] text-muted-foreground">dias restantes</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground">Progresso do ciclo</span>
            <span className={`text-[10px] font-bold ${visual.textColor}`}>{progressPct}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${
                status.currentCycle === "intensidade" ? "from-orange-500 to-destructive" :
                status.currentCycle === "recuperacao" ? "from-chart-2 to-primary" :
                "from-primary to-chart-2"
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Intensity indicator */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] text-muted-foreground">Intensidade:</span>
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`w-5 h-1.5 rounded-full transition-all ${
                  i < status.intensityLevel
                    ? status.currentCycle === "intensidade" ? "bg-orange-400" :
                      status.currentCycle === "recuperacao" ? "bg-chart-2" : "bg-primary"
                    : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Metric pills */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {status.loadMultiplier !== 1.0 && (
            <span className={`text-[9px] font-medium px-2 py-0.5 rounded-md border ${visual.bgColor} ${visual.borderColor} ${visual.textColor}`}>
              {status.loadMultiplier > 1 ? "↑" : "↓"} Carga {Math.round((status.loadMultiplier - 1) * 100)}%
            </span>
          )}
          {status.volumeAdjust !== 0 && (
            <span className={`text-[9px] font-medium px-2 py-0.5 rounded-md border ${visual.bgColor} ${visual.borderColor} ${visual.textColor}`}>
              {status.volumeAdjust > 0 ? "+" : ""}{status.volumeAdjust} série{Math.abs(status.volumeAdjust) > 1 ? "s" : ""}
            </span>
          )}
          {status.restAdjust !== 0 && (
            <span className={`text-[9px] font-medium px-2 py-0.5 rounded-md border ${visual.bgColor} ${visual.borderColor} ${visual.textColor}`}>
              Descanso {status.restAdjust > 0 ? "+" : ""}{status.restAdjust}s
            </span>
          )}
          {status.techniques.length > 0 && (
            <span className="text-[9px] font-medium px-2 py-0.5 rounded-md border bg-amber-500/10 border-amber-500/15 text-amber-400">
              ⚡ {status.techniques.length} técnica{status.techniques.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Cycle roadmap */}
        <div className="flex items-center gap-1.5 mb-3">
          {CYCLE_ORDER.map((cycle, i) => {
            const isCurrent = cycle === status.currentCycle;
            const short = CYCLE_SHORT[cycle];
            const cv = getCycleVisualConfig(cycle);
            return (
              <div key={cycle} className="flex-1 flex flex-col items-center gap-1">
                <div className={`w-full h-2 rounded-full transition-all ${
                  isCurrent
                    ? `${cv.bgColor} shadow-[0_0_8px_hsl(var(--primary)/0.3)]`
                    : "bg-muted"
                }`} />
                <span className={`text-[8px] ${isCurrent ? `font-bold ${cv.textColor}` : "text-muted-foreground"}`}>
                  {short.emoji}
                </span>
              </div>
            );
          })}
        </div>

        {/* Expandable details */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-[10px] text-primary font-medium hover:underline"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? "Menos detalhes" : "Ver detalhes do ciclo"}
        </button>

        {expanded && (
          <div className="mt-3 space-y-2 animate-fade-in">
            <div className="p-3 rounded-xl bg-secondary/30 border border-border/20">
              <p className="text-xs text-muted-foreground leading-relaxed">{status.cycleDescription}</p>
            </div>
            <div className="p-3 rounded-xl bg-secondary/30 border border-border/20 flex items-start gap-2">
              <Dumbbell className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
              <p className="text-[11px] text-muted-foreground">{status.cardioRecommendation}</p>
            </div>
            {status.techniques.length > 0 && (
              <div className="p-3 rounded-xl bg-secondary/30 border border-border/20">
                <p className="text-[10px] text-muted-foreground mb-1.5 font-medium">Técnicas ativas:</p>
                <div className="flex flex-wrap gap-1.5">
                  {status.techniques.map(t => (
                    <span key={t} className="text-[9px] font-medium px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/15 text-amber-400 capitalize">
                      {t.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="p-2 rounded-lg bg-primary/5 border border-primary/10">
              <p className="text-[10px] text-muted-foreground italic">
                💡 Ciclo #{status.cycleNumber} • O sistema transiciona automaticamente baseado no seu desempenho.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
