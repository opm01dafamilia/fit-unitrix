import { Flame } from "lucide-react";

interface FitPulseLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  showSubtext?: boolean;
  className?: string;
}

const sizeMap = {
  xs: { box: "w-7 h-7 rounded-lg", icon: "w-3.5 h-3.5", text: "text-sm", subtext: "text-[9px]" },
  sm: { box: "w-10 h-10 rounded-xl", icon: "w-5 h-5", text: "text-lg", subtext: "text-[11px]" },
  md: { box: "w-14 h-14 rounded-2xl", icon: "w-7 h-7", text: "text-2xl", subtext: "text-xs" },
  lg: { box: "w-20 h-20 rounded-3xl shadow-lg shadow-primary/20", icon: "w-10 h-10", text: "text-3xl", subtext: "text-sm" },
  xl: { box: "w-24 h-24 rounded-3xl shadow-xl shadow-primary/25", icon: "w-12 h-12", text: "text-4xl", subtext: "text-base" },
};

const FitPulseLogo = ({ size = "sm", showText = false, showSubtext = false, className = "" }: FitPulseLogoProps) => {
  const s = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className={`${s.box} flex items-center justify-center shrink-0`}
        style={{ background: 'var(--gradient-primary)' }}
      >
        <Flame className={`${s.icon} text-primary-foreground`} />
      </div>
      {(showText || showSubtext) && (
        <div>
          {showText && (
            <h1 className={`font-display ${s.text} font-bold text-foreground tracking-tight`}>Fit-Unitrix</h1>
          )}
          {showSubtext && (
            <p className={`${s.subtext} text-muted-foreground font-medium uppercase tracking-widest`}>Pro Fitness</p>
          )}
        </div>
      )}
    </div>
  );
};

export default FitPulseLogo;
