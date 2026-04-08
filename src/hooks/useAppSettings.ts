import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useAppSettings = () => {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("app_settings" as any)
        .select("key, value");
      if (data) {
        const map: Record<string, any> = {};
        (data as any[]).forEach((r: any) => { map[r.key] = r.value; });
        setSettings(map);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const isPersonalEnabled = settings["personal_enabled"] === true;

  const toggleSetting = async (key: string, value: any) => {
    const { error } = await supabase
      .from("app_settings" as any)
      .update({ value, updated_at: new Date().toISOString() } as any)
      .eq("key", key);
    if (!error) {
      setSettings((prev) => ({ ...prev, [key]: value }));
    }
    return !error;
  };

  return { settings, loading, isPersonalEnabled, toggleSetting };
};
