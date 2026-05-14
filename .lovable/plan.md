## Why the chart shows zero attendance

The Regional Dashboard's Attendance Trend computes points from two sources:

- `kpis.filteredEvents` — rows from the `events` table (the regional events themselves).
- `kpis.filteredAttendance` — rows from `useAttendanceHistoryWithMemberTypes`, which returns one row per `attendance_events` record, including `dcg_id` and `source_event_id`.

Two bugs combine to wipe out the regional trend now that DCG admins record attendance for regional events:

1. **The "Regional Events" filter excludes DCG-recorded attendance.** In `Dashboard.tsx` `kpis` (around line 211), `filteredAttendance` is filtered with `if (eventType === "regional") return !a.dcg_id`. When a DCG admin records attendance for a regional event, the resulting `attendance_events` row has `dcg_id` set (the recording DCG) but `source_event_id` pointing to the regional event. The current rule throws those rows away, so regional-event attendance disappears from the chart whenever the recorder was a DCG.

2. **Same source event recorded by multiple DCGs collapses to one row.** In `trendChartData` (around line 307), `attendanceBySourceId = new Map(...)` keys by `source_event_id`, so if Region's "Sunday Service" has attendance submitted by DCG A and DCG B, only the last one wins. Members from the other DCGs vanish.

Net effect on the user's "1M, Regional Events" view: every regional event whose attendance was submitted by a DCG is treated as zero attendance.

## Fix plan

1. **Reclassify attendance rows by their source event, not by `dcg_id`.**
   - In `Dashboard.tsx` `kpis`, build a `Set<string>` of regional-event ids (`filteredEvents` already excludes DCG and special events when `eventType === "regional"`; we also have access to `events`).
   - Change the `filteredAttendance` filter so:
     - `eventType === "regional"` keeps any attendance row whose `source_event_id` belongs to a regional (non-DCG, non-special) event in this region — regardless of whether `dcg_id` is set on the attendance row.
     - `eventType === "dcg"` keeps attendance rows whose `source_event_id` belongs to a DCG event, OR rows that have `dcg_id` set and no regional source event (DCG-only meetings).
     - `eventType === "all"` keeps everything as today.
   - Apply the same reclassification when computing `regionalAttendance` / `dcgAttendance` so the KPIs ("Regional Events: Avg N attendees", etc.) match the chart.

2. **Aggregate multiple DCG submissions for the same regional event.**
   - In `trendChartData`, replace the single-winner `Map` with an aggregator: for each `source_event_id`, sum `members_present`, `visitors_present`, and `children_present` across all matching attendance rows. This represents the full regional attendance when several DCGs record their own members for the same regional meeting.
   - Keep the existing per-event vs. monthly-bucket logic. In monthly mode, average per regional event (not per attendance row) so a regional meeting recorded by three DCGs still counts as one event with summed attendance.

3. **Make sure the data hook returns DCG-recorded regional attendance.**
   - `useAttendanceHistoryWithMemberTypes` already fetches `attendance_events` for `region_id = userRegion` OR `dcg_id IN regionalDcgs`, and already returns `source_event_id` and `dcg_id`. No change needed to the query, only to how the dashboard interprets the returned rows.

4. **Validation.**
   - Spot-check via the Supabase read tool: pick one regional event in the last month and confirm there are `attendance_events` rows with `source_event_id = <event>` and `dcg_id IS NOT NULL`, and that `attendance_records.is_present = true` for several members. After the fix, the same event must appear as a non-zero point on the 1M Regional Events trend.
   - Verify the 3M / 6M / 1Y monthly buckets show non-zero averages for months that have any regional-event attendance (recorded by region or DCG).
   - Confirm the "DCG Events" filter still shows pure DCG meetings and does not double-count DCG-recorded regional attendance.

## Files to change

- `src/pages/admin/regional/Dashboard.tsx`
  - `kpis` memo: build the regional-event id set; update `filteredAttendance`, `regionalAttendance`, `dcgAttendance` classification.
  - `trendChartData` memo: aggregate by `source_event_id` (sum across DCG submissions) instead of overwriting.

No DB schema or hook changes required.
