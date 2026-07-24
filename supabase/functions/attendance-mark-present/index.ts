import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization") || "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Identify caller (for recorded_by).
    let recordedBy: string | null = null;
    if (auth.startsWith("Bearer ")) {
      const token = auth.slice(7);
      const { data } = await supabase.auth.getUser(token);
      recordedBy = data.user?.id || null;
    }

    const body = await req.json();
    const eventId: string = body?.event_id;
    const memberIds: string[] = Array.isArray(body?.member_ids) ? body.member_ids : [];
    if (!eventId || memberIds.length === 0) {
      return new Response(JSON.stringify({ error: "event_id and member_ids required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Deduplicate.
    const uniq = Array.from(new Set(memberIds));

    // Fetch existing records to distinguish newly marked from already present.
    const { data: existing } = await supabase
      .from("attendance_records")
      .select("member_id, is_present")
      .eq("event_id", eventId)
      .in("member_id", uniq);

    const alreadyPresent = new Set(
      (existing || []).filter((r: any) => r.is_present === true).map((r: any) => r.member_id),
    );

    const now = new Date().toISOString();
    const rows = uniq.map((mid) => ({
      event_id: eventId,
      member_id: mid,
      is_present: true,
      recorded_at: now,
      recorded_by: recordedBy,
    }));

    const { error: upsertError } = await supabase
      .from("attendance_records")
      .upsert(rows, { onConflict: "event_id,member_id" });

    if (upsertError) throw upsertError;

    const newlyMarked = uniq.filter((m) => !alreadyPresent.has(m)).length;

    return new Response(
      JSON.stringify({
        submitted: uniq.length,
        newly_marked: newlyMarked,
        already_present: uniq.length - newlyMarked,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error("attendance-mark-present error", e);
    return new Response(JSON.stringify({ error: e?.message || "internal_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
