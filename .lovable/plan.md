## Problem

In the DCG Events filter view of the Regional Dashboard, KPI cards show wrong numbers:

- `Members: 0 · 0 adults · 0 children`
- `Children: 0`
- `Attendance Target: —` even when DCG events have attendance

For the logged-in admin (WCA DOUALA), the database actually has **5 active DCGs with 58 active dcg_members**, so Members should not be 0.

## Root causes identified

1. **`useDcgRegionMembership` swallows errors.** It does not surface RLS or fetch errors and resolves to an empty Set, which the dashboard then renders as `0`. If the supabase select on `dcgs` or `dcg_members` returns an error (or `null` data) the card silently shows 0 with no indication.

2. **Children intersection is wrong.** `dcgChildren` is computed by intersecting `dcgMemberIds` with `childrenSet`, where `childrenSet` is built from `useMembers(userRegion?.id)` — which only returns members the dashboard already filters (active region members). DCG members whose row is not present in that list (different status, RLS, paging) are not counted. The "Children" card and the `dcgAdults` subtitle become inconsistent with `dcgTotalMembers`.

3. **Avg DCG Attendance vs Members mismatch.** Events show `18 events · Avg 7 attendees`, but `Members` shows `0`. This confirms attendance is fetched correctly per event but membership totals are not — they should be computed from the same `dcg_members` source the events draw from.

4. **Attendance Target subtitle is stale.** When no active plan exists, the card shows `—` even though we could still show actual avg attendance ("Avg 7 attendees — no target set").

## Fix plan

### 1. Harden `useDcgRegionMembership` (`src/hooks/useDcgRegionMembership.ts`)

- Throw on supabase errors instead of returning empty silently (let react-query surface them).
- Return additional fields needed for the children calculation:
  - `dcgMemberIds: Set<string>`
  - `dcgChildIds: Set<string>` — computed inside the hook by joining `dcg_members → members → profiles.date_of_birth` and applying the strict child rule via `buildChildrenSet` over the DCG-scoped subset, with `member_relationships` fetched for just those ids.
  - `totalDcgMembers`, `totalDcgChildren`, `totalDcgAdults`.
- Filter out rows where `member_id` is null and de-duplicate (a member can belong to multiple DCGs).

### 2. Update Dashboard KPI memo (`src/pages/admin/regional/Dashboard.tsx`)

- Replace the local intersection `childrenSet.has(id)` block with the values returned by the hook:
  - `dcgTotalMembers = dcgMembership.totalDcgMembers`
  - `dcgChildren = dcgMembership.totalDcgChildren`
  - `dcgAdults = dcgMembership.totalDcgAdults`
- Make the DCG Attendance Target subtitle always show actual avg when target missing:
  - With target: `Avg {avgDcgAttendees} / {planAvgDcgAttendance} target`
  - Without target: `Avg {avgDcgAttendees} attendees — no target set`

### 3. Quick diagnostic safety net

- Add a one-line `console.warn` in `useDcgRegionMembership` when the resolved `totalDcgMembers === 0` but `regionId` is set, including the supabase error if any. This makes future RLS/filter regressions obvious in the preview console without affecting users.

### 4. Verify

- After the fix, with the regional admin for WCA DOUALA on DCG filter, the expected values are:
  - Members: 58 (with adult/child split from DOB rule)
  - Children: from DOB rule
  - DCG Events: 18 (unchanged)
  - Attendance Target: subtitle reads `Avg 7 attendees — no target set`
  - Discipleship Success: unchanged (region-wide)

### Out of scope

- Regional Events filter cards (working correctly).
- Attendance Trend chart, bottom row cards, and the Plan Management page itself.

### Files to change

- `src/hooks/useDcgRegionMembership.ts` (rewrite to also resolve children + surface errors)
- `src/pages/admin/regional/Dashboard.tsx` (use hook output directly; tweak DCG attendance target subtitle)
