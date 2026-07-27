# Event Report — Super Admin + Day Tabs

## Goal
Give Super Admins the same rich per-event report Regional Admins already have, and upgrade both portals so multi-day events (like the ongoing DESCO) are viewed via **day tabs** with an "All Days" overview — not a small day dropdown.

## Scope

### 1. New Super Admin route + page
- Add route `events/:eventId/report` under `/admin/super` in `src/App.tsx` → new page `src/pages/admin/super/EventReport.tsx`.
- In `src/pages/admin/super/Events.tsx`, add a "View report" action in the event row dropdown that navigates to the new route (keep the existing "special-report" entry for special events).
- The Super Admin page mirrors the regional layout but:
  - Resolves the event's own `region_id` from `events` (or supports `NULL` for global events) instead of using `userRegion`.
  - Passes that region into `useEventReport`.
  - Header shows a Region badge and a back button to `/admin/super/events`.

### 2. Day tabs (both portals)
Replace the day `Select` in `src/pages/admin/regional/EventReport.tsx` and use the same component in the new Super Admin page:
- Render a `Tabs` bar at the top of the report when `totalDays > 1`:
  - `All Days` (default) + one tab per day labelled `Day N · <short date>`, with a small "Today" indicator on the matching day.
- Tab selection drives the same `dayFilter` state already wired through `useEventReport`, so KPIs, participants table, and CSV export automatically reflect the active day.
- Keep the existing "Daily Attendance" summary card visible on the **All Days** tab only, and hide the participants "Days Attended" column when a specific day is selected (already handled).
- Single-day events: no tabs, current layout unchanged.

### 3. Shared extraction
Extract the report body into `src/components/admin/EventReportView.tsx` taking `{ eventId, regionId, backTo }` props so both `regional/EventReport.tsx` and `super/EventReport.tsx` render it without duplicating ~450 lines. The hook `useEventReport` and CSV export logic stay as-is.

## Out of scope
- No schema changes; no changes to attendance scanning.
- No new KPIs beyond what the regional report already computes.
- Special-event report page is untouched.

## Technical notes
- `useEventReport` already returns `days[]`, `totalDays`, and accepts a `dayEventId` filter — day tabs just bind to it.
- Global events have `region_id = null`; the Super Admin page will pass `null`/skip the region filter branch in the hook (small tweak: allow `regionId` to be optional and drop the `.eq('region_id', regionId)` on `attendance_events` when absent).
- "Today" detection uses local date comparison against `days[i].eventDate`.
