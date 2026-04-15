import { differenceInYears } from 'date-fns';

export const CHILD_AGE_THRESHOLD = 16;

/**
 * Determines if a member is a child based on:
 * 1. Age < 16 (based on date_of_birth)
 * 2. Has at least one relationship in the member_relationships table
 */
export const isChildMember = (
  dateOfBirth: string | null | undefined,
  memberId: string,
  relationships: Array<{ member_id: string; related_member_id: string }>
): boolean => {
  if (!dateOfBirth) return false;
  
  const age = differenceInYears(new Date(), new Date(dateOfBirth));
  if (age >= CHILD_AGE_THRESHOLD) return false;
  
  const hasRelationship = relationships.some(
    r => r.member_id === memberId || r.related_member_id === memberId
  );
  
  return hasRelationship;
};

/**
 * Simple age-only check for attendance trend graph (where we don't have relationship data per-record)
 */
export const isUnderChildAge = (dateOfBirth: string | null | undefined): boolean => {
  if (!dateOfBirth) return false;
  return differenceInYears(new Date(), new Date(dateOfBirth)) < CHILD_AGE_THRESHOLD;
};
