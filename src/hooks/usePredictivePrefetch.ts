import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { onRouteChange } from "@/lib/predictivePrefetchEngine";

/**
 * Hook that tracks route changes and triggers predictive prefetching.
 * Place in AppLayout to capture all navigation within protected routes.
 */
export function usePredictivePrefetch() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const prevRoute = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    onRouteChange(prevRoute.current, pathname, user.id);
    prevRoute.current = pathname;
  }, [pathname, user?.id]);
}
