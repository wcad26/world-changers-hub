import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const digitsOnly = (s: string) => (s || "").replace(/\D/g, "");

// Inverse relationship label from the perspective of the OTHER party.
// e.g. if A.member_id -> B.related_member_id with type "parent",
// then from B's perspective A is their "child"? No — A is parent, so B sees A as "parent"
// of? Wait: the row says member A is "parent" of B. So when we view from B,
// A is B's parent → relationship_type from B's perspective is "parent".
// But when fetching relations for primary P, if row is (P, X, "parent") → X is P's parent.
// If row is (X, P, "parent") → X is P's child (because X is parent of someone? no, X is parent of P? row means X is "parent" relating to P).
// Convention used elsewhere: relationship_type describes member_id's relation to related_member_id.
// i.e. row (A,B,"parent") = "A is parent of B". So from primary P:
//   - row (P, X, t): P is t of X  → X's relation to P is the inverse of t
//   - row (X, P, t): X is t of P  → X's relation to P is t
const INVERSE: Record<string, string> = {
  spouse: "spouse",
  sibling: "sibling",
  parent: "child",
  child: "parent",
  guardian: "other",
  other: "other",
};

function calcAge(dob?: string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  return a;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const emailRaw = String(body?.email ?? "").trim().toLowerCase();
    const phoneRaw = String(body?.phone ?? "").trim();
    const phoneDigits = digitsOnly(phoneRaw);
    const eventIdRaw = String(body?.event_id ?? "").trim();
    const eventId = eventIdRaw || null;

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
      const { data: profiles } = await admin
        .from("profiles")
        .select("id, first_name, last_name, email, phone, date_of_birth")
        .not("phone", "is", null)
        .limit(2000);
      profile = (profiles ?? []).find((p: any) =>
        digitsOnly(p.phone || "").endsWith(phoneDigits.slice(-9))
      ) || null;
    }

    if (!profile) return json({ found: false, member: null, relations: [] });

    const { data: member } = await admin
      .from("members")
      .select("id, member_type, region_id, member_id")
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (!member) return json({ found: false, member: null, relations: [] });

    // Fetch member_relationships from BOTH sides (mirrors fetchMemberRelationshipsForMembers).
    const [byMember, byRelated] = await Promise.all([
      admin
        .from("member_relationships")
        .select("member_id, related_member_id, relationship_type")
        .eq("member_id", member.id),
      admin
        .from("member_relationships")
        .select("member_id, related_member_id, relationship_type")
        .eq("related_member_id", member.id),
    ]);

    type Rel = { other_id: string; relationship_type: string };
    const relMap = new Map<string, Rel>();
    (byMember.data || []).forEach((r: any) => {
      // member.id is on the member_id side -> primary's relation to other is r.relationship_type,
      // other's relation to primary is inverse.
      const other = r.related_member_id;
      if (!relMap.has(other)) {
        relMap.set(other, { other_id: other, relationship_type: INVERSE[r.relationship_type] || "other" });
      }
    });
    (byRelated.data || []).forEach((r: any) => {
      // member.id is on the related_member_id side -> other is r.member_id,
      // other's relation to primary is r.relationship_type (as stored).
      const other = r.member_id;
      if (!relMap.has(other)) {
        relMap.set(other, { other_id: other, relationship_type: r.relationship_type || "other" });
      }
    });

    let relations: any[] = [];
    if (relMap.size > 0) {
      const otherIds = Array.from(relMap.keys());
      const { data: relMembers } = await admin
        .from("members")
        .select("id, profile_id, member_type, profiles:profile_id(first_name, last_name, email, phone, date_of_birth)")
        .in("id", otherIds);
      relations = (relMembers || []).map((rm: any) => {
        const r = relMap.get(rm.id)!;
        const dob = rm.profiles?.date_of_birth || null;
        const age = calcAge(dob);
        return {
          member_id: rm.id,
          profile_id: rm.profile_id,
          first_name: rm.profiles?.first_name || "",
          last_name: rm.profiles?.last_name || "",
          email: rm.profiles?.email || "",
          phone: rm.profiles?.phone || "",
          date_of_birth: dob,
          is_child: age !== null && age < 16,
          relationship_type: r.relationship_type,
        };
      });
    }

    // Optional: existing pre-registration for this event
    let existing_registration: any = null;
    if (eventId) {
      const { data: myReg } = await admin
        .from("event_pre_registrations")
        .select("id, group_id, is_primary, needs_lodging, lodging_party_size, meal_preferences, dietary_notes, arrival_date, departure_date, phone, pledge_amount, pledge_currency_code")
        .eq("event_id", eventId)
        .eq("member_id", member.id)
        .maybeSingle();
      if (myReg) {
        let familyRegs: any[] = [];
        if (myReg.group_id) {
          const { data: groupRows } = await admin
            .from("event_pre_registrations")
            .select("member_id, is_primary")
            .eq("event_id", eventId)
            .eq("group_id", myReg.group_id);
          const otherIds = (groupRows || [])
            .filter((r: any) => r.member_id !== member.id)
            .map((r: any) => r.member_id);
          if (otherIds.length) {
            const { data: famMembers } = await admin
              .from("members")
              .select("id, profile_id, profiles:profile_id(first_name, last_name, email, phone, date_of_birth)")
              .in("id", otherIds);

            // Determine each other's relationship to primary using member_relationships
            const [byMember2, byRelated2] = await Promise.all([
              admin
                .from("member_relationships")
                .select("member_id, related_member_id, relationship_type")
                .eq("member_id", member.id)
                .in("related_member_id", otherIds),
              admin
                .from("member_relationships")
                .select("member_id, related_member_id, relationship_type")
                .eq("related_member_id", member.id)
                .in("member_id", otherIds),
            ]);
            const relTypeMap = new Map<string, string>();
            (byMember2.data || []).forEach((r: any) => {
              if (!relTypeMap.has(r.related_member_id)) {
                relTypeMap.set(r.related_member_id, INVERSE[r.relationship_type] || "other");
              }
            });
            (byRelated2.data || []).forEach((r: any) => {
              if (!relTypeMap.has(r.member_id)) {
                relTypeMap.set(r.member_id, r.relationship_type || "other");
              }
            });

            familyRegs = (famMembers || []).map((fm: any) => {
              const dob = fm.profiles?.date_of_birth || null;
              const age = calcAge(dob);
              return {
                member_id: fm.id,
                first_name: fm.profiles?.first_name || "",
                last_name: fm.profiles?.last_name || "",
                email: fm.profiles?.email || "",
                phone: fm.profiles?.phone || "",
                date_of_birth: dob,
                is_child: age !== null && age < 16,
                relationship_type: relTypeMap.get(fm.id) || "other",
              };
            });
          }
        }
        existing_registration = {
          id: myReg.id,
          is_primary: !!myReg.is_primary,
          group_id: myReg.group_id,
          needs_lodging: myReg.needs_lodging,
          lodging_party_size: myReg.lodging_party_size,
          meal_preferences: myReg.meal_preferences || [],
          dietary_notes: myReg.dietary_notes,
          arrival_date: myReg.arrival_date,
          departure_date: myReg.departure_date,
          phone: myReg.phone,
          pledge_amount: myReg.pledge_amount,
          pledge_currency_code: myReg.pledge_currency_code,
          family: familyRegs,
        };
      }
    }

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
      relations,
      existing_registration,
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
