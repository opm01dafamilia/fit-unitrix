import { type MuscleId } from "@/lib/exerciseLibrary";

interface MuscleBodyMapProps {
  highlightedMuscles: MuscleId[];
  className?: string;
}

const muscleColors: Record<string, string> = {
  active: "hsl(152 69% 46%)",
  secondary: "hsl(152 69% 46% / 0.35)",
  inactive: "hsl(225 12% 18%)",
  outline: "hsl(225 12% 25%)",
};

// Maps muscle IDs to SVG path definitions (front view body)
const musclePaths: Record<string, { d: string; label: string; side: "front" | "back" | "both" }> = {
  "peitoral": {
    d: "M58,52 Q65,48 72,50 Q78,53 80,60 Q78,65 72,66 Q65,66 58,62 Z M122,52 Q115,48 108,50 Q102,53 100,60 Q102,65 108,66 Q115,66 122,62 Z",
    label: "Peitoral",
    side: "front",
  },
  "peitoral-superior": {
    d: "M62,46 Q70,42 78,46 Q80,50 72,52 Q65,52 60,48 Z M118,46 Q110,42 102,46 Q100,50 108,52 Q115,52 120,48 Z",
    label: "Peitoral Sup.",
    side: "front",
  },
  "deltoide-anterior": {
    d: "M50,48 Q54,44 58,48 Q58,56 54,58 Q50,56 48,52 Z M130,48 Q126,44 122,48 Q122,56 126,58 Q130,56 132,52 Z",
    label: "Deltóide Ant.",
    side: "front",
  },
  "deltoide-lateral": {
    d: "M46,46 Q50,40 52,46 Q52,54 48,56 Q44,54 44,50 Z M134,46 Q130,40 128,46 Q128,54 132,56 Q136,54 136,50 Z",
    label: "Deltóide Lat.",
    side: "front",
  },
  "deltoide-posterior": {
    d: "M46,50 Q44,46 46,44 Q48,42 50,44 L50,52 Q48,54 46,52 Z M134,50 Q136,46 134,44 Q132,42 130,44 L130,52 Q132,54 134,52 Z",
    label: "Deltóide Post.",
    side: "back",
  },
  "biceps": {
    d: "M48,60 Q52,58 54,62 Q54,72 52,76 Q48,78 46,74 Q44,68 46,62 Z M132,60 Q128,58 126,62 Q126,72 128,76 Q132,78 134,74 Q136,68 134,62 Z",
    label: "Bíceps",
    side: "front",
  },
  "triceps": {
    d: "M44,62 Q42,58 44,56 Q48,54 48,60 Q48,72 46,76 Q42,74 42,68 Z M136,62 Q138,58 136,56 Q132,54 132,60 Q132,72 134,76 Q138,74 138,68 Z",
    label: "Tríceps",
    side: "back",
  },
  "antebraco": {
    d: "M44,78 Q48,76 50,80 Q50,90 48,94 Q44,92 42,86 Z M136,78 Q132,76 130,80 Q130,90 132,94 Q136,92 138,86 Z",
    label: "Antebraço",
    side: "front",
  },
  "reto-abdominal": {
    d: "M82,64 Q90,62 98,64 Q100,72 100,82 Q98,90 90,92 Q82,90 80,82 Q80,72 82,64 Z",
    label: "Abdômen",
    side: "front",
  },
  "obliquos": {
    d: "M76,66 Q80,64 82,68 Q82,80 80,86 Q76,84 74,76 Z M104,66 Q100,64 98,68 Q98,80 100,86 Q104,84 106,76 Z",
    label: "Oblíquos",
    side: "front",
  },
  "core": {
    d: "M78,60 Q90,58 102,60 Q104,64 104,68 Q102,72 90,74 Q78,72 76,68 Q76,64 78,60 Z",
    label: "Core",
    side: "front",
  },
  "dorsal": {
    d: "M62,52 Q70,48 78,50 Q82,56 82,68 Q78,74 70,76 Q62,74 58,68 Q58,56 62,52 Z M118,52 Q110,48 102,50 Q98,56 98,68 Q102,74 110,76 Q118,74 122,68 Q122,56 118,52 Z",
    label: "Dorsal",
    side: "back",
  },
  "trapezio": {
    d: "M72,32 Q80,28 90,26 Q100,28 108,32 Q112,38 108,42 Q100,44 90,44 Q80,44 72,42 Q68,38 72,32 Z",
    label: "Trapézio",
    side: "back",
  },
  "lombar": {
    d: "M80,78 Q90,76 100,78 Q102,84 100,90 Q90,92 80,90 Q78,84 80,78 Z",
    label: "Lombar",
    side: "back",
  },
  "quadriceps": {
    d: "M72,96 Q78,94 82,98 Q84,110 82,124 Q78,128 74,124 Q70,116 68,106 Q68,98 72,96 Z M108,96 Q102,94 98,98 Q96,110 98,124 Q102,128 106,124 Q110,116 112,106 Q112,98 108,96 Z",
    label: "Quadríceps",
    side: "front",
  },
  "isquiotibiais": {
    d: "M72,100 Q78,98 82,102 Q84,114 82,126 Q78,130 74,126 Q70,118 68,108 Q68,102 72,100 Z M108,100 Q102,98 98,102 Q96,114 98,126 Q102,130 106,126 Q110,118 112,108 Q112,102 108,100 Z",
    label: "Isquiotibiais",
    side: "back",
  },
  "gluteos": {
    d: "M72,90 Q82,86 90,88 Q98,86 108,90 Q112,96 108,100 Q98,104 90,104 Q82,104 72,100 Q68,96 72,90 Z",
    label: "Glúteos",
    side: "back",
  },
  "panturrilha": {
    d: "M72,130 Q76,128 80,132 Q82,142 80,152 Q76,154 74,150 Q70,142 70,134 Z M108,130 Q104,128 100,132 Q98,142 100,152 Q104,154 106,150 Q110,142 110,134 Z",
    label: "Panturrilha",
    side: "back",
  },
  "adutor": {
    d: "M84,96 Q88,94 90,98 Q90,110 88,118 Q84,116 82,108 Q82,98 84,96 Z M96,96 Q92,94 90,98 Q90,110 92,118 Q96,116 98,108 Q98,98 96,96 Z",
    label: "Adutores",
    side: "front",
  },
};

