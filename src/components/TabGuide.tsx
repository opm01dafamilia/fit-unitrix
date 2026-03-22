import { useState, useEffect } from "react";
import { X, ChevronRight, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

type GuideStep = {
  title: string;
  description: string;
  icon?: string;
};

type TabGuideProps = {
  tabKey: string;
  steps: GuideStep[];
};

const STORAGE_PREFIX = "fitpulse_guide_seen_";

const TabGuide = ({ tabKey, steps }: TabGuideProps) => {
  const [visible, setVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem(`${STORAGE_PREFIX}${tabKey}`);
    if (!seen) {
      const timer = setTimeout(() => setVisible(true), 400);
      return () => clearTimeout(timer);
    }
  }, [tabKey]);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(`${STORAGE_PREFIX}${tabKey}`, "true");
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      dismiss();
    }
  };

  if (!visible || steps.length === 0) return null;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={dismiss} />
      <div className="relative w-full max-w-md mx-4 mb-4 sm:mb-0 bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Progress bar */}
        {steps.length > 1 && (
          <div className="flex gap-1.5 px-5 pt-4">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full flex-1 transition-colors duration-300 ${
                  i <= currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        )}

        <div className="p-5 pt-4">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              {step.icon ? (
                <span className="text-lg">{step.icon}</span>
              ) : (
                <Lightbulb className="w-5 h-5 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-bold text-base text-foreground leading-tight">
                {step.title}
              </h3>
              {steps.length > 1 && (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {currentStep + 1} de {steps.length}
                </p>
              )}
            </div>
            <button
              onClick={dismiss}
              className="p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground transition-colors -mt-0.5 -mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <p className="text-sm text-muted-foreground leading-relaxed mb-5">
            {step.description}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={dismiss}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              Pular
            </Button>
            <Button
              size="sm"
              onClick={handleNext}
              className="flex-1 gap-1.5 text-xs font-semibold"
            >
              {isLast ? "Entendi" : "Seguir"}
              {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TabGuide;
