import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { format } from "date-fns";

export type LedgerScope = "regional" | "dcg" | "all";

export interface LedgerFilters {
  scope: LedgerScope;
  from?: Date;
  to?: Date;
  dcgId?: string | null;        // dcg-scope only; "all" or null
  categoryId?: string | null;   // null = all
  type?: "all" | "income" | "expense";
}

export interface LedgerRow {
  id: string;
  amount: number;
  description: string | null;
  transaction_date: string;
  dcg_id: string | null;
  category_id: string;
  category: { name: string | null; type: string | null } | null;
  dcg: { name: string | null } | null;
}

const toIso = (d?: Date) => (d ? format(d, "yyyy-MM-dd") : undefined);

export const useRegionalLedger = (filters: LedgerFilters) => {
  const { userRegion } = useAuth();
  const regionId = userRegion?.id;

  return useQuery({
    queryKey: ["regional_ledger", regionId, filters],
    queryFn: async (): Promise<LedgerRow[]> => {
      if (!regionId) return [];
      let q = supabase
        .from("financial_transactions")
        .select("id, amount, description, transaction_date, dcg_id, category_id, category:financial_transaction_categories(name, type), dcg:dcgs(name)")
        .eq("region_id", regionId);

      if (filters.scope === "regional") q = q.is("dcg_id", null);
      if (filters.scope === "dcg") {
        q = q.not("dcg_id", "is", null);
        if (filters.dcgId) q = q.eq("dcg_id", filters.dcgId);
      }
      if (filters.categoryId) q = q.eq("category_id", filters.categoryId);
      const from = toIso(filters.from);
      const to = toIso(filters.to);
      if (from) q = q.gte("transaction_date", from);
      if (to) q = q.lte("transaction_date", to);

      const { data, error } = await q.order("transaction_date", { ascending: false }).limit(1000);
      if (error) throw error;
      let rows = (data || []) as unknown as LedgerRow[];
      if (filters.type && filters.type !== "all") {
        rows = rows.filter(r => r.category?.type?.toLowerCase() === filters.type);
      }
      return rows;
    },
    enabled: !!regionId,
    staleTime: 2 * 60 * 1000,
  });
};

export interface LedgerSummary {
  total_income: number;
  total_expenses: number;
  net_balance: number;
  tithes: number;
  offerings: number;
  special_giving: number;
  transaction_count: number;
}

export function summarizeLedger(rows: LedgerRow[]): LedgerSummary {
  const s: LedgerSummary = {
    total_income: 0, total_expenses: 0, net_balance: 0,
    tithes: 0, offerings: 0, special_giving: 0, transaction_count: rows.length,
  };
  for (const r of rows) {
    const amt = Number(r.amount) || 0;
    const ct = r.category?.type?.toLowerCase();
    const cn = r.category?.name || "";
    if (ct === "income") {
      s.total_income += amt;
      if (cn === "Tithes") s.tithes += amt;
      else if (cn.includes("Offering")) s.offerings += amt;
      else if (["Building Fund","Mission Fund","Youth Fund","Benevolence Fund","Special Giving"].includes(cn)) s.special_giving += amt;
    } else if (ct === "expense") {
      s.total_expenses += amt;
    }
  }
  s.net_balance = s.total_income - s.total_expenses;
  return s;
}

export interface DcgAggRow {
  dcg_id: string;
  dcg_name: string;
  income: number;
  expenses: number;
  net: number;
  count: number;
}

export function aggregateByDcg(rows: LedgerRow[]): DcgAggRow[] {
  const map = new Map<string, DcgAggRow>();
  for (const r of rows) {
    if (!r.dcg_id) continue;
    const key = r.dcg_id;
    if (!map.has(key)) {
      map.set(key, { dcg_id: key, dcg_name: r.dcg?.name || "Unknown DCG", income: 0, expenses: 0, net: 0, count: 0 });
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
