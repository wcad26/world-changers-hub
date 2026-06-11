import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import type { LedgerRow } from "./useRegionalLedger";

export type RegionFilter = "all" | "global" | string; // string = a region uuid

export interface GlobalLedgerFilters {
  scope: "regional" | "dcg"; // regional ledger (dcg null) vs dcg ledger (dcg not null)
  from?: Date;
  to?: Date;
  regionFilter?: RegionFilter; // "all" | "global" | <uuid>
  categoryId?: string | null;
  type?: "all" | "income" | "expense";
  dcgId?: string | null;
  includeGlobal?: boolean; // when regionFilter = "all", whether to include scope='global' rows
}

export interface GlobalLedgerRow extends LedgerRow {
  region_id: string | null;
  scope: string;
  currency_code: string | null;
  region: { id: string; name: string; code: string | null; currency_code?: string | null } | null;
}

const toIso = (d?: Date) => (d ? format(d, "yyyy-MM-dd") : undefined);

export const useGlobalLedger = (filters: GlobalLedgerFilters) => {
  return useQuery({
    queryKey: ["global_ledger", filters],
    queryFn: async (): Promise<GlobalLedgerRow[]> => {
      let q = supabase
        .from("financial_transactions")
        .select(
          "id, amount, description, transaction_date, dcg_id, category_id, region_id, scope, currency_code, category:financial_transaction_categories(name, type), dcg:dcgs(name), region:regions(id, name, code, currency_code)"
        );

      if (filters.scope === "regional") q = q.is("dcg_id", null);
      if (filters.scope === "dcg") {
        q = q.not("dcg_id", "is", null);
        if (filters.dcgId) q = q.eq("dcg_id", filters.dcgId);
      }
      if (filters.regionFilter === "global") {
        q = q.is("region_id", null);
      } else if (filters.regionFilter && filters.regionFilter !== "all") {
        q = q.eq("region_id", filters.regionFilter);
      }
      if (filters.categoryId) q = q.eq("category_id", filters.categoryId);

      const fromIso = toIso(filters.from);
      const toIsoStr = toIso(filters.to);
      if (fromIso) q = q.gte("transaction_date", fromIso);
      if (toIsoStr) q = q.lte("transaction_date", toIsoStr);

      const { data, error } = await q.order("transaction_date", { ascending: false }).limit(5000);
      if (error) throw error;
      let rows = (data || []) as unknown as GlobalLedgerRow[];
      if (filters.type && filters.type !== "all") {
        rows = rows.filter((r) => r.category?.type?.toLowerCase() === filters.type);
      }
      return rows;
    },
    staleTime: 60 * 1000,
  });
};

export interface RegionAggRow {
  region_id: string | null;
  region_name: string;
  income: number;
  expenses: number;
  net: number;
  count: number;
}

export function aggregateByRegion(rows: GlobalLedgerRow[]): RegionAggRow[] {
  const map = new Map<string, RegionAggRow>();
  for (const r of rows) {
    const key = r.region_id ?? "__global__";
    const name = r.region_id ? r.region?.name || "Unknown Region" : "Global (Super Admin)";
    if (!map.has(key)) {
      map.set(key, { region_id: r.region_id, region_name: name, income: 0, expenses: 0, net: 0, count: 0 });
    }
    const row = map.get(key)!;
    const amt = Number(r.amount) || 0;
    const ct = r.category?.type?.toLowerCase();
    if (ct === "income") row.income += amt;
    else if (ct === "expense") row.expenses += amt;
    row.count += 1;
    row.net = row.income - row.expenses;
  }
  return Array.from(map.values()).sort((a, b) => b.net - a.net);
}
