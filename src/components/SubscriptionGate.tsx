import { ExternalLink, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useSubscriptionAccess } from "@/hooks/useSubscriptionAccess";
import { toast } from "@/components/ui/sonner";
import { useState, useCallback } from "react";

const ECOSYSTEM_URL = "https://eco-platform-hub.lovable.app";

/**
 * Hook that returns a guard function.
 * Call `guardAction(callback)` — if the user has write access the callback runs,
 * otherwise a friendly modal is shown.
 */
export const useSubscriptionGuard = () => {
  const { canWrite, subscriptionStatus } = useSubscriptionAccess();
  const [open, setOpen] = useState(false);

  const guardAction = useCallback(
    (callback: () => void) => {
      if (canWrite) {
        callback();
      } else {
        setOpen(true);
      }
    },
    [canWrite],
  );

  const GateModal = () => (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader className="items-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <Lock className="w-7 h-7 text-primary" />
          </div>
          <DialogTitle className="text-lg font-display">
            Recurso bloqueado
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            {subscriptionStatus === "pending"
              ? "Seu pagamento está pendente. Regularize para usar este recurso."
              : "Sua assinatura está inativa. Renove para desbloquear todos os recursos do FitPulse."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 mt-4">
          <Button asChild className="w-full">
            <a
              href={`${ECOSYSTEM_URL}/billing`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Regularizar assinatura <ExternalLink className="w-4 h-4 ml-1.5" />
            </a>
          </Button>
          <Button variant="ghost" onClick={() => setOpen(false)} className="w-full">
            Voltar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return { guardAction, canWrite, GateModal };
};

/**
 * Quick toast version for inline guards (no modal needed).
 */
export const toastSubscriptionBlocked = () => {
  toast.error("Recurso bloqueado — regularize sua assinatura para continuar.", {
    action: {
      label: "Regularizar",
      onClick: () => window.open(`${ECOSYSTEM_URL}/billing`, "_blank"),
    },
  });
};
