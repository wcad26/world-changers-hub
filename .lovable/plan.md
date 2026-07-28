## Root cause (verified)

DESCO CMR 2026 runs Jul 27 → Aug 2 (7 days), but only **one** `attendance_events` row exists for it:

- `id: 46e16b91…`, `event_date: 2026-07-27`, `day_index: NULL`, `parent_event_id: NULL`

There are no child day rows, so:
- The scanner's day picker has nothing to switch to — every scan is written against the Jul 27 session, regardless of which day it actually is.
- The Event Report shows "Single-day event · 1 attendance day recorded" (matches your earlier screenshot).

The scanner code itself already supports day tabs (`parent + children` model in `AttendanceScan.tsx`), and the report already recomputes per day. The missing piece is the **day rows in the database** and a way for admins to create them without hand-writing SQL.

## Fix

### 1. Backfill DESCO's day sessions (one-off migration)

Convert the existing single attendance_event into the Day 1 parent, then create Day 2–7 children:

```
UPDATE attendance_events
SET day_index = 1, name = 'DESCO CMR 2026 — Day 1'
WHERE id = '46e16b91-d621-44dd-8a43-a5a1139030ca';

INSERT INTO attendance_events (name, event_date, day_index, parent_event_id, source_event_id, region_id, created_by)
SELECT 'DESCO CMR 2026 — Day ' || d, ('2026-07-27'::date + (d-1)), d,
       '46e16b91-d621-44dd-8a43-a5a1139030ca', '078aff4a-8910-4332-90b4-8f41d9026cf6', NULL, created_by
FROM attendance_events, generate_series(2,7) AS d
WHERE id = '46e16b91-d621-44dd-8a43-a5a1139030ca';
```

Result: scanner immediately shows a Day dropdown with Day 1 (Jul 27) … Day 7 (Aug 2). Existing scans from Jul 27 remain attached to Day 1. Day 2 badges scanned today will land on Day 2.

### 2. General: auto-create day sessions for any multi-day event

To prevent this happening again for other multi-day events:

- Add a helper in `src/pages/admin/AttendanceScan.tsx`: when the selected root `attendance_event` maps to a source `events` row whose `end_datetime` date > `start_datetime` date AND no child days exist, show a small **"Set up N-day sessions"** button. Clicking it inserts the day rows (parent → children, day_index 1..N) using dates derived from the source event's date range.
- Same button also appears when children exist but today's date is missing (e.g., event extended). It inserts only the missing days.

### 3. Scanner UX guardrails (small tweaks in `AttendanceScan.tsx`)

- If children exist and none matches today, keep the current yellow "Today's date is outside the event schedule" banner but also **auto-select the day matching today** on load (currently done — verify it works with the new day rows).
- Add a tiny caption under the Day selector: `Scans will be recorded against: Day X — <date>` so the operator sees the exact target before submitting.

### 4. Verify

After the migration:
- Open `/attendance/scan`, pick DESCO — Day dropdown should list 7 days, default to today (Day 2 = Jul 28 while testing).
- Scan a badge, submit, then open the Super Admin Event Report — the Per-day report card should show tabs for Day 1..7, and the Day 2 tab should show the newly scanned attendee.

## Files touched

- New migration: backfill DESCO Day 1 rename + insert Day 2–7 children.
- `src/pages/admin/AttendanceScan.tsx`: "Set up N-day sessions" action + confirm caption under Day selector.

No changes to the report page or edge functions — they already handle multi-day correctly once the day rows exist.

## Out of scope

- Automatic day creation on event creation (can be added later; for now it's a one-click admin action).
- Editing individual day names/dates (Day rows can be edited directly in Supabase if needed).
