## Goal
Make the Regional Dashboard's Attendance Trend agree with the Members and Children KPI cards.

## What's happening
- The Members and Children KPI cards already use **unique** member/visitor/children IDs across all in-period regional attendance — this is correct and matches the user's definition.
- The Attendance Trend chart aggregates per source event by **summing** `members_present`, `visitors_present`, and `children_present` from every attendance row that points to that source event. When multiple DCGs record attendance against the same regional event, overlapping people get counted multiple times, so a single trend point can exceed the unique KPI total — exactly what the user sees (trend ~48, KPI 45).

## Fix
In `src/pages/admin/regional/Dashboard.tsx`, change `trendChartData`'s per-source-event aggregation to use deduplicated ID sets instead of count sums:

- Replace the `aggBySourceId` Map of `{ m, v, c }` counters with a Map of `{ m: Set<string>, v: Set<string>, c: Set<string> }`.
- Populate by unioning `present_member_ids`, `present_visitor_ids`, and `present_children_ids` from each attendance row.
- When mapping to `perEventPoints`, read `.size` of each set as the point value.

This guarantees the trend reports unique attendees per regional event, so the maximum point on the Members line cannot exceed the period-wide unique Members KPI, and the same for Children.

The DCG (weekly bucket) branch of the chart already sums per-DCG points and is intentionally additive (each DCG meets once per week with distinct attendees), so that logic stays unchanged.

## Verification
- Open the regional dashboard with 1M filter and Regional Events selected.
- Confirm the highest Members point on the trend ≤ Members KPI value, and the highest Children point ≤ Children KPI value.