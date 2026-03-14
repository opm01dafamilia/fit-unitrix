import { memo } from "react";
import { User } from "lucide-react";
import { getFitnessLevel, type FitnessLevel } from "@/lib/fitnessLevelEngine";

interface AuraAvatarProps {
  avatarUrl?: string | null;
  totalXP: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { container: "w-10 h-10", icon: "w-4 h-4", ring: 2, rounded: "rounded-xl" },
  md: { container: "w-16 h-16", icon: "w-7 h-7", ring: 2, rounded: "rounded-2xl" },
  lg: { container: "w-24 h-24", icon: "w-10 h-10", ring: 3, rounded: "rounded-3xl" },
};

const AuraAvatar = memo(({ avatarUrl, totalXP, size = "md", className = "" }: AuraAvatarProps) => {
  const level = getFitnessLevel(totalXP);
  const s = sizeMap[size];
  const isElite = level.level === 8;

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      {/* Outer aura glow */}
      <div
        className={`absolute inset-[-4px] ${s.rounded} opacity-60 blur-sm`}
        style={{ background: level.auraGradient }}
      />
      {/* Animated pulse for high levels */}
      {level.level >= 6 && (
        <div
          className={`absolute inset-[-6px] ${s.rounded} opacity-30 blur-md animate-pulse`}
          style={{ background: level.auraGradient }}
        />
      )}
      {/* Elite sparkle ring */}
      {isElite && (
        <div
          className={`absolute inset-[-3px] ${s.rounded} opacity-40`}
          style={{
            background: level.auraGradient,
            animation: "spin 8s linear infinite",
          }}
        />
      )}
      {/* Avatar container */}
      <div
        className={`${s.container} ${s.rounded} flex items-center justify-center relative z-10 border-${s.ring} ${level.auraBorderClass} ${level.auraGlowClass} overflow-hidden`}
        style={{
          background: avatarUrl
            ? "transparent"
            : `linear-gradient(135deg, hsl(${level.auraColor} / 0.15), hsl(${level.auraColor} / 0.05))`,
        }}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className={`${s.container} ${s.rounded} object-cover`} />
        ) : (
          <User className={`${s.icon} text-foreground/70`} style={{ color: `hsl(${level.auraColor})` }} />
        )}
      </div>
    </div>
  );
});

AuraAvatar.displayName = "AuraAvatar";
export default AuraAvatar;
