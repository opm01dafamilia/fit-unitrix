import { X } from "lucide-react";
import { useEffect } from "react";

interface FocusModeProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const FocusMode = ({ open, onClose, children }: FocusModeProps) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center animate-in fade-in duration-200">
      {/* Blurred dark overlay */}
      <div
        className="absolute inset-0 backdrop-blur-md"
        style={{
          background: "hsl(225 18% 4% / 0.85)",
        }}
        onClick={onClose}
      />

      {/* Content container — fixed, centered, no scroll, mobile-first */}
      <div
        className="relative z-10 w-full max-w-[400px] mx-auto px-4 sm:px-0 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100dvh",
          maxHeight: "100dvh",
          overflow: "hidden",
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:right-0 z-20 w-9 h-9 rounded-full bg-secondary/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          style={{ top: "calc(env(safe-area-inset-top, 12px) + 12px)" }}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-full" style={{ maxHeight: "calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 24px)", overflow: "hidden" }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default FocusMode;
