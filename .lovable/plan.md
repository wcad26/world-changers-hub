## Goal

Replace the current tab-based DCG Events page with a unified layout that matches the Regional Events page (`src/pages/admin/regional/Events.tsx`) — period filter, KPI cards, search + type + time filters, and a single events table — but scoped to the signed-in DCG plus the regional events of that DCG's region.

## Data scope

Combine two existing hooks into one merged list:
- `useDcgEvents(userDcg.id)` — events belonging to this DCG (`dcg_id = userDcg.id`).
- `useRegionalEventsForDcg(userDcg.region_id)` — regional events for the parent region (`region_id = userDcg.region_id AND dcg_id IS NULL`).

All KPIs, filters, and the table operate on this combined, period-filtered set. Nothing outside this DCG's region is ever shown.

## Page layout (matches reference screenshot)

```text
[Period: 1M 3M 6M 1Y Custom]  [Search]  [All Types ▾]  [All Events ▾]        [+ Create Event]

[Total Events] [Regional Events] [DCG Events] [Special Events] [Attendance Target]

Events
View and manage all events for your DCG
┌──────────────────────────────────────────────────────────────────────────────┐
│ Event Name │ Type │ Date │ Time │ Location │ Capacity │ Attendance │ Actions │
└──────────────────────────────────────────────────────────────────────────────┘
```

- Reuse `PeriodFilter` from `@/components/admin/regional/dashboard/PeriodFilter`.
- Reuse the regional page's KPI card markup (rounded-2xl glass cards, growth indicators, attendance-target tile).
- Type filter options: `All Types`, `Regional`, `DCG`, `Special`.
- Time filter options: `All Events`, `Upcoming`, `Past`.
- Type column badge: `Regional` / `DCG` / `Special` (visitor/DCG/regional badge logic from regional page).

## Actions per row

- DCG events (`dcg_id = userDcg.id`): dropdown with **Record Attendance**, **Duplicate Event**, **Delete Event** (keep current `CreateEventDialog` for duplicate and `useDeleteDcgEvent`).
- Regional events (`dcg_id IS NULL`): dropdown limited to **Record Attendance** only — no edit/duplicate/delete (DCG admins cannot manage regional events).
- `+ Create Event` button always creates a DCG event (current `CreateEventDialog` behavior is preserved).

## KPI cards (scoped to combined set + period)

1. **Total Events** — count of all events in the merged, period-filtered set.
2. **Regional Events** — events with `dcg_id IS NULL` and `is_special = false`.
3. **DCG Events** — events with `dcg_id = userDcg.id`.
4. **Special Events** — events with `is_special = true`.
5. **Attendance Target** — `% = totalActualAttendance / totalCapacity` across regional (non-special) events in scope, mirroring the regional page formula.

Each card shows count, average attendance, and growth vs. the previous equivalent period (same logic the regional page already uses; we'll factor it into a small `useEventAnalytics(events, period)` helper to avoid copying the math twice).

## Mobile / tablet

- Keep the existing `useIsMobile` / `useIsTablet` card-view fallback for the events list.
- KPI grid: `grid-cols-2 md:grid-cols-3 lg:grid-cols-5` so the 5 cards still read well on small screens.
- Keep `pb-24` for the bottom-tab clearance per project convention.

## Files

- **Rewrite** `src/pages/dcg/Events.tsx` — new layout, merged data, unified table, KPIs, filters. Keep the existing imports for `CreateEventDialog`, `EventAttendanceDialog`, `useDcgEvents`, `useRegionalEventsForDcg`, `useDeleteDcgEvent`.
- **No changes** to hooks, DB schema, RLS, or other pages. The data scoping is already correct in the existing hooks.

## Out of scope

- No new event categories, no schema changes, no new edge functions.
- No changes to how regional admins manage events.
- The Reports/EventReport pages are untouched.
