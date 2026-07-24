## Goal
Make multi-day events first-class in both the attendance scanner and the event report so the operator always knows which day they are marking, and the report can be filtered per day.

## Current state (verified)
- `attendance_events` already supports multi-day via `parent_event_id` and `day_index`.
- `AttendanceScan.tsx` already exposes a "Select day…" dropdown when a parent event has child day rows, but it doesn't make the current day obvious in the header (users have missed it) and defaults quietly to today.
- `useEventReport.ts` aggregates every attendance_event linked to a source event and dedupes across days, so multi-day events collapse into one figure — there is no way to filter per day.
- `EventReport.tsx` (regional) shows no day breakdown at all.

## Changes

### 1. Attendance scanner — show "Day X of N"
In `src/pages/admin/AttendanceScan.tsx`:
- When `days.length > 0`, compute `currentDay = days.find(d => d.id === dayEventId)` and `totalDays = days.length`.
- Replace the header subtitle "Scan badges to mark attendees present" with a live indicator: event name + `Day {day_index} of {totalDays} — {formatted event_date}` (falls back to the single-day date when no children exist).
- Add a prominent day chip above the scanner card (e.g., a colored `Badge` "Day 2 of 4 · Sat 15 Feb") so it is visible while scanning.
- Keep auto-selecting today's day but if today doesn't match any day, highlight a warning "Today's date is outside the event schedule — pick a day manually" instead of silently picking day 1.
- Small polish: label items in the day `<Select>` as `Day {i} · {formatted date}{today badge}`.

### 2. Event report — per-day breakdown & filter
In `src/hooks/useEventReport.ts`:
- Return per-day metadata: `days: [{ attendanceEventId, dayIndex, eventDate, presentCount }]`.
- Accept an optional `dayEventId` param. When provided, restrict `attendance_records` fetch to that one attendance_event id; when omitted, keep current aggregate behavior but expose which day each attendee was marked (add `day_index`/`event_date` to `EventAttendeeWithDetails` by joining on the record's `event_id`).
- Deduplication rule: for aggregate view, still one row per member (earliest recorded_at), plus a `days_attended: number` counter used in the UI.

In `src/pages/admin/regional/EventReport.tsx`:
- Add a "Day" filter `<Select>` next to the existing filters (`All days`, then `Day 1 — date`, …). Hidden when the event is single-day.
- Add a small "Daily attendance" card above the KPI grid for multi-day events: a compact table/bar chart of `Day | Date | Present` sourced from `days`.
- Add a `Days attended` column in the attendee table (e.g., `3 / 4`) only in aggregate view.
- Include the selected day (or "All days") and, in aggregate view, a `Days Attended` column in the CSV export; filename includes the day suffix when filtered.

### 3. Super admin Special Event Report
`SpecialEventReport.tsx` already has a Daily Attendance rollup driven by pre-registrations. Reuse the same `days` structure from `useEventReport` for its attendance-based tab so the day filter works there too (add the same Day `<Select>` on the Attendees tab; leave Registration/Lodging/Health tabs unchanged since those aren't per-day).

## Technical notes
- No DB migrations; `parent_event_id` / `day_index` already exist.
- All new UI keeps existing styling (shadcn cards, badges).
- Single-day events (no child rows) behave exactly as today — new controls are conditionally rendered.
- Query keys updated to include `dayEventId` for cache correctness.
