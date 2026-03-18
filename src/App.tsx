import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

import { lazy, Suspense, useEffect, useState } from "react";
import AppLayout from "./components/AppLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import { useSSOAuth, redirectToEcosystem } from "./hooks/useSSOAuth";

// Lazy load all pages for code splitting
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
const Auth = lazy(() => import("./pages/Auth"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));

// GIF preloading removed from app start - now lazy-loaded per page

// Optimized QueryClient with smart caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes cache
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

// Page loading skeleton
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

// Offline banner component with sync status
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

  if (!user) return <Navigate to="/auth" replace />;
  if (profile && !profile.onboarding_completed) return <Navigate to="/onboarding" replace />;

  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    if (profile && !profile.onboarding_completed) return <Navigate to="/onboarding" replace />;
    return <Navigate to="/" replace />;
  }

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

  if (!user) return <Navigate to="/auth" replace />;
  if (profile?.onboarding_completed) return <Navigate to="/" replace />;

  return (
    <Suspense fallback={<PageSkeleton />}>
      <Onboarding />
    </Suspense>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <OfflineBanner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<PublicRoute><Suspense fallback={<PageSkeleton />}><Auth /></Suspense></PublicRoute>} />
            <Route path="/reset-password" element={<Suspense fallback={<PageSkeleton />}><ResetPassword /></Suspense>} />
            <Route path="/invite/:code" element={<Suspense fallback={<PageSkeleton />}><InviteLanding /></Suspense>} />
            <Route path="/onboarding" element={<OnboardingRoute />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<ErrorBoundary><Suspense fallback={<PageSkeleton />}><Dashboard /></Suspense></ErrorBoundary>} />
              <Route path="/treino" element={<ErrorBoundary><Suspense fallback={<PageSkeleton />}><Treino /></Suspense></ErrorBoundary>} />
              <Route path="/dieta" element={<ErrorBoundary><Suspense fallback={<PageSkeleton />}><Dieta /></Suspense></ErrorBoundary>} />
              <Route path="/acompanhamento" element={<ErrorBoundary><Suspense fallback={<PageSkeleton />}><Acompanhamento /></Suspense></ErrorBoundary>} />
              <Route path="/metas" element={<ErrorBoundary><Suspense fallback={<PageSkeleton />}><Metas /></Suspense></ErrorBoundary>} />
              <Route path="/historico" element={<ErrorBoundary><Suspense fallback={<PageSkeleton />}><Historico /></Suspense></ErrorBoundary>} />
              <Route path="/conquistas" element={<ErrorBoundary><Suspense fallback={<PageSkeleton />}><Conquistas /></Suspense></ErrorBoundary>} />
              <Route path="/biblioteca" element={<ErrorBoundary><Suspense fallback={<PageSkeleton />}><Biblioteca /></Suspense></ErrorBoundary>} />
              <Route path="/analise" element={<ErrorBoundary><Suspense fallback={<PageSkeleton />}><AnaliseCorporal /></Suspense></ErrorBoundary>} />
              <Route path="/ranking" element={<ErrorBoundary><Suspense fallback={<PageSkeleton />}><Ranking /></Suspense></ErrorBoundary>} />
              <Route path="/comunidade" element={<ErrorBoundary><Suspense fallback={<PageSkeleton />}><Comunidade /></Suspense></ErrorBoundary>} />
              <Route path="/desafios" element={<ErrorBoundary><Suspense fallback={<PageSkeleton />}><Desafios /></Suspense></ErrorBoundary>} />
              <Route path="/temporadas" element={<ErrorBoundary><Suspense fallback={<PageSkeleton />}><Temporadas /></Suspense></ErrorBoundary>} />
              <Route path="/minha-liga" element={<ErrorBoundary><Suspense fallback={<PageSkeleton />}><MinhaLiga /></Suspense></ErrorBoundary>} />
              <Route path="/evolucao" element={<ErrorBoundary><Suspense fallback={<PageSkeleton />}><EvolucaoTreino /></Suspense></ErrorBoundary>} />
              <Route path="/evolucao-alimentar" element={<ErrorBoundary><Suspense fallback={<PageSkeleton />}><EvolucaoAlimentar /></Suspense></ErrorBoundary>} />
              <Route path="/convites" element={<ErrorBoundary><Suspense fallback={<PageSkeleton />}><Convites /></Suspense></ErrorBoundary>} />
              <Route path="/amigos" element={<ErrorBoundary><Suspense fallback={<PageSkeleton />}><Amigos /></Suspense></ErrorBoundary>} />
              <Route path="/perfil" element={<ErrorBoundary><Suspense fallback={<PageSkeleton />}><Perfil /></Suspense></ErrorBoundary>} />
              <Route path="/perfil-fitness" element={<ErrorBoundary><Suspense fallback={<PageSkeleton />}><PerfilFitness /></Suspense></ErrorBoundary>} />
              <Route path="/configuracoes" element={<ErrorBoundary><Suspense fallback={<PageSkeleton />}><Configuracoes /></Suspense></ErrorBoundary>} />
              <Route path="/score-fitness" element={<ErrorBoundary><Suspense fallback={<PageSkeleton />}><ScoreFitness /></Suspense></ErrorBoundary>} />
            </Route>
            <Route path="*" element={<Suspense fallback={<PageSkeleton />}><NotFound /></Suspense>} />
          </Routes>
          
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
