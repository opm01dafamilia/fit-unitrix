import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, ChevronRight, Star } from "lucide-react";
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
    <div>
      <h1 className="text-2xl font-display font-bold mb-2">Meu Plano</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Status atual: <span className="text-primary font-semibold capitalize">{subscriptionStatus}</span>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
        {plans.map((plan) => (
          <Card key={plan.name} className={plan.popular ? "border-primary/40 shadow-[0_0_24px_-6px_hsl(var(--primary)/0.15)]" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{plan.name}</CardTitle>
                {plan.popular && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
                    <Star className="w-3 h-3" /> Popular
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xl font-bold text-primary">{plan.highlight}</p>
                <p className="text-sm text-muted-foreground">{plan.price}</p>
                {plan.after && <p className="text-xs text-muted-foreground">{plan.after}</p>}
              </div>
              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <ChevronRight className="w-3 h-3 text-primary" /> {f}
                  </li>
                ))}
              </ul>
              <a href={plan.link} target="_blank" rel="noopener noreferrer">
                <Button className="w-full rounded-xl gap-2" variant={plan.popular ? "default" : "secondary"}>
                  Assinar <ExternalLink className="w-3.5 h-3.5" />
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
