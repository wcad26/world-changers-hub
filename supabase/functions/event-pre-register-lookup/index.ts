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
    const emailRaw = String(body?.email ?? "").trim().toLowerCase();
    const phoneRaw = String(body?.phone ?? "").trim();
    const phoneDigits = digitsOnly(phoneRaw);

    if (!emailRaw && phoneDigits.length < 9) {
      return json({ error: "Provide a valid email or phone (>=9 digits)" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let profile: any = null;

    if (emailRaw) {
      const { data } = await admin
        .from("profiles")
        .select("id, first_name, last_name, email, phone, date_of_birth")
        .ilike("email", emailRaw)
        .maybeSingle();
      profile = data;
    }

    if (!profile && phoneDigits.length >= 9) {
      // Match by trailing 9 digits to handle country code differences
      const { data: profiles } = await admin
        .from("profiles")
        .select("id, first_name, last_name, email, phone, date_of_birth")
        .not("phone", "is", null)
        .limit(2000);
      profile = (profiles ?? []).find((p: any) =>
        digitsOnly(p.phone || "").endsWith(phoneDigits.slice(-9))
      ) || null;
    }

    if (!profile) return json({ found: false, member: null });

    const { data: member } = await admin
      .from("members")
      .select("id, member_type, region_id, member_id")
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (!member) return json({ found: false, member: null });

    return json({
      found: true,
      member: {
        id: member.id,
        member_id: member.member_id,
        member_type: member.member_type,
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        phone: profile.phone,
        date_of_birth: profile.date_of_birth,
      },
    });
  } catch (e: any) {
    return json({ error: String(e?.message ?? e) }, 500);
  }

  function json(payload: unknown, status = 200) {
    return new Response(JSON.stringify(payload), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
