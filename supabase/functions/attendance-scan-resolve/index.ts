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

function parseCode(raw: string): { kind: "member" | "prereg" | "verification"; value: string } | null {
  const s = (raw || "").trim();
  if (!s) return null;
  // /verify/<CODE>
  const verifyMatch = s.match(/\/verify\/([A-Z0-9]+)/i);
  if (verifyMatch) return { kind: "verification", value: verifyMatch[1].toUpperCase() };
  // pre_reg:<uuid>
  if (s.toLowerCase().startsWith("pre_reg:")) {
    const v = s.split(":")[1]?.trim();
    if (v && UUID_RE.test(v)) return { kind: "prereg", value: v };
  }
  // raw uuid → member
  if (UUID_RE.test(s)) return { kind: "member", value: s };
  // otherwise assume verification code (short alphanumeric)
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

    const body = await req.json();
    const codes: string[] = Array.isArray(body?.codes) ? body.codes : [];
    if (codes.length === 0) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const memberIds = new Set<string>();
    const preregIds = new Set<string>();
    const verifCodes = new Set<string>();
    const parsed = codes.map((c) => ({ raw: c, parsed: parseCode(c) }));

    for (const p of parsed) {
      if (!p.parsed) continue;
      if (p.parsed.kind === "member") memberIds.add(p.parsed.value);
      else if (p.parsed.kind === "prereg") preregIds.add(p.parsed.value);
      else if (p.parsed.kind === "verification") verifCodes.add(p.parsed.value);
    }

    // Resolve verification codes to member_id via certificates
    const verifToMember = new Map<string, string>();
    if (verifCodes.size > 0) {
      const { data } = await supabase
        .from("certificates")
        .select("verification_code, member_id")
        .in("verification_code", Array.from(verifCodes));
      for (const r of data || []) {
        if ((r as any).member_id) {
          verifToMember.set((r as any).verification_code, (r as any).member_id);
          memberIds.add((r as any).member_id);
        }
      }
    }

    // Bulk load members with profile
    const membersById = new Map<string, { name: string; code: string }>();
    if (memberIds.size > 0) {
      const { data } = await supabase
        .from("members")
        .select("id, member_id, profiles(first_name, last_name)")
        .in("id", Array.from(memberIds));
      for (const m of data || []) {
        const p = (m as any).profiles || {};
        const name = `${p.last_name || ""} ${p.first_name || ""}`.trim() || "Unknown";
        membersById.set((m as any).id, { name, code: (m as any).member_id });
      }
    }

    // Pre-registration → look up matching member by email/phone
    const preregToMember = new Map<string, { member_id: string; name: string; code: string }>();
    if (preregIds.size > 0) {
      const { data: pregs } = await supabase
        .from("event_pre_registrations")
        .select("id, first_name, last_name, email, phone")
        .in("id", Array.from(preregIds));
      for (const pr of pregs || []) {
        const nm = `${(pr as any).last_name || ""} ${(pr as any).first_name || ""}`.trim() || "Guest";
        preregToMember.set((pr as any).id, { member_id: "", name: nm, code: "" });
      }
    }

    const results: ResolveResult[] = parsed.map(({ raw, parsed: p }) => {
      if (!p) return { code: raw, error: "unrecognized" };
      if (p.kind === "member") {
        const m = membersById.get(p.value);
        return m
          ? { code: raw, member_id: p.value, display_name: m.name, member_code: m.code }
          : { code: raw, error: "member_not_found" };
      }
      if (p.kind === "verification") {
        const mid = verifToMember.get(p.value);
        if (!mid) return { code: raw, error: "verification_not_found" };
        const m = membersById.get(mid);
        return { code: raw, member_id: mid, display_name: m?.name || "Unknown", member_code: m?.code };
      }
      if (p.kind === "prereg") {
        const pr = preregToMember.get(p.value);
        if (!pr) return { code: raw, error: "prereg_not_found" };
        // pre-reg-only badges cannot mark attendance without a member_id
        return { code: raw, display_name: pr.name, error: "prereg_no_member" };
      }
      return { code: raw, error: "unrecognized" };
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
