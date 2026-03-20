import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";

import { lazy, Suspense, useEffect, useState, useCallback } from "react";
import AppLayout from "./components/AppLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import { useSSOAuth, redirectToEcosystem, hasSSOParams } from "./hooks/useSSOAuth";

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
const Onboarding = lazy(() => import("./pages/Onboarding"));
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

const AUTO_REDIRECT_SECONDS = 8;

const SSOErrorScreen = ({ ssoError }: { ssoError: string | null }) => {
  const [countdown, setCountdown] = useState(AUTO_REDIRECT_SECONDS);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          redirectToEcosystem();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <span className="text-xl">⚠️</span>
        </div>
        <h1 className="text-base font-semibold text-foreground">Acesse pelo ecossistema para continuar</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {ssoError || "Não conseguimos validar seu acesso automático. Por favor, tente novamente pelo ecossistema."}
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          Redirecionando em <span className="font-semibold text-foreground">{countdown}s</span>…
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex h-9 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Tentar novamente
          </button>
          <button
            type="button"
            onClick={redirectToEcosystem}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Ir ao ecossistema
          </button>
        </div>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading, setSubscriptionStatus } = useAuth();
  const { ssoLoading, ssoFinished, ssoError, subscriptionStatus } = useSSOAuth();
  const hasParams = hasSSOParams();

  useEffect(() => {
    if (subscriptionStatus) {
      setSubscriptionStatus(subscriptionStatus);
    }
  }, [subscriptionStatus, setSubscriptionStatus]);

  // Redirect to ecosystem when no session, no SSO params, and auth is done loading
  useEffect(() => {
    if (!loading && !ssoLoading && ssoFinished && !user && !hasParams) {
      redirectToEcosystem();
    }
  }, [loading, ssoLoading, ssoFinished, user, hasParams]);

  // Still loading auth state or processing SSO token
  if (loading || ssoLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground">
            {ssoLoading ? "Autenticando via SSO..." : "Carregando..."}
          </p>
        </div>
      </div>
    );
  }

  // SSO finished but failed — show error with auto-redirect countdown
  if (!user && hasParams && ssoFinished) {
    return <SSOErrorScreen ssoError={ssoError} />;
  }

  // No user and no SSO params — show redirecting state (effect above handles the redirect)
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground">Redirecionando ao ecossistema...</p>
        </div>
      </div>
    );
  }

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

  if (!user) {
    redirectToEcosystem();
    return null;
  }
  if (profile?.onboarding_completed) return <Navigate to="/" replace />;

  return (
    <Suspense fallback={<PageSkeleton />}>
      <Onboarding />
    </Suspense>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <OfflineBanner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
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
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
