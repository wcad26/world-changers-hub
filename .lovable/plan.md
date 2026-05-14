## Goal

Make the **Attendance Trend** chart on the Regional Admin Dashboard adapt to the selected period filter:

- **1 month (or custom range ≤ 31 days):** plot one point per meeting/event in that window (current behavior).
- **3 months / 6 months / 1 year / custom range > 31 days:** plot one point per calendar month, where each point is the **average attendance per event for that month**. Show the last N months matching the selected window (e.g. 6M → last 6 months, 1Y → last 12 months).

The chart must continue to honor the current filters (event type: All / Regional / DCG, search query, custom date range), since it already reads from `kpis.filteredAttendance`.

## Changes

Single file: `src/pages/admin/regional/Dashboard.tsx`

Replace the `trendChartData` `useMemo` (lines ~299–309) with logic that:

1. Determines aggregation mode from the active period:
   - `quickPeriod === "1-month"` → per-event mode.
   - `quickPeriod` is `3-months` / `6-months` / `1-year` → monthly mode.
   - `quickPeriod === "custom"` → per-event if range span ≤ 31 days, otherwise monthly.

2. **Per-event mode** (unchanged): sort `filteredAttendance` ascending by date, map to `{ date: "MMM d", Members, "Regular Visitors", Children }`.

3. **Monthly mode**:
   - Build the list of target months (e.g. 6 months → last 6 calendar months ending at `dateRange.to`, oldest → newest), so empty months still show as zero-line points.
   - Group `filteredAttendance` by `yyyy-MM`.
   - For each month: compute the **average per event** of `members_present`, `visitors_present`, `children_present` (sum / count of events that month; 0 when no events).
   - Map to `{ date: "MMM yyyy" (or "MMM" when single year), Members, "Regular Visitors", Children }`, sorted oldest → newest.

4. The three existing series (Members, Regular Visitors, Children) and the existing `AreaChart` rendering stay the same — only the data shape feeding it changes.

No backend, hook, schema, or RLS change. No other UI changes.

## Acceptance

- Selecting **1M** shows one point per meeting in the last month, like today.
- Selecting **3M / 6M / 1Y** shows exactly 3 / 6 / 12 monthly points labeled by month, each being the average attendance per event in that month.
- Selecting **Custom** with a > 31-day range behaves like the monthly mode for that window; ≤ 31-day custom range behaves per-event.
- Switching the event-type filter (All / Regional / DCG) and search query continues to update the chart correctly in both modes.
