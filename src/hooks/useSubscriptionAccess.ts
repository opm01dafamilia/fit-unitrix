import { useAuth } from "@/contexts/AuthContext";
import type { SubscriptionStatus } from "@/hooks/useSSOAuth";

/**
 * Centralised subscription access control.
 *
 * STATUS RULES:
 *  active / trial / lifetime → full access
 *  pending                   → read-only (show warning, block writes)
 *  canceled / expired        → limited visual access, block main features
 */
export const useSubscriptionAccess = () => {
  const { subscriptionStatus } = useAuth();

  const hasFullAccess = subscriptionStatus === "active"
    || subscriptionStatus === "trial"
    || subscriptionStatus === "lifetime";

  const isReadOnly = subscriptionStatus === "pending";

  const isBlocked = subscriptionStatus === "canceled"
    || subscriptionStatus === "expired";

  /** Can the user perform write operations (save workout, update diet, etc.)? */
  const canWrite = hasFullAccess;

  /** Can the user access main features (treino, dieta, desafios, etc.)? */
  const canAccessFeatures = hasFullAccess || isReadOnly;

  return {
    subscriptionStatus,
    hasFullAccess,
    isReadOnly,
    isBlocked,
    canWrite,
    canAccessFeatures,
  };
};

/** Utility for non-hook contexts */
export const checkAccess = (status: SubscriptionStatus) => {
  const full = status === "active" || status === "trial" || status === "lifetime";
  return {
    hasFullAccess: full,
    isReadOnly: status === "pending",
    isBlocked: status === "canceled" || status === "expired",
    canWrite: full,
    canAccessFeatures: full || status === "pending",
  };
};
