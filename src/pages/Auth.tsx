import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flame, Mail, Lock, User, ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "@/components/ui/sonner";

type AuthMode = "welcome" | "login" | "signup" | "forgot";

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("welcome");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSocialLogin = async (provider: "google" | "apple") => {
    setSocialLoading(provider);
    try {
      const { error } = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (error) {
        toast.error(`Erro ao entrar com ${provider === "google" ? "Google" : "Apple"}`);
      }
    } catch {
      toast.error("Erro ao iniciar login social");
    } finally {
      setSocialLoading(null);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(error.message);
    else navigate("/");
  };

  const handleSignup = async () => {
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Conta criada! Verifique seu email para confirmar.");
  };

  const handleForgotPassword = async () => {
    if (!email) { toast.error("Informe seu email"); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Email de recuperação enviado!"); setMode("login"); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") handleLogin();
    else if (mode === "signup") handleSignup();
    else if (mode === "forgot") handleForgotPassword();
  };

  // Welcome / Landing screen
  if (mode === "welcome") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background effects */}
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-[0.04] pointer-events-none"
             style={{ background: 'radial-gradient(circle, hsl(152 69% 46%), transparent 60%)' }} />
        <div className="fixed top-0 left-0 w-full h-full opacity-[0.02] pointer-events-none"
             style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%2322c55e\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />

        <div className="w-full max-w-[400px] relative z-10 flex flex-col items-center">
          {/* Logo */}
          <div className="w-20 h-20 rounded-3xl mb-6 flex items-center justify-center shadow-lg shadow-primary/20"
               style={{ background: 'linear-gradient(135deg, hsl(152 69% 46%), hsl(168 80% 38%))' }}>
            <Flame className="w-10 h-10 text-primary-foreground" />
          </div>

          <h1 className="font-display text-4xl font-bold tracking-tight mb-2">FitPulse</h1>
          <p className="text-muted-foreground text-sm mb-10 text-center max-w-[280px]">
            Seu treino personalizado, dieta inteligente e acompanhamento completo.
          </p>

          {/* Social buttons */}
          <div className="w-full space-y-3 mb-6">
            <Button
              variant="outline"
              className="w-full h-12 text-sm font-medium gap-3 bg-secondary/50 border-border/50 hover:bg-secondary"
              onClick={() => handleSocialLogin("google")}
              disabled={!!socialLoading}
            >
              {socialLoading === "google" ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Entrar com Google
            </Button>

            <Button
              variant="outline"
              className="w-full h-12 text-sm font-medium gap-3 bg-secondary/50 border-border/50 hover:bg-secondary"
              onClick={() => handleSocialLogin("apple")}
              disabled={!!socialLoading}
            >
              {socialLoading === "apple" ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
              )}
              Entrar com Apple
            </Button>
          </div>

          {/* Divider */}
          <div className="w-full flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">ou</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Email options */}
          <div className="w-full space-y-3">
            <Button
              className="w-full h-12 text-sm font-medium"
              onClick={() => setMode("login")}
            >
              <Mail className="w-4 h-4 mr-2" />
              Entrar com Email
            </Button>

            <Button
              variant="ghost"
              className="w-full h-10 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setMode("signup")}
            >
              Criar conta com email
            </Button>
          </div>

          {/* Terms */}
          <p className="text-[10px] text-muted-foreground text-center mt-8 leading-relaxed max-w-[300px]">
            Ao continuar, você concorda com os{" "}
            <span className="text-primary cursor-pointer hover:underline">Termos de Uso</span>{" "}
            e a{" "}
            <span className="text-primary cursor-pointer hover:underline">Política de Privacidade</span>{" "}
            do FitPulse.
          </p>
        </div>
      </div>
    );
  }

  // Login / Signup / Forgot forms
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.03] pointer-events-none"
           style={{ background: 'radial-gradient(circle, hsl(152 69% 46%), transparent 70%)' }} />
      
      <div className="w-full max-w-[400px] relative">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, hsl(152 69% 46%), hsl(168 80% 38%))' }}>
            <Flame className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight">FitPulse</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {mode === "login" && "Entre na sua conta"}
            {mode === "signup" && "Crie sua conta gratuita"}
            {mode === "forgot" && "Recupere sua senha"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
          <button type="button" onClick={() => setMode("welcome")} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar
          </button>

          {mode === "forgot" && (
            <button type="button" onClick={() => setMode("login")} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao login
            </button>
          )}

          {mode === "signup" && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Nome completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} className="pl-10 bg-secondary/50 border-border/50" />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 bg-secondary/50 border-border/50" required />
            </div>
          </div>

          {mode !== "forgot" && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 bg-secondary/50 border-border/50" required minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {mode === "login" && (
            <button type="button" onClick={() => setMode("forgot")} className="text-[11px] text-primary hover:underline">
              Esqueceu a senha?
            </button>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Carregando...
              </span>
            ) : mode === "login" ? "Entrar" : mode === "signup" ? "Criar Conta" : "Enviar Email"}
          </Button>

          {mode === "login" && (
            <p className="text-center text-xs text-muted-foreground">
              Não tem conta?{" "}
              <button type="button" onClick={() => setMode("signup")} className="text-primary hover:underline font-medium">
                Cadastre-se
              </button>
            </p>
          )}
          {mode === "signup" && (
            <p className="text-center text-xs text-muted-foreground">
              Já tem conta?{" "}
              <button type="button" onClick={() => setMode("login")} className="text-primary hover:underline font-medium">
                Entrar
              </button>
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default Auth;
