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
    const anonymous = !!body?.anonymous;

    if (!campaignId) return json({ error: "campaign_id required" }, 400);
    if (!amount || amount <= 0) return json({ error: "Amount must be positive" }, 400);
    if (!currency) return json({ error: "Currency required" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: campaign, error: cErr } = await admin
      .from("fundraising_campaigns")
      .select("id, region_id, is_public, name")
      .eq("id", campaignId)
      .maybeSingle();
    if (cErr) throw cErr;
    if (!campaign || !campaign.is_public) return json({ error: "Campaign not available" }, 404);

    let memberId: string | null = null;
    let donorId: string | null = null;
    let donorName: string | null = null;
    let donorEmail: string | null = anonymous ? null : email;

    if (!anonymous) {
      const phoneDigits = digitsOnly(phoneRaw);
      if (phoneDigits.length >= 9) {
        const last9 = phoneDigits.slice(-9);
        const { data: profiles } = await admin
          .from("profiles")
          .select("id, first_name, last_name, email, phone")
          .not("phone", "is", null)
          .limit(3000);
        const matchedProfile = (profiles ?? []).find((p: any) =>
          digitsOnly(p.phone || "").endsWith(last9)
        );
        if (matchedProfile) {
          const { data: mem } = await admin
            .from("members")
            .select("id")
            .eq("profile_id", matchedProfile.id)
            .maybeSingle();
          if (mem) memberId = mem.id;
          donorName = [matchedProfile.first_name, matchedProfile.last_name]
            .filter(Boolean).join(" ");
          donorEmail = donorEmail || matchedProfile.email;
        } else {
          const { data: donors } = await admin
            .from("donors")
            .select("id, first_name, last_name, email, phone")
            .not("phone", "is", null)
            .limit(3000);
          const d = (donors ?? []).find((x: any) =>
            digitsOnly(x.phone || "").endsWith(last9)
          );
          if (d) {
            donorId = d.id;
            donorName = [d.first_name, d.last_name].filter(Boolean).join(" ");
            donorEmail = donorEmail || d.email;
          } else if (familyName || otherNames) {
            const { data: newDonor, error: dErr } = await admin
              .from("donors")
              .insert({
                region_id: campaign.region_id,
                first_name: otherNames || null,
                last_name: familyName || "Donor",
                email: donorEmail,
                phone: phoneRaw,
                notes: "Created from public donation form",
              })
              .select("id")
              .single();
            if (dErr) throw dErr;
            donorId = newDonor.id;
            donorName = [otherNames, familyName].filter(Boolean).join(" ");
          }
        }
      }
    }

    const { data: donation, error: donErr } = await admin
      .from("fundraising_donations")
      .insert({
        campaign_id: campaignId,
        amount: Math.round(amount * 100),
        currency_code: currency,
        donor_id: donorId,
        member_id: memberId,
        donor_name: anonymous ? null : donorName,
        donor_email: anonymous ? null : donorEmail,
        anonymous,
        status: "pending",
      })
      .select("id, amount, currency_code")
      .single();
    if (donErr) throw donErr;

    return json({ ok: true, donation });
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
