

## Plan: Align Child Detection Between KPI Cards and Attendance Trend Chart

### Root Cause

Two different definitions of "child" are in use:

- **KPI cards** (Dashboard.tsx) use `isChildMember()` from `childUtils.ts` — requires age < 16 **AND** a record in `member_relationships`. This is the strict, correct definition per project memory.
- **Attendance hook** (`useAttendance.ts` line 140-144) uses a simple age-only check (`differenceInYears < 16`). This catches anyone under 16 regardless of whether they have a family relationship recorded.

Result: A person under 16 who has no relationship record appears as "Children: 1" in the chart but "Children: 0" in the KPI.

### Fix

Update the attendance hook's child detection to match the KPI logic. This means the hook needs access to `member_relationships` data to apply the same two-criteria check.

### Changes

**`src/hooks/useAttendance.ts`** — In `useAttendanceHistoryWithMemberTypes`:

1. After fetching attendance records, collect all unique member IDs from the results.
2. Fetch their relationships from `member_relationships` (same query pattern as Dashboard.tsx).
3. Replace the simple age check (`isChild`) with the full `isChildMember()` logic that checks both age and relationship status.

This ensures the chart's Members/Regular Visitors/Children breakdown matches the KPI cards exactly.

### Files Modified

- `src/hooks/useAttendance.ts` — Update `useAttendanceHistoryWithMemberTypes` to use relationship-aware child detection

### Technical Detail

The `isChild` function at line 140 will be replaced with a call that mirrors `isChildMember(dob, memberId, relationships)`, using relationship data fetched within the same query function.

