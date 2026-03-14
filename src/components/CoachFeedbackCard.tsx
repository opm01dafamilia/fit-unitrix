import { ArrowRight, Brain } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { CoachMessage } from "@/lib/fitnessCoachEngine";

interface CoachFeedbackCardProps {
  messages: CoachMessage[];
}

const typeColors: Record<string, string> = {
  motivacional: "from-primary/10 to-primary/5 border-primary/15",
  alerta: "from-chart-3/10 to-chart-3/5 border-chart-3/15",
  conquista: "from-chart-4/10 to-chart-4/5 border-chart-4/15",
  dica: "from-chart-2/10 to-chart-2/5 border-chart-2/15",
  risco: "from-destructive/10 to-destructive/5 border-destructive/15",
};

const CoachFeedbackCard = ({ messages }: CoachFeedbackCardProps) => {
  const navigate = useNavigate();

  if (messages.length === 0) return null;

  return (
    <div className="glass-card p-5 lg:p-6 space-y-3">
      <div className="flex items-center gap-2.5 mb-1">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/15 to-chart-2/10 flex items-center justify-center">
          <Brain className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-sm">Coach Inteligente</h3>
          <p className="text-[10px] text-muted-foreground">Análise comportamental do seu progresso</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-3.5 rounded-xl bg-gradient-to-r border transition-all ${typeColors[msg.type] || typeColors.motivacional}`}
          >
            <div className="flex items-start gap-2.5">
              <span className="text-lg shrink-0 mt-0.5">{msg.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight">{msg.title}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{msg.message}</p>
                {msg.actionRoute && (
                  <button
                    onClick={() => navigate(msg.actionRoute!)}
                    className="mt-2 text-[11px] text-primary font-medium flex items-center gap-1 hover:underline"
                  >
                    {msg.actionLabel || "Ver mais"} <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CoachFeedbackCard;
