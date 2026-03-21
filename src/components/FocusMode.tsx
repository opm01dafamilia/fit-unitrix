import { X } from "lucide-react";
import { useEffect } from "react";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/bodyScrollLock";

interface FocusModeProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const FocusMode = ({ open, onClose, children }: FocusModeProps) => {
  useEffect(() => {
    if (!open) return;
    lockBodyScroll();
    return () => unlockBodyScroll();
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
      {/* Blurred dark overlay — blocks interaction */}
      <div
        className="absolute inset-0 backdrop-blur-xl"
        style={{ background: "hsl(225 18% 4% / 0.92)" }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Content container — fixed, centered, no scroll, mobile-first */}
      <div
        className="relative z-10 w-full max-w-[400px] mx-auto px-3 sm:px-0 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          height: "100dvh",
          maxHeight: "100dvh",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          overscrollBehaviorY: "contain",
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 10px)",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:right-0 z-20 w-10 h-10 rounded-full bg-secondary/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all active:scale-95"
          style={{ top: "calc(env(safe-area-inset-top, 12px) + 12px)" }}
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div
          className="w-full scrollbar-hide"
          style={{
            maxHeight: "calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 24px)",
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default FocusMode;
