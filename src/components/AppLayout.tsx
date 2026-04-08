import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Dumbbell, UtensilsCrossed, 
  Menu, Flame, LogOut, User, X, 
  History, Settings, UserCheck, Trophy, Crown, Users, Target, Medal,
  BarChart3, Crosshair, TrendingUp, Apple, Gift, BookOpen, Activity, Gauge, ClipboardList, Info, CreditCard
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getMenuPreferences, MODULAR_ROUTES } from "@/lib/menuPreferences";
import NotificationCenter from "@/components/NotificationCenter";
import FitPulseLogo from "@/components/FitPulseLogo";
import BillingBanner from "@/components/BillingBanner";
import { usePredictivePrefetch } from "@/hooks/usePredictivePrefetch";
import { useUserRole } from "@/hooks/useUserRole";
import { resetBodyScrollLock } from "@/lib/bodyScrollLock";
import RouteGuide from "@/components/RouteGuide";

const iconMap: Record<string, any> = {
  Trophy, Crown, Users, Target, Flame, Medal, BookOpen, Activity,
};

const coreNavItems = [
  { to: "/app", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/app/treino", icon: Dumbbell, label: "Plano Ativo" },
  { to: "/app/analise", icon: BarChart3, label: "Análise" },
  { to: "/app/metas", icon: Crosshair, label: "Metas" },
  { to: "/app/dieta", icon: UtensilsCrossed, label: "Dieta" },
  { to: "/app/acompanhamento", icon: TrendingUp, label: "Corpo" },
  { to: "/app/evolucao", icon: TrendingUp, label: "Evolução Treino" },
  { to: "/app/evolucao-alimentar", icon: Apple, label: "Evolução Dieta" },
  { to: "/app/convites", icon: Gift, label: "Convites" },
  { to: "/app/historico", icon: History, label: "Histórico" },
  { to: "/app/perfil-fitness", icon: UserCheck, label: "Perfil Fitness" },
  { to: "/app/score-fitness", icon: Gauge, label: "Score Fitness" },
];

const secondaryNavItems = [
  { to: "/app/planos", icon: CreditCard, label: "Meu Plano" },
  { to: "/app/perfil", icon: User, label: "Perfil" },
  { to: "/app/configuracoes", icon: Settings, label: "Configurações" },
  { to: "/app/sobre", icon: Info, label: "Sobre o Fit-Pulse" },
];

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { profile, signOut, subscriptionStatus } = useAuth();
  const { isPersonal } = useUserRole();
  const [pinnedItems, setPinnedItems] = useState<string[]>([]);
  usePredictivePrefetch();

  useEffect(() => {
    resetBodyScrollLock();
  }, [location.pathname]);

  useEffect(() => {
    const prefs = getMenuPreferences();
    setPinnedItems(prefs.pinnedSocialItems);
  }, []);

  useEffect(() => {
    const handler = () => {
      const prefs = getMenuPreferences();
      setPinnedItems(prefs.pinnedSocialItems);
    };
    window.addEventListener("menuPrefsChanged", handler);
    return () => window.removeEventListener("menuPrefsChanged", handler);
  }, []);

  const pinnedNavItems = MODULAR_ROUTES
    .filter(r => pinnedItems.includes(r.to))
    .map(r => ({ to: `/app${r.to}`, icon: iconMap[r.icon] || Target, label: r.label }));

  const objectiveLabel = profile?.objective === "emagrecer" ? "Emagrecimento" : 
    profile?.objective === "massa" ? "Ganho de Massa" : 
    profile?.objective === "condicionamento" ? "Condicionamento" : 
    profile?.objective === "manter" ? "Manutenção" : "—";

  const renderNavLink = (item: { to: string; icon: any; label: string }) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.to === "/app"}
      onClick={() => setSidebarOpen(false)}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-3 rounded-xl text-[13px] font-medium transition-all duration-200 touch-feedback min-h-[44px]
        ${isActive 
          ? "bg-primary/10 text-primary border border-primary/15 shadow-[0_0_16px_-4px_hsl(152_69%_46%_/_0.15)]" 
          : "text-muted-foreground hover:text-foreground hover:bg-secondary/60 border border-transparent"
        }`
      }
    >
      <item.icon className="w-[18px] h-[18px]" />
      {item.label}
    </NavLink>
  );

  return (
    <div className="flex min-h-screen w-full flex-col bg-background overflow-x-hidden lg:flex-row">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/60 backdrop-blur-md z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen w-[272px]
        bg-sidebar border-r border-sidebar-border
        flex flex-col transition-transform duration-300 ease-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* Brand */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-sidebar-border">
          <FitPulseLogo size="sm" showText showSubtext />
          <div className="flex items-center gap-1">
            <div className="hidden lg:block">
              <NotificationCenter />
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted-foreground hover:text-foreground p-2 -mr-2 touch-target touch-feedback rounded-xl">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-5 space-y-0.5 overflow-y-auto scrollbar-hide">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground px-3 mb-3">Menu Principal</p>
          {coreNavItems.map(renderNavLink)}

          {/* Personal Mode */}
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground px-3 mt-5 mb-3">Personal</p>
          {renderNavLink({ to: "/app/personal", icon: ClipboardList, label: "Personal" })}

          {/* Pinned Modular Items */}
          {pinnedNavItems.length > 0 && (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground px-3 mt-5 mb-3">Módulos</p>
              {pinnedNavItems.map(renderNavLink)}
            </>
          )}

          {/* Secondary */}
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground px-3 mt-5 mb-3">Conta</p>
          {secondaryNavItems.map(renderNavLink)}

          {/* Admin - only for admin users */}
          {isAdmin && (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground px-3 mt-5 mb-3">Admin</p>
              {renderNavLink({ to: "/admin", icon: Shield, label: "Administração" })}
            </>
          )}
        </nav>

        {/* User Card */}
        <div className="mx-4 mb-3">
          <div className="p-3.5 rounded-xl bg-secondary/60 border border-border/50">
            <div className="flex items-center gap-2.5 mb-1.5">
              {profile?.avatar_url ? (
                <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                     style={{ background: 'linear-gradient(135deg, hsl(265 85% 62% / 0.15), hsl(217 90% 58% / 0.1))' }}>
                  <User className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{profile?.full_name || "Usuário"}</p>
                <p className="text-[11px] text-muted-foreground">{objectiveLabel}</p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={signOut}
          className="flex items-center gap-2.5 px-7 py-4 text-[13px] text-muted-foreground hover:text-destructive transition-colors border-t border-sidebar-border touch-target touch-feedback min-h-[48px]"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col min-w-0 min-h-[100dvh] overflow-x-hidden overflow-y-auto overscroll-y-auto app-scroll-area">
        <header className="sticky top-0 z-30 flex items-center justify-between px-5 py-3 bg-background/80 backdrop-blur-2xl border-b border-border/30 lg:hidden safe-area-header">
          <button onClick={() => setSidebarOpen(true)} className="text-foreground p-2 -ml-2 touch-target touch-feedback rounded-xl">
            <Menu className="w-5 h-5" />
          </button>
          <FitPulseLogo size="xs" showText />
          <div className="touch-target flex items-center justify-center">
            <NotificationCenter />
          </div>
        </header>
        <BillingBanner status={subscriptionStatus} />
        <div className="p-4 lg:p-8 mobile-content-safe lg:pb-8 max-w-7xl mx-auto page-enter min-h-0 w-full">
          <RouteGuide />
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-2xl border-t border-border/30 lg:hidden safe-area-bottom-nav keyboard-hide">
        <div className="flex items-center justify-around px-2 pt-1.5 pb-1">
          {[
            { to: "/app", icon: LayoutDashboard, label: "Home" },
            { to: "/app/treino", icon: Dumbbell, label: "Treino" },
            { to: "/app/dieta", icon: UtensilsCrossed, label: "Dieta" },
            { to: "/app/historico", icon: History, label: "Histórico" },
            { to: "/app/perfil-fitness", icon: UserCheck, label: "Perfil" },
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/app"}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[48px] px-3 py-2 rounded-2xl text-[10px] font-medium transition-all duration-200 touch-feedback
                ${isActive 
                  ? "text-primary bg-primary/10 shadow-[0_0_12px_-4px_hsl(152_69%_46%_/_0.2)]" 
                  : "text-muted-foreground"}`
              }
            >
              <item.icon className="w-[22px] h-[22px]" />
              <span className="leading-none">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default AppLayout;
