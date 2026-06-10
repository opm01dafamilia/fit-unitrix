import { useState, useMemo } from "react";
import { ChevronDown, Target, Layers, Anchor } from "lucide-react";
import MuscleBodyMap from "@/components/MuscleBodyMap";
import type { MuscleId } from "@/lib/exerciseLibrary";

interface ExerciseVisualCardProps {
  nome: string;
  grupoLabel: string;
  series: string;
  reps: string;
  descanso: string;
  highlightedMuscles: MuscleId[];
  musculosPrincipais?: string[];
  musculosSecundarios?: string[];
  musculosEstabilizadores?: string[];
  instrucoes?: string[];
  dicas?: string[];
}

// Heuristic to infer secondary/stabilizer muscles from highlighted muscle ids
function inferGroups(highlighted: MuscleId[], musculos?: string[]) {
  const principal = musculos && musculos.length > 0 ? [musculos[0]] : [];
  const secundarios = musculos && musculos.length > 1 ? musculos.slice(1) : [];

  // Stabilizers: core almost always; serrátil if peitoral; lombar if posterior chain
  const stabilizers = new Set<string>(["Core", "Articulações ativas"]);
  if (highlighted.some(m => m === "peitoral" || m === "peitoral-superior")) stabilizers.add("Serrátil anterior");
  if (highlighted.includes("dorsal") || highlighted.includes("trapezio")) stabilizers.add("Romboides");
  if (highlighted.includes("isquiotibiais") || highlighted.includes("gluteos")) stabilizers.add("Lombar");
  if (highlighted.some(m => m === "deltoide-anterior" || m === "deltoide-lateral" || m === "deltoide-posterior")) stabilizers.add("Manguito rotador");

  return {
    principal,
    secundarios,
    estabilizadores: Array.from(stabilizers).slice(0, 3),
  };
}

const MuscleChips = ({
  label,
  items,
  accent,
  icon: Icon,
}: {
  label: string;
  items: string[];
  accent?: boolean;
  icon: React.ComponentType<{ className?: string }>;
}) => {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1.5">
        <Icon className="w-3 h-3" /> {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((m, i) => (
          <span
            key={i}
            className={
              accent
                ? "text-[11px] px-2.5 py-1 rounded-full font-semibold bg-primary/15 text-primary border border-primary/25"
                : "text-[11px] px-2.5 py-1 rounded-full bg-secondary/60 text-foreground/80 border border-border/40"
            }
          >
            {m}
          </span>
        ))}
      </div>
    </div>
  );
};

export default function ExerciseVisualCard({
  nome,
  grupoLabel,
  series,
  reps,
  descanso,
  highlightedMuscles,
  musculosPrincipais,
  musculosSecundarios,
  musculosEstabilizadores,
  instrucoes,
  dicas,
}: ExerciseVisualCardProps) {
  const [view, setView] = useState<"front" | "back">("front");
  const [showHow, setShowHow] = useState(false);

  const groups = useMemo(() => {
    const auto = inferGroups(highlightedMuscles, musculosPrincipais);
    return {
      principal: musculosPrincipais && musculosPrincipais.length > 0 ? [musculosPrincipais[0]] : auto.principal,
      secundarios: musculosSecundarios && musculosSecundarios.length > 0
        ? musculosSecundarios
        : (musculosPrincipais && musculosPrincipais.length > 1 ? musculosPrincipais.slice(1) : auto.secundarios),
      estabilizadores: musculosEstabilizadores && musculosEstabilizadores.length > 0 ? musculosEstabilizadores : auto.estabilizadores,
    };
  }, [highlightedMuscles, musculosPrincipais, musculosSecundarios, musculosEstabilizadores]);

  const fallbackSteps = [
    "Posicione-se de forma estável, core ativo e coluna neutra.",
    "Execute o movimento principal com tempo controlado.",
    "Faça uma breve contração no ponto de pico do esforço.",
    "Retorne à posição inicial de forma lenta e controlada.",
    "Mantenha a respiração ritmada: expire na fase de força.",
  ];
  const steps = instrucoes && instrucoes.length > 0 ? instrucoes : fallbackSteps;

  return (
    <div className="rounded-3xl border border-border/40 bg-card/80 overflow-hidden shadow-md shadow-black/20">
      <div className="p-4 sm:p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display font-bold text-lg leading-tight tracking-tight">{nome}</h3>
            <p className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground mt-0.5">
              {grupoLabel}
            </p>
          </div>
        </div>

        {/* Sets / Reps / Rest */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Séries", value: series },
            { label: "Reps", value: reps },
            { label: "Descanso", value: descanso },
          ].map((m, i) => (
            <div key={i} className="rounded-xl bg-secondary/40 border border-border/30 px-2 py-2 text-center">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">{m.label}</p>
              <p className="text-sm font-display font-bold text-foreground mt-0.5 truncate">{m.value}</p>
            </div>
          ))}
        </div>

        {/* Anatomy + muscles */}
        <div className="grid sm:grid-cols-[auto_1fr] gap-4 items-start">
          <div className="flex flex-col items-center mx-auto">
            <div className="relative rounded-2xl border border-border/40 bg-gradient-to-b from-secondary/40 to-background/40 px-3 py-2">
              <MuscleBodyMap highlightedMuscles={highlightedMuscles} size="md" view={view} />
            </div>
            <div className="mt-2 inline-flex rounded-full border border-border/50 bg-secondary/40 p-0.5">
              {([
                { id: "front", label: "Ver frente" },
                { id: "back", label: "Ver costas" },
              ] as const).map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setView(opt.id)}
                  className={`px-3 py-1 text-[11px] font-semibold rounded-full transition-all ${
                    view === opt.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <MuscleChips label="Músculo principal" items={groups.principal} accent icon={Target} />
            <MuscleChips label="Secundários" items={groups.secundarios} icon={Layers} />
            <MuscleChips label="Estabilizadores" items={groups.estabilizadores} icon={Anchor} />
          </div>
        </div>

        {/* How to execute */}
        <div>
          <button
            type="button"
            onClick={() => setShowHow(s => !s)}
            className="w-full flex items-center justify-between gap-2 rounded-xl border border-border/40 bg-secondary/40 hover:bg-secondary/60 px-4 py-3 transition-all active:scale-[0.99]"
          >
            <span className="text-sm font-bold">Como executar</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showHow ? "rotate-180" : ""}`} />
          </button>
          {showHow && (
            <div className="mt-2 rounded-xl border border-border/40 bg-background/40 p-4 space-y-3 animate-fade-in">
              <ol className="space-y-2">
                {steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-xs text-foreground/85 leading-relaxed">{s}</p>
                  </li>
                ))}
              </ol>
              {dicas && dicas.length > 0 && (
                <div className="pt-2 border-t border-border/30">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-amber-400 mb-1.5">💡 Dicas</p>
                  <ul className="space-y-1">
                    {dicas.map((d, i) => (
                      <li key={i} className="text-xs text-muted-foreground leading-relaxed pl-3 border-l-2 border-amber-500/30">{d}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
