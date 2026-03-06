import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { 
  LayoutDashboard, Dumbbell, UtensilsCrossed, 
  Activity, Target, Menu, Flame, LogOut, User
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/treino", icon: Dumbbell, label: "Treino" },
  { to: "/dieta", icon: UtensilsCrossed, label: "Dieta" },
  { to: "/acompanhamento", icon: Activity, label: "Corpo" },
  { to: "/metas", icon: Target, label: "Metas" },
];

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, signOut } = useAuth();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen w-64 
        bg-sidebar border-r border-sidebar-border
        flex flex-col transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="flex items-center gap-3 px-6 py-6 border-b border-sidebar-border">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Flame className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-foreground">FitPulse</h1>
            <p className="text-xs text-muted-foreground">Fitness Tracker</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
                ${isActive 
                  ? "bg-primary/10 text-primary glow-border" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div className="p-4 mx-3 mb-2 rounded-xl bg-secondary border border-border">
          <div className="flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-primary" />
            <p className="text-sm font-medium truncate">{profile?.full_name || "Usuário"}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            {profile?.objective === "emagrecer" ? "Emagrecimento" : 
             profile?.objective === "massa" ? "Ganho de Massa" : 
             profile?.objective === "condicionamento" ? "Condicionamento" : 
             profile?.objective === "manter" ? "Manutenção" : "—"}
          </p>
        </div>

        <button
          onClick={signOut}
          className="flex items-center gap-2 px-7 py-4 text-sm text-muted-foreground hover:text-destructive transition-colors border-t border-sidebar-border"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 min-h-screen">
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-background/80 backdrop-blur-xl border-b border-border lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-foreground">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-primary" />
            <span className="font-display font-bold">FitPulse</span>
          </div>
          <div className="w-6" />
        </header>
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
