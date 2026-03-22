import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Flame } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center px-6">
        <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
             style={{ background: 'linear-gradient(135deg, hsl(152 69% 46% / 0.15), hsl(168 80% 38% / 0.08))' }}>
          <Flame className="w-7 h-7 text-primary" />
        </div>
        <h1 className="mb-2 text-5xl font-display font-bold text-foreground">404</h1>
        <p className="mb-6 text-base text-muted-foreground">Página não encontrada</p>
        <a href="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/15 transition-colors">
          Voltar ao início
        </a>
      </div>
    </div>
  );
};

export default NotFound;
