
## Goal

Update the 6 KPI cards on the Regional Dashboard so that the set of cards shown — and the data backing them — depends on the active **Event Type** filter ("Regional Events" vs "DCG Events"). Replace the hard-coded capacity-based Attendance Target with one driven by the active plan in **Plan Management**.

## Card sets

When **Regional Events** filter is active (5 cards):
1. **Members** — totals scoped to the region (unchanged source)
2. **Children** — totals scoped to the region (unchanged source)
3. **Regional Events** — count + avg attendees for regional events in period
4. **Attendance Target** — % of plan's regional attendance milestone reached
5. **Discipleship Success** — % relationships reaching `became_member`

When **DCG Events** filter is active (5 cards):
1. **Members** — total DCG members (sum across DCGs in region)
2. **Children** — children in DCGs (children whose membership is linked to a DCG)
3. **DCG Events** — count + avg attendees for DCG events in period
4. **Attendance Target** — % of plan's DCG attendance milestone reached
5. **Discipleship Success** — % relationships reaching `became_member` (region-wide; same metric)

The 6-column grid becomes a 5-column grid.

## Attendance Target source

The current card uses `sum(event capacity)` as denominator. Replace with a milestone pulled from `regional_plan_targets` of the active plan (status = `active`, latest by `start_date`):

- Regional filter → target with `metric_key = 'avg_event_attendance'` OR `'total_event_attendees'`. Use `total_event_attendees` if present, otherwise fall back to `avg_event_attendance * regional_events_count_target` (or `avg_event_attendance` compared against current avg).
- DCG filter → target with `metric_key = 'avg_dcg_attendance'` compared against current avg DCG attendance per event in period. (No `total_dcg_attendees` key exists today; keep avg-based.)

Formula:
- Regional: `pct = round(totalActualRegionalAttendance / planTotalAttendanceTarget * 100)`
- DCG: `pct = round(avgDcgAttendees / planAvgDcgAttendanceTarget * 100)`

If no active plan or no relevant target row → show `—` and subtitle "No target set in Plan Management".

## DCG Members & Children sources

- DCG Members count: `select count(*) from dcg_members where dcg_id in (select id from dcgs where region_id = :region)` via existing `useDcgMembers`-style aggregation, or sum `member_count` per DCG already exposed by `useDCGs`.
- DCG Children count: same set filtered by `isChildMember` rule against `members` table joined through dcg_members.member_id. Reuse existing `childrenSet` from region members, intersected with dcg member ids.

## Implementation steps

### 1. New hook: `useActivePlanTargets(regionId)`
- File: `src/hooks/useActivePlanTargets.ts`
- Returns `{ activePlan, targetsByKey: Record<string, number> }` where `targetsByKey[metric_key] = target_value`.
- Query: latest `regional_plans` row with `status = 'active'` and `region_id = :regionId`, then its `regional_plan_targets`.

### 2. New hook: `useDcgRegionMembership(regionId)`
- File: `src/hooks/useDcgRegionMembership.ts`
- Returns `{ dcgMemberIds: Set<string>, totalDcgMembers: number }` by joining `dcg_members` → `dcgs` filtered by region.

### 3. Update `src/pages/admin/regional/Dashboard.tsx`
- Consume the two new hooks.
- In the `kpis` memo:
  - Compute `dcgMembersTotal` and `dcgChildrenTotal` (intersect `childrenSet` with `dcgMemberIds`).
  - Compute `attendanceTargetPct` from plan targets per active filter (see formulas above); return both the numeric pct and a `targetMissing` boolean.
- In the JSX KPI grid:
  - Change wrapper to `grid-cols-2 lg:grid-cols-3 xl:grid-cols-5`.
  - Render conditionally on `eventType`:
    - `regional` → Members (region totals), Children (region totals), Regional Events, Attendance Target (regional), Discipleship Success.
    - `dcg` → Members (DCG totals), Children (DCG totals), DCG Events, Attendance Target (DCG), Discipleship Success.
- Update subtitle text for Attendance Target to reference the plan target value (e.g., `"Target: 250 / actual 180"`).

### 4. No DB migration required.
The `regional_plan_targets` table and metric keys (`total_event_attendees`, `avg_event_attendance`, `avg_dcg_attendance`) already exist.

## Files touched

- `src/hooks/useActivePlanTargets.ts` (new)
- `src/hooks/useDcgRegionMembership.ts` (new)
- `src/pages/admin/regional/Dashboard.tsx` (edit kpis memo + KPI grid JSX only)

## Out of scope

- Attendance Trend chart (stays as-is; already eventType-aware).
- Bottom row (gender/tithers/givers/income/fundraising) — unchanged.
- Plan Management page itself — no UI changes; the user already sets targets there.
