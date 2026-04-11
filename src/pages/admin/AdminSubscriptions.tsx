import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Eye, EyeOff } from "lucide-react";

const fitpulsePlans = [
  {
    name: "Fit-Unitrix Mensal",
    price: "R$ 19,90/mês (primeiro mês R$ 9,90)",
    link: "https://pay.kiwify.com.br/gLBLXaS",
    visible: true,
  },
  {
    name: "Fit-Unitrix Anual",
    price: "12x R$ 15,20 ou R$ 147,00 à vista (depois R$ 197,00/ano)",
    link: "https://pay.kiwify.com.br/BDxFfhj",
    visible: true,
  },
];

const personalPlans = [
  {
    name: "Personal Mensal Pro",
    price: "Plano exclusivo para personals",
    link: "https://pay.kiwify.com.br/0QgelNv",
    visible: false,
  },
  {
    name: "Personal Mensal Elite",
    price: "Plano premium para personals",
    link: "https://pay.kiwify.com.br/GOeM6XC",
    visible: false,
  },
];

const PlanCard = ({ plan }: { plan: typeof fitpulsePlans[0] }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-semibold">{plan.name}</CardTitle>
      <div className="flex items-center gap-2">
        {plan.visible ? (
          <Badge variant="default" className="gap-1 text-xs"><Eye className="w-3 h-3" /> Visível</Badge>
        ) : (
          <Badge variant="secondary" className="gap-1 text-xs"><EyeOff className="w-3 h-3" /> Oculto</Badge>
        )}
      </div>
    </CardHeader>
    <CardContent className="space-y-3">
      <p className="text-sm text-muted-foreground">{plan.price}</p>
      <a href={plan.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
        Link de pagamento <ExternalLink className="w-3 h-3" />
      </a>
    </CardContent>
  </Card>
);

const AdminSubscriptions = () => {
  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-6">Assinaturas</h1>

      <h2 className="text-lg font-semibold mb-4">Planos Fit-Unitrix (visíveis ao usuário)</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {fitpulsePlans.map((p) => <PlanCard key={p.name} plan={p} />)}
      </div>

      <h2 className="text-lg font-semibold mb-4">Planos Personal (apenas admin)</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {personalPlans.map((p) => <PlanCard key={p.name} plan={p} />)}
      </div>
    </div>
  );
};

export default AdminSubscriptions;
