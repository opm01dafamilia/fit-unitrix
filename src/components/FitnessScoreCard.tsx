import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";
import type { FitnessScoreResult } from "@/lib/fitnessScoreEngine";
import { getScoreHistoryData } from "@/lib/fitnessScoreEngine";

interface Props {
  result: FitnessScoreResult;
}

const tierColors: Record<string, string> = {
  elite: "text-chart-4",
  alta: "text-primary",
  media: "text-chart-3",
  baixa: "text-destructive",
};

const tierBg: Record<string, string> = {
  elite: "from-chart-4/15 to-chart-4/5",
  alta: "from-primary/15 to-primary/5",
  media: "from-chart-3/15 to-chart-3/5",
  baixa: "from-destructive/15 to-destructive/5",
};

const tierRingColor: Record<string, string> = {
  elite: "stroke-chart-4",
  alta: "stroke-primary",
  media: "stroke-chart-3",
  baixa: "stroke-destructive",
};

const FitnessScoreCard = ({ result }: Props) => {
  const history = getScoreHistoryData();
  const { score, tier, tierLabel, trend, message, breakdown } = result;

  // SVG ring
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  const TrendIcon = trend === "subindo" ? TrendingUp : trend === "caindo" ? TrendingDown : Minus;
  const trendLabel = trend === "subindo" ? "Subindo" : trend === "caindo" ? "Caindo" : "Estável";
  const trendColor = trend === "subindo" ? "text-primary" : trend === "caindo" ? "text-destructive" : "text-muted-foreground";

  return (
    <div className="glass-card p-5 lg:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${tierBg[tier]} flex items-center justify-center`}>
          <Activity className={`w-4 h-4 ${tierColors[tier]}`} />
        </div>
        <div>
          <h3 className="font-display font-semibold text-sm">Score Fitness</h3>
          <p className="text-[10px] text-muted-foreground">{tierLabel}</p>
        </div>
      </div>

      {/* Score ring + info */}
      <div className="flex items-center gap-5 mb-4">
        <div className="relative w-24 h-24 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={radius} fill="none" className="stroke-secondary/40" strokeWidth="6" />
            <circle
              cx="50" cy="50" r={radius} fill="none"
              className={tierRingColor[tier]}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress}
              style={{ transition: "stroke-dashoffset 1s ease-out" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-display font-bold ${tierColors[tier]}`}>{score}</span>
            <span className="text-[8px] text-muted-foreground uppercase tracking-wider">/ 100</span>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <div className={`flex items-center gap-1.5 ${trendColor}`}>
            <TrendIcon className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">{trendLabel}</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{message}</p>
          {result.xpMultiplier !== 1.0 && (
            <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold inline-block ${
              result.xpMultiplier > 1 ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
            }`}>
              XP ×{result.xpMultiplier.toFixed(2)}
            </span>
          )}
        </div>
      </div>

      {/* Breakdown bars */}
      <div className="space-y-2">
        {breakdown.map((b) => {
          const pct = b.max > 0 ? Math.round((b.value / b.max) * 100) : 0;
          return (
            <div key={b.label}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] text-muted-foreground">{b.label}</span>
                <span className="text-[10px] font-semibold">{b.value}/{b.max}</span>
              </div>
              <div className="h-1.5 bg-secondary/40 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    pct >= 80 ? "bg-primary" : pct >= 50 ? "bg-chart-3" : "bg-destructive/70"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Mini chart */}
      {history.length > 1 && (
        <div className="mt-4 pt-3 border-t border-border/30">
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">Evolução do Score</p>
          <div className="flex items-end gap-1 h-12">
            {history.slice(0, 14).reverse().map((h, i) => {
              const height = Math.max(4, (h.score / 100) * 48);
              const isToday = i === history.slice(0, 14).length - 1;
              return (
                <div
                  key={h.date}
                  className={`flex-1 rounded-sm transition-all ${isToday ? "bg-primary" : "bg-secondary/60"}`}
                  style={{ height: `${height}px` }}
                  title={`${h.date}: ${h.score}`}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default FitnessScoreCard;
