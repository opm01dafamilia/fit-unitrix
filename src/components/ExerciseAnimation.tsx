import { useState, useEffect } from "react";
import { Dumbbell } from "lucide-react";
import type { ExerciseDetail } from "@/lib/exerciseLibrary";

interface ExerciseAnimationProps {
  exercise: ExerciseDetail;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const exerciseIllustrations: Record<string, { poses: string[][]; icon: string }> = {
  // Musculação
  "supino": {
    poses: [
      ["M30,60 L50,45 L60,50 L70,45 L90,60", "M30,70 L50,55 L60,60 L70,55 L90,70"],
      ["M30,55 L50,35 L60,30 L70,35 L90,55", "M30,70 L50,55 L60,60 L70,55 L90,70"],
    ],
    icon: "🏋️",
  },
  "agachamento": {
    poses: [
      ["M55,30 L60,50 L55,70 L50,90", "M65,30 L60,50 L65,70 L70,90"],
      ["M55,40 L60,55 L50,70 L45,90", "M65,40 L60,55 L70,70 L75,90"],
    ],
    icon: "🏋️",
  },
  "default": {
    poses: [
      ["M50,30 L50,60 L40,85", "M50,30 L50,60 L60,85"],
      ["M50,30 L50,60 L42,80", "M50,30 L50,60 L58,80"],
    ],
    icon: "💪",
  },
};

function getIllustration(exerciseId: string): { poses: string[][]; icon: string } {
  for (const key of Object.keys(exerciseIllustrations)) {
    if (key !== "default" && exerciseId.includes(key)) {
      return exerciseIllustrations[key];
    }
  }
  return exerciseIllustrations["default"];
}

const sizeMap = {
  sm: { container: "w-20 h-20", text: "text-3xl", svg: "w-16 h-16" },
  md: { container: "w-32 h-32", text: "text-5xl", svg: "w-24 h-24" },
  lg: { container: "w-44 h-44", text: "text-7xl", svg: "w-36 h-36" },
};

const ExerciseAnimation = ({ exercise, className = "", size = "md" }: ExerciseAnimationProps) => {
  const [frame, setFrame] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const illustration = getIllustration(exercise.id);
  const sizes = sizeMap[size];

  useEffect(() => {
    const interval = setInterval(() => {
      setOpacity(0.6);
      setTimeout(() => {
        setFrame((f) => (f + 1) % exercise.animacao.frames.length);
        setOpacity(1);
      }, 200);
    }, 1500);
    return () => clearInterval(interval);
  }, [exercise.animacao.frames.length]);

  return (
    <div
      className={`relative ${sizes.container} rounded-2xl flex items-center justify-center overflow-hidden ${className}`}
      style={{
        background: `radial-gradient(circle at 50% 50%, ${exercise.animacao.cor}15, ${exercise.animacao.cor}05)`,
        border: `1px solid ${exercise.animacao.cor}25`,
      }}
    >
      {/* Pulsing ring */}
      <div
        className="absolute inset-2 rounded-xl animate-pulse"
        style={{
          border: `1px solid ${exercise.animacao.cor}15`,
        }}
      />

      {/* Animated figure SVG */}
      <svg viewBox="0 0 100 100" className={`absolute ${sizes.svg} opacity-20`}>
        {illustration.poses[frame % illustration.poses.length]?.map((d, i) => (
          <path
            key={i}
            d={d}
            stroke={exercise.animacao.cor}
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            className="transition-all duration-500 ease-in-out"
          />
        ))}
        {/* Head */}
        <circle cx="60" cy="22" r="8" stroke={exercise.animacao.cor} strokeWidth="2" fill="none" opacity="0.6" />
      </svg>

      {/* Animated emoji */}
      <div
        className="relative z-10 transition-all duration-300 ease-in-out select-none"
        style={{
          opacity,
          transform: frame % 2 === 0 ? "translateY(0px) scale(1)" : "translateY(-4px) scale(1.05)",
        }}
      >
        <span className={sizes.text}>{exercise.animacao.frames[frame]}</span>
      </div>

      {/* Muscle pulse indicators */}
      {exercise.musculosDestacados.slice(0, 3).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-ping"
          style={{
            width: 6,
            height: 6,
            background: exercise.animacao.cor,
            opacity: 0.3,
            top: `${25 + i * 20}%`,
            left: `${15 + i * 25}%`,
            animationDelay: `${i * 0.5}s`,
            animationDuration: "2s",
          }}
        />
      ))}

      {/* Bottom label */}
      <div
        className="absolute bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-medium whitespace-nowrap"
        style={{
          background: `${exercise.animacao.cor}20`,
          color: exercise.animacao.cor,
          border: `1px solid ${exercise.animacao.cor}30`,
        }}
      >
        {exercise.tipoExercicio === "musculação" && "Em movimento"}
        {exercise.tipoExercicio === "cardio" && "Contínuo"}
        {exercise.tipoExercicio === "alongamento" && "Manter posição"}
        {exercise.tipoExercicio === "mobilidade" && "Rotação"}
      </div>
    </div>
  );
};

export default ExerciseAnimation;
