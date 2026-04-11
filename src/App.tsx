import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";

import { lazy, Suspense, useEffect, useState } from "react";
import AppLayout from "./components/AppLayout";
import ErrorBoundary from "./components/ErrorBoundary";

// Lazy load all pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Treino = lazy(() => import("./pages/Treino"));
const Dieta = lazy(() => import("./pages/Dieta"));
const Acompanhamento = lazy(() => import("./pages/Acompanhamento"));
const Metas = lazy(() => import("./pages/Metas"));
const Perfil = lazy(() => import("./pages/Perfil"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const Historico = lazy(() => import("./pages/Historico"));
const Conquistas = lazy(() => import("./pages/Conquistas"));
const Biblioteca = lazy(() => import("./pages/Biblioteca"));
const AnaliseCorporal = lazy(() => import("./pages/AnaliseCorporal"));
const Ranking = lazy(() => import("./pages/Ranking"));
const Comunidade = lazy(() => import("./pages/Comunidade"));
const Desafios = lazy(() => import("./pages/Desafios"));
const Temporadas = lazy(() => import("./pages/Temporadas"));
const Convites = lazy(() => import("./pages/Convites"));
const Amigos = lazy(() => import("./pages/Amigos"));
const InviteLanding = lazy(() => import("./pages/InviteLanding"));
const PerfilFitness = lazy(() => import("./pages/PerfilFitness"));
const MinhaLiga = lazy(() => import("./pages/MinhaLiga"));
const EvolucaoTreino = lazy(() => import("./pages/EvolucaoTreino"));
const EvolucaoAlimentar = lazy(() => import("./pages/EvolucaoAlimentar"));
const ScoreFitness = lazy(() => import("./pages/ScoreFitness"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Personal = lazy(() => import("./pages/Personal"));
const SobreFitUnitrix = lazy(() => import("./pages/SobreFitPulse"));
const Planos = lazy(() => import("./pages/Planos"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Landing = lazy(() => import("./pages/Landing"));

// Admin pages
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminSubscriptions = lazy(() => import("./pages/admin/AdminSubscriptions"));
const AdminWebhook = lazy(() => import("./pages/admin/AdminWebhook"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

const PageSkeleton = () => (
  <div className="space-y-6 animate-pulse p-5 lg:p-8">
    <div className="h-8 w-48 bg-secondary/60 rounded-lg" />
    <div className="h-4 w-32 bg-secondary/40 rounded" />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-24 bg-secondary/40 rounded-2xl" />
      ))}
    </div>
    <div className="h-64 bg-secondary/30 rounded-2xl" />
  </div>
);

const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const updatePending = () => {
      try {
        const queue = JSON.parse(localStorage.getItem("fitpulse_sync_queue") || "[]");
        setPendingCount(queue.length);
      } catch { setPendingCount(0); }
    };
    updatePending();
    window.addEventListener("syncQueueChanged", updatePending);

    const handleSyncDone = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.success > 0) {
        setSyncMessage(`✅ ${detail.success} ação(ões) sincronizada(s)`);
        setTimeout(() => setSyncMessage(null), 3000);
      }
    };
    window.addEventListener("syncCompleted", handleSyncDone);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("syncQueueChanged", updatePending);
      window.removeEventListener("syncCompleted", handleSyncDone);
    };
  }, []);

  if (syncMessage) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] bg-primary/90 text-primary-foreground text-center py-2 px-4 text-xs font-medium backdrop-blur-sm animate-in slide-in-from-top duration-300">
        {syncMessage}
      </div>
    );
  }

  if (!isOffline && pendingCount === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-muted/95 text-muted-foreground text-center py-2 px-4 text-xs font-medium backdrop-blur-sm border-b border-border/50">
      {isOffline
        ? `📡 Modo offline${pendingCount > 0 ? ` — ${pendingCount} ação(ões) pendente(s)` : " — dados em cache"}`
        : `🔄 Sincronizando ${pendingCount} ação(ões)...`}
    </div>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (profile && !profile.onboarding_completed) return <Navigate to="/onboarding" replace />;

  return <>{children}</>;
};

