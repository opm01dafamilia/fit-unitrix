import { AlertTriangle, ExternalLink } from "lucide-react";
import { SubscriptionStatus } from "@/hooks/useSSOAuth";

const ECOSYSTEM_URL = "https://eco-platform-hub.lovable.app";

interface BillingBannerProps {
  status: SubscriptionStatus;
}

const BillingBanner = ({ status }: BillingBannerProps) => {
  if (status === "active" || status === "trial") return null;

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
    <div className={`mx-4 mt-4 p-3.5 rounded-xl border ${c.bg} flex items-center gap-3`}>
      <AlertTriangle className={`w-5 h-5 shrink-0 ${c.text}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium ${c.text}`}>
          {c.icon} {c.message}
        </p>
      </div>
      <a
        href={`${ECOSYSTEM_URL}/billing`}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
      >
        Resolver <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
};

export default BillingBanner;

export const isPremiumBlocked = (status: SubscriptionStatus): boolean => {
  return status === "pending" || status === "canceled" || status === "expired";
};
