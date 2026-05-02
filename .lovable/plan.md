# Fix children count in dashboard reports

## Root cause

Two problems make the children count always read as **0** (or far too low) across the regional dashboard, MemberKPICards, MembersTab, Members pages, attendance, and event-attendance dialogs:

1. **`isChildMember` requires a family relationship row**, but the `member_relationships` table does **not exist** in the database. Every call therefore returns `false`, even for members whose date of birth clearly puts them under age. Verified via `information_schema.tables` — no such table exists; only `discipleship_relationships` is present.
2. **Threshold mismatch.** Project memory says "Children (<18)", but `CHILD_AGE_THRESHOLD` is set to `16`. With DOB data only 38 members are under 16 vs 45 under 18 — and none of them currently appear in any "Children" KPI because of problem #1.

Database snapshot for context:
- 600 total members
- 307 with DOB set
- 38 under 16, 45 under 18
- Currently displayed children count: effectively 0

## Fix

### 1. `src/utils/childUtils.ts` — make age the sole criterion, raise threshold to 18

```ts
export const CHILD_AGE_THRESHOLD = 18; // was 16

// Age-only check. The optional relationships arg is kept for backward compatibility
// with existing call sites but is no longer required.
export const isChildMember = (
  dateOfBirth: string | null | undefined,
  _memberId?: string,
  _relationships?: Array<{ member_id: string; related_member_id: string }>
): boolean => {
  if (!dateOfBirth) return false;
  return differenceInYears(new Date(), new Date(dateOfBirth)) < CHILD_AGE_THRESHOLD;
};

export const isUnderChildAge = (dateOfBirth: string | null | undefined): boolean => {
  if (!dateOfBirth) return false;
  return differenceInYears(new Date(), new Date(dateOfBirth)) < CHILD_AGE_THRESHOLD;
};
```

This single change immediately fixes every consumer (regional Dashboard, MemberKPICards, MembersTab, regional/super Members pages, attendance hooks, AttendanceManagementDialog, EventAttendanceDialog) because they all funnel through `isChildMember`.

### 2. `src/pages/admin/regional/Dashboard.tsx` — remove the dead relationships query

The `memberRelationships` query targets a non-existent table and throws on every dashboard load (silently swallowed by react-query). Replace it with an empty array constant and drop the `useQuery`/`memberIds`/`.or(...)` block. Also update the local `const CHILD_AGE = 16` to import `CHILD_AGE_THRESHOLD` from `childUtils` (or simply remove the unused constant).

### 3. Other places that pass `memberRelationships`

`MemberKPICards`, `MembersTab`, both `Members.tsx` pages, attendance hooks and dialogs already accept the relationships array and forward it to `isChildMember`. Because `isChildMember` will now ignore it, no further changes are required there — but as cleanup we can pass `[]` from the dashboard so we stop fetching from a non-existent table.

### 4. Memory update

Update `mem://logic/child-member-categorization` to reflect:
- Children are detected by age alone (DOB < 18 years).
- The `member_relationships` table is not in use; do not gate child detection on it.

## Files touched

- `src/utils/childUtils.ts` — threshold + age-only logic
- `src/pages/admin/regional/Dashboard.tsx` — remove broken `member_relationships` query, drop local `CHILD_AGE` constant
- `mem://logic/child-member-categorization` — refreshed rule

## Out of scope

- Creating a real `member_relationships` table. The feature memory references it, but until it actually ships, child detection cannot depend on it.
- Re-introducing the relationship requirement later: if/when the table exists, `isChildMember` can be tightened again — its signature already accepts the relationships argument.