const OnboardingRoute = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (profile?.onboarding_completed) return <Navigate to="/app" replace />;

  return (
    <Suspense fallback={<PageSkeleton />}>
      <Onboarding />
    </Suspense>
  );
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (user) return <Navigate to="/app" replace />;
  return <>{children}</>;
};

// Landing route: if logged in, redirect to /app
const LandingRoute = () => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (user) return <Navigate to="/app" replace />;
  return <Suspense fallback={<PageSkeleton />}><Landing /></Suspense>;
};

const S = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary><Suspense fallback={<PageSkeleton />}>{children}</Suspense></ErrorBoundary>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem storageKey="fitpulse-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <OfflineBanner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Landing */}
              <Route path="/" element={<LandingRoute />} />

              {/* Public auth routes */}
              <Route path="/login" element={<PublicRoute><Suspense fallback={<PageSkeleton />}><Login /></Suspense></PublicRoute>} />
              <Route path="/signup" element={<PublicRoute><Suspense fallback={<PageSkeleton />}><Signup /></Suspense></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><Suspense fallback={<PageSkeleton />}><Signup /></Suspense></PublicRoute>} />
              <Route path="/forgot-password" element={<Suspense fallback={<PageSkeleton />}><ForgotPassword /></Suspense>} />
              <Route path="/reset-password" element={<Suspense fallback={<PageSkeleton />}><ResetPassword /></Suspense>} />
              <Route path="/invite/:code" element={<Suspense fallback={<PageSkeleton />}><InviteLanding /></Suspense>} />
              <Route path="/onboarding" element={<OnboardingRoute />} />

              {/* App routes (protected) */}
              <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route index element={<S><Dashboard /></S>} />
                <Route path="treino" element={<S><Treino /></S>} />
                <Route path="dieta" element={<S><Dieta /></S>} />
                <Route path="acompanhamento" element={<S><Acompanhamento /></S>} />
                <Route path="metas" element={<S><Metas /></S>} />
                <Route path="historico" element={<S><Historico /></S>} />
                <Route path="conquistas" element={<S><Conquistas /></S>} />
                <Route path="biblioteca" element={<S><Biblioteca /></S>} />
                <Route path="analise" element={<S><AnaliseCorporal /></S>} />
                <Route path="ranking" element={<S><Ranking /></S>} />
                <Route path="comunidade" element={<S><Comunidade /></S>} />
                <Route path="desafios" element={<S><Desafios /></S>} />
                <Route path="temporadas" element={<S><Temporadas /></S>} />
                <Route path="minha-liga" element={<S><MinhaLiga /></S>} />
                <Route path="evolucao" element={<S><EvolucaoTreino /></S>} />
                <Route path="evolucao-alimentar" element={<S><EvolucaoAlimentar /></S>} />
                <Route path="convites" element={<S><Convites /></S>} />
                <Route path="amigos" element={<S><Amigos /></S>} />
                <Route path="perfil" element={<S><Perfil /></S>} />
                <Route path="perfil-fitness" element={<S><PerfilFitness /></S>} />
                <Route path="configuracoes" element={<S><Configuracoes /></S>} />
                <Route path="score-fitness" element={<S><ScoreFitness /></S>} />
                <Route path="personal" element={<S><Personal /></S>} />
                <Route path="sobre" element={<S><SobreFitUnitrix /></S>} />
                <Route path="planos" element={<S><Planos /></S>} />
              </Route>

              {/* Admin routes */}
              <Route path="/admin" element={<Suspense fallback={<PageSkeleton />}><AdminLayout /></Suspense>}>
                <Route index element={<Suspense fallback={<PageSkeleton />}><AdminDashboard /></Suspense>} />
                <Route path="usuarios" element={<Suspense fallback={<PageSkeleton />}><AdminUsers /></Suspense>} />
                <Route path="assinaturas" element={<Suspense fallback={<PageSkeleton />}><AdminSubscriptions /></Suspense>} />
                <Route path="webhook" element={<Suspense fallback={<PageSkeleton />}><AdminWebhook /></Suspense>} />
                <Route path="configuracoes" element={<Suspense fallback={<PageSkeleton />}><AdminSettings /></Suspense>} />
              </Route>

              <Route path="*" element={<Suspense fallback={<PageSkeleton />}><NotFound /></Suspense>} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
