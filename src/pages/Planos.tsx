import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, ChevronRight, Star, Zap, CheckCircle2, AlertTriangle, Clock, Loader2 } from "lucide-react";
import { useUserSubscription } from "@/hooks/useUserSubscription";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const plans = [
  {
    name: "FitPulse Mensal",
    highlight: "Primeiro mês: R$ 9,90",
    price: "Depois: R$ 19,90/mês",
    link: "https://pay.kiwify.com.br/gLBLXaS",
    planKey: "mensal",
    features: ["Treinos personalizados por IA", "Dieta inteligente", "Acompanhamento de evolução", "Comunidade FitPulse"],
  },
  {
    name: "FitPulse Anual",
    highlight: "12x de R$ 15,20",
    price: "ou R$ 147,00 à vista",
    after: "Depois: R$ 197,00/ano",
    link: "https://pay.kiwify.com.br/BDxFfhj",
    planKey: "anual",
    popular: true,
    features: ["Tudo do plano mensal", "Economia de até 40%", "Acesso prioritário", "Suporte premium"],
  },
];

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  active: { label: "Ativo", color: "text-emerald-400", icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
  trial: { label: "Período de teste", color: "text-sky-400", icon: <Clock className="w-4 h-4 text-sky-400" /> },
  lifetime: { label: "Vitalício", color: "text-emerald-400", icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
  pending: { label: "Pagamento pendente", color: "text-yellow-400", icon: <AlertTriangle className="w-4 h-4 text-yellow-400" /> },
  canceled: { label: "Cancelado", color: "text-destructive", icon: <AlertTriangle className="w-4 h-4 text-destructive" /> },
  expired: { label: "Expirado", color: "text-destructive", icon: <AlertTriangle className="w-4 h-4 text-destructive" /> },
  refunded: { label: "Reembolsado", color: "text-destructive", icon: <AlertTriangle className="w-4 h-4 text-destructive" /> },
  chargedback: { label: "Chargeback", color: "text-destructive", icon: <AlertTriangle className="w-4 h-4 text-destructive" /> },
};

const planTypeLabels: Record<string, string> = {
  mensal: "Mensal",
  anual: "Anual",
  individual: "Individual",
};

const formatDate = (d: string | null) => {
  if (!d) return "—";
  try { return format(new Date(d), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }); } catch { return "—"; }
};

const Planos = () => {
  const { subscription, loading, isActive } = useUserSubscription();

  const st = statusConfig[subscription?.status ?? ""] ?? { label: subscription?.status ?? "Sem plano", color: "text-muted-foreground", icon: null };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-display font-bold mb-1">Meu Plano</h1>

      {/* Current subscription info */}
      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-8">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando seu plano…
        </div>
      ) : subscription ? (
        <Card className="mb-8 border-border/60 rounded-2xl">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              {st.icon}
              <span className={`text-sm font-semibold ${st.color}`}>{st.label}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                Plano: <span className="font-medium text-foreground">{planTypeLabels[subscription.plan_type] ?? subscription.plan_type}</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
              <div>
                <p className="mb-0.5 font-medium text-foreground/80">Início</p>
                <p>{formatDate(subscription.started_at)}</p>
              </div>
              <div>
                <p className="mb-0.5 font-medium text-foreground/80">Expira em</p>
                <p>{formatDate(subscription.expires_at)}</p>
              </div>
            </div>

            {!isActive && (
              <p className="text-xs text-yellow-400/90 pt-1">
                ⚠ Seu acesso está limitado. Escolha um plano abaixo para continuar usando o FitPulse.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground mb-8">
          Você ainda não possui um plano ativo. Escolha abaixo para começar.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {plans.map((plan) => {
          const isCurrentPlan = isActive && subscription?.plan_type === plan.planKey;

          return (
            <Card
              key={plan.name}
              className={`relative overflow-hidden rounded-3xl border transition-all duration-200 hover:scale-[1.01] ${
                plan.popular
                  ? "border-primary/50 shadow-[0_0_40px_-8px_hsl(var(--primary)/0.2)] bg-gradient-to-b from-primary/[0.06] to-transparent"
                  : "border-border/60"
              } ${isCurrentPlan ? "ring-2 ring-primary/40" : ""}`}
            >
              {isCurrentPlan && (
                <div className="absolute top-0 left-0 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-br-2xl flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3" /> Seu plano
                </div>
              )}

              {plan.popular && !isCurrentPlan && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-bl-2xl flex items-center gap-1.5">
                  <Star className="w-3 h-3 fill-current" /> Mais popular
                </div>
              )}

              <CardContent className="p-8 flex flex-col h-full">
                <div className="flex items-center gap-2.5 mb-6">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    plan.popular ? "bg-primary/15" : "bg-secondary/80"
                  }`}>
                    <Zap className={`w-5 h-5 ${plan.popular ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                </div>

                <div className="mb-8">
                  <p className="text-2xl font-extrabold text-primary leading-tight">{plan.highlight}</p>
                  <p className="text-sm text-muted-foreground mt-1">{plan.price}</p>
                  {plan.after && <p className="text-xs text-muted-foreground/70 mt-0.5">{plan.after}</p>}
                </div>

                <div className="border-t border-border/40 pt-6 mb-8 flex-1">
                  <ul className="space-y-3.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-3 text-sm">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <ChevronRight className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-foreground/90">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <a href={plan.link} target="_blank" rel="noopener noreferrer" className="mt-auto">
                  <Button
                    className={`w-full rounded-2xl h-12 gap-2 text-sm font-semibold transition-all duration-200 ${
                      plan.popular
                        ? "bg-primary hover:bg-primary/90 shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.4)]"
                        : ""
                    }`}
                    variant={plan.popular ? "default" : "secondary"}
                  >
                    {isCurrentPlan ? "Gerenciar plano" : "Assinar agora"} <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </a>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Planos;
