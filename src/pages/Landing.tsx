import { Link } from "react-router-dom";
import { Dumbbell, Zap, TrendingUp, Shield, Star, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import FitPulseLogo from "@/components/FitPulseLogo";

const plans = [
  {
    name: "FitPulse Mensal",
    highlight: "Primeiro mês R$ 9,90",
    price: "R$ 19,90/mês",
    link: "https://pay.kiwify.com.br/gLBLXaS",
    features: ["Treinos personalizados por IA", "Dieta inteligente", "Acompanhamento completo", "Comunidade FitPulse"],
  },
  {
    name: "FitPulse Anual",
    highlight: "12x de R$ 15,20",
    price: "ou R$ 147,00 à vista",
    after: "Depois R$ 197,00/ano",
    link: "https://pay.kiwify.com.br/BDxFfhj",
    popular: true,
    features: ["Tudo do mensal", "Economia de até 40%", "Acesso prioritário a novidades", "Suporte premium"],
  },
];

const features = [
  { icon: Dumbbell, title: "Treinos com IA", desc: "Planos personalizados que evoluem com você" },
  { icon: Zap, title: "Modo Personal", desc: "Experiência de personal trainer dentro do app" },
  { icon: TrendingUp, title: "Evolução Real", desc: "Acompanhe seu progresso com métricas detalhadas" },
  { icon: Shield, title: "Dieta Inteligente", desc: "Planos alimentares adaptados ao seu objetivo" },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <FitPulseLogo size="sm" showText />
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="rounded-xl">Começar agora</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6">
            <Star className="w-3.5 h-3.5" /> Treine como um profissional
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-bold leading-tight mb-6">
            Seu treino e dieta{" "}
            <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
              personalizados por IA
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            O FitPulse cria planos de treino e alimentação inteligentes que evoluem com você. 
            Resultados reais, sem complicação.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/signup">
              <Button size="lg" className="rounded-xl text-base px-8 w-full sm:w-auto">
                Começar agora <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 border-t border-border/20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-12">
            Tudo que você precisa em um só app
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="py-20 px-6 border-t border-border/20" id="planos">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-4">Escolha seu plano</h2>
          <p className="text-muted-foreground text-center mb-12">Comece sua transformação hoje</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative p-6 rounded-2xl border ${
                  plan.popular
                    ? "border-primary/40 bg-primary/5 shadow-[0_0_30px_-8px_hsl(var(--primary)/0.2)]"
                    : "border-border/50 bg-card"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    Mais popular
                  </div>
                )}
                <h3 className="text-lg font-bold mb-2">{plan.name}</h3>
                <p className="text-2xl font-display font-bold text-primary mb-1">{plan.highlight}</p>
                <p className="text-sm text-muted-foreground mb-1">{plan.price}</p>
                {plan.after && <p className="text-xs text-muted-foreground mb-4">{plan.after}</p>}
                {!plan.after && <div className="mb-4" />}
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                        <ChevronRight className="w-3 h-3 text-primary" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <a href={plan.link} target="_blank" rel="noopener noreferrer" className="block">
                  <Button className="w-full rounded-xl" variant={plan.popular ? "default" : "secondary"}>
                    Assinar agora
                  </Button>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-border/20">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <FitPulseLogo size="xs" showText />
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} FitPulse. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
