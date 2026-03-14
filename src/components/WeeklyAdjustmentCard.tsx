import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, ArrowRight, TrendingUp, Shield, Zap, ChevronDown, ChevronUp } from "lucide-react";
import {
  analyzeWeeklyPerformance,
  saveDecision,
  getCurrentWeekDecision,
  getImpactColor,
  getImpactBg,
  type WeeklyPerformanceData,
  type WeeklyAdjustmentReport,
  type UserAdjustmentDecision,
} from "@/lib/weeklyAutoAdjustEngine";

type Props = {
  data: WeeklyPerformanceData;
};

export default function WeeklyAdjustmentCard({ data }: Props) {
  const existingDecision = getCurrentWeekDecision();
  const [decision, setDecision] = useState<UserAdjustmentDecision | null>(
    existingDecision?.decision || null
  );
  const [expanded, setExpanded] = useState(false);

  const report = useMemo(() => analyzeWeeklyPerformance(data), [data]);

  if (report.adjustments.length === 0) return null;

  const handleDecision = (d: UserAdjustmentDecision) => {
    setDecision(d);
    saveDecision(report.weekStart, d, report);
  };

  const statusGradient = report.status === "evolving"
    ? "from-primary/8 to-chart-2/5"
    : report.status === "fatigued"
    ? "from-chart-2/8 to-primary/5"
    : "from-amber-500/8 to-orange-500/5";

  const statusBorder = report.status === "evolving"
    ? "border-primary/15"
    : report.status === "fatigued"
    ? "border-chart-2/15"
    : "border-amber-500/15";

  return (
    <div className={`glass-card relative overflow-hidden border ${statusBorder} animate-fade-in`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${statusGradient} opacity-60`} />
      <div className="relative z-10 p-4 lg:p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${statusGradient} flex items-center justify-center border ${statusBorder}`}>
              <span className="text-xl">{report.statusEmoji}</span>
            </div>
            <div>
              <p className="text-sm font-bold flex items-center gap-2">
                Ajustes Inteligentes da Semana
                <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md border ${
                  report.status === "evolving" ? "text-primary bg-primary/10 border-primary/15" :
                  report.status === "fatigued" ? "text-chart-2 bg-chart-2/10 border-chart-2/15" :
                  "text-amber-400 bg-amber-500/10 border-amber-500/15"
                }`}>
                  {report.statusLabel}
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{report.statusMessage}</p>
            </div>
          </div>
        </div>

        {/* Metric pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-[10px] font-medium px-2.5 py-1 rounded-lg bg-secondary/60 border border-border/30 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-primary" />
            Score: {report.overallScore}/100
          </span>
          <span className="text-[10px] font-medium px-2.5 py-1 rounded-lg bg-secondary/60 border border-border/30 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            Treinos: {report.workoutCompletionPct}%
          </span>
          <span className="text-[10px] font-medium px-2.5 py-1 rounded-lg bg-secondary/60 border border-border/30 flex items-center gap-1">
            <Shield className="w-3 h-3 text-chart-2" />
            Dieta: {report.dietAdherencePct}%
          </span>
          {report.weightChangePct !== 0 && (
            <span className={`text-[10px] font-medium px-2.5 py-1 rounded-lg bg-secondary/60 border border-border/30 ${
              report.weightChangePct > 0 ? "text-amber-400" : "text-primary"
            }`}>
              Peso: {report.weightChangePct > 0 ? "+" : ""}{report.weightChangePct}%
            </span>
          )}
        </div>

        {/* Adjustments list */}
        <div className="space-y-2">
          {(expanded ? report.adjustments : report.adjustments.slice(0, 3)).map((adj) => (
            <div
              key={adj.id}
              className={`flex items-start gap-3 p-3 rounded-xl border ${getImpactBg(adj.impact)} transition-all`}
            >
              <span className="text-base mt-0.5">{adj.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-xs font-semibold ${getImpactColor(adj.impact)}`}>{adj.title}</p>
                  {adj.metric && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${getImpactBg(adj.impact)}`}>
                      {adj.metric}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{adj.description}</p>
              </div>
            </div>
          ))}
        </div>

        {report.adjustments.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[10px] text-primary font-medium mt-2 hover:underline"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? "Ver menos" : `Ver mais ${report.adjustments.length - 3} ajustes`}
          </button>
        )}

        {/* Decision buttons or feedback */}
        {!decision ? (
          <div className="grid grid-cols-3 gap-2 mt-4">
            <Button
              size="sm"
              className="h-9 text-xs bg-gradient-to-r from-primary to-chart-2 hover:opacity-90"
              onClick={() => handleDecision("accepted")}
            >
              <Check className="w-3.5 h-3.5 mr-1" /> Aceitar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-9 text-xs"
              onClick={() => handleDecision("kept_current")}
            >
              <ArrowRight className="w-3.5 h-3.5 mr-1" /> Manter
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-9 text-xs text-muted-foreground hover:text-destructive"
              onClick={() => handleDecision("rejected")}
            >
              <X className="w-3.5 h-3.5 mr-1" /> Rejeitar
            </Button>
          </div>
        ) : (
          <div className={`mt-4 p-3 rounded-xl border ${
            decision === "accepted" ? "bg-primary/5 border-primary/15" :
            decision === "kept_current" ? "bg-secondary/40 border-border/30" :
            "bg-muted/30 border-border/20"
          }`}>
            <p className="text-[11px] font-medium flex items-center gap-2">
              {decision === "accepted" && <><Check className="w-3.5 h-3.5 text-primary" /> Ajustes aplicados! Seu plano foi atualizado.</>}
              {decision === "kept_current" && <><ArrowRight className="w-3.5 h-3.5 text-muted-foreground" /> Plano mantido. Reavaliaremos na próxima semana.</>}
              {decision === "rejected" && <><X className="w-3.5 h-3.5 text-muted-foreground" /> Ajustes rejeitados. Você pode aceitar a qualquer momento.</>}
            </p>
          </div>
        )}

        {/* Subtle tip */}
        <div className="mt-3 p-2 rounded-lg bg-primary/5 border border-primary/10">
          <p className="text-[10px] text-muted-foreground italic">
            💡 Ajustes são calculados com base em {report.adjustments.length} indicadores de desempenho reais.
          </p>
        </div>
      </div>
    </div>
  );
}
