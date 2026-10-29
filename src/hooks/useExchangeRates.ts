import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import {
  computeRatesFromSpotAndSpreads,
  fetchLiveSpotPrice,
  type ExchangeRate,
} from "@/utils/fx";

export type { ExchangeRate };

export const useExchangeRates = () => {
  return useQuery({
    queryKey: ["exchange_rates"],
    queryFn: async (): Promise<ExchangeRate[]> => {
      const { data, error } = await (supabase as any)
        .from("exchange_rates")
        .select(
          "id, base_code, quote_code, bid, ask, mid, is_active, spot_price, buy_spread_pct, sell_spread_pct, spread_mode, last_api_fetch_at, auto_sync, updated_at"
        )
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
        spot_price: r.spot_price != null ? Number(r.spot_price) : Number(r.mid),
        buy_spread_pct: r.buy_spread_pct != null ? Number(r.buy_spread_pct) : 0,
        sell_spread_pct: r.sell_spread_pct != null ? Number(r.sell_spread_pct) : 0,
        spread_mode: r.spread_mode === "manual" ? "manual" : "percentage",
        last_api_fetch_at: r.last_api_fetch_at ?? null,
        auto_sync: r.auto_sync !== false,
        updated_at: r.updated_at ?? null,
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
  spot_price?: number | null;
  buy_spread_pct?: number;
  sell_spread_pct?: number;
  spread_mode?: "percentage" | "manual";
  last_api_fetch_at?: string | null;
  auto_sync?: boolean;
  is_active?: boolean;
}

export const useCreateExchangeRate = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: ExchangeRateInput) => {
      const { data, error } = await (supabase as any)
        .from("exchange_rates")
        .insert({
          base_code: input.base_code.toUpperCase(),
          quote_code: input.quote_code.toUpperCase(),
          bid: input.bid,
          ask: input.ask,
          spot_price: input.spot_price ?? (input.bid + input.ask) / 2,
          buy_spread_pct: input.buy_spread_pct ?? 0,
          sell_spread_pct: input.sell_spread_pct ?? 0,
          spread_mode: input.spread_mode ?? "percentage",
          last_api_fetch_at: input.last_api_fetch_at ?? new Date().toISOString(),
          auto_sync: input.auto_sync ?? true,
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
      const { data, error } = await (supabase as any)
        .from("exchange_rates")
        .update({
          ...patch,
          updated_at: new Date().toISOString(),
        })
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

/**
 * Syncs live market spot prices for all active pairs (or a single pair) via open FX API
 * and recalculates Bid (Buy) & Ask (Sell) using each pair's configured Buy Spread % and Sell Spread %.
 */
export const useSyncSpotRates = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (targetPairs: ExchangeRate[]) => {
      const syncable = targetPairs.filter(
        (r) => r.is_active && r.spread_mode !== "manual" && r.auto_sync !== false
      );
      if (syncable.length === 0) {
        return { updated: 0 };
      }

      let updatedCount = 0;
      for (const pair of syncable) {
        const { spot, fetchedAt } = await fetchLiveSpotPrice(pair.base_code, pair.quote_code);
        const calc = computeRatesFromSpotAndSpreads(
          spot,
          pair.buy_spread_pct ?? 0,
          pair.sell_spread_pct ?? 0
        );
        const { error } = await (supabase as any)
          .from("exchange_rates")
          .update({
            spot_price: calc.spot,
            bid: calc.bid,
            ask: calc.ask,
            last_api_fetch_at: fetchedAt,
            updated_at: fetchedAt,
          })
          .eq("id", pair.id);
        if (!error) updatedCount += 1;
      }

      return { updated: updatedCount };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exchange_rates"] }),
  });
};
