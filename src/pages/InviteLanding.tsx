import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Flame, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const InviteLanding = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [valid, setValid] = useState<boolean | null>(null);

  useEffect(() => {
    const checkCode = async () => {
      if (!code) { setValid(false); return; }
      const { data } = await supabase
        .from("user_invites")
        .select("id")
        .eq("invite_code", code)
        .limit(1);
      setValid(!!(data && data.length > 0));
      // Store invite code for post-signup attribution
      localStorage.setItem("fitpulse_invite_code", code);
    };
    checkCode();
  }, [code]);

  if (valid === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-[0.04] pointer-events-none"
           style={{ background: 'radial-gradient(circle, hsl(152 69% 46%), transparent 60%)' }} />
      
      <div className="w-full max-w-[400px] relative z-10 text-center">
        <div className="w-20 h-20 rounded-3xl mb-6 mx-auto flex items-center justify-center shadow-lg shadow-primary/20"
             style={{ background: 'linear-gradient(135deg, hsl(152 69% 46%), hsl(168 80% 38%))' }}>
          <Flame className="w-10 h-10 text-primary-foreground" />
        </div>

        <h1 className="font-display text-3xl font-bold tracking-tight mb-2">FitPulse</h1>
        
        {valid ? (
          <>
            <p className="text-muted-foreground text-sm mb-6">
              Você foi convidado para o FitPulse! 🎉<br />
              Acesse pelo ecossistema para começar.
            </p>
            <Button onClick={() => window.location.href = "https://eco-platform-hub.lovable.app"} className="w-full h-12 text-sm font-medium">
              Acessar pelo Ecossistema
            </Button>
          </>
        ) : (
          <>
            <p className="text-muted-foreground text-sm mb-6">
              Link de convite inválido ou expirado.
            </p>
            <Button onClick={() => window.location.href = "https://eco-platform-hub.lovable.app"} variant="outline" className="w-full">
              Ir para o Ecossistema
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default InviteLanding;
