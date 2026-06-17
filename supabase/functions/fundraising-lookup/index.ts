import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const digitsOnly = (s: string) => (s || "").replace(/\D/g, "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const phoneRaw = String(body?.phone ?? "").trim();
    const campaignId = String(body?.campaign_id ?? "").trim() || null;
    const phoneDigits = digitsOnly(phoneRaw);

    if (phoneDigits.length < 9) {
      return json({ error: "Provide a valid phone (>=9 digits)" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const last9 = phoneDigits.slice(-9);

    // Try profiles first
    let firstName: string | null = null;
    let lastName: string | null = null;
    let memberId: string | null = null;
    let donorId: string | null = null;
    let email: string | null = null;
    let kind: "member" | "donor" | null = null;

    const { data: profiles } = await admin
      .from("profiles")
      .select("id, first_name, last_name, email, phone")
      .not("phone", "is", null)
      .limit(3000);
    const matchedProfile = (profiles ?? []).find((p: any) =>
      digitsOnly(p.phone || "").endsWith(last9)
    );

    if (matchedProfile) {
      firstName = matchedProfile.first_name;
      lastName = matchedProfile.last_name;
      email = matchedProfile.email;
      const { data: mem } = await admin
        .from("members")
        .select("id")
        .eq("profile_id", matchedProfile.id)
        .maybeSingle();
      if (mem) {
        memberId = mem.id;
        kind = "member";
      }
    }

    // Donors fallback
    if (!firstName) {
      const { data: donors } = await admin
        .from("donors")
        .select("id, first_name, last_name, email, phone")
        .not("phone", "is", null)
        .limit(3000);
      const d = (donors ?? []).find((x: any) =>
        digitsOnly(x.phone || "").endsWith(last9)
      );
      if (d) {
        firstName = d.first_name;
        lastName = d.last_name;
        email = d.email;
        donorId = d.id;
        kind = "donor";
      }
    }

    // Existing pledge for this campaign
    let pledge: any = null;
    if (campaignId) {
      const orConds: string[] = [];
      if (memberId) orConds.push(`member_id.eq.${memberId}`);
      if (donorId) orConds.push(`donor_id.eq.${donorId}`);
      // Also match by phone for unlinked pledges
      const { data: byPhone } = await admin
        .from("fundraising_pledges")
        .select("id, amount, currency_code, status, pledger_phone, pledger_name")
        .eq("campaign_id", campaignId);
      const matched = (byPhone ?? []).filter((p: any) => {
        if (memberId && p.member_id === memberId) return true;
        if (donorId && p.donor_id === donorId) return true;
        return digitsOnly(p.pledger_phone || "").endsWith(last9);
      });
      const active = matched.find((p: any) => p.status === "active");
      if (active) {
        // Sum donations applied to this pledge (best-effort: by member_id/donor_id/email on this campaign)
        const sums = await admin
          .from("fundraising_donations")
          .select("amount, member_id, donor_id, donor_email, status")
          .eq("campaign_id", campaignId)
          .eq("status", "completed");
        const paid = (sums.data ?? []).reduce((acc: number, r: any) => {
          const match =
            (memberId && r.member_id === memberId) ||
            (donorId && r.donor_id === donorId) ||
            (email && r.donor_email && r.donor_email.toLowerCase() === email.toLowerCase());
          return acc + (match ? Number(r.amount) / 100 : 0);
        }, 0);
        pledge = {
          id: active.id,
          amount: Number(active.amount),
          currency_code: active.currency_code,
          paid,
          remaining: Math.max(0, Number(active.amount) - paid),
        };
      }
    }

    return json({
      found: !!firstName,
      kind,
      first_name: firstName,
      last_name: lastName,
      email,
      member_id: memberId,
      donor_id: donorId,
      pledge,
    });
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
