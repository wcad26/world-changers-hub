## Goal

Change the Super Admin dashboard "Attendance Trend" chart so that — in BOTH Regional and DCG event-type modes — each X-axis point is a calendar week, and the Y values are the count of **unique members / unique regular visitors / unique children** who attended *at least one* event of that type during that week. Same person attending multiple events in the same week counts once per category for that week.

## What changes

### 1. Data layer — `src/hooks/useGlobalDashboardData.ts`

Extend `useGlobalAttendanceScoped` (or add a sibling hook) so each returned event row also carries the **list of present member IDs per category**, not just counts:

```ts
{
  event_date, source_event_id, dcg_id, region_id,
  present_member_ids: string[],
  present_visitor_ids: string[],
  present_children_ids: string[],
  // existing count fields kept for KPIs
}
```

The classification per record (member vs visitor vs child) already uses `isChildMember` + `member_type` — reuse it; just collect IDs into arrays in addition to incrementing counters.

### 2. Chart aggregation — `src/pages/admin/super/Dashboard.tsx`

Replace the current per-event mapping (Regional) and the existing weekly count-sum bucketing (DCG) with a single weekly **unique-set** aggregator used for both modes:

```text
For each attendance event in scope (after region + event-type + period filters):
  weekKey = startOfWeek(event_date, { weekStartsOn: 1 })  // ISO week (Mon)
  buckets[weekKey].membersSet   ∪= present_member_ids
  buckets[weekKey].visitorsSet  ∪= present_visitor_ids
  buckets[weekKey].childrenSet  ∪= present_children_ids

chartData = sortedWeeks.map(w => ({
  date: format(w, 'MMM d'),                    // week-starting label
  Members:           buckets[w].membersSet.size,
  "Regular Visitors": buckets[w].visitorsSet.size,
  Children:          buckets[w].childrenSet.size,
}))
```

Scope rules per event-type filter:
- **Regional**: only events where `source_event_id` is non-null AND that source event is a regional (non-special) event in scope. Exclude special-event ids via `useGlobalSpecialEventIds`.
- **DCG**: only events where `dcg_id` is non-null and the DCG falls within scope (region filter, if set).

Region filter and date-period filter apply before bucketing (already wired through `useGlobalAttendanceScoped(regionId)` + `dateFilters`).

Weeks with zero events are omitted (no more "0" gaps); chart shows only weeks that actually had at least one event of the selected type.

### 3. Chart presentation

- Keep the existing `AreaChart` styling, gradients, tooltip, and legend.
- Update the section subtitle to: "Unique members, regular visitors and children attending at least one {Regional|DCG} event per week."
- X-axis label uses `format(weekStart, 'MMM d')`; tooltip label prefixes "Week of ".

### 4. Validation

- Pick one week with two regional events sharing an attendee: that member should appear in `Members` exactly once for that week.
- Toggle Region filter from "All" to a specific region → counts shrink to that region's unique attendees only.
- Toggle Event Type Regional ↔ DCG → buckets recompute from the matching event subset, axis re-labels, no zero-attendance gaps.
- Special-event attendance must not appear in Regional buckets.

## Files touched

- `src/hooks/useGlobalDashboardData.ts` — extend attendance hook to expose per-event present ID arrays for the three categories.
- `src/pages/admin/super/Dashboard.tsx` — replace the trend-chart aggregation block (current lines ~291–360) with the unified weekly unique-set aggregator; update subtitle.

No DB, RLS, or business-logic changes elsewhere. KPI cards and other sections are untouched.
