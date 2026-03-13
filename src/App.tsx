import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

import { lazy, Suspense, useEffect, useState } from "react";
import AppLayout from "./components/AppLayout";
import ErrorBoundary from "./components/ErrorBoundary";

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
const PerfilFitness = lazy(() => import("./pages/PerfilFitness"));
const Auth = lazy(() => import("./pages/Auth"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Preload exercise GIFs in background
preloadExerciseGifs();

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

// Offline banner component
const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-destructive/90 text-destructive-foreground text-center py-2 px-4 text-xs font-medium backdrop-blur-sm">
      📡 Modo offline — dados podem não estar atualizados
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
            <Route path="/onboarding" element={<OnboardingRoute />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<Suspense fallback={<PageSkeleton />}><Dashboard /></Suspense>} />
              <Route path="/treino" element={<Suspense fallback={<PageSkeleton />}><Treino /></Suspense>} />
              <Route path="/dieta" element={<Suspense fallback={<PageSkeleton />}><Dieta /></Suspense>} />
              <Route path="/acompanhamento" element={<Suspense fallback={<PageSkeleton />}><Acompanhamento /></Suspense>} />
              <Route path="/metas" element={<Suspense fallback={<PageSkeleton />}><Metas /></Suspense>} />
              <Route path="/historico" element={<Suspense fallback={<PageSkeleton />}><Historico /></Suspense>} />
              <Route path="/conquistas" element={<Suspense fallback={<PageSkeleton />}><Conquistas /></Suspense>} />
              <Route path="/biblioteca" element={<Suspense fallback={<PageSkeleton />}><Biblioteca /></Suspense>} />
              <Route path="/analise" element={<Suspense fallback={<PageSkeleton />}><AnaliseCorporal /></Suspense>} />
              <Route path="/ranking" element={<Suspense fallback={<PageSkeleton />}><Ranking /></Suspense>} />
              <Route path="/comunidade" element={<Suspense fallback={<PageSkeleton />}><Comunidade /></Suspense>} />
              <Route path="/perfil" element={<Suspense fallback={<PageSkeleton />}><Perfil /></Suspense>} />
              <Route path="/perfil-fitness" element={<Suspense fallback={<PageSkeleton />}><PerfilFitness /></Suspense>} />
              <Route path="/configuracoes" element={<Suspense fallback={<PageSkeleton />}><Configuracoes /></Suspense>} />
            </Route>
            <Route path="*" element={<Suspense fallback={<PageSkeleton />}><NotFound /></Suspense>} />
          </Routes>
          
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
