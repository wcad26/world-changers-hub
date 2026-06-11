// Unified special-event registration: onboard (if needed) + signal interest.
// Accepts a primary registrant (existing member_id, or new visitor/member payload)
// plus optional family entries (existing or new), lodging/meals/pledge info.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Relationship = { relationship_type: string; member_ids: string[] };

type NewRegistrant = {
  type?: "member" | "visitor";
  attendee_type?: "member" | "visitor";
  region_id?: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  occupation?: string | null;
  // member-only
  has_completed_foundation_school?: string | null;
  foundation_school_date?: string | null;
  is_baptized?: string | null;
  baptism_date?: string | null;
  ministry_interests?: string[];
  dcg_id?: string | null;
  relationships?: Relationship[];
  // visitor-only
  referral_source?: string | null;
  referral_social_media?: string | null;
  referral_member_ids?: string[];
  referral_relationship_type?: string | null;
  referral_other_details?: string | null;
  join_interest?: string | null;
  // child indicator (auto-detected from DOB but allow explicit)
  is_child?: boolean;
};

type FamilyEntry = {
  relationship_type: string;
  existing_member_id?: string | null;
  new_registrant?: NewRegistrant | null;
  is_child?: boolean;
};

const VALID_RELS = ["spouse", "parent", "child", "sibling", "guardian", "other"];

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
    const event_id = String(body?.event_id ?? "");
    if (!event_id) return json({ error: "Missing event_id" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Validate event
    const { data: event, error: evErr } = await admin
      .from("events")
      .select("id, capacity, region_id, is_special, requires_pre_registration, collect_lodging, collect_meal_preferences, collect_pledges, linked_fundraising_campaign_id")
      .eq("id", event_id)
      .maybeSingle();
    if (evErr || !event) return json({ error: "Event not found" }, 404);
    if (!event.is_special) return json({ error: "Not a special event" }, 400);

    // === PRIMARY ===
    const primaryExistingId: string | null = body?.primary_member_id || null;
    const primaryNew: NewRegistrant | null = body?.primary_new || null;

    const primaryMember = await resolveOrCreateMember(admin, {
      existing_member_id: primaryExistingId,
      new_registrant: primaryNew,
      fallback_region_id: event.region_id,
      source_event_id: event_id,
    });
    if (!primaryMember) return json({ error: "Primary registrant could not be resolved" }, 400);

    // === FAMILY ===
    const familyInput: FamilyEntry[] = Array.isArray(body?.family) ? body.family : [];
    const familyResolved: { entry: FamilyEntry; member: { id: string; profile_id: string; email?: string } }[] = [];
    for (const f of familyInput) {
      if (!VALID_RELS.includes((f.relationship_type || "").toLowerCase())) {
        return json({ error: `Invalid relationship_type: ${f.relationship_type}` }, 400);
      }
      const m = await resolveOrCreateMember(admin, {
        existing_member_id: f.existing_member_id || null,
        new_registrant: f.new_registrant || null,
        fallback_region_id: event.region_id,
        source_event_id: event_id,
      });
      if (!m) return json({ error: "A family member could not be resolved" }, 400);
      familyResolved.push({ entry: f, member: m });
    }

    // Capacity
    if (event.capacity) {
      const { count } = await admin
        .from("event_pre_registrations")
        .select("id", { count: "exact", head: true })
        .eq("event_id", event_id);
      const total = (count ?? 0) + 1 + familyResolved.length;
      if (total > event.capacity) return json({ error: "Event capacity reached" }, 409);
    }

    const groupId = familyResolved.length > 0 ? crypto.randomUUID() : null;
    const registration_type = familyResolved.length > 0 ? "family" : "individual";

    const meals: string[] = Array.isArray(body?.meal_preferences) ? body.meal_preferences : [];
    const lodging = !!body?.needs_lodging;
    const lodgingPartySize = body?.lodging_party_size ?? null;
    const arrival_date = body?.arrival_date || null;
    const departure_date = body?.departure_date || null;
    const dietary_notes = body?.dietary_notes || null;
    const pledge_amount = body?.pledge_amount ?? null;
    const pledge_currency_code = body?.pledge_currency_code || null;

    const baseRow = {
      event_id,
      registration_type,
      group_id: groupId,
      attending_with_family: familyResolved.length > 0,
      has_children: familyResolved.some(f => f.entry.is_child),
      needs_lodging: lodging,
      lodging_party_size: lodgingPartySize,
      meal_preferences: meals.length ? meals : null,
      dietary_notes,
      arrival_date,
      departure_date,
    };

    const rows = [
      {
        ...baseRow,
        member_id: primaryMember.id,
        is_primary: true,
        email: primaryMember.email || null,
        phone: body?.primary_phone || null,
        pledge_amount,
        pledge_currency_code,
        pledge_status: pledge_amount ? "pledged" : null,
      },
      ...familyResolved.map(f => ({
        ...baseRow,
        member_id: f.member.id,
        is_primary: false,
        email: f.member.email || null,
        phone: null as string | null,
      })),
    ];

    const { error: insErr, data: inserted } = await admin
      .from("event_pre_registrations")
      .upsert(rows, { onConflict: "event_id,member_id", ignoreDuplicates: false })
      .select("id, member_id, is_primary");

    if (insErr) return json({ error: insErr.message }, 500);

    // Member relationships between primary and family.
    if (familyResolved.length > 0) {
      const relatedIds = familyResolved.map(f => f.member.id);
      const [byMember, byRelated] = await Promise.all([
        admin
          .from("member_relationships")
          .select("member_id, related_member_id")
          .eq("member_id", primaryMember.id)
          .in("related_member_id", relatedIds),
        admin
          .from("member_relationships")
          .select("member_id, related_member_id")
          .eq("related_member_id", primaryMember.id)
          .in("member_id", relatedIds),
      ]);
      const has = new Set<string>();
      const collect = (rows: any[] | null | undefined) => {
        (rows ?? []).forEach((r: any) => {
          has.add(`${r.member_id}|${r.related_member_id}`);
          has.add(`${r.related_member_id}|${r.member_id}`);
        });
      };
      collect(byMember.data as any[]);
      collect(byRelated.data as any[]);
      const toInsert = familyResolved
        .filter(f => !has.has(`${primaryMember!.id}|${f.member.id}`))
        .map(f => ({
          member_id: primaryMember!.id,
          related_member_id: f.member.id,
          relationship_type: (f.entry.relationship_type || "other").toLowerCase(),
        }));
      if (toInsert.length) await admin.from("member_relationships").insert(toInsert);
    }

    return json({
      success: true,
      registered: rows.length,
      group_id: groupId,
      primary_member_id: primaryMember.id,
      pre_registration_ids: (inserted ?? []).map((r: any) => r.id),
    });
  } catch (e: any) {
    console.error("event-special-register error:", e);
    return json({ error: String(e?.message ?? e) }, 500);
  }
});

