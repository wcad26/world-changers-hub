import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type FamilyMember = { email: string; relationship_type: string };

const VALID_RELS = ["spouse", "parent", "child", "sibling", "guardian", "other"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const event_id = String(body?.event_id ?? "");
    const registration_type = body?.registration_type === "family" ? "family" : "individual";
    const primary_email = String(body?.primary_email ?? "").trim().toLowerCase();
    const familyRaw: FamilyMember[] = Array.isArray(body?.family) ? body.family : [];

    if (!event_id || !primary_email) {
      return json({ error: "Missing event_id or primary_email" }, 400);
    }

    const family = familyRaw
      .map((f) => ({
        email: String(f?.email ?? "").trim().toLowerCase(),
        relationship_type: String(f?.relationship_type ?? "").trim().toLowerCase(),
      }))
      .filter((f) => f.email && f.email !== primary_email);

    if (registration_type === "family") {
      for (const f of family) {
        if (!VALID_RELS.includes(f.relationship_type)) {
          return json({ error: `Invalid relationship_type: ${f.relationship_type}` }, 400);
        }
      }
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Validate event
    const { data: event, error: evErr } = await admin
      .from("events")
      .select("id, capacity, is_special, requires_pre_registration, is_public")
      .eq("id", event_id)
      .maybeSingle();
    if (evErr || !event) return json({ error: "Event not found" }, 404);
    if (!event.is_public || !event.is_special || !event.requires_pre_registration) {
      return json({ error: "Pre-registration not enabled for this event" }, 400);
    }

    // Resolve all emails to members
    const emails = [primary_email, ...family.map((f) => f.email)];
    const uniqueEmails = Array.from(new Set(emails));

    const { data: profiles } = await admin
      .from("profiles")
      .select("id, email")
      .in("email", uniqueEmails);

    const profilesByEmail = new Map<string, string>();
    (profiles ?? []).forEach((p: any) => {
      if (p.email) profilesByEmail.set(String(p.email).toLowerCase(), p.id);
    });

    const profileIds = Array.from(profilesByEmail.values());
    const { data: members } = profileIds.length
      ? await admin.from("members").select("id, profile_id").in("profile_id", profileIds)
      : { data: [] as any[] };

    const memberByProfile = new Map<string, string>();
    (members ?? []).forEach((m: any) => memberByProfile.set(m.profile_id, m.id));

    const resolveMemberId = (email: string): string | null => {
      const pid = profilesByEmail.get(email);
      if (!pid) return null;
      return memberByProfile.get(pid) ?? null;
    };

    const missing: string[] = [];
    for (const e of uniqueEmails) {
      if (!resolveMemberId(e)) missing.push(e);
    }
    if (missing.length) {
      return json({ error: "Some attendees are not yet onboarded", missing }, 409);
    }

    const primaryMemberId = resolveMemberId(primary_email)!;
    const familyEntries = family.map((f) => ({
      email: f.email,
      relationship_type: f.relationship_type,
      member_id: resolveMemberId(f.email)!,
    }));

    // Capacity check
    if (event.capacity) {
      const { count } = await admin
        .from("event_pre_registrations")
        .select("id", { count: "exact", head: true })
        .eq("event_id", event_id);
      const total = (count ?? 0) + 1 + familyEntries.length;
      if (total > event.capacity) {
        return json({ error: "Event capacity reached" }, 409);
      }
    }

    const groupId = registration_type === "family" ? crypto.randomUUID() : null;

    const rows = [
      {
        event_id,
        member_id: primaryMemberId,
        registration_type,
        group_id: groupId,
        is_primary: true,
        email: primary_email,
      },
      ...familyEntries.map((f) => ({
        event_id,
        member_id: f.member_id,
        registration_type,
        group_id: groupId,
        is_primary: false,
        email: f.email,
      })),
    ];

    // Upsert with ignore-conflict semantics
    const { error: insErr } = await admin
      .from("event_pre_registrations")
      .upsert(rows, { onConflict: "event_id,member_id", ignoreDuplicates: true });
    if (insErr) return json({ error: insErr.message }, 500);

    // Create missing member_relationships rows
    if (registration_type === "family" && familyEntries.length) {
      const relatedIds = familyEntries.map((f) => f.member_id);
      const { data: existingRels } = await admin
        .from("member_relationships")
        .select("member_id, related_member_id")
        .or(
          `and(member_id.eq.${primaryMemberId},related_member_id.in.(${relatedIds.join(",")})),and(related_member_id.eq.${primaryMemberId},member_id.in.(${relatedIds.join(",")}))`,
        );

      const hasRel = new Set<string>();
      (existingRels ?? []).forEach((r: any) => {
        hasRel.add(`${r.member_id}|${r.related_member_id}`);
        hasRel.add(`${r.related_member_id}|${r.member_id}`);
      });

      const newRels = familyEntries
        .filter((f) => !hasRel.has(`${primaryMemberId}|${f.member_id}`))
        .map((f) => ({
          member_id: primaryMemberId,
          related_member_id: f.member_id,
          relationship_type: f.relationship_type,
        }));

      if (newRels.length) {
        await admin.from("member_relationships").insert(newRels);
      }
    }

    return json({ success: true, registered: rows.length });
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
