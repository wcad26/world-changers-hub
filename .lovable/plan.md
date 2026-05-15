## Goal
Fix two bugs on the regional DCG profile page (`src/pages/admin/regional/DcgProfile.tsx`):
1. The page crashes with "Rendered more hooks than during the previous render".
2. The Attendance Trend chart shows data for all DCGs and plots fake zero points.

## 1. Fix the crash (hooks order)

The component declares `useMemo` for `filteredMembers` at line ~196, **after** two early returns at lines 156 (`dcgsLoading`) and 165 (`!dcg`). On first render those returns fire, on later renders the memo runs — React then sees more hooks than before and throws.

Fix: hoist every hook above all early returns. Move `filteredMembers` (and keep `dcgTransactions` / `trendChartData` / `dateRange` already in correct position) to sit before the `if (dcgsLoading)` and `if (!dcg)` blocks. Compute `activeMembers` inline inside the memo (not as a const above).

## 2. Scope the Attendance Trend to this DCG, no fake zeros

Current code buckets every week between `dateRange.from` and `dateRange.to` and pre-fills each bucket with `m: 0, v: 0, c: 0`, producing a 0 point on every week with no recorded attendance — exactly what the user said must not happen.

New logic (mirrors how the dashboard treats DCG attendance, but scoped to one DCG and unbucketed):

```text
1. records = attendanceData.filter(a => a.dcg_id === dcgId)
2. records = records.filter(a => a.event_date in dateRange)
3. group by source_event_id (fallback: event_date) summing
   members_present / visitors_present / children_present
4. sort ascending by event_date
5. emit one point per real attendance event:
   { date: format(eventDate, "MMM d"), Members, "Regular Visitors", Children }
```

No buckets, no zero filling. If `records` is empty after filtering, render the existing "No attendance data for the selected period" empty state.

## Files

- `src/pages/admin/regional/DcgProfile.tsx` — only file changed.

No hooks, services, queries, or routes added.
