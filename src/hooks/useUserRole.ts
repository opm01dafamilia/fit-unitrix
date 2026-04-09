import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "admin" | "personal" | "user" | "admin_master" | "admin_viewer";

export const useUserRole = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }

    const fetchRoles = async () => {
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        if (error) {
          console.error("Error fetching roles:", error);
          setRoles([]);
        } else {
          setRoles((data || []).map((r: any) => r.role as AppRole));
        }
      } catch {
        setRoles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, [user]);

  const hasRole = (role: AppRole) => roles.includes(role);
  
  // admin_master has full access, admin_viewer has read-only access
  // legacy "admin" role is treated as admin_master for backwards compatibility
  const isAdminMaster = hasRole("admin_master") || hasRole("admin");
  const isAdminViewer = hasRole("admin_viewer");
  const isAdmin = isAdminMaster || isAdminViewer;
  const isPersonal = hasRole("personal") || isAdminMaster;

  return { roles, loading, hasRole, isPersonal, isAdmin, isAdminMaster, isAdminViewer };
};
