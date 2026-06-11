import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { ExchangeRate } from "@/utils/fx";

export type { ExchangeRate };

export const useExchangeRates = () => {
  return useQuery({
    queryKey: ["exchange_rates"],
    queryFn: async (): Promise<ExchangeRate[]> => {
      const { data, error } = await supabase
        .from("exchange_rates")
        .select("id, base_code, quote_code, bid, ask, mid, is_active, updated_at")
        .order("base_code", { ascending: true })
        .order("quote_code", { ascending: true });
      if (error) throw error;
      return ((data || []) as any[]).map((r) => ({
        id: r.id,
        base_code: r.base_code,
        quote_code: r.quote_code,
        bid: Number(r.bid),
        ask: Number(r.ask),
        mid: Number(r.mid),
        is_active: r.is_active,
      }));
    },
    staleTime: 60 * 1000,
  });
};

export interface ExchangeRateInput {
  base_code: string;
  quote_code: string;
  bid: number;
  ask: number;
  is_active?: boolean;
}

export const useCreateExchangeRate = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: ExchangeRateInput) => {
      const { data, error } = await supabase
        .from("exchange_rates")
        .insert({
          base_code: input.base_code,
          quote_code: input.quote_code,
          bid: input.bid,
          ask: input.ask,
          is_active: input.is_active ?? true,
          created_by: user?.id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exchange_rates"] }),
  });
};

export const useUpdateExchangeRate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & Partial<ExchangeRateInput>) => {
      const { data, error } = await supabase
        .from("exchange_rates")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exchange_rates"] }),
  });
};

export const useDeleteExchangeRate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exchange_rates").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exchange_rates"] }),
  });
};