// --- Helpers ---

async function resolveOrCreateMember(
  admin: any,
  args: {
    existing_member_id?: string | null;
    new_registrant?: NewRegistrant | null;
    fallback_region_id?: string | null;
    source_event_id?: string | null;
  }
): Promise<{ id: string; profile_id: string; email?: string } | null> {
  if (args.existing_member_id) {
    const { data: m } = await admin
      .from("members")
      .select("id, profile_id, profiles:profile_id(email)")
      .eq("id", args.existing_member_id)
      .maybeSingle();
    if (m) return { id: m.id, profile_id: m.profile_id, email: m.profiles?.email };
    return null;
  }

  const nr = args.new_registrant;
  if (!nr) return null;

  // Per-registrant region wins; falls back to event region, then any region.
  let region_id: string | null = nr.region_id || args.fallback_region_id || null;
  if (!region_id) {
    const { data: r } = await admin.from("regions").select("id").limit(1).maybeSingle();
    region_id = r?.id || null;
  }
  if (!region_id) return null;

  // Check existing profile by email — reuse and create a member in this region if missing.
  const email = (nr.email || "").trim().toLowerCase();
  let profileId: string | null = null;
  if (email) {
    const { data: existingProfile } = await admin
      .from("profiles").select("id, email").ilike("email", email).maybeSingle();
    if (existingProfile) {
      profileId = existingProfile.id;
      const { data: existingMember } = await admin
        .from("members").select("id, profile_id").eq("profile_id", existingProfile.id).maybeSingle();
      if (existingMember) {
        return { id: existingMember.id, profile_id: existingMember.profile_id, email };
      }
    }
  }

  // Create profile if needed
  if (!profileId) {
    profileId = crypto.randomUUID();
    const { error: profErr } = await admin.from("profiles").insert({
      id: profileId,
      first_name: nr.first_name,
      last_name: nr.last_name,
      email: email || null,
      phone: nr.phone || null,
      address: nr.address || null,
      date_of_birth: nr.date_of_birth || null,
      gender: nr.gender ? String(nr.gender).toLowerCase() : null,
      occupation: nr.occupation || null,
      region_id,
    });
    if (profErr) {
      console.error("profile insert failed", profErr);
      return null;
    }
  }

  // Decide member_type: member only when explicitly chosen AND foundation school done.
  const requestedType = nr.attendee_type || nr.type || "visitor";
  const memberType =
    requestedType === "member" && nr.has_completed_foundation_school === "yes"
      ? "member"
      : "visitor";

  const { data: memberIdGen } = await admin.rpc("generate_member_id", { _region_id: region_id });

  const memberInsert: any = {
    profile_id: profileId,
    member_id: memberIdGen,
    region_id,
    member_type: memberType,
    status: "new",
    join_date: new Date().toISOString().split("T")[0],
    membership_class_completed: nr.has_completed_foundation_school === "yes",
    foundation_school_date:
      nr.has_completed_foundation_school === "yes" && nr.foundation_school_date
        ? nr.foundation_school_date
        : null,
    baptism_date: nr.is_baptized === "yes" && nr.baptism_date ? nr.baptism_date : null,
    preferred_service_areas:
      Array.isArray(nr.ministry_interests) && nr.ministry_interests.length
        ? nr.ministry_interests
        : null,
  };

  // Visitor-specific fields
  if (requestedType !== "member") {
    memberInsert.referral_source = nr.referral_source || null;
    memberInsert.referral_other_details = nr.referral_other_details || null;
    memberInsert.join_interest = nr.join_interest || null;
    if (args.source_event_id) memberInsert.rated_event_id = args.source_event_id;
  }

  const { data: newMember, error: memErr } = await admin
    .from("members").insert(memberInsert).select("id, profile_id").single();

  if (memErr) {
    console.error("member insert failed", memErr);
    return null;
  }

  // DCG (member only)
  if (requestedType === "member" && nr.dcg_id) {
    await admin.from("dcg_members").insert({
      dcg_id: nr.dcg_id,
      member_id: newMember.id,
      role: "Member",
      is_active: true,
      joined_date: new Date().toISOString().split("T")[0],
    });
  }

  // Member family relationships (member only)
  if (requestedType === "member" && Array.isArray(nr.relationships)) {
    for (const rel of nr.relationships) {
      if (!rel?.relationship_type || !Array.isArray(rel.member_ids) || rel.member_ids.length === 0) continue;
      const rows = rel.member_ids.map((rid) => ({
        member_id: newMember.id,
        related_member_id: rid,
        relationship_type: rel.relationship_type,
      }));
      await admin.from("member_relationships").insert(rows);
    }
  }

  // Visitor referral relationships
  if (
    requestedType !== "member" &&
    Array.isArray(nr.referral_member_ids) &&
    nr.referral_member_ids.length > 0 &&
    nr.referral_relationship_type
  ) {
    const rows = nr.referral_member_ids.map((rid) => ({
      member_id: newMember.id,
      related_member_id: rid,
      relationship_type: nr.referral_relationship_type,
    }));
    await admin.from("member_relationships").insert(rows);
  }

  return { id: newMember.id, profile_id: newMember.profile_id, email };
}
