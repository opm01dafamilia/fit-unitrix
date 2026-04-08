import { Link } from "react-router-dom";
import { Dumbbell, Zap, TrendingUp, Shield, Star, ChevronRight, LayoutDashboard, Brain, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import FitPulseLogo from "@/components/FitPulseLogo";

import previewDashboard from "@/assets/preview-dashboard.png";
import previewTreino from "@/assets/preview-treino.png";
import previewAnalise from "@/assets/preview-analise.png";
import previewEvolucao from "@/assets/preview-evolucao.png";
import previewPerfil from "@/assets/preview-perfil.png";

const previews = [
  { img: previewDashboard, label: "Dashboard", desc: "Controle total do seu progresso", icon: LayoutDashboard },
  { img: previewTreino, label: "Treino", desc: "Treinos criados automaticamente pela IA", icon: Dumbbell },
  { img: previewEvolucao, label: "Evolução", desc: "Ajustes inteligentes semanais", icon: TrendingUp },
  { img: previewPerfil, label: "Perfil", desc: "Tudo personalizado para você", icon: UserCircle },
  { img: previewAnalise, label: "Análise", desc: "IA adapta seu plano automaticamente", icon: Brain },
];

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
  { icon: Dumbbell, title: "Treinos com IA", desc: "Treinos gerados automaticamente com base no seu objetivo" },
  { icon: Zap, title: "Modo Personal", desc: "Experiência de personal trainer com inteligência artificial" },
  { icon: TrendingUp, title: "Evolução Real", desc: "A IA analisa seu progresso e adapta tudo semanalmente" },
  { icon: Shield, title: "Dieta Inteligente", desc: "Plano alimentar ajustado pela IA conforme sua evolução" },
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
          <h1 className="text-4xl md:text-6xl font-display font-bold leading-tight mb-4">
            Seu treino e dieta{" "}
            <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
              personalizados por IA
            </span>
          </h1>
          <p className="text-base md:text-lg font-medium text-muted-foreground mb-3">
            Sem personal. Sem planilhas. Sem complicação.
          </p>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto mb-8">
            O FitPulse usa IA para criar e ajustar seus treinos e alimentação com base no seu objetivo e evolução. Tudo automático.
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

      {/* App Preview — Premium Showcase */}
      <section className="py-20 px-6 border-t border-border/20 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-2">
            Veja como o FitPulse funciona por dentro
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Treinos, dieta e evolução gerenciados automaticamente pela inteligência artificial
          </p>

          {/* Horizontal scroll showcase */}
          <div className="flex gap-5 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0">
            {previews.map((p, i) => (
              <div
                key={p.label}
                className={`group flex-shrink-0 snap-center rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_30px_-5px_hsl(var(--primary)/0.25)] ${
                  i === 0
                    ? "w-[320px] md:w-[380px]"
                    : "w-[260px] md:w-[280px]"
                }`}
              >
                <div className="overflow-hidden bg-background/50 p-3">
                  <img
                    src={p.img}
                    alt={p.label}
                    loading="lazy"
                    className={`w-full rounded-xl object-contain transition-transform duration-500 group-hover:scale-[1.03] ${
                      i === 0 ? "h-[400px] md:h-[460px]" : "h-[320px] md:h-[380px]"
                    }`}
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-sm mb-0.5">{p.label}</h3>
                  <p className="text-xs text-muted-foreground">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Feature pills row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-10">
            {previews.map((p) => (
              <div
                key={`pill-${p.label}`}
                className="flex items-start gap-3 p-4 rounded-xl bg-card/60 border border-border/30"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <p.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-0.5">{p.label}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* IA Banner */}
          <div className="mt-10 p-6 rounded-2xl bg-card/60 border border-primary/20 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-primary mb-1">
                Inteligência Artificial em cada detalhe
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                O FitPulse aprende com você. Quanto mais você usa, mais precisos ficam seus treinos e dieta, garantindo resultados reais com um plano feito 100% para o seu perfil.
              </p>
            </div>
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
