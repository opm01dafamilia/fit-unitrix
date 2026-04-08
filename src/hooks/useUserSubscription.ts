import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type SubscriptionDetail = {
  id: string;
  status: string;
  plan_type: string;
  started_at: string;
  expires_at: string | null;
  updated_at: string;
} | null;

export const useUserSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionDetail>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("user_subscriptions")
        .select("id, status, plan_type, started_at, expires_at, updated_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      setSubscription(data ?? null);
      setLoading(false);
    };

    fetch();
  }, [user]);

  const isActive = subscription?.status === "active" || subscription?.status === "trial" || subscription?.status === "lifetime";
  const isBlocked = subscription?.status === "canceled" || subscription?.status === "expired" || subscription?.status === "refunded" || subscription?.status === "chargedback";
  const isPending = subscription?.status === "pending";

  return { subscription, loading, isActive, isBlocked, isPending };
};
