import { useMemo } from "react";
import { Target, TrendingUp, TrendingDown, AlertCircle, BarChart3 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import {
  calculateWeeklyVolume,
  getVolumeAdjustments,
  type WeeklyVolumeReport,
  type MuscleVolumeData,
  type VolumeAlert,
} from "@/lib/muscleVolumeEngine";

type Props = {
  level: string;
  objective: string;
  bodyFocus: string;
};

export default function MuscleVolumeCard({ level, objective, bodyFocus }: Props) {
  const report = useMemo(() => calculateWeeklyVolume(level, objective, bodyFocus), [level, objective, bodyFocus]);
  const adjustments = useMemo(() => getVolumeAdjustments(report), [report]);

  // Only show groups that have data or are relevant
  const activeGroups = report.groups.filter(g => g.weeklySets > 0);
  const inactiveGroups = report.groups.filter(g => g.weeklySets === 0);

  const statusColor = report.overallStatus === "ideal" ? "text-primary" :
    report.overallStatus === "excessivo" ? "text-destructive" :
    report.overallStatus === "alto" ? "text-amber-400" : "text-muted-foreground";

  return (
    <div className="glass-card p-4 lg:p-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <BarChart3 className="w-3.5 h-3.5 text-primary" />
          Volume Muscular da Semana
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-secondary/60 text-muted-foreground">
            {report.totalSets} séries
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
            report.balanceScore >= 70 ? "bg-primary/10 text-primary border border-primary/20" :
            report.balanceScore >= 40 ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
            "bg-destructive/10 text-destructive border border-destructive/20"
          }`}>
            {report.balanceScore}% equilibrado
          </span>
        </div>
      </div>

      {/* Active muscle groups */}
      {activeGroups.length > 0 ? (
        <div className="space-y-2.5">
          {activeGroups.map((g) => (
            <MuscleVolumeRow key={g.group} data={g} />
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          <Target className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs font-medium">Nenhum treino registrado esta semana</p>
          <p className="text-[10px] mt-1">Complete treinos para ver o volume muscular</p>
        </div>
      )}

      {/* Inactive groups summary */}
      {inactiveGroups.length > 0 && activeGroups.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/30">
          <p className="text-[10px] text-muted-foreground mb-1.5 font-semibold uppercase tracking-wider">Sem estímulo esta semana:</p>
          <div className="flex flex-wrap gap-1">
            {inactiveGroups.map(g => (
              <span key={g.group} className="text-[9px] px-2 py-0.5 rounded-md bg-secondary/40 text-muted-foreground border border-border/20">
                {g.emoji} {g.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Alerts */}
      {report.alerts.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/30 space-y-1.5">
          {report.alerts.slice(0, 3).map((alert, i) => (
            <div key={i} className={`flex items-start gap-2 p-2 rounded-lg ${
              alert.type === "excess" ? "bg-destructive/5 border border-destructive/10" :
              alert.type === "deficit" ? "bg-amber-500/5 border border-amber-500/10" :
              "bg-blue-500/5 border border-blue-500/10"
            }`}>
              <span className="text-xs shrink-0">{alert.emoji}</span>
              <p className="text-[10px] text-muted-foreground leading-relaxed">{alert.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Adjustments */}
      {adjustments.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/30">
          <p className="text-[10px] text-muted-foreground mb-2 font-semibold uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-primary" /> Ajustes sugeridos
          </p>
          <div className="space-y-1">
            {adjustments.slice(0, 4).map((adj, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px]">
                {adj.action === "increase" ? (
                  <TrendingUp className="w-3 h-3 text-primary shrink-0" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-amber-400 shrink-0" />
                )}
                <span className="text-muted-foreground">{adj.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Protection note */}
      <div className="mt-3 p-2 rounded-lg bg-primary/5 border border-primary/10">
        <p className="text-[9px] text-muted-foreground italic flex items-center gap-1">
          🛡️ Volume protegido por fadiga, periodização e modo retomada
        </p>
      </div>
    </div>
  );
}

// ===== Row Component =====

function MuscleVolumeRow({ data }: { data: MuscleVolumeData }) {
  const pct = data.maxSets > 0 ? Math.min(100, (data.weeklySets / data.maxSets) * 100) : 0;
  const barColor = data.status === "ideal" ? "bg-primary" :
    data.status === "baixo" ? "bg-amber-500" :
    data.status === "alto" ? "bg-orange-500" : "bg-destructive";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-3 group cursor-default">
            <span className="text-sm w-5 text-center shrink-0">{data.statusEmoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[11px] font-semibold text-foreground">{data.label}</span>
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {data.weeklySets}/{data.minSets}–{data.maxSets}
                </span>
              </div>
              <div className="h-1.5 bg-secondary/60 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[220px]">
          <p className="text-[10px] font-semibold mb-0.5">{data.label} — {data.statusLabel}</p>
          <p className="text-[9px] text-muted-foreground">{data.suggestion}</p>
          {data.frequency > 0 && (
            <p className="text-[9px] text-muted-foreground mt-0.5">
              {data.frequency}x/semana • Intensidade {data.avgIntensity.toFixed(1)}/3
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
