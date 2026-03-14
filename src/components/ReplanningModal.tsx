import { useState } from "react";
import { RefreshCw, ChevronRight, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReplanResult } from "@/lib/smartReplanningEngine";
import { acknowledgeReplan, getReplanState } from "@/lib/smartReplanningEngine";

interface Props {
  replan: ReplanResult;
}

const scopeColors: Record<string, { bg: string; text: string }> = {
  treino: { bg: "bg-primary/10", text: "text-primary" },
  dieta: { bg: "bg-chart-3/10", text: "text-chart-3" },
  cardio: { bg: "bg-chart-2/10", text: "text-chart-2" },
  recuperacao: { bg: "bg-chart-4/10", text: "text-chart-4" },
};

const scopeLabels: Record<string, string> = {
  treino: "Treino",
  dieta: "Dieta",
  cardio: "Cardio",
  recuperacao: "Recuperação",
};

const ReplanningModal = ({ replan }: Props) => {
  const [acknowledged, setAcknowledged] = useState(false);

  if (!replan.shouldReplan || acknowledged) return null;

  // Check if already acknowledged
  const state = getReplanState();
  if (state?.acknowledged) return null;

  const handleAcknowledge = () => {
    acknowledgeReplan();
    setAcknowledged(true);
  };

  return (
    <div className="glass-card p-5 lg:p-6 border border-chart-4/25 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-chart-4/5 to-primary/3 opacity-60" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-chart-4/15 to-primary/10 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-chart-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-display font-semibold text-sm">
                {replan.isTotal ? "Plano Replanejado" : "Ajuste Estratégico"}
              </h3>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                replan.isTotal ? "bg-chart-4/15 text-chart-4" : "bg-primary/15 text-primary"
              }`}>
                {replan.isTotal ? "TOTAL" : "PARCIAL"}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Seu plano foi atualizado estrategicamente</p>
          </div>
        </div>

        {/* Message */}
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{replan.message}</p>

        {/* Triggers */}
        <div className="mb-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">Motivos identificados</p>
          <div className="flex flex-wrap gap-1.5">
            {replan.triggers.map((t, i) => (
              <span key={i} className="text-[9px] px-2 py-1 rounded-lg bg-secondary/50 text-muted-foreground font-medium flex items-center gap-1">
                <AlertTriangle className="w-2.5 h-2.5" />
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Changes */}
        <div className="mb-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">O que mudou</p>
          <div className="space-y-2">
            {replan.changes.map((change, i) => {
              const colors = scopeColors[change.scope] || scopeColors.treino;
              return (
                <div key={i} className="p-3 rounded-xl bg-secondary/30 border border-border/20">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">{change.icon}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${colors.bg} ${colors.text}`}>
                      {scopeLabels[change.scope]}
                    </span>
                    <span className="text-[10px] font-semibold">{change.area}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="text-muted-foreground line-through">{change.before}</span>
                    <ChevronRight className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                    <span className="font-medium text-foreground">{change.after}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Benefits */}
        <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 mb-4">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] font-semibold text-primary mb-0.5">Benefícios esperados</p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">{replan.benefitMessage}</p>
            </div>
          </div>
        </div>

        {/* New cycle suggestion */}
        {replan.newCycleSuggestion && (
          <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/20 mb-4 flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 text-chart-4" />
            <span className="text-[10px] text-muted-foreground">
              Novo ciclo sugerido: <span className="font-semibold text-foreground capitalize">{replan.newCycleSuggestion}</span>
            </span>
          </div>
        )}

        {/* Acknowledge button */}
        <Button onClick={handleAcknowledge} size="sm" className="w-full">
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Entendi — continuar
        </Button>
      </div>
    </div>
  );
};

export default ReplanningModal;
