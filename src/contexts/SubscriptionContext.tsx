import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type SubscriptionStatus = "active" | "inactive" | "expired" | "trial";

type Subscription = {
  status: SubscriptionStatus;
  plan_type: string;
  expires_at: string | null;
  started_at: string;
};

type SubscriptionContextType = {
  subscription: Subscription | null;
  loading: boolean;
  isPremium: boolean;
  refreshSubscription: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextType>({
  subscription: null,
  loading: true,
  isPremium: false,
  refreshSubscription: async () => {},
});

export const useSubscription = () => useContext(SubscriptionContext);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = async (userId: string) => {
    const { data } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (data) {
      // Check if expired
      let status = data.status as SubscriptionStatus;
      if (data.expires_at && new Date(data.expires_at) < new Date() && status !== "inactive") {
        status = "expired";
      }
      setSubscription({
        status,
        plan_type: data.plan_type,
        expires_at: data.expires_at,
        started_at: data.started_at,
      });
    } else {
      setSubscription(null);
    }
    setLoading(false);
  };

  const refreshSubscription = async () => {
    if (user) await fetchSubscription(user.id);
  };

  useEffect(() => {
    if (user) {
      fetchSubscription(user.id);
    } else {
      setSubscription(null);
      setLoading(false);
    }
  }, [user]);

  const isPremium = subscription?.status === "active" || subscription?.status === "trial";

  return (
    <SubscriptionContext.Provider value={{ subscription, loading, isPremium, refreshSubscription }}>
      {children}
    </SubscriptionContext.Provider>
  );
};
