import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { DropoutRisk } from "@/lib/fitnessCoachEngine";

interface DropoutRiskModalProps {
  risk: DropoutRisk | null;
  onDismiss: () => void;
}

const DropoutRiskModal = ({ risk, onDismiss }: DropoutRiskModalProps) => {
  const navigate = useNavigate();

  if (!risk || !risk.detected) return null;

  const severityColors = {
    low: "from-chart-4/20 to-chart-4/5",
    medium: "from-chart-3/20 to-chart-3/5",
    high: "from-destructive/20 to-destructive/5",
  };

  const severityIcons = {
    low: "💡",
    medium: "⚠️",
    high: "🚨",
  };

  return (
    <Dialog open={true} onOpenChange={onDismiss}>
      <DialogContent className="max-w-sm mx-auto p-0 overflow-hidden border-border/50 bg-card">
        <DialogTitle className="sr-only">Alerta de risco</DialogTitle>
        <div className={`bg-gradient-to-b ${severityColors[risk.severity]} p-6 text-center`}>
          <div className="text-4xl mb-3">{severityIcons[risk.severity]}</div>
          <h2 className="text-lg font-display font-bold">{risk.reason}</h2>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed text-center">
            {risk.suggestion}
          </p>
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => { onDismiss(); navigate(risk.ctaRoute); }}
              className="w-full"
            >
              {risk.ctaLabel}
            </Button>
            <Button
              variant="ghost"
              onClick={onDismiss}
              className="w-full text-muted-foreground text-xs"
            >
              Agora não
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DropoutRiskModal;
