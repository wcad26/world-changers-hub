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
    const eventKey = String(body?.event_id ?? body?.slug ?? "").trim();
    const f = body?.feedback ?? {};
    const testimonialText = clean(body?.testimonial?.content, 2000);
    const testimonialRole = clean(body?.testimonial?.role, 120);
    const testimonialName = clean(body?.testimonial?.name, 120);

    if (!eventKey) return json({ error: "Missing event identifier" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventKey);
    const { data: event } = isUuid
      ? await admin.from("events").select("id").eq("id", eventKey).maybeSingle()
      : await admin.from("events").select("id").eq("slug", eventKey).maybeSingle();

    if (!event) return json({ error: "Event not found" }, 404);

    const enjoyed = Array.isArray(f?.enjoyed_most)
      ? f.enjoyed_most.map((x: unknown) => String(x).slice(0, 120)).slice(0, 20)
      : [];

    const dailyRaw = clean(f?.kids_daily_attendance, 20)?.toLowerCase() ?? null;
    const kidsDaily = ["yes", "no", "sometimes"].includes(dailyRaw ?? "") ? dailyRaw : null;

    const payload = {
      event_id: event.id,
      member_id: null,
      profile_id: null,
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
      kids_attended: typeof f?.kids_attended === "boolean" ? f.kids_attended : null,
      kids_daily_attendance: kidsDaily,
      kids_comprehension_rating: clampRating(f?.kids_comprehension_rating),
      kids_care_rating: clampRating(f?.kids_care_rating),
      kids_meals_rating: clampRating(f?.kids_meals_rating),
      kids_remarks: clean(f?.kids_remarks),
      submitted_at: new Date().toISOString(),
    };

    // Reject completely empty submissions
    const hasContent =
      payload.first_time_attending !== null ||
      payload.kids_attended !== null ||
      enjoyed.length > 0 ||
      !!testimonialText ||
      [
        payload.fellowship,
        payload.teaching_impact,
        payload.schedule_feedback,
        payload.impactful_sessions,
        payload.enjoyed_most_other,
        payload.challenges,
        payload.future_topics,
        payload.suggestions,
        payload.kids_daily_attendance,
        payload.kids_remarks,
      ].some((v) => v !== null) ||
      [
        payload.overall_rating,
        payload.communication_rating,
        payload.lodging_rating,
        payload.food_rating,
        payload.children_management_rating,
        payload.kids_comprehension_rating,
        payload.kids_care_rating,
        payload.kids_meals_rating,
      ].some((v) => v !== null);

    if (!hasContent) return json({ error: "Empty submission" }, 400);

    const { error: fbError } = await admin.from("event_feedback").insert(payload);
    if (fbError) return json({ error: fbError.message }, 400);

    let testimonialSaved = false;
    if (testimonialText) {
      const { error: tError } = await admin.from("event_testimonials").insert({
        event_id: event.id,
        member_id: null,
        name: testimonialName || "Anonymous",
        role: testimonialRole || "Attendee",
        content: testimonialText,
        rating: clampRating(f?.overall_rating) ?? 5,
        status: "pending",
        submitted_at: new Date().toISOString(),
      });
      if (tError) return json({ error: tError.message }, 400);
      testimonialSaved = true;
    }

    return json({ success: true, testimonial_submitted: testimonialSaved });
  } catch (e: any) {
    return json({ error: String(e?.message ?? e) }, 500);
  }
});
