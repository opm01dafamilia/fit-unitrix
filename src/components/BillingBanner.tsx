import { AlertTriangle } from "lucide-react";
import { SubscriptionStatus } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

interface BillingBannerProps {
  status: SubscriptionStatus;
}

const BillingBanner = ({ status }: BillingBannerProps) => {
  if (status === "active" || status === "trial" || status === "lifetime") return null;

  const config = {
    pending: {
      message: "Seu pagamento está pendente. Regularize para continuar usando todos os recursos.",
      bg: "bg-yellow-500/10 border-yellow-500/20",
      text: "text-yellow-400",
      icon: "⏳",
    },
    canceled: {
      message: "Sua assinatura foi cancelada. Reative para desbloquear todos os recursos.",
      bg: "bg-destructive/10 border-destructive/20",
      text: "text-destructive",
      icon: "🚫",
    },
    expired: {
      message: "Sua assinatura expirou. Renove para continuar usando o FitPulse.",
      bg: "bg-destructive/10 border-destructive/20",
      text: "text-destructive",
      icon: "⚠️",
    },
  };

  const c = config[status as keyof typeof config];
  if (!c) return null;

  return (
    <div className="sticky top-0 z-40 lg:top-0 w-full">
      <div className={`px-4 py-3 border-b ${c.bg} flex items-center gap-3`}>
        <AlertTriangle className={`w-5 h-5 shrink-0 ${c.text}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium ${c.text}`}>
            {c.icon} {c.message}
          </p>
        </div>
        <Link
          to="/app/planos"
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold hover:opacity-90 transition-opacity"
        >
          Regularizar
        </Link>
      </div>
    </div>
  );
};

export default BillingBanner;

export const isPremiumBlocked = (status: SubscriptionStatus): boolean => {
  return status === "pending" || status === "canceled" || status === "expired";
};
