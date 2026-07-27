
## Goal

Fix two related issues on the Event Report page (used by both Super Admin and Regional):
1. **KPI numbers don't add up** because attendees with missing/unknown attributes are silently dropped from the sub-totals.
2. **Multi-day tabs are invisible** when the event only has one attendance day, and the user cannot tell where per-day reporting lives.

Only presentation and the report hook's stats aggregation change. No schema, no attendance-recording changes.

---

## What's wrong today (verified against your DESCO screenshot)

`src/hooks/useEventReport.ts` computes:
- `members` = attendees where `member_type === 'member'` AND not child
- `visitors` = attendees where `member_type === 'visitor'` AND not child
- `maleCount` / `femaleCount` = strict gender match
- `wantToJoin` / `notWantToJoin` / `undecided` = strict `join_interest` match

Anything else (null gender, `child` type, `member_type` outside those two, null `join_interest`) is silently dropped. Result on DESCO: 36 + 19 = 55 out of 82, 22 + 56 = 78 out of 82, 7 + 0 + 7 = 14 out of 19 visitors. The KPI cards look wrong.

Multi-day: `EventReportView.tsx` already renders day tabs and a "Daily Attendance" breakdown table, but ONLY when `totalDays > 1`. DESCO currently has a single attendance_event linked, so tabs never render and there's no hint that the feature exists.

---

## Changes

### 1. `src/hooks/useEventReport.ts` — extend stats with unknowns

Add to `EventReportData.stats`:
- `childrenCount` (already there as `children`)
- `unknownType` — attendees with neither `member` nor `visitor` (excluding children)
- `unknownGender` — attendees with no gender or gender outside male/female
- `visitorsTotal` — count of visitors (denominator for join interest)
- `joinInterestNotSpecified` — visitors with null/blank `join_interest` (already computable but not surfaced)

Invariant to preserve: `members + visitors + children + unknownType === totalAttendees`.

### 2. `src/components/admin/EventReportView.tsx` — accurate KPI cards

Rework the 4 KPI cards so every count is reconciled to the total:

- **Total Attendees**: unchanged, still shows target %.
- **Composition** (renamed from "Members vs Visitors"): show Members / Visitors / Children, and a small muted `+N unknown type` chip when > 0 (with tooltip "Attendees whose member/visitor status isn't set").
- **Gender Distribution**: show Male / Female, and a muted `Unknown: N` badge when > 0.
- **Join Interest (Visitors)**: show Yes / No / Undecided, and add a `Not specified: N` badge. Sub-line: `Based on N visitors`.

Rule: whenever a count > 0 exists in an "unknown/not specified" bucket, render it visibly (muted badge) instead of hiding it. This is the "indicate unknowns" behavior you asked for.

### 3. Make multi-day tabs & per-day reporting discoverable

Currently tabs only appear when `totalDays > 1`. Improve visibility in three ways:

a. **Always render a "Days" panel** above the KPI cards, right under the event summary:
   - Multi-day (>1 attendance_event linked): render the existing `Tabs` (All Days · Day 1 · Day 2 …) with a small header "Per-day report — click a day to filter this entire report to that day."
   - Single-day: render a compact info line: "Single-day event · 1 attendance day recorded" — no tabs.
   - Zero attendance days: render an amber alert: "No attendance sessions have been recorded for this event yet. Days will appear here once attendance is taken."

b. **Add a `Day` column to the Daily Attendance table** header note: "Click a day above to filter the participants list and KPIs to that day only."

c. **Filter chip near the Participants title** when `dayFilter !== 'all'`: `Filtered to Day X (date) · Clear` — clarifies which slice you're reading and how to get back to the aggregate.

### 4. Per-day separation confirmation

The existing hook already re-queries `attendance_records` scoped to the selected `dayEventId`, so KPIs, participants table, and CSV export all recompute per day when a day tab is active. Verify and keep. The CSV filename already includes `-dayN`. No change needed beyond making sure the new "unknown" buckets recompute per day too (they will, since they're derived from the same filtered attendee set).

---

## Where multi-day tabs will appear

On the Event Report page (both `/admin/super/events/:eventId/report` and `/admin/regional/events/:eventId/report`), directly under the event summary card and above the KPI cards:

```text
┌─ Event summary (name, date, location) ──────────────┐
├─ Per-day report ────────────────────────────────────┤
│  [ All Days ] [ Day 1 · Jul 27 ] [ Day 2 · Jul 28 ] │  ← click to filter
├─ Daily Attendance breakdown (only on All Days) ─────┤
├─ KPI cards (recompute per selected day) ────────────┤
└─ Participants table + filters + CSV ────────────────┘
```

For DESCO to actually show multiple day tabs, DESCO must have multiple `attendance_events` rows linked via `source_event_id`. Today's data controls how many tabs appear — the UI is ready.

---

## Files touched

- `src/hooks/useEventReport.ts` — add unknown/not-specified fields to stats.
- `src/components/admin/EventReportView.tsx` — new KPI card layout with unknown chips, always-visible Days panel, filter chip, "click a day" helper text.

No changes to attendance recording, edge functions, or DB.

---

## Out of scope

- Backfilling missing gender/DOB/join_interest on existing profiles.
- Splitting a single-day event into multiple days (that's a data setup task, not a report bug).
- Redesigning the Participants table columns beyond the new "Days Attended" already present.
