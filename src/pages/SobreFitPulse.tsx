import { Dumbbell, UtensilsCrossed, BarChart3, Crosshair, Trophy, Users, TrendingUp, Heart, Sparkles, Info } from "lucide-react";
import FitUnitrixLogo from "@/components/FitPulseLogo";

const features = [
  { icon: Dumbbell, title: "Treinos Personalizados", desc: "Planos de treino gerados de acordo com seu nível, objetivo e dias disponíveis." },
  { icon: UtensilsCrossed, title: "Plano Alimentar", desc: "Dieta personalizada com base no seu peso, altura e objetivo fitness." },
  { icon: TrendingUp, title: "Acompanhamento Corporal", desc: "Registre peso, medidas e veja sua evolução ao longo do tempo." },
  { icon: BarChart3, title: "Análise & Evolução", desc: "Gráficos de progresso de treino, dieta e composição corporal." },
  { icon: Crosshair, title: "Metas & Desafios", desc: "Defina metas pessoais e participe de desafios semanais para ganhar XP." },
  { icon: Trophy, title: "Conquistas & Ranking", desc: "Desbloqueie conquistas e acompanhe sua posição no ranking global." },
  { icon: Users, title: "Comunidade", desc: "Conecte-se com outros usuários, compartilhe progresso e motive-se." },
  { icon: Heart, title: "Cardio & Alongamento", desc: "Sessões complementares de cardio e alongamento integradas ao treino." },
];

const SobreFitUnitrix = () => {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <FitUnitrixLogo size="sm" />
        <div>
          <h1 className="font-display text-xl font-bold text-foreground">Sobre o Fit-Pulse</h1>
          <p className="text-xs text-muted-foreground">Conheça o app e saiba como aproveitá-lo</p>
        </div>
      </div>

      {/* Intro Card */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm text-foreground">O que é o Fit-Pulse?</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          O <span className="text-foreground font-medium">Fit-Pulse</span> é o seu companheiro fitness completo. 
          Ele gera treinos e dietas personalizadas, acompanha sua evolução corporal, mantém você motivado com 
          conquistas e desafios, e conecta você a uma comunidade de pessoas com os mesmos objetivos.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Nosso objetivo é simples: <span className="text-foreground font-medium">tornar sua jornada fitness mais organizada, 
          motivadora e eficiente</span> — tudo em um só lugar.
        </p>
      </div>

      {/* Features Grid */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm text-foreground">Principais Funcionalidades</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-primary/10">
                <f.icon className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{f.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Tips */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <h2 className="font-semibold text-sm text-foreground">💡 Dicas Rápidas</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold mt-0.5">1.</span>
            <span>Comece pelo <span className="text-foreground font-medium">onboarding</span> para configurar seu perfil e objetivo.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold mt-0.5">2.</span>
            <span>Gere seu <span className="text-foreground font-medium">plano de treino</span> e <span className="text-foreground font-medium">dieta</span> na aba correspondente.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold mt-0.5">3.</span>
            <span>Registre seus treinos e refeições para acumular <span className="text-foreground font-medium">XP e subir no ranking</span>.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold mt-0.5">4.</span>
            <span>Acompanhe sua evolução nas abas de <span className="text-foreground font-medium">análise</span> e <span className="text-foreground font-medium">acompanhamento corporal</span>.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold mt-0.5">5.</span>
            <span>Ative <span className="text-foreground font-medium">módulos extras</span> nas configurações para expandir seu menu.</span>
          </li>
        </ul>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground pb-4">
        Fit-Pulse · Feito para sua evolução 💚
      </p>
    </div>
  );
};

export default SobreFitUnitrix;
