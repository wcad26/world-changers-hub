// Returns the registration fee for each attendee of a special event.
// Categories and family eligibility are resolved server-side; the browser
// cannot claim a cheaper category or a fake family.
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  loadEventFees,
  resolveCategoriesForMembers,
  categoryForNewRegistrant,
  resolveFamilyUnit,
  priceGroup,
  type FeeCategory,
} from "../_shared/eventFees.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Attendee = {
  key: string;
  name?: string;
  member_id?: string | null;
  date_of_birth?: string | null;
  is_child?: boolean;
  has_family?: boolean;
  relationship_type?: string | null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json();
    const event_id = String(body?.event_id ?? "");
    const attendees: Attendee[] = Array.isArray(body?.attendees) ? body.attendees : [];
    if (!event_id) {
      return new Response(JSON.stringify({ error: "Missing event_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const fees = await loadEventFees(admin, event_id);
    const currency = fees[0]?.currency_code || null;

    const memberIds = attendees.map((a) => a.member_id).filter(Boolean) as string[];
    const resolved = await resolveCategoriesForMembers(admin, memberIds);

    // Per-person categories (used when no family package applies).
    const categories: Record<string, FeeCategory> = { ...resolved };
    attendees.forEach((a) => {
      if (a.member_id && !categories[a.member_id]) categories[a.member_id] = "member";
    });

    // Family unit: only the primary's spouse and their under-16 children.
    const primary = attendees[0];
    let covered = new Set<string>();
    if (primary?.member_id && memberIds.length > 1) {
      const declared: Record<string, string> = {};
      attendees.forEach((a: any) => {
        if (a.member_id && a.relationship_type) declared[a.member_id] = String(a.relationship_type).toLowerCase();
      });
      const unit = await resolveFamilyUnit(admin, primary.member_id, memberIds, declared);
      covered = unit.covered;
    }

    const groupAttendees = attendees.map((a) => ({
      key: a.key,
      name: a.name,
      member_id: a.member_id ?? null,
      family_covered: !a.member_id
        ? categoryForNewRegistrant({
            date_of_birth: a.date_of_birth,
            is_child: a.is_child,
            hasFamily: a.has_family,
          }) === "child"
        : false,
    }));

    const priced = priceGroup(fees, groupAttendees, categories, covered);

    return new Response(
      JSON.stringify({
        has_fees: fees.length > 0,
        currency_code: currency,
        pricing_mode: priced.mode,
        lines: priced.lines,
        total: priced.total,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
