import { NavLink, Outlet, Navigate } from "react-router-dom";
import { LayoutDashboard, Users, CreditCard, Activity, Settings, LogOut, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import FitPulseLogo from "@/components/FitPulseLogo";

const adminNav = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/admin/usuarios", icon: Users, label: "Usuários" },
  { to: "/admin/assinaturas", icon: CreditCard, label: "Assinaturas" },
  { to: "/admin/webhook", icon: Activity, label: "Webhook" },
  { to: "/admin/configuracoes", icon: Settings, label: "Configurações" },
];

const AdminLayout = () => {
  const { user, loading, signOut } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 border-r border-border/50 bg-card flex flex-col shrink-0">
        <div className="px-6 py-5 border-b border-border/50 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <span className="font-display font-bold text-sm">Admin</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {adminNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-border/50 space-y-2">
          <NavLink to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all">
            <FitPulseLogo size="xs" />
            <span>Voltar ao App</span>
          </NavLink>
          <button onClick={signOut} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-destructive transition-all w-full">
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
