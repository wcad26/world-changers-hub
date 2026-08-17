import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

type Rule = {
  id: string;
  template_event_id: string | null;
  region_id: string | null;
  dcg_id: string | null;
  name: string;
  frequency: string; // weekly | biweekly | monthly | custom_days
  interval_count: number;
  days_of_week: number[];
  start_time: string; // HH:MM:SS
  duration_minutes: number;
  lead_time_days: number;
  end_date: string | null;
  is_active: boolean;
  last_generated_until: string | null;
  created_by: string | null;
};

const startOfDay = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);
const ymd = (d: Date) => d.toISOString().slice(0, 10);

function occurrenceDates(rule: Rule, from: Date, to: Date, anchor: Date): Date[] {
  const out: Date[] = [];
  const end = rule.end_date ? new Date(`${rule.end_date}T23:59:59Z`) : null;
  let cursor = startOfDay(from);
  const limit = startOfDay(to);
  const anchorDay = startOfDay(anchor);

  while (cursor <= limit && out.length < 400) {
    if (end && cursor > end) break;
    let matches = false;

    if (rule.frequency === "weekly" || rule.frequency === "biweekly") {
      const step = rule.frequency === "biweekly" ? 2 : Math.max(1, rule.interval_count || 1);
      const days = rule.days_of_week?.length ? rule.days_of_week : [anchorDay.getUTCDay()];
      if (days.includes(cursor.getUTCDay())) {
        const weeksSinceAnchor = Math.floor((cursor.getTime() - anchorDay.getTime()) / (7 * 86400000));
        matches = weeksSinceAnchor >= 0 ? weeksSinceAnchor % step === 0 : false;
      }
    } else if (rule.frequency === "monthly") {
      // same weekday, same ordinal week of month as the anchor
      const anchorOrdinal = Math.ceil(anchorDay.getUTCDate() / 7);
      const ordinal = Math.ceil(cursor.getUTCDate() / 7);
      matches = cursor.getUTCDay() === anchorDay.getUTCDay() && ordinal === anchorOrdinal;
    } else if (rule.frequency === "custom_days") {
      const step = Math.max(1, rule.interval_count || 1);
      const diff = Math.round((cursor.getTime() - anchorDay.getTime()) / 86400000);
      matches = diff >= 0 && diff % step === 0;
    }

    if (matches) out.push(new Date(cursor));
    cursor = addDays(cursor, 1);
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    let ruleId: string | null = null;
    try {
      const body = await req.json();
      ruleId = body?.rule_id ?? null;
    } catch (_) { /* scheduled call with no body */ }

    let query = supabase.from("event_recurrence_rules").select("*").eq("is_active", true);
    if (ruleId) query = query.eq("id", ruleId);
    const { data: rules, error: rulesError } = await query;
    if (rulesError) throw rulesError;

    const now = new Date();
    let created = 0;
    const results: Record<string, number> = {};

    for (const rule of (rules ?? []) as Rule[]) {
      // Deactivate finished series
      if (rule.end_date && new Date(`${rule.end_date}T23:59:59Z`) < now) {
        await supabase.from("event_recurrence_rules").update({ is_active: false }).eq("id", rule.id);
        continue;
      }

      if (!rule.template_event_id) continue;
      const { data: template, error: tplError } = await supabase
        .from("events").select("*").eq("id", rule.template_event_id).maybeSingle();
      if (tplError) throw tplError;
      if (!template) continue;

      const anchor = new Date(template.start_datetime);
      const from = anchor > now ? anchor : now;
      const to = addDays(now, Math.max(1, rule.lead_time_days || 30));

      const dates = occurrenceDates(rule, from, to, anchor);
      if (dates.length === 0) {
        await supabase.from("event_recurrence_rules")
          .update({ last_generated_until: ymd(to) }).eq("id", rule.id);
        continue;
      }

      // Existing occurrences for this rule in range
      const { data: existing } = await supabase
        .from("events")
        .select("start_datetime")
        .eq("recurrence_rule_id", rule.id)
        .gte("start_datetime", startOfDay(from).toISOString())
        .lte("start_datetime", addDays(to, 1).toISOString());
      const taken = new Set((existing ?? []).map((e: { start_datetime: string }) => e.start_datetime.slice(0, 10)));

      for (const date of dates) {
        const day = ymd(date);
        if (taken.has(day)) continue;
        if (day === ymd(anchor) && template.recurrence_rule_id === rule.id) continue;

        const startISO = new Date(`${day}T${(rule.start_time || "09:00:00").slice(0, 8)}Z`).toISOString();
        const endISO = new Date(new Date(startISO).getTime() + (rule.duration_minutes || 120) * 60000).toISOString();

        const { data: inserted, error: insertError } = await supabase.from("events").insert({
          name: template.name,
          name_fr: template.name_fr,
          description: template.description,
          description_fr: template.description_fr,
          category: template.category,
          start_datetime: startISO,
          end_datetime: endISO,
          location_name: template.location_name,
          location_name_fr: template.location_name_fr,
          address: template.address,
          address_fr: template.address_fr,
          image_url: template.image_url,
          image_url_fr: template.image_url_fr,
          capacity: template.capacity,
          cost: template.cost,
          cost_currency_code: template.cost_currency_code,
          whatsapp_contact: template.whatsapp_contact,
          organizer_name: template.organizer_name,
          organizer_email: template.organizer_email,
          organizer_phone: template.organizer_phone,
          requirements: template.requirements,
          requirements_fr: template.requirements_fr,
          is_public: template.is_public,
          is_featured: false,
          status: "Upcoming",
          region_id: rule.region_id,
          dcg_id: rule.dcg_id,
          created_by: rule.created_by,
          recurrence_rule_id: rule.id,
          is_recurring_instance: true,
        }).select("id, name, start_datetime").single();

        if (insertError) {
          if (insertError.code === "23505") continue; // duplicate slot
          console.error("insert event failed", insertError);
          continue;
        }

        // Attendance session for the occurrence
        const { error: aeError } = await supabase.from("attendance_events").insert({
          name: inserted.name,
          event_date: day,
          source_event_id: inserted.id,
          region_id: rule.region_id,
          dcg_id: rule.dcg_id,
          created_by: rule.created_by,
        });
        if (aeError) console.error("attendance_events insert failed", aeError);

        created++;
        results[rule.id] = (results[rule.id] ?? 0) + 1;
      }

      await supabase.from("event_recurrence_rules")
        .update({ last_generated_until: ymd(to) }).eq("id", rule.id);
    }

    return new Response(JSON.stringify({ success: true, created, per_rule: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-recurring-events error", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
