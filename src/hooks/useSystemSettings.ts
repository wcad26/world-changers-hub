import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useSystemSetting = <T = unknown>(key: string) => {
  return useQuery({
    queryKey: ["system_settings", key],
    queryFn: async (): Promise<T | null> => {
      const { data, error } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", key)
        .maybeSingle();
      if (error) throw error;
      return (data?.value ?? null) as T | null;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useBaseCurrencyCode = () => {
  const q = useSystemSetting<string>("base_currency");
  return { ...q, data: (q.data || "USD") as string };
};

export const useUpsertSystemSetting = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: unknown }) => {
      const { data, error } = await supabase
        .from("system_settings")
        .upsert({ key, value: value as never, updated_by: user?.id ?? null }, { onConflict: "key" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["system_settings", vars.key] });
      // Currency-aware screens depend on base currency
      qc.invalidateQueries({ queryKey: ["system_settings"] });
    },
  });
};
