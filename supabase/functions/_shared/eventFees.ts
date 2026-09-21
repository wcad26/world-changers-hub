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

// ---------------------------------------------------------------------------
// Family unit resolution + group pricing
// ---------------------------------------------------------------------------

export const CHILD_AGE_LIMIT = 16;

export type FamilyUnit = { covered: Set<string>; separate: Set<string> };

/**
 * Decide which of the attending member ids genuinely belong to the primary
 * registrant's family unit: the spouse, and under-16 children of the primary
 * or of that spouse. Everyone else (adult friends/siblings, adult "children")
 * is billed individually. Relationships are read from the database only.
 */
export async function resolveFamilyUnit(
  admin: any,
  primaryMemberId: string,
  attendeeMemberIds: string[],
): Promise<FamilyUnit> {
  const others = Array.from(new Set(attendeeMemberIds.filter((id) => id && id !== primaryMemberId)));
  const covered = new Set<string>([primaryMemberId]);
  const separate = new Set<string>();
  if (others.length === 0) return { covered, separate };

  const all = [primaryMemberId, ...others];
  const { data: members } = await admin
    .from("members")
    .select("id, profiles:profile_id(date_of_birth)")
    .in("id", all);
  const dob = new Map<string, string | null>();
  (members || []).forEach((m: any) => dob.set(m.id, m.profiles?.date_of_birth ?? null));
  const isMinor = (id: string) => {
    const a = ageFrom(dob.get(id) ?? null);
    return a !== null && a < CHILD_AGE_LIMIT;
  };

  const [a, b] = await Promise.all([
    admin.from("member_relationships").select("member_id, related_member_id, relationship_type").in("member_id", all),
    admin.from("member_relationships").select("member_id, related_member_id, relationship_type").in("related_member_id", all),
  ]);
  type Link = { a: string; b: string; type: string };
  const links: Link[] = [];
  const push = (r: any) => links.push({ a: r.member_id, b: r.related_member_id, type: String(r.relationship_type || "") });
  (a.data || []).forEach(push);
  (b.data || []).forEach(push);

  const relatedTo = (x: string, y: string, types: string[]) =>
    links.some((l) => types.includes(l.type) && ((l.a === x && l.b === y) || (l.a === y && l.b === x)));

  // Spouse of the primary (at most one counted).
  let spouseId: string | null = null;
  for (const id of others) {
    if (relatedTo(primaryMemberId, id, ["spouse"])) { spouseId = id; break; }
  }
  if (spouseId) covered.add(spouseId);

  const PARENTAL = ["child", "parent", "guardian"];
  for (const id of others) {
    if (id === spouseId) continue;
    const parentLink = relatedTo(primaryMemberId, id, PARENTAL) || (spouseId ? relatedTo(spouseId, id, PARENTAL) : false);
    if (parentLink && isMinor(id)) covered.add(id);
    else separate.add(id);
  }

  // A family package needs at least two qualifying people.
  if (covered.size < 2) {
    covered.forEach((id) => { if (id !== primaryMemberId) separate.add(id); });
    covered.clear();
  }
  return { covered, separate };
}

export type PricedLine = {
  key: string;
  name: string;
  category: FeeCategory;
  label: string | null;
  amount: number;
  currency_code: string | null;
  covered_by_family?: boolean;
  is_family_line?: boolean;
};

export type GroupAttendee = {
  key: string;
  name?: string;
  member_id?: string | null;
  family_covered?: boolean; // for new registrants: submitted as an under-16 child
};

/**
 * Price a whole group. When the event defines a family fee and the resolved
 * family unit has 2+ people, those people share one flat family fee and
 * everyone else is priced by their own category.
 */
export function priceGroup(
  fees: FeeRow[],
  attendees: GroupAttendee[],
  categories: Record<string, FeeCategory>,
  familyCovered: Set<string>,
): { mode: "family" | "individual"; lines: PricedLine[]; total: number } {
  const familyFee = feeFor(fees, "family");
  const fallbackCurrency = fees[0]?.currency_code || null;

  const covered = attendees.filter((a) =>
    a.member_id ? familyCovered.has(a.member_id) : !!a.family_covered && familyCovered.size > 0
  );
  const useFamily = !!familyFee && covered.length >= 2;

  const individualLine = (a: GroupAttendee): PricedLine => {
    const category: FeeCategory = (a.member_id ? categories[a.member_id] : undefined) || "member";
    const fee = feeFor(fees, category);
    return {
      key: a.key,
      name: a.name || "",
      category,
      label: fee?.label ?? null,
      amount: fee?.amount ?? 0,
      currency_code: fee?.currency_code || fallbackCurrency,
    };
  };

  if (!useFamily) {
    const lines = attendees.map(individualLine);
    return { mode: "individual", lines, total: lines.reduce((s, l) => s + (l.amount || 0), 0) };
  }

  const coveredKeys = new Set(covered.map((c) => c.key));
  const lines: PricedLine[] = attendees.map((a, i) => {
    if (!coveredKeys.has(a.key)) return individualLine(a);
    const first = covered[0].key === a.key;
    return {
      key: a.key,
      name: a.name || "",
      category: "family" as FeeCategory,
      label: familyFee!.label ?? null,
      amount: first ? familyFee!.amount : 0,
      currency_code: familyFee!.currency_code || fallbackCurrency,
      covered_by_family: true,
      is_family_line: first,
    };
  });
  return { mode: "family", lines, total: lines.reduce((s, l) => s + (l.amount || 0), 0) };
}
