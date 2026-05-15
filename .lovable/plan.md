## Diagnosis

I queried the database for Kotto DCG (`c7c38d97-…`). The chart is plotting **regional-event submissions, not DCG meetings**.

Every `attendance_events` row for this DCG has a non-null `source_event_id`. Looking up those source events in `events`:

| Source event | events.dcg_id | What it really is |
|---|---|---|
| Word Study | this DCG | A DCG meeting ✅ |
| Seminar on the 7 mountains | NULL | Regional event ❌ |
| Grace Celebration Meeting | NULL | Regional event ❌ |
| Revelation & Impartation | NULL | Regional event ❌ |
| All Night, Easter Worship, Workshop, Prayer Meeting | NULL | Regional events ❌ |

The Mar 22 spike of **26 members** is `Seminar on the 7 mountains of influence` — a regional event the DCG submitted attendance for. That's why the count exceeds the DCG's 10 members: it includes everyone who walked in to a regional event.

The current filter (`attendanceData.filter(a => a.dcg_id === dcgId)`) treats "DCG submitted the attendance" as "this is a DCG meeting", which is wrong. Both DCG meetings and regional-event submissions stamp `attendance_events.dcg_id` with the submitting DCG.

**Children = 0 on certain weeks**: not a bug in the chart. The strict child rule (age < 16 AND linked to at least one adult via `member_relationships`) is applied uniformly. Weeks with 0 children mean either (a) no qualifying children were marked present at that meeting, or (b) the children present aren't linked to an adult in `member_relationships`. The chart correctly reflects the recorded data — this is a data-entry observation, not a chart bug. I will not silently invent children data.

## Fix

In `src/pages/admin/regional/DcgProfile.tsx`:

1. Pull the list of events owned by this DCG (events where `events.dcg_id === dcgId`). Use the existing `useDcgEvents(dcgId)` hook (already in the codebase) — no new query needed.
2. Build `Set<string>` of those event ids.
3. In `trendChartData`, change the filter from `a.dcg_id === dcgId` to `a.source_event_id && dcgEventIds.has(a.source_event_id)`. This guarantees only attendance for events the DCG itself owns is plotted.
4. Keep the rest of the logic (date range, group-by-source-event, sort, no zero-fill) unchanged.

After this change, the Kotto DCG trend will show only Word Study meetings (max 10 members), and regional event submissions will no longer pollute it.

## Note about children

I won't change the child-counting rule from the chart side — it's the project-wide standard. If the user expects more children in the trend, the underlying data (date_of_birth on profiles, `member_relationships` links between children and adults) needs review. I can flag this separately if they want.

## Files

- `src/pages/admin/regional/DcgProfile.tsx` — only file changed.
