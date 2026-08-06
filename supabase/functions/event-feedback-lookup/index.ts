import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const digitsOnly = (s: string) => (s || "").replace(/\D/g, "");

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const emailRaw = String(body?.email ?? "").trim().toLowerCase();
    const phoneRaw = String(body?.phone ?? "").trim();
    const phoneDigits = digitsOnly(phoneRaw);
    const eventKey = String(body?.event_id ?? body?.slug ?? "").trim();

    if (!eventKey) return json({ error: "Missing event identifier" }, 400);
    if (!emailRaw && phoneDigits.length < 9) {
      return json({ error: "Provide a valid email or phone (at least 9 digits)" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Resolve the event by id or slug
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventKey);
    const { data: event } = isUuid
      ? await admin.from("events").select("id, name, name_fr, slug").eq("id", eventKey).maybeSingle()
      : await admin.from("events").select("id, name, name_fr, slug").eq("slug", eventKey).maybeSingle();

    if (!event) return json({ error: "Event not found" }, 404);

    // Resolve the profile
    let profile: any = null;
    if (emailRaw) {
      const { data } = await admin
        .from("profiles")
        .select("id, first_name, last_name, email, phone")
        .ilike("email", emailRaw)
        .maybeSingle();
      profile = data;
    }
    if (!profile && phoneDigits.length >= 9) {
      const { data: profiles } = await admin
        .from("profiles")
        .select("id, first_name, last_name, email, phone")
        .not("phone", "is", null)
        .limit(5000);
      profile = (profiles ?? []).find((p: any) =>
        digitsOnly(p.phone || "").endsWith(phoneDigits.slice(-9))
      ) || null;
    }

    if (!profile) return json({ found: false, eligible: false });

    const { data: member } = await admin
      .from("members")
      .select("id, member_id, region_id")
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (!member) return json({ found: false, eligible: false });

    // Eligibility: pre-registered OR attendance recorded for this event (any day)
    const { data: preReg } = await admin
      .from("event_pre_registrations")
      .select("id")
      .eq("event_id", event.id)
      .eq("member_id", member.id)
      .maybeSingle();

    let attended = false;
    if (!preReg) {
      const { data: attEvents } = await admin
        .from("attendance_events")
        .select("id")
        .or(`source_event_id.eq.${event.id},parent_event_id.eq.${event.id}`);
      const attIds = (attEvents ?? []).map((a: any) => a.id);
      if (attIds.length) {
        const { data: recs } = await admin
          .from("attendance_records")
          .select("id")
          .eq("member_id", member.id)
          .eq("is_present", true)
          .in("event_id", attIds)
          .limit(1);
        attended = !!(recs && recs.length);
      }
    }

    if (!preReg && !attended) {
      return json({ found: true, eligible: false });
    }

    const { data: feedback } = await admin
      .from("event_feedback")
      .select("*")
      .eq("event_id", event.id)
      .eq("member_id", member.id)
      .maybeSingle();

    const { data: testimonial } = await admin
      .from("event_testimonials")
      .select("id, content, role, status")
      .eq("event_id", event.id)
      .eq("member_id", member.id)
      .maybeSingle();

    return json({
      found: true,
      eligible: true,
      event: { id: event.id, name: event.name, name_fr: event.name_fr, slug: event.slug },
      member: {
        id: member.id,
        member_id: member.member_id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        phone: profile.phone,
      },
      feedback: feedback ?? null,
      testimonial: testimonial ?? null,
    });
  } catch (e: any) {
    return json({ error: String(e?.message ?? e) }, 500);
  }
});
