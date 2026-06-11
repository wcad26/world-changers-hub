import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Database } from "@/integrations/supabase/types";
import type { RegionFilter } from "./useGlobalLedger";

export type FundraisingCampaign = Database["public"]["Tables"]["fundraising_campaigns"]["Row"] & {
  region?: { id: string; name: string; code: string | null } | null;
};
export type FundraisingDonation = Database["public"]["Tables"]["fundraising_donations"]["Row"];

/**
 * Fetch pledges aggregated per fundraising campaign.
 * Pledges are stored on `event_pre_registrations.pledge_amount` and linked
 * to a campaign via `events.linked_fundraising_campaign_id`.
 *
 * Returns: { [campaignId]: { byCurrency: { [code]: amount }, count } }
 * Amounts are in MAJOR units (not cents), matching how pledge_amount is stored.
 */
export const useCampaignPledges = (campaignIds: string[]) => {
  const ids = [...new Set(campaignIds.filter(Boolean))].sort();
  return useQuery({
    queryKey: ["campaign_pledges", ids],
    enabled: ids.length > 0,
    queryFn: async () => {
      const out: Record<string, { byCurrency: Record<string, number>; count: number }> = {};
      ids.forEach((id) => { out[id] = { byCurrency: {}, count: 0 }; });

      const { data: events, error: eErr } = await supabase
        .from("events")
        .select("id, linked_fundraising_campaign_id")
        .in("linked_fundraising_campaign_id", ids);
      if (eErr) throw eErr;
      const eventToCampaign = new Map<string, string>();
      (events || []).forEach((e: any) => {
        if (e.linked_fundraising_campaign_id) eventToCampaign.set(e.id, e.linked_fundraising_campaign_id);
      });
      const eventIds = Array.from(eventToCampaign.keys());
      if (eventIds.length === 0) return out;

      const { data: regs, error: rErr } = await supabase
        .from("event_pre_registrations")
        .select("event_id, pledge_amount, pledge_currency_code, pledge_status")
        .in("event_id", eventIds);
      if (rErr) throw rErr;

      (regs || []).forEach((r: any) => {
        if (!r.pledge_amount || Number(r.pledge_amount) <= 0) return;
        if (r.pledge_status === "cancelled") return;
        const campaignId = eventToCampaign.get(r.event_id);
        if (!campaignId) return;
        const code = (r.pledge_currency_code || "").toUpperCase() || "USD";
        const bucket = out[campaignId];
        bucket.byCurrency[code] = (bucket.byCurrency[code] || 0) + Number(r.pledge_amount);
        bucket.count += 1;
      });

      return out;
    },
    staleTime: 60 * 1000,
  });
};

export const useGlobalFundraisingCampaigns = (regionFilter: RegionFilter = "all", status?: string) => {
  return useQuery({
    queryKey: ["global_fundraising_campaigns", regionFilter, status],
    queryFn: async () => {
      let q = supabase
        .from("fundraising_campaigns")
        .select("*, region:regions(id, name, code)")
        .order("created_at", { ascending: false });
      if (regionFilter === "global") q = q.is("region_id", null);
      else if (regionFilter !== "all") q = q.eq("region_id", regionFilter);
      if (status && status !== "all") q = q.eq("status", status);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as FundraisingCampaign[];
    },
    staleTime: 60 * 1000,
  });
};

export const useGlobalDonations = (from: Date, to: Date, regionFilter: RegionFilter = "all") => {
  return useQuery({
    queryKey: ["global_donations", regionFilter, from.toISOString(), to.toISOString()],
    queryFn: async () => {
      let cq = supabase.from("fundraising_campaigns").select("id, name, currency_code, region_id");
      if (regionFilter === "global") cq = cq.is("region_id", null);
      else if (regionFilter !== "all") cq = cq.eq("region_id", regionFilter);
      const { data: campaigns, error: cErr } = await cq;
      if (cErr) throw cErr;
      const ids = (campaigns || []).map((c) => c.id);
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from("fundraising_donations")
        .select("*")
        .in("campaign_id", ids)
        .gte("donation_date", from.toISOString())
        .lte("donation_date", to.toISOString())
        .order("donation_date", { ascending: false });
      if (error) throw error;
      const byId = new Map(campaigns!.map((c) => [c.id, c]));
      return (data || []).map((d) => ({ ...d, campaign: byId.get(d.campaign_id) || null }));
    },
  });
};

// Insert global (region_id = null, scope = 'global') transaction
export interface NewGlobalTransactionInput {
  category_id: string;
  amount: number; // major units
  description?: string | null;
  transaction_date: string; // yyyy-MM-dd
  currency_code: string;
}

export const useCreateGlobalTransaction = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: NewGlobalTransactionInput) => {
      const { data, error } = await supabase
        .from("financial_transactions")
        .insert({
          region_id: null,
          scope: "global",
          dcg_id: null,
          category_id: input.category_id,
          amount: input.amount,
          description: input.description ?? null,
          transaction_date: input.transaction_date,
          currency_code: input.currency_code,
          recorded_by: user?.id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["global_ledger"] });
    },
  });
};

export interface NewGlobalCampaignInput {
  name: string;
  description: string;
  goal: number; // major units
  start_date: string;
  end_date?: string | null;
  image_url?: string | null;
  is_public?: boolean;
  currency_code: string;
}

export const useCreateGlobalCampaign = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: NewGlobalCampaignInput) => {
      const { data, error } = await supabase
        .from("fundraising_campaigns")
        .insert({
          region_id: null,
          scope: "global",
          name: input.name,
          description: input.description,
          goal: Math.round(input.goal * 100),
          start_date: input.start_date,
          end_date: input.end_date ?? null,
          image_url: input.image_url ?? null,
          is_public: input.is_public ?? true,
          status: "Active",
          currency_code: input.currency_code,
          created_by: user?.id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["global_fundraising_campaigns"] });
    },
  });
};

export const useDeleteGlobalCampaign = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fundraising_campaigns").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["global_fundraising_campaigns"] });
      qc.invalidateQueries({ queryKey: ["global_donations"] });
    },
  });
};
