import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flame, Mail, Lock, User, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

type AuthMode = "login" | "signup" | "forgot";

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

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
    else handleForgotPassword();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Subtle background glow */}
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
                <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Carregando...
              </span>
            ) : mode === "login" ? "Entrar" : mode === "signup" ? "Criar Conta" : "Enviar Email"}
          </Button>

          {mode !== "forgot" && (
            <p className="text-center text-xs text-muted-foreground">
              {mode === "login" ? "Não tem conta? " : "Já tem conta? "}
              <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")} className="text-primary hover:underline font-medium">
                {mode === "login" ? "Cadastre-se" : "Entrar"}
              </button>
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default Auth;
