import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const clampRating = (v: unknown): number | null => {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 1 || n > 5) return null;
  return Math.round(n);
};

const clean = (v: unknown, max = 4000): string | null => {
  const s = String(v ?? "").trim();
  if (!s) return null;
  return s.slice(0, max);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const eventId = String(body?.event_id ?? "").trim();
    const memberId = String(body?.member_id ?? "").trim();
    const f = body?.feedback ?? {};
    const testimonialText = clean(body?.testimonial?.content, 2000);
    const testimonialRole = clean(body?.testimonial?.role, 120);

    if (!eventId || !memberId) return json({ error: "Missing event or member" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: member } = await admin
      .from("members")
      .select("id, profile_id, profiles:profile_id(first_name, last_name)")
      .eq("id", memberId)
      .maybeSingle();
    if (!member) return json({ error: "Member not found" }, 404);

    const { data: preReg } = await admin
      .from("event_pre_registrations")
      .select("id")
      .eq("event_id", eventId)
      .eq("member_id", memberId)
      .maybeSingle();

    let eligible = !!preReg;
    if (!eligible) {
      const { data: attEvents } = await admin
        .from("attendance_events")
        .select("id")
        .or(`source_event_id.eq.${eventId},parent_event_id.eq.${eventId}`);
      const attIds = (attEvents ?? []).map((a: any) => a.id);
      if (attIds.length) {
        const { data: recs } = await admin
          .from("attendance_records")
          .select("id")
          .eq("member_id", memberId)
          .eq("is_present", true)
          .in("event_id", attIds)
          .limit(1);
        eligible = !!(recs && recs.length);
      }
    }
    if (!eligible) return json({ error: "Not eligible to submit feedback for this event" }, 403);

    const enjoyed = Array.isArray(f?.enjoyed_most)
      ? f.enjoyed_most.map((x: unknown) => String(x).slice(0, 120)).slice(0, 20)
      : [];

    const payload = {
      event_id: eventId,
      member_id: memberId,
      profile_id: member.profile_id,
      first_time_attending: typeof f?.first_time_attending === "boolean" ? f.first_time_attending : null,
      fellowship: clean(f?.fellowship, 160),
      overall_rating: clampRating(f?.overall_rating),
      communication_rating: clampRating(f?.communication_rating),
      lodging_rating: clampRating(f?.lodging_rating),
      food_rating: clampRating(f?.food_rating),
      children_management_rating: clampRating(f?.children_management_rating),
      teaching_impact: clean(f?.teaching_impact),
      schedule_feedback: clean(f?.schedule_feedback),
      impactful_sessions: clean(f?.impactful_sessions),
      enjoyed_most: enjoyed,
      enjoyed_most_other: clean(f?.enjoyed_most_other, 300),
      challenges: clean(f?.challenges),
      future_topics: clean(f?.future_topics),
      suggestions: clean(f?.suggestions),
      submitted_at: new Date().toISOString(),
    };

    const { error: fbError } = await admin
      .from("event_feedback")
      .upsert(payload, { onConflict: "event_id,member_id" });
    if (fbError) return json({ error: fbError.message }, 400);

    let testimonialSaved = false;
    if (testimonialText) {
      const prof: any = (member as any).profiles;
      const name = [prof?.last_name, prof?.first_name].filter(Boolean).join(" ") || "Attendee";

      const { data: existing } = await admin
        .from("event_testimonials")
        .select("id")
        .eq("event_id", eventId)
        .eq("member_id", memberId)
        .maybeSingle();

      const record = {
        event_id: eventId,
        member_id: memberId,
        name,
        role: testimonialRole || "Attendee",
        content: testimonialText,
        rating: clampRating(f?.overall_rating) ?? 5,
        status: "pending",
        submitted_at: new Date().toISOString(),
      };

      const { error: tError } = existing
        ? await admin.from("event_testimonials").update(record).eq("id", existing.id)
        : await admin.from("event_testimonials").insert(record);
      if (tError) return json({ error: tError.message }, 400);
      testimonialSaved = true;
    }

    return json({ success: true, testimonial_submitted: testimonialSaved });
  } catch (e: any) {
    return json({ error: String(e?.message ?? e) }, 500);
  }
});
