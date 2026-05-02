import { differenceInYears } from 'date-fns';

export const CHILD_AGE_THRESHOLD = 16;

export interface MemberRelationshipLite {
  member_id: string;
  related_member_id: string;
}

/**
 * A member is a child when BOTH conditions hold:
 *   1. DOB indicates age < CHILD_AGE_THRESHOLD (16), AND
 *   2. They have at least one row in `member_relationships` linking them to
 *      another member who is an adult.
 *
 * `adultDobLookup` (optional) maps memberId → date_of_birth so this helper can
 * verify the related party is an adult. When the lookup is provided, a related
 * member with no DOB on file is treated as an adult. When the lookup is omitted
 * (call sites without the full member list) we fall back to "any relationship
 * row counts" — the strict adult check is still enforced at every dashboard /
 * reporting layer where the lookup IS supplied.
 */
export const isChildMember = (
  dateOfBirth: string | null | undefined,
  memberId: string,
  relationships: MemberRelationshipLite[],
  adultDobLookup?: Map<string, string | null | undefined>
): boolean => {
  if (!dateOfBirth) return false;
  const age = differenceInYears(new Date(), new Date(dateOfBirth));
  if (age >= CHILD_AGE_THRESHOLD) return false;

  // Collect every related member id (relationships are bi-directional in spirit).
  const relatedIds: string[] = [];
  for (const r of relationships) {
    if (r.member_id === memberId) relatedIds.push(r.related_member_id);
    else if (r.related_member_id === memberId) relatedIds.push(r.member_id);
  }
  if (relatedIds.length === 0) return false;

  if (!adultDobLookup) return true; // best-effort fallback

  return relatedIds.some(id => {
    const dob = adultDobLookup.get(id);
    if (!dob) return true; // unknown DOB → treat as adult
    return differenceInYears(new Date(), new Date(dob)) >= CHILD_AGE_THRESHOLD;
  });
};

/**
 * Simple age-only check (used by the attendance trend graph where
 * relationship data per record is unavailable).
 */
export const isUnderChildAge = (dateOfBirth: string | null | undefined): boolean => {
  if (!dateOfBirth) return false;
  return differenceInYears(new Date(), new Date(dateOfBirth)) < CHILD_AGE_THRESHOLD;
};

/**
 * Convenience helper: given a list of members and the relationship rows that
 * touch them, return a Set of member ids that satisfy the strict child rule
 * (age < 16 AND linked to at least one adult via member_relationships).
 *
 * Use this in every report/KPI surface so children are NEVER counted as
 * members or visitors.
 */
export const buildChildrenSet = (
  members: Array<{ id: string; profiles?: { date_of_birth?: string | null } | null; date_of_birth?: string | null }>,
  relationships: MemberRelationshipLite[]
): Set<string> => {
  const adultDobLookup = new Map<string, string | null | undefined>();
  members.forEach(m => {
    const dob = m.profiles?.date_of_birth ?? m.date_of_birth ?? null;
    adultDobLookup.set(m.id, dob);
  });

  const childrenSet = new Set<string>();
  members.forEach(m => {
    const dob = m.profiles?.date_of_birth ?? m.date_of_birth ?? null;
    if (isChildMember(dob, m.id, relationships, adultDobLookup)) {
      childrenSet.add(m.id);
    }
  });
  return childrenSet;
};
