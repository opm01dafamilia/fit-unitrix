import { useState } from "react";
import { ArrowLeft, ArrowUp, ArrowDown, Dumbbell, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateWorkoutPlan, type BodyFocus, type UserGender } from "@/lib/workoutGenerator";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

interface ManualWorkoutFlowProps {
  onBack: () => void;
  onComplete: () => void;
}

type Step = "region" | "muscle" | "generating";

const upperGroups = [
  { id: "peito", label: "Peito", emoji: "💪" },
  { id: "costas", label: "Costas", emoji: "🔙" },
  { id: "ombros", label: "Ombros", emoji: "🏋️" },
  { id: "biceps_triceps", label: "Braços", emoji: "💪" },
];

const lowerGroups = [
  { id: "quadriceps", label: "Quadríceps", emoji: "🦵" },
  { id: "posterior", label: "Posterior", emoji: "🦿" },
];

const ManualWorkoutFlow = ({ onBack, onComplete }: ManualWorkoutFlowProps) => {
  const { user, profile } = useAuth();
  const [step, setStep] = useState<Step>("region");
  const [region, setRegion] = useState<"superior" | "inferior" | null>(null);
  const [saving, setSaving] = useState(false);

  const nivel = (profile as any)?.experience_level || "intermediario";
  const objetivo = (profile as any)?.objective || "massa";
  const gender: UserGender = (profile as any)?.gender === "feminino" ? "feminino" : "masculino";

  const handleSelectMuscle = async (muscleId: string) => {
    if (!user) return;
    setStep("generating");

    try {
      // Map muscle selection to exercise groups
      let groups: string[];
      switch (muscleId) {
        case "peito":
          groups = ["peito", "triceps"];
          break;
        case "costas":
          groups = ["costas", "biceps"];
          break;
        case "ombros":
          groups = ["ombros", "triceps"];
          break;
        case "biceps_triceps":
          groups = ["biceps", "triceps", "ombros"];
          break;
        case "quadriceps":
          groups = ["quadriceps", "panturrilha"];
          break;
        case "posterior":
          groups = ["posterior", "gluteos"];
          break;
        default:
          groups = ["peito", "triceps"];
      }

      // Generate a single-day plan using the workout generator
      const fullPlan = generateWorkoutPlan(
        objetivo as any,
        nivel as any,
        3,
        region === "superior" ? "superior" : "inferior",
        "0",
        "intenso",
        undefined,
        gender
      );

      // Find the day that best matches the selected muscle groups or build one
      const groupLabel = groups.map(g => {
        const labels: Record<string, string> = {
          peito: "Peito", costas: "Costas", ombros: "Ombros", biceps: "Bíceps",
          triceps: "Tríceps", quadriceps: "Quadríceps", posterior: "Posterior",
          gluteos: "Glúteos", panturrilha: "Panturrilha", abdomen: "Abdômen",
        };
        return labels[g] || g;
      }).join(" + ");

      // Use the generator to create a focused single day
      const focusedPlan = generateWorkoutPlan(
        objetivo as any,
        nivel as any,
        3,
        region === "superior" ? "superior" : "inferior",
        "0",
        "intenso",
        undefined,
        gender
      );

      // Build a 1-day plan from the best matching day
      let bestDay = focusedPlan[0];
      const lowerGroupId = muscleId.toLowerCase();
      for (const day of focusedPlan) {
        const dayGroupsLower = day.grupo.toLowerCase();
        if (
          (muscleId === "peito" && dayGroupsLower.includes("peito")) ||
          (muscleId === "costas" && dayGroupsLower.includes("costas")) ||
          (muscleId === "ombros" && dayGroupsLower.includes("ombro")) ||
          (muscleId === "biceps_triceps" && (dayGroupsLower.includes("bíceps") || dayGroupsLower.includes("tríceps"))) ||
          (muscleId === "quadriceps" && dayGroupsLower.includes("quadríceps")) ||
          (muscleId === "posterior" && dayGroupsLower.includes("posterior"))
        ) {
          bestDay = day;
          break;
        }
      }

      // Create a plan_data with just one day renamed
      const planData = [{
        ...bestDay,
        dia: "Segunda",
        grupo: groupLabel,
      }];

      setSaving(true);

      const { error } = await supabase.from("workout_plans").insert({
        user_id: user.id,
        objective: objetivo,
        experience_level: nivel,
        days_per_week: 1,
        body_focus: region,
        plan_data: planData as any,
      });

      if (error) throw error;

      toast.success("Treino guiado criado com sucesso! 🎯");
      onComplete();
    } catch (err) {
      console.error("Erro ao gerar treino guiado:", err);
      toast.error("Erro ao criar treino. Tente novamente.");
      setStep("muscle");
    } finally {
      setSaving(false);
    }
  };

  // Step: Generating
  if (step === "generating") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-slide-up gap-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/25 to-primary/10 flex items-center justify-center border border-primary/15 animate-pulse">
          <Zap className="w-10 h-10 text-primary" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-display font-bold">Montando seu treino...</h2>
          <p className="text-sm text-muted-foreground">A IA está selecionando os melhores exercícios</p>
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Step: Muscle group selection
  if (step === "muscle" && region) {
    const groups = region === "superior" ? upperGroups : lowerGroups;

    return (
      <div className="space-y-6 animate-slide-up">
        <Button variant="ghost" size="sm" onClick={() => { setStep("region"); setRegion(null); }} className="gap-2 text-muted-foreground hover:text-foreground -ml-2">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>

        <div className="text-center pt-2">
          <h2 className="text-2xl font-display font-bold tracking-tight">
            Qual grupo muscular?
          </h2>
          <p className="text-muted-foreground text-sm mt-2 max-w-sm mx-auto">
            Escolha o foco e a IA monta os exercícios automaticamente
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 max-w-md mx-auto pt-4">
          {groups.map((group) => (
            <button
              key={group.id}
              onClick={() => handleSelectMuscle(group.id)}
              className="group relative rounded-2xl p-5 text-left transition-all duration-200 border-2 border-border/40 hover:border-primary/50 bg-gradient-to-br from-secondary/60 to-secondary/30 hover:from-primary/8 hover:to-primary/3 touch-feedback flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-muted/60 to-muted/30 flex items-center justify-center border border-border/30 group-hover:border-primary/20 group-hover:from-primary/15 group-hover:to-primary/5 transition-all text-2xl shrink-0">
                {group.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-bold text-lg text-foreground">{group.label}</h3>
                <p className="text-xs text-muted-foreground">
                  IA seleciona os melhores exercícios
                </p>
              </div>
              <Dumbbell className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Step: Region selection (Superior / Inferior)
  return (
    <div className="space-y-6 animate-slide-up">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 text-muted-foreground hover:text-foreground -ml-2">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Button>

      <div className="text-center pt-2">
        <h2 className="text-2xl font-display font-bold tracking-tight">
          Superior ou Inferior?
        </h2>
        <p className="text-muted-foreground text-sm mt-2 max-w-sm mx-auto">
          Escolha a região e depois o grupo muscular. A IA faz o resto!
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto pt-4">
        <button
          onClick={() => { setRegion("superior"); setStep("muscle"); }}
          className="group relative rounded-2xl p-6 text-left transition-all duration-200 border-2 border-border/40 hover:border-primary/50 bg-gradient-to-br from-secondary/60 to-secondary/30 hover:from-primary/8 hover:to-primary/3 touch-feedback min-h-[160px] flex flex-col items-center justify-center text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4 border border-primary/15 group-hover:scale-105 transition-transform">
            <ArrowUp className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-display font-bold text-xl text-foreground mb-1">Superior</h3>
          <p className="text-xs text-muted-foreground">Peito, Costas, Ombros, Braços</p>
        </button>

        <button
          onClick={() => { setRegion("inferior"); setStep("muscle"); }}
          className="group relative rounded-2xl p-6 text-left transition-all duration-200 border-2 border-border/40 hover:border-primary/50 bg-gradient-to-br from-secondary/60 to-secondary/30 hover:from-primary/8 hover:to-primary/3 touch-feedback min-h-[160px] flex flex-col items-center justify-center text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4 border border-primary/15 group-hover:scale-105 transition-transform">
            <ArrowDown className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-display font-bold text-xl text-foreground mb-1">Inferior</h3>
          <p className="text-xs text-muted-foreground">Quadríceps, Posterior</p>
        </button>
      </div>
    </div>
  );
};

export default ManualWorkoutFlow;