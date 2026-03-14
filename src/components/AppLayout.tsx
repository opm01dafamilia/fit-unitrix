import { useState, useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { 
  LayoutDashboard, Dumbbell, UtensilsCrossed, 
  Menu, Flame, LogOut, User, X, 
  History, Settings, UserCheck, Trophy, Crown, Users, Target, Medal
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getMenuPreferences, SOCIAL_ROUTES } from "@/lib/menuPreferences";
import NotificationCenter from "@/components/NotificationCenter";

const iconMap: Record<string, any> = {
  Trophy, Crown, Users, Target, Flame, Medal,
};

const coreNavItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/treino", icon: Dumbbell, label: "Plano Ativo" },
  { to: "/dieta", icon: UtensilsCrossed, label: "Dieta" },
  { to: "/historico", icon: History, label: "Histórico" },
  { to: "/perfil-fitness", icon: UserCheck, label: "Perfil Fitness" },
];

const secondaryNavItems = [
  { to: "/perfil", icon: User, label: "Perfil" },
  { to: "/configuracoes", icon: Settings, label: "Configurações" },
];

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, signOut } = useAuth();
  const [pinnedItems, setPinnedItems] = useState<string[]>([]);

  useEffect(() => {
    const prefs = getMenuPreferences();
    setPinnedItems(prefs.pinnedSocialItems);
  }, []);

  // Listen for storage changes (from settings page)
  useEffect(() => {
    const handler = () => {
      const prefs = getMenuPreferences();
      setPinnedItems(prefs.pinnedSocialItems);
    };
    window.addEventListener("menuPrefsChanged", handler);
    return () => window.removeEventListener("menuPrefsChanged", handler);
  }, []);

  const pinnedNavItems = SOCIAL_ROUTES
    .filter(r => pinnedItems.includes(r.to))
    .map(r => ({ to: r.to, icon: iconMap[r.icon] || Target, label: r.label }));

  const allNavItems = [...coreNavItems, ...pinnedNavItems, ...secondaryNavItems];

  const objectiveLabel = profile?.objective === "emagrecer" ? "Emagrecimento" : 
    profile?.objective === "massa" ? "Ganho de Massa" : 
    profile?.objective === "condicionamento" ? "Condicionamento" : 
    profile?.objective === "manter" ? "Manutenção" : "—";

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/60 backdrop-blur-md z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen w-[272px]
        bg-sidebar border-r border-sidebar-border
        flex flex-col transition-transform duration-300 ease-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* Brand */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" 
                 style={{ background: 'linear-gradient(135deg, hsl(152 69% 46%), hsl(168 80% 38%))' }}>
              <Flame className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-foreground tracking-tight">FitPulse</h1>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-widest">Pro Fitness</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="hidden lg:block">
              <NotificationCenter />
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-5 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground px-3 mb-3">Menu</p>
          {coreNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200
                ${isActive 
                  ? "bg-primary/10 text-primary border border-primary/15 shadow-[0_0_16px_-4px_hsl(152_69%_46%_/_0.15)]" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60 border border-transparent"
                }`
              }
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </NavLink>
          ))}

          {/* Pinned Social Items */}
          {pinnedNavItems.length > 0 && (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground px-3 mt-5 mb-3">Social</p>
              {pinnedNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200
                    ${isActive 
                      ? "bg-primary/10 text-primary border border-primary/15 shadow-[0_0_16px_-4px_hsl(152_69%_46%_/_0.15)]" 
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60 border border-transparent"
                    }`
                  }
                >
                  <item.icon className="w-[18px] h-[18px]" />
                  {item.label}
                </NavLink>
              ))}
            </>
          )}

          {/* Secondary */}
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground px-3 mt-5 mb-3">Conta</p>
          {secondaryNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200
                ${isActive 
                  ? "bg-primary/10 text-primary border border-primary/15 shadow-[0_0_16px_-4px_hsl(152_69%_46%_/_0.15)]" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60 border border-transparent"
                }`
              }
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User Card */}
        <div className="mx-4 mb-3">
          <div className="p-3.5 rounded-xl bg-secondary/60 border border-border/50">
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                   style={{ background: 'linear-gradient(135deg, hsl(152 69% 46% / 0.15), hsl(168 80% 38% / 0.1))' }}>
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{profile?.full_name || "Usuário"}</p>
                <p className="text-[11px] text-muted-foreground">{objectiveLabel}</p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={signOut}
          className="flex items-center gap-2.5 px-7 py-4 text-[13px] text-muted-foreground hover:text-destructive transition-colors border-t border-sidebar-border"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen pb-16 lg:pb-0">
        <header className="sticky top-0 z-30 flex items-center justify-between px-5 py-3.5 bg-background/70 backdrop-blur-xl border-b border-border/50 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-foreground p-1">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, hsl(152 69% 46%), hsl(168 80% 38%))' }}>
              <Flame className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-sm">FitPulse</span>
          </div>
          <NotificationCenter />
        </header>
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-xl border-t border-border/50 lg:hidden safe-area-pb">
        <div className="flex items-center justify-around px-2 py-1.5">
          {[
            { to: "/", icon: LayoutDashboard, label: "Home" },
            { to: "/treino", icon: Dumbbell, label: "Treino" },
            { to: "/dieta", icon: UtensilsCrossed, label: "Dieta" },
            { to: "/historico", icon: History, label: "Histórico" },
            { to: "/perfil-fitness", icon: UserCheck, label: "Perfil" },
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all
                ${isActive ? "text-primary" : "text-muted-foreground"}`
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default AppLayout;
