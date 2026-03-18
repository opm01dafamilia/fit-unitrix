import { useEffect } from "react";
import { redirectToEcosystem } from "@/hooks/useSSOAuth";
import { Flame, Loader2 } from "lucide-react";

const Auth = () => {
  useEffect(() => {
    // Check for SSO params — if not present, redirect to ecosystem
    const params = new URLSearchParams(window.location.search);
    const ssoToken = params.get("sso_token");
    if (!ssoToken) {
      redirectToEcosystem();
    }
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-[0.04] pointer-events-none"
           style={{ background: 'radial-gradient(circle, hsl(152 69% 46%), transparent 60%)' }} />
      
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-20 h-20 rounded-3xl mb-6 flex items-center justify-center shadow-lg shadow-primary/20"
             style={{ background: 'linear-gradient(135deg, hsl(152 69% 46%), hsl(168 80% 38%))' }}>
          <Flame className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight mb-2">FitPulse</h1>
        <p className="text-muted-foreground text-sm mb-8 text-center">
          Redirecionando para o ecossistema...
        </p>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground mt-4">
          Acesse o FitPulse pelo{" "}
          <a href="https://app.platformhub.com" className="text-primary hover:underline font-medium">
            Platform Hub
          </a>
        </p>
      </div>
    </div>
  );
};

export default Auth;
