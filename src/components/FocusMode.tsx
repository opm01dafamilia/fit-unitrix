import { X, Share2 } from "lucide-react";
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Dark overlay */}
      <div
        className="absolute inset-0 bg-background/95 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Content container */}
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-secondary/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {children}
      </div>
    </div>
  );
};

export default FocusMode;