const MuscleBodyMap = ({ highlightedMuscles, className = "" }: MuscleBodyMapProps) => {
  const isFullBody = highlightedMuscles.includes("corpo-inteiro");

  const getMuscleColor = (muscleId: string) => {
    if (isFullBody) return muscleColors.active;
    if (highlightedMuscles.includes(muscleId as MuscleId)) return muscleColors.active;
    return muscleColors.inactive;
  };

  const getMuscleOpacity = (muscleId: string) => {
    if (isFullBody) return 0.7;
    if (highlightedMuscles.includes(muscleId as MuscleId)) return 0.85;
    return 0.3;
  };

  return (
    <div className={`inline-flex gap-1.5 items-start justify-center ${className}`}>
      {/* Front View */}
      <div className="relative">
        <p className="text-[9px] text-center text-muted-foreground mb-0.5 uppercase tracking-widest font-semibold">Frente</p>
        <svg viewBox="30 18 120 150" className="w-[72px] h-[100px]" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M90,24 Q96,24 100,28 Q104,32 104,38 L104,40 Q108,40 114,44 Q120,48 122,52 Q126,44 132,44 Q138,48 138,56 Q138,68 136,78 Q134,86 130,94 L128,98 Q130,98 132,100 Q134,104 132,108 L124,100 Q122,100 120,102 Q118,106 116,110 Q114,118 112,126 Q110,134 108,140 Q106,146 104,152 Q102,160 100,164 L80,164 Q78,160 76,152 Q74,146 72,140 Q70,134 68,126 Q66,118 64,110 Q62,106 60,102 Q58,100 56,100 L48,108 Q46,104 48,100 Q50,98 52,98 L50,94 Q46,86 44,78 Q42,68 42,56 Q42,48 48,44 Q54,44 58,52 Q60,48 66,44 Q72,40 76,40 L76,38 Q76,32 80,28 Q84,24 90,24 Z"
            fill="none"
            stroke={muscleColors.outline}
            strokeWidth="0.8"
            opacity="0.5"
          />
          {Object.entries(musclePaths)
            .filter(([, config]) => config.side === "front" || config.side === "both")
            .map(([id, config]) => (
              <path
                key={id}
                d={config.d}
                fill={getMuscleColor(id)}
                opacity={getMuscleOpacity(id)}
                stroke={highlightedMuscles.includes(id as MuscleId) || isFullBody ? muscleColors.active : "transparent"}
                strokeWidth="0.5"
                className="transition-all duration-500"
              >
                <title>{config.label}</title>
              </path>
            ))}
        </svg>
      </div>

      {/* Back View */}
      <div className="relative">
        <p className="text-[9px] text-center text-muted-foreground mb-0.5 uppercase tracking-widest font-semibold">Costas</p>
        <svg viewBox="30 18 120 150" className="w-[72px] h-[100px]" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M90,24 Q96,24 100,28 Q104,32 104,38 L104,40 Q108,40 114,44 Q120,48 122,52 Q126,44 132,44 Q138,48 138,56 Q138,68 136,78 Q134,86 130,94 L128,98 Q130,98 132,100 Q134,104 132,108 L124,100 Q122,100 120,102 Q118,106 116,110 Q114,118 112,126 Q110,134 108,140 Q106,146 104,152 Q102,160 100,164 L80,164 Q78,160 76,152 Q74,146 72,140 Q70,134 68,126 Q66,118 64,110 Q62,106 60,102 Q58,100 56,100 L48,108 Q46,104 48,100 Q50,98 52,98 L50,94 Q46,86 44,78 Q42,68 42,56 Q42,48 48,44 Q54,44 58,52 Q60,48 66,44 Q72,40 76,40 L76,38 Q76,32 80,28 Q84,24 90,24 Z"
            fill="none"
            stroke={muscleColors.outline}
            strokeWidth="0.8"
            opacity="0.5"
          />
          {Object.entries(musclePaths)
            .filter(([, config]) => config.side === "back" || config.side === "both")
            .map(([id, config]) => (
              <path
                key={id}
                d={config.d}
                fill={getMuscleColor(id)}
                opacity={getMuscleOpacity(id)}
                stroke={highlightedMuscles.includes(id as MuscleId) || isFullBody ? muscleColors.active : "transparent"}
                strokeWidth="0.5"
                className="transition-all duration-500"
              >
                <title>{config.label}</title>
              </path>
            ))}
        </svg>
      </div>
    </div>
  );
};

export default MuscleBodyMap;
