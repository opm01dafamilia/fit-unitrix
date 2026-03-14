import { AlertTriangle, RefreshCw, X, ChevronRight } from "lucide-react";
import type { PlateauDetection } from "@/lib/plateauDetectionEngine";
import { dismissPlateau, getPlateauState } from "@/lib/plateauDetectionEngine";
import { useState } from "react";

interface Props {
  plateau: PlateauDetection;
}

const typeLabels: Record<string, string> = {
  forca: "Estagnação de Força",
  composicao: "Estagnação Corporal",
  metabolica: "Estagnação Metabólica",
  comportamental: "Estagnação Comportamental",
};

const severityConfig: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  leve: { bg: "from-chart-3/8 to-chart-3/3", border: "border-chart-3/20", text: "text-chart-3", badge: "bg-chart-3/15 text-chart-3" },
  moderada: { bg: "from-chart-4/8 to-chart-4/3", border: "border-chart-4/20", text: "text-chart-4", badge: "bg-chart-4/15 text-chart-4" },
  alta: { bg: "from-destructive/8 to-destructive/3", border: "border-destructive/20", text: "text-destructive", badge: "bg-destructive/15 text-destructive" },
};

const PlateauAlertCard = ({ plateau }: Props) => {
  const [dismissed, setDismissed] = useState(false);

  if (!plateau.detected || dismissed) return null;

  // Check if already dismissed
  const state = getPlateauState();
  if (state && !state.activeAdjustment) return null;

  const config = severityConfig[plateau.severity];
  const primaryLabel = plateau.primaryType ? typeLabels[plateau.primaryType] : "Estagnação Detectada";

  const handleDismiss = () => {
    dismissPlateau();
    setDismissed(true);
  };

  return (
    <div className={`glass-card p-5 lg:p-6 border ${config.border} relative overflow-hidden`}>
      <div className={`absolute inset-0 bg-gradient-to-r ${config.bg} opacity-50`} />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.bg} flex items-center justify-center`}>
              <AlertTriangle className={`w-5 h-5 ${config.text}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-semibold text-sm">Ajuste Estratégico Ativado</h3>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${config.badge}`}>
                  {plateau.severity.toUpperCase()}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">{primaryLabel}</p>
            </div>
          </div>
          <button onClick={handleDismiss} className="p-1.5 rounded-lg hover:bg-secondary/50 transition-colors">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>

        {/* Message */}
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{plateau.message}</p>

        {/* Detected types */}
        {plateau.types.length > 1 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {plateau.types.map((t) => (
              <span key={t} className="text-[9px] px-2 py-0.5 rounded-md bg-secondary/50 text-muted-foreground font-medium">
                {typeLabels[t]}
              </span>
            ))}
          </div>
        )}

        {/* Adjustments */}
        <div className="space-y-2 mb-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Ajustes recomendados</p>
          {plateau.adjustments.map((adj, i) => (
            <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-secondary/30 border border-border/20">
              <span className="text-sm mt-0.5">{adj.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-foreground">{adj.area}</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">{adj.action}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Recovery estimate */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/20">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] text-muted-foreground">Previsão de retomada</span>
          </div>
          <span className="text-xs font-bold text-primary">~{plateau.estimatedRecoveryDays} dias</span>
        </div>
      </div>
    </div>
  );
};

export default PlateauAlertCard;
