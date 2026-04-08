import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
export type SubscriptionStatus = "active" | "trial" | "pending" | "canceled" | "expired" | "lifetime";

const getStoredSubscriptionStatus = (): SubscriptionStatus => {
  return (localStorage.getItem("fitpulse_sub_status") as SubscriptionStatus) || "active";
};

type Profile = {
  id: string;
  user_id: string;
  full_name: string | null;
  age: number | null;
  gender: string | null;
  height: number | null;
  weight: number | null;
  objective: string | null;
  activity_level: string | null;
  experience_level: string | null;
  training_location: string | null;
  onboarding_completed: boolean;
  privacy_level: string;
  avatar_url: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  friend_code: string | null;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  subscriptionStatus: SubscriptionStatus;
  isPremiumBlocked: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setSubscriptionStatus: (status: SubscriptionStatus) => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  subscriptionStatus: "active",
  isPremiumBlocked: false,
  signOut: async () => {},
  refreshProfile: async () => {},
  setSubscriptionStatus: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>(
    getStoredSubscriptionStatus()
  );

  const isPremiumBlocked = subscriptionStatus === "pending" || subscriptionStatus === "canceled" || subscriptionStatus === "expired";
  // "lifetime" is treated as full access, same as "active"

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    setProfile(data);
  };

  const fetchSubscriptionStatus = async (userId: string) => {
    const { data } = await supabase
      .from("user_subscriptions")
      .select("status, expires_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (data?.status) {
      let status = data.status as SubscriptionStatus;
      // Auto-expire trial if past expiration date
      if (status === "trial" && data.expires_at && new Date(data.expires_at) < new Date()) {
        status = "expired";
      }
      setSubscriptionStatus(status);
      localStorage.setItem("fitpulse_sub_status", status);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
      await fetchSubscriptionStatus(user.id);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
            fetchSubscriptionStatus(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchSubscriptionStatus(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    localStorage.removeItem("fitpulse_sub_status");
  };

  return (
    <AuthContext.Provider value={{
      user, session, profile, loading,
      subscriptionStatus, isPremiumBlocked,
      signOut, refreshProfile, setSubscriptionStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
};
