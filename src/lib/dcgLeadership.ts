export type DcgLeadershipLookup = {
  data: string | null;
  error: unknown | null;
};

export type DcgLeadershipAccess =
  | { allowed: true; dcgId: string }
  | { allowed: false; reason: 'not_leader' | 'verification_failed' };

/** Fail closed unless the database resolves an active Leader/Assistant DCG. */
export const evaluateDcgLeadership = (
  lookup: DcgLeadershipLookup,
): DcgLeadershipAccess => {
  if (lookup.error) return { allowed: false, reason: 'verification_failed' };
  if (!lookup.data) return { allowed: false, reason: 'not_leader' };
  return { allowed: true, dcgId: lookup.data };
};
