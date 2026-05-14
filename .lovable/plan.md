# Switch trend buckets from average to max

In `src/pages/admin/regional/Dashboard.tsx`, inside the `trendChartData` useMemo:

1. Change the per-bucket aggregation from sum + count (averaged at the end) to max-per-series.
2. While binning each `perEventPoint` into its bucket, update `b.m = Math.max(b.m, p.Members)`, same for Regular Visitors and Children. Drop the `n` counter.
3. Final mapping returns the raw max values (no division). Empty buckets stay at 0.

No other changes — bucket widths (7d for DCG, 14d for Regional/All), period selector, and chart rendering all stay the same.

## Validation
- DCG filter, 1M: weekly points show the highest single-event attendance that week.
- Regional filter, 3M: biweekly points show the highest regional event attendance in each window.
