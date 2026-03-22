import { Gift, Lock } from "lucide-react";

const Convites = () => {
  return (
    <div className="space-y-7 animate-slide-up">
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight">Convites</h1>
        <p className="text-muted-foreground text-sm mt-1">Convide amigos e ganhe XP social</p>
      </div>

      <div className="glass-card p-8 lg:p-12 flex flex-col items-center justify-center text-center min-h-[340px]">
        <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-5">
          <Lock className="w-7 h-7 text-muted-foreground" />
        </div>
        <h2 className="font-display font-bold text-lg text-foreground mb-2">
          Área temporariamente indisponível
        </h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          A seção de convites está em manutenção. Em breve você poderá convidar amigos e ganhar XP novamente.
        </p>
        <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground/70">
          <Gift className="w-4 h-4" />
          <span>Seus dados e convites anteriores estão seguros</span>
        </div>
      </div>
    </div>
  );
};

export default Convites;
