import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ResolveResult {
  code: string;
  member_id?: string;
  display_name?: string;
  member_code?: string;
  error?: string;
}

/**
 * Badges encode `members.id` directly. This is the shortest possible resolution
 * path because `attendance_records.member_id` FKs to `members.id`, so no
 * translation is needed to mark attendance.
 *
 * Kept for backwards compatibility only:
 *   - `/verify/CODE` URLs → look up via `certificates.verification_code`.
 */
function parseCode(raw: string): { kind: "member" | "verification"; value: string } | null {
  const s = (raw || "").trim();
  if (!s) return null;
  if (UUID_RE.test(s)) return { kind: "member", value: s };
  const verifyMatch = s.match(/\/verify\/([A-Z0-9]+)/i);
  if (verifyMatch) return { kind: "verification", value: verifyMatch[1].toUpperCase() };
  if (/^[A-Z0-9]{6,}$/i.test(s)) return { kind: "verification", value: s.toUpperCase() };
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => ({}));
    const codes: string[] = Array.isArray(body?.codes) ? body.codes : [];
    if (codes.length === 0) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = codes.map((c) => ({ raw: c, parsed: parseCode(c) }));

    const memberIds = new Set<string>();
    const verifCodes = new Set<string>();
    for (const p of parsed) {
      if (!p.parsed) continue;
      if (p.parsed.kind === "member") memberIds.add(p.parsed.value);
      else if (p.parsed.kind === "verification") verifCodes.add(p.parsed.value);
    }

    // Backwards-compat: translate verification codes → members.id.
    const verifToMember = new Map<string, string>();
    if (verifCodes.size > 0) {
      const { data, error } = await supabase
        .from("certificates")
        .select("verification_code, member_id")
        .in("verification_code", Array.from(verifCodes));
      if (error) console.error("cert lookup error", error);
      for (const r of (data as any[]) || []) {
        if (r.member_id) {
          verifToMember.set(r.verification_code, r.member_id);
          memberIds.add(r.member_id);
        }
      }
    }

    // Single hot-path lookup: members + profiles.
    const memberInfo = new Map<string, { name: string; code: string }>();
    if (memberIds.size > 0) {
      const { data: members, error: mErr } = await supabase
        .from("members")
        .select("id, member_id, profile_id")
        .in("id", Array.from(memberIds));
      if (mErr) console.error("members lookup error", mErr);

      const profileIds = Array.from(
        new Set(((members as any[]) || []).map((m) => m.profile_id).filter(Boolean)),
      );

      const profileMap = new Map<string, { first: string; last: string }>();
      if (profileIds.length > 0) {
        const { data: profiles, error: pErr } = await supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .in("id", profileIds);
        if (pErr) console.error("profiles lookup error", pErr);
        for (const p of (profiles as any[]) || []) {
          profileMap.set(p.id, { first: p.first_name || "", last: p.last_name || "" });
        }
      }

      for (const m of (members as any[]) || []) {
        const p = m.profile_id ? profileMap.get(m.profile_id) : undefined;
        // Global convention: "Last Name First Name".
        const name = p ? `${p.last} ${p.first}`.trim() : "";
        memberInfo.set(m.id, { name: name || "Unknown", code: m.member_id || "" });
      }
    }

    const results: ResolveResult[] = parsed.map(({ raw, parsed: p }) => {
      if (!p) return { code: raw, error: "unrecognized_code" };
      if (p.kind === "member") {
        const m = memberInfo.get(p.value);
        return m
          ? { code: raw, member_id: p.value, display_name: m.name, member_code: m.code }
          : { code: raw, error: "member_not_found" };
      }
      // verification
      const mid = verifToMember.get(p.value);
      if (!mid) return { code: raw, error: "verification_not_found" };
      const m = memberInfo.get(mid);
      return {
        code: raw,
        member_id: mid,
        display_name: m?.name || "Unknown",
        member_code: m?.code || "",
      };
    });

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("attendance-scan-resolve error", e);
    return new Response(JSON.stringify({ error: e?.message || "internal_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
