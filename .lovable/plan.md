# Fix Attendance Trend bucketing

## Problem
- DCG events trend underplots actual attendance because the chart uses month-average buckets, hiding weeks with strong DCG turnout.
- The current monthly-bucket logic for regional events is no longer desired.

## New behavior

Bucketing now depends on the selected event type filter, NOT on the selected period:

- **DCG Events**: weekly buckets. For every week within the selected period, compute the average attendance across all DCG attendance events recorded that week (aggregating across all DCGs).
- **Regional Events**: biweekly buckets (14-day windows). For every biweekly window in the selected period, compute the average attendance across all regional events in that window. DCG-recorded regional attendance for the same regional event is still summed first (existing aggregation), so the regional event's per-event value reflects total attendance, then averaged across events in the bucket.
- **All Events**: biweekly buckets, averaging across all events in each window (combined regional + DCG).

The 1M / 3M / 6M / 1Y / Custom selector still controls the date range, but bucket width is now fixed by event type (weekly for DCG, biweekly otherwise). Empty buckets render as 0 so the trend line spans the full period.

## Bucket construction

- Anchor buckets at `dateRange.to` (or today) and walk backwards in 7-day (DCG) or 14-day (regional/all) steps until reaching `dateRange.from`.
- Label format:
  - Weekly: `MMM d` of the bucket start (e.g. "May 5").
  - Biweekly: `MMM d` of the bucket start (e.g. "Apr 28").
- Each bucket stores: sum of Members, Regular Visitors, Children, plus event count `n`. Final value = round(sum / n) per series, or 0 when `n === 0`.

## Per-event values fed into buckets

Reuse the existing `perEventPoints` array (one row per event in `kpis.filteredEvents`, joined to `aggBySourceId` so multi-DCG submissions for the same regional event are summed). Each event is dropped into the single bucket whose `[start, end)` window contains its `start_datetime`.

## Code changes

Single file: `src/pages/admin/regional/Dashboard.tsx`

In the `trendChartData` useMemo (lines ~320–416):
1. Remove the `monthsCount` branching and the per-event "1M" mode.
2. Determine `bucketDays = eventType === "dcg" ? 7 : 14`.
3. Build buckets from `dateRange.to` back to `dateRange.from` in `bucketDays` steps; each bucket holds `{ start, end, label }`.
4. Bin `perEventPoints` into the matching bucket and average each series.
5. Return buckets in chronological order (oldest → newest) so the line reads left-to-right.

Dependencies of the memo: add `eventType` (already covered indirectly via `kpis`, but explicit is clearer); keep `quickPeriod`, `dateRange`.

No changes to data hooks, KPI computation, or chart rendering markup. The chart's X-axis automatically picks up the new labels.

## Validation

- Filter = DCG Events, period = 1M: expect ~4 weekly points; values should be close to KPI "Avg DCG attendees" for weeks with events, 0 for empty weeks.
- Filter = Regional Events, period = 3M: expect ~6–7 biweekly points; values should reflect the summed regional attendance per event averaged in each 2-week window.
- Filter = All Events, period = 6M / 1Y: biweekly points across the full range; series remain non-zero where any events exist.
- Confirm that switching periods only changes how many buckets render, not the bucket width.
