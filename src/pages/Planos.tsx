import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, ChevronRight, Star, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const plans = [
  {
    name: "FitPulse Mensal",
    highlight: "Primeiro mês: R$ 9,90",
    price: "Depois: R$ 19,90/mês",
    link: "https://pay.kiwify.com.br/gLBLXaS",
    features: ["Treinos personalizados por IA", "Dieta inteligente", "Acompanhamento de evolução", "Comunidade FitPulse"],
  },
  {
    name: "FitPulse Anual",
    highlight: "12x de R$ 15,20",
    price: "ou R$ 147,00 à vista",
    after: "Depois: R$ 197,00/ano",
    link: "https://pay.kiwify.com.br/BDxFfhj",
    popular: true,
    features: ["Tudo do plano mensal", "Economia de até 40%", "Acesso prioritário", "Suporte premium"],
  },
];

const Planos = () => {
  const { subscriptionStatus } = useAuth();

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-display font-bold mb-1">Meu Plano</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Status atual: <span className="text-primary font-semibold capitalize">{subscriptionStatus}</span>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`relative overflow-hidden rounded-3xl border transition-all duration-200 hover:scale-[1.01] ${
              plan.popular
                ? "border-primary/50 shadow-[0_0_40px_-8px_hsl(var(--primary)/0.2)] bg-gradient-to-b from-primary/[0.06] to-transparent"
                : "border-border/60"
            }`}
          >
            {plan.popular && (
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
                  Assinar agora <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Planos;
