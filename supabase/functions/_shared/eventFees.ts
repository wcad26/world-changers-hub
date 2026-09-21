// Shared server-side resolution of event registration fee categories.
// The browser never decides a category: leader/child status is computed here.

export type FeeCategory = "leader" | "member" | "child" | "family";

export type FeeRow = {
  category: FeeCategory;
  label: string | null;
  amount: number; // minor units
  currency_code: string;
};

export async function loadEventFees(admin: any, eventId: string): Promise<FeeRow[]> {
  const { data } = await admin
    .from("event_registration_fees")
    .select("category, label, amount, currency_code, sort_order")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });
  return (data || []).map((r: any) => ({
    category: r.category as FeeCategory,
    label: r.label ?? null,
    amount: Number(r.amount) || 0,
    currency_code: r.currency_code || "",
  }));
}

export function feeFor(fees: FeeRow[], category: FeeCategory) {
  return fees.find((f) => f.category === category) || null;
}

const ageFrom = (dob?: string | null): number | null => {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  return a;
};

const ADMIN_ROLES = ["super_admin", "regional_admin", "dcg_admin"];

/**
 * Resolve the fee category for a set of existing members.
 * Priority: child → leader → member.
 */
export async function resolveCategoriesForMembers(
  admin: any,
  memberIds: string[],
): Promise<Record<string, FeeCategory>> {
  const out: Record<string, FeeCategory> = {};
  const ids = Array.from(new Set(memberIds.filter(Boolean)));
  if (ids.length === 0) return out;

  const { data: members } = await admin
    .from("members")
    .select("id, profile_id, profiles:profile_id(date_of_birth)")
    .in("id", ids);

  const dobById = new Map<string, string | null>();
  const profileByMember = new Map<string, string | null>();
  (members || []).forEach((m: any) => {
    dobById.set(m.id, m.profiles?.date_of_birth ?? null);
    profileByMember.set(m.id, m.profile_id ?? null);
  });

  // --- Leader: any active admin role on the linked profile/auth user.
  const profileIds = Array.from(new Set(Array.from(profileByMember.values()).filter(Boolean))) as string[];
  const leaderProfiles = new Set<string>();
  if (profileIds.length) {
    const [ur, rur, sur] = await Promise.all([
      admin.from("user_roles").select("user_id, role, status").in("user_id", profileIds),
      admin.from("regional_user_roles").select("user_id, is_active").in("user_id", profileIds),
      admin.from("super_admin_user_roles").select("user_id, is_active").in("user_id", profileIds),
    ]);
    (ur.data || []).forEach((r: any) => {
      const active = !r.status || r.status === "active";
      if (active && ADMIN_ROLES.includes(String(r.role))) leaderProfiles.add(r.user_id);
    });
    (rur.data || []).forEach((r: any) => { if (r.is_active !== false) leaderProfiles.add(r.user_id); });
    (sur.data || []).forEach((r: any) => { if (r.is_active !== false) leaderProfiles.add(r.user_id); });
  }

  // --- Child: under 16 AND linked to an adult family member.
  const youngIds = ids.filter((id) => {
    const a = ageFrom(dobById.get(id) ?? null);
    return a !== null && a < 16;
  });
  const childIds = new Set<string>();
  if (youngIds.length) {
    const [a, b] = await Promise.all([
      admin.from("member_relationships").select("member_id, related_member_id").in("member_id", youngIds),
      admin.from("member_relationships").select("member_id, related_member_id").in("related_member_id", youngIds),
    ]);
    const links = new Map<string, string[]>();
    const add = (k: string, v: string) => links.set(k, [...(links.get(k) || []), v]);
    (a.data || []).forEach((r: any) => add(r.member_id, r.related_member_id));
    (b.data || []).forEach((r: any) => add(r.related_member_id, r.member_id));

    const counterpartIds = Array.from(new Set(Array.from(links.values()).flat()));
    const counterpartDob = new Map<string, string | null>();
    if (counterpartIds.length) {
      const { data: cps } = await admin
        .from("members")
        .select("id, profiles:profile_id(date_of_birth)")
        .in("id", counterpartIds);
      (cps || []).forEach((m: any) => counterpartDob.set(m.id, m.profiles?.date_of_birth ?? null));
    }
    youngIds.forEach((id) => {
      const related = links.get(id) || [];
      const hasAdult = related.some((rid) => {
        const age = ageFrom(counterpartDob.get(rid) ?? null);
        return age === null || age >= 16;
      });
      if (hasAdult) childIds.add(id);
    });
  }

  ids.forEach((id) => {
    if (childIds.has(id)) out[id] = "child";
    else {
      const pid = profileByMember.get(id);
      out[id] = pid && leaderProfiles.has(pid) ? "leader" : "member";
    }
  });
  return out;
}

/** Category for someone who does not exist in the system yet. */
export function categoryForNewRegistrant(args: { date_of_birth?: string | null; is_child?: boolean; hasFamily?: boolean }): FeeCategory {
  const age = ageFrom(args.date_of_birth ?? null);
  if ((age !== null && age < 16 && args.hasFamily !== false) || args.is_child) return "child";
  return "member";
}
