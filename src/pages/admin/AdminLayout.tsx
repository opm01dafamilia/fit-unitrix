import { NavLink, Outlet, Navigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, CreditCard, Activity, Settings, LogOut, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import FitPulseLogo from "@/components/FitPulseLogo";

const allAdminNav = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true, viewerAccess: true },
  { to: "/admin/usuarios", icon: Users, label: "Usuários", viewerAccess: false },
  { to: "/admin/assinaturas", icon: CreditCard, label: "Assinaturas", viewerAccess: true },
  { to: "/admin/webhook", icon: Activity, label: "Webhook", viewerAccess: false },
  { to: "/admin/configuracoes", icon: Settings, label: "Configurações", viewerAccess: false },
];

// Routes accessible by admin_viewer
const viewerAllowedPaths = ["/admin", "/admin/assinaturas"];

const AdminLayout = () => {
  const { user, loading, signOut } = useAuth();
  const { isAdmin, isAdminMaster, isAdminViewer, loading: roleLoading } = useUserRole();
  const location = useLocation();

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) return <Navigate to="/login" replace />;

  // Block admin_viewer from accessing restricted routes
  if (isAdminViewer && !isAdminMaster) {
    const currentPath = location.pathname.replace(/\/$/, "") || "/admin";
    if (!viewerAllowedPaths.includes(currentPath)) {
      return <Navigate to="/admin" replace />;
    }
  }

  const visibleNav = isAdminMaster
    ? allAdminNav
    : allAdminNav.filter((item) => item.viewerAccess);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 border-r border-border/50 bg-card flex flex-col shrink-0">
        <div className="px-6 py-5 border-b border-border/50 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <span className="font-display font-bold text-sm">Admin</span>
          {isAdminViewer && !isAdminMaster && (
            <span className="ml-auto text-[10px] font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">Visualização</span>
          )}
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {visibleNav.map((item) => (
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
        <Outlet context={{ isAdminMaster, isAdminViewer }} />
      </main>
    </div>
  );
};

export default AdminLayout;
