# Fix DCG trend chart aggregation

## Diagnosis

DCGs **are** reporting (67 DCG attendance events on file). Two bugs in `trendChartData` (src/pages/admin/regional/Dashboard.tsx):

1. **Wrong aggregation across DCGs.** Weekly bucket uses `Math.max` over every per-event point, so the bucket only shows the single largest DCG meeting that week. The regional total across DCGs is hidden.
2. **Empty trailing partial week plots as 0.** The forward-walk loop emits a clamped tail bucket; if no DCG has met yet in the current partial week it renders as 0 and crashes the line down (visible on 1M view ending May 13).

## Fix (DCG branch only — Regional unchanged)

In `trendChartData`, after `perEventPoints` is built and after the early-return for Regional:

1. **Per-DCG max per week, then sum across DCGs.** Carry `dcg_id` on each per-event point (from `e.dcg_id`). For each bucket:
   - Group the events that fall in the bucket by `dcg_id`.
   - Take the MAX Members / Regular Visitors / Children **per DCG** within the bucket (one DCG can have multiple meetings in a week — count their best, not double-count).
   - SUM those per-DCG maxes across all DCGs → bucket total.
   - Track event count per bucket for step 2.
2. **Drop trailing empty partial bucket.** After binning, if the last bucket was clamped (partial: `end <= periodEnd + 1ms` and shorter than `bucketDays`) AND has zero events, pop it. Mid-period weeks with zero meetings still render as 0 (legitimate gap).

## What does NOT change

- Regional per-event plotting.
- Filters, KPI cards, dropdown, search.
- Attendance classification (`isDcgSource` / `isRegionalSource`).
- Bucket width (7 days for DCG).

## Validation

- DCG 1M / 3M: weekly points reflect total regional DCG attendance (sum of per-DCG weekly maxes). Trailing partial week with no meetings is omitted instead of dropping to 0.
- Mid-period week with zero meetings still renders 0.
- Regional view unchanged.
