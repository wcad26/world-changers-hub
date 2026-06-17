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
    const campaignId = String(body?.campaign_id ?? "").trim();
    const phoneRaw = String(body?.phone ?? "").trim();
    const familyName = String(body?.family_name ?? "").trim();
    const otherNames = String(body?.other_names ?? "").trim();
    const email = String(body?.email ?? "").trim().toLowerCase() || null;
    const amount = Number(body?.amount || 0);
    const currency = String(body?.currency_code ?? "").trim().toUpperCase();
    const note = body?.note ? String(body.note) : null;

    if (!campaignId) return json({ error: "campaign_id required" }, 400);
    const phoneDigits = digitsOnly(phoneRaw);
    if (phoneDigits.length < 9) return json({ error: "Valid phone required" }, 400);
    if (!amount || amount <= 0) return json({ error: "Amount must be positive" }, 400);
    if (!currency) return json({ error: "Currency required" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Load campaign for region
    const { data: campaign, error: cErr } = await admin
      .from("fundraising_campaigns")
      .select("id, region_id, is_public, name")
      .eq("id", campaignId)
      .maybeSingle();
    if (cErr) throw cErr;
    if (!campaign || !campaign.is_public) {
      return json({ error: "Campaign not available" }, 404);
    }

    const last9 = phoneDigits.slice(-9);
    let memberId: string | null = null;
    let donorId: string | null = null;
    let pledgerFirst = otherNames;
    let pledgerLast = familyName;

    // Find profile/member
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, first_name, last_name, email, phone")
      .not("phone", "is", null)
      .limit(3000);
    const matchedProfile = (profiles ?? []).find((p: any) =>
      digitsOnly(p.phone || "").endsWith(last9)
    );
    if (matchedProfile) {
      pledgerFirst = pledgerFirst || matchedProfile.first_name || "";
      pledgerLast = pledgerLast || matchedProfile.last_name || "";
      const { data: mem } = await admin
        .from("members")
        .select("id")
        .eq("profile_id", matchedProfile.id)
        .maybeSingle();
      if (mem) memberId = mem.id;
    }

    if (!memberId) {
      // Donor lookup / create
      const { data: donors } = await admin
        .from("donors")
        .select("id, first_name, last_name, email, phone, region_id")
        .not("phone", "is", null)
        .limit(3000);
      const d = (donors ?? []).find((x: any) =>
        digitsOnly(x.phone || "").endsWith(last9)
      );
      if (d) {
        donorId = d.id;
        pledgerFirst = pledgerFirst || d.first_name || "";
        pledgerLast = pledgerLast || d.last_name || "";
      } else {
        if (!pledgerLast) return json({ error: "Family name required" }, 400);
        const { data: newDonor, error: dErr } = await admin
          .from("donors")
          .insert({
            region_id: campaign.region_id,
            first_name: pledgerFirst || null,
            last_name: pledgerLast,
            email,
            phone: phoneRaw,
            notes: "Created from public pledge form",
          })
          .select("id")
          .single();
        if (dErr) throw dErr;
        donorId = newDonor.id;
      }
    }

    const pledgerName = [pledgerFirst, pledgerLast].filter(Boolean).join(" ").trim() ||
      "Anonymous";

    const { data: pledge, error: pErr } = await admin
      .from("fundraising_pledges")
      .insert({
        campaign_id: campaignId,
        donor_id: donorId,
        member_id: memberId,
        pledger_name: pledgerName,
        pledger_phone: phoneRaw,
        pledger_email: email,
        amount: Math.round(amount),
        currency_code: currency,
        note,
      })
      .select("id, amount, currency_code")
      .single();
    if (pErr) throw pErr;

    return json({ ok: true, pledge });
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
