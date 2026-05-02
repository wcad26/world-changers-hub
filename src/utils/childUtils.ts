import { differenceInYears } from 'date-fns';

export const CHILD_AGE_THRESHOLD = 18;

/**
 * Determines if a member is a child based on age alone (DOB < 18).
 *
 * The optional `memberId` and `relationships` arguments are kept for
 * backward compatibility with existing call sites — they are ignored.
 * The `member_relationships` table is not currently in use, so gating
 * child detection on it caused the children count to always be 0.
 */
export const isChildMember = (
  dateOfBirth: string | null | undefined,
  _memberId?: string,
  _relationships?: Array<{ member_id: string; related_member_id: string }>
): boolean => {
  if (!dateOfBirth) return false;
  return differenceInYears(new Date(), new Date(dateOfBirth)) < CHILD_AGE_THRESHOLD;
};

/**
 * Simple age-only check (kept for backward compatibility with attendance graph).
 */
export const isUnderChildAge = (dateOfBirth: string | null | undefined): boolean => {
  if (!dateOfBirth) return false;
  return differenceInYears(new Date(), new Date(dateOfBirth)) < CHILD_AGE_THRESHOLD;
};
