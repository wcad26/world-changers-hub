import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PledgeRow {
  id: string; // event_pre_registration id
  event_id: string;
  member_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  type: "member" | "visitor";
  region_id: string | null;
  region_name: string;
  pledge_amount: number;
  pledge_currency_code: string;
  pledge_status: string | null;
  paid: number; // in same major units as pledge_amount, summed in pledge currency
  remaining: number;
  paid_pct: number;
}

export const useCampaignPledgesDetailed = (campaignId: string | undefined) => {
  return useQuery({
    queryKey: ["campaign_pledges_detailed", campaignId],
    enabled: !!campaignId,
    queryFn: async (): Promise<PledgeRow[]> => {
      if (!campaignId) return [];

      const { data: events, error: eErr } = await supabase
        .from("events")
        .select("id")
        .eq("linked_fundraising_campaign_id", campaignId);
      if (eErr) throw eErr;
      const eventIds = (events || []).map((e: any) => e.id);
      if (eventIds.length === 0) return [];

      const { data: regs, error: rErr } = await supabase
        .from("event_pre_registrations")
        .select(
          "id, event_id, member_id, email, phone, pledge_amount, pledge_currency_code, pledge_status"
        )
        .in("event_id", eventIds);
      if (rErr) throw rErr;

      const preRegs = (regs || []).filter(
        (r: any) =>
          Number(r.pledge_amount || 0) > 0 && r.pledge_status !== "cancelled"
      );
      if (preRegs.length === 0) return [];

      const memberIds = Array.from(
        new Set(preRegs.map((r: any) => r.member_id).filter(Boolean))
      ) as string[];

      let membersById = new Map<string, any>();
      if (memberIds.length > 0) {
        const { data: members } = await supabase
          .from("members")
          .select(
            "id, member_type, region_id, profile:profiles(first_name, last_name), region:regions(name)"
          )
          .in("id", memberIds);
        (members || []).forEach((m: any) => membersById.set(m.id, m));
      }

      const preregIds = preRegs.map((r: any) => r.id);
      const { data: donations } = await supabase
        .from("fundraising_donations")
        .select("event_pre_registration_id, amount, currency_code")
        .in("event_pre_registration_id", preregIds)
        .eq("campaign_id", campaignId);

      const paidByPrereg = new Map<string, number>();
      (donations || []).forEach((d: any) => {
        const key = d.event_pre_registration_id;
        if (!key) return;
        // amount stored in cents → major units
        const major = Number(d.amount || 0) / 100;
        paidByPrereg.set(key, (paidByPrereg.get(key) || 0) + major);
      });

      const rows: PledgeRow[] = preRegs.map((r: any) => {
        const m = r.member_id ? membersById.get(r.member_id) : null;
        const profile = m?.profile;
        const name = m
          ? `${profile?.last_name || ""} ${profile?.first_name || ""}`.trim() ||
            r.email ||
            "Member"
          : r.email || r.phone || "Visitor";
        const type: "member" | "visitor" = m ? "member" : "visitor";
        const region_name = m?.region?.name || "—";
        const pledge_amount = Number(r.pledge_amount);
        const pledge_currency_code = (r.pledge_currency_code || "USD").toUpperCase();
        const paid = paidByPrereg.get(r.id) || 0;
        const remaining = Math.max(0, pledge_amount - paid);
        const paid_pct = pledge_amount > 0 ? Math.min(100, (paid / pledge_amount) * 100) : 0;
        return {
          id: r.id,
          event_id: r.event_id,
          member_id: r.member_id,
          name,
          email: r.email,
          phone: r.phone,
          type,
          region_id: m?.region_id || null,
          region_name,
          pledge_amount,
          pledge_currency_code,
          pledge_status: r.pledge_status,
          paid,
          remaining,
          paid_pct,
        };
      });

      rows.sort((a, b) => b.pledge_amount - a.pledge_amount);
      return rows;
    },
    staleTime: 30 * 1000,
  });
};
