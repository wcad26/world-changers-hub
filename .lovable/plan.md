# Fix DCG trend chart aggregation

## Problem

DCGs are reporting attendance (67 records on file), but the regional Dashboard DCG trend chart is wrong on two counts:

1. **Only the largest DCG shows.** The weekly bucket uses `Math.max` across every per-event point in the week, so the chart collapses to the single biggest DCG meeting instead of the regional total across all DCGs.
2. **Trailing partial week renders as 0.** The forward-walk loop always emits a clamped tail bucket. On a view ending mid-week with no meetings yet, that bucket renders as 0 and the line crashes down.

## Domain rule

Each DCG meets exactly **once per week** (different DCGs may meet on different days, but no DCG meets twice in the same week). So per-DCG weekly max is unnecessary — a straight SUM across all DCG attendance events in the week IS the regional total.

## Fix (DCG branch only — Regional per-event plotting unchanged)

In `src/pages/admin/regional/Dashboard.tsx`, inside `trendChartData`, after `perEventPoints` is built and after the early-return for Regional:

1. **Sum all DCG attendance per week.**
   - For each weekly bucket, SUM Members / Regular Visitors / Children across every DCG attendance event that falls in that week.
   - No `Math.max`, no per-DCG grouping. Each event contributes its full count.
   - Track event count per bucket for step 2.

2. **Drop trailing empty partial bucket.**
   - After binning, while the last bucket is partial (clamped: shorter than 7 days at the period end) AND has zero events, pop it.
   - Mid-period weeks with zero meetings still render as 0 (legitimate gap).

## What does NOT change

- Regional per-event plotting (one point per event).
- Filters, KPI cards, dropdown, search.
- Attendance classification (`isDcgSource` / `isRegionalSource`).
- Bucket width (still 7 days for DCG).

## Files

- `src/pages/admin/regional/Dashboard.tsx` (only `trendChartData` DCG branch).

## Validation

- DCG 1M / 3M: weekly point = sum of every DCG meeting's attendance that week → true regional total.
- Trailing partial week with no meetings is omitted, not plotted as 0.
- Mid-period empty week still renders 0.
- Regional view unchanged.
