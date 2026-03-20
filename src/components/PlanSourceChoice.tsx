import { Zap, FileText, ArrowLeft, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlanSourceChoiceProps {
  type: "treino" | "dieta";
  onChooseAI: () => void;
  onChoosePDF: () => void;
  onChooseManual?: () => void;
  onBack?: () => void;
}

const PlanSourceChoice = ({ type, onChooseAI, onChoosePDF, onChooseManual, onBack }: PlanSourceChoiceProps) => {
  const isTreino = type === "treino";
  const title = isTreino ? "Como deseja montar seu treino?" : "Como deseja montar sua dieta?";
  const subtitle = isTreino
    ? "Escolha entre a inteligência artificial ou monte seu treino guiado"
    : "Escolha entre a inteligência artificial ou o plano do seu nutricionista";

  return (
    <div className="space-y-6 animate-slide-up">
      {onBack && (
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 text-muted-foreground hover:text-foreground -ml-2">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
      )}

      <div className="text-center pt-4">
        <h2 className="text-2xl lg:text-3xl font-display font-bold tracking-tight">{title}</h2>
        <p className="text-muted-foreground text-sm mt-2 max-w-md mx-auto">{subtitle}</p>
      </div>

      <div className={`grid grid-cols-1 ${isTreino ? 'sm:grid-cols-2' : 'sm:grid-cols-2'} gap-4 max-w-lg mx-auto pt-4`}>
        {/* AI Option */}
        <button
          onClick={onChooseAI}
          className="group relative rounded-2xl p-6 text-left transition-all duration-200 border-2 border-primary/20 hover:border-primary/50 bg-gradient-to-br from-primary/8 to-primary/3 hover:from-primary/12 hover:to-primary/6 touch-feedback min-h-[160px] flex flex-col"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/25 to-primary/10 flex items-center justify-center mb-4 border border-primary/15 group-hover:scale-105 transition-transform">
            <Zap className="w-7 h-7 text-primary" />
          </div>
          <h3 className="font-display font-bold text-lg text-foreground mb-1">Criar com IA</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isTreino
              ? "Gerador inteligente monta um treino personalizado para você"
              : "Plano alimentar calculado para seus objetivos e perfil"}
          </p>
          <div className="mt-auto pt-3">
            <span className="text-[10px] uppercase tracking-[0.12em] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-md">
              Recomendado
            </span>
          </div>
        </button>

        {/* Manual Guided Option (treino only) or PDF Option (dieta) */}
        {isTreino && onChooseManual ? (
          <button
            onClick={onChooseManual}
            className="group relative rounded-2xl p-6 text-left transition-all duration-200 border-2 border-border/40 hover:border-border/80 bg-gradient-to-br from-secondary/60 to-secondary/30 hover:from-secondary/80 hover:to-secondary/50 touch-feedback min-h-[160px] flex flex-col"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-muted/60 to-muted/30 flex items-center justify-center mb-4 border border-border/30 group-hover:scale-105 transition-transform">
              <SlidersHorizontal className="w-7 h-7 text-foreground/70" />
            </div>
            <h3 className="font-display font-bold text-lg text-foreground mb-1">Treino Guiado</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Escolha a direção e a IA monta os exercícios para você
            </p>
            <div className="mt-auto pt-3">
              <span className="text-[10px] uppercase tracking-[0.12em] font-bold text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-md">
                Personalizado
              </span>
            </div>
          </button>
        ) : (
          <button
            onClick={onChoosePDF}
            className="group relative rounded-2xl p-6 text-left transition-all duration-200 border-2 border-border/40 hover:border-border/80 bg-gradient-to-br from-secondary/60 to-secondary/30 hover:from-secondary/80 hover:to-secondary/50 touch-feedback min-h-[160px] flex flex-col"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-muted/60 to-muted/30 flex items-center justify-center mb-4 border border-border/30 group-hover:scale-105 transition-transform">
              <FileText className="w-7 h-7 text-foreground/70" />
            </div>
            <h3 className="font-display font-bold text-lg text-foreground mb-1">Enviar PDF</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Use o plano do seu nutricionista
            </p>
            <div className="mt-auto pt-3">
              <span className="text-[10px] uppercase tracking-[0.12em] font-bold text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-md">
                Arquivo próprio
              </span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

export default PlanSourceChoice;
