import { useSubscription } from "@/contexts/SubscriptionContext";
import { Crown, Zap, ExternalLink, Dumbbell, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";

const PLATFORM_HUB_URL = "https://platform-hub.app";

type PremiumGateProps = {
  children: React.ReactNode;
  feature?: string;
};

const PremiumGate = ({ children, feature }: PremiumGateProps) => {
  const { isPremium, subscription, loading } = useSubscription();

  if (loading) return <>{children}</>;
  if (isPremium) return <>{children}</>;

  const isExpired = subscription?.status === "expired";

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Glow effect */}
        <div className="relative mx-auto w-20 h-20">
          <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl animate-pulse" />
          <div className="relative w-20 h-20 rounded-2xl flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(168 80% 38%))' }}>
            <Crown className="w-9 h-9 text-primary-foreground" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-display font-bold text-foreground">
            {isExpired ? "Seu acesso expirou" : "Recurso Premium"}
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {isExpired
              ? "Renove seu plano pelo Platform Hub para continuar usando todas as funcionalidades."
              : feature
                ? `"${feature}" é um recurso exclusivo para assinantes. Acesse pelo Platform Hub.`
                : "Acesse este recurso pelo Platform Hub para desbloquear todo o potencial do FitPulse."
            }
          </p>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-2 gap-3 text-left">
          {[
            { icon: Dumbbell, label: "Treinos ilimitados" },
            { icon: Flame, label: "Dieta personalizada" },
            { icon: Crown, label: "Ranking completo" },
            { icon: Zap, label: "Modo social" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 p-3 rounded-xl bg-secondary/60 border border-border/50">
              <Icon className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs font-medium text-foreground">{label}</span>
            </div>
          ))}
        </div>

        <div className="space-y-3 pt-2">
          <Button
            className="w-full gap-2 h-12 text-sm font-semibold rounded-xl"
            onClick={() => window.open(PLATFORM_HUB_URL, "_blank")}
          >
            <ExternalLink className="w-4 h-4" />
            Ir para Platform Hub
          </Button>
          <Button
            variant="outline"
            className="w-full gap-2 h-11 text-sm rounded-xl"
            onClick={() => window.open(`${PLATFORM_HUB_URL}/plans`, "_blank")}
          >
            Ver planos
          </Button>
        </div>

        {subscription?.status === "trial" === false && (
          <p className="text-[11px] text-muted-foreground">
            O FitPulse faz parte do ecossistema Platform Hub.
          </p>
        )}
      </div>
    </div>
  );
};

export default PremiumGate;
