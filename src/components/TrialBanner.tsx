import { Clock, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useUserSubscription } from "@/hooks/useUserSubscription";
import { differenceInDays, differenceInHours, parseISO } from "date-fns";

const TrialBanner = () => {
  const { subscription, loading } = useUserSubscription();

  if (loading || !subscription) return null;
  if (subscription.status !== "trial") return null;
  if (!subscription.expires_at) return null;

  const expiresAt = parseISO(subscription.expires_at);
  const now = new Date();
  const daysLeft = differenceInDays(expiresAt, now);
  const hoursLeft = differenceInHours(expiresAt, now);

  if (daysLeft < 0) return null; // expired, BillingBanner handles this

  const urgency = daysLeft <= 1;
  const timeLabel = daysLeft >= 1
    ? `${daysLeft} dia${daysLeft !== 1 ? "s" : ""} restante${daysLeft !== 1 ? "s" : ""}`
    : `${Math.max(hoursLeft, 0)}h restantes`;

  return (
    <div className="sticky top-0 z-40 lg:top-0 w-full">
      <div
        className={`px-4 py-3 border-b flex items-center gap-3 ${
          urgency
            ? "bg-yellow-500/10 border-yellow-500/20"
            : "bg-primary/5 border-primary/10"
        }`}
      >
        <div className={`flex items-center gap-1.5 ${urgency ? "text-yellow-400" : "text-primary"}`}>
          {urgency ? <Clock className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium ${urgency ? "text-yellow-400" : "text-primary"}`}>
            {urgency ? "⏳" : "✨"} Teste grátis — <span className="font-bold">{timeLabel}</span>
          </p>
        </div>
        <Link
          to="/app/planos"
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold hover:opacity-90 transition-opacity"
        >
          Escolher plano
        </Link>
      </div>
    </div>
  );
};

export default TrialBanner;
