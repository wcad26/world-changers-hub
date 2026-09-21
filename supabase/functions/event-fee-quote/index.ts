// Returns the registration fee for each attendee of a special event.
// Categories are resolved server-side; the browser cannot claim a cheaper one.
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  loadEventFees,
  feeFor,
  resolveCategoriesForMembers,
  categoryForNewRegistrant,
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

    const lines = attendees.map((a) => {
      const category: FeeCategory = a.member_id
        ? resolved[a.member_id] || "member"
        : categoryForNewRegistrant({
            date_of_birth: a.date_of_birth,
            is_child: a.is_child,
            hasFamily: a.has_family,
          });
      const fee = feeFor(fees, category);
      return {
        key: a.key,
        name: a.name || "",
        category,
        label: fee?.label || null,
        amount: fee?.amount ?? 0,
        currency_code: fee?.currency_code || currency,
      };
    });

    const total = lines.reduce((s, l) => s + (l.amount || 0), 0);

    return new Response(
      JSON.stringify({ has_fees: fees.length > 0, currency_code: currency, lines, total }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
