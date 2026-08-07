# Event Report Page: Tabbed Navigation

Replace the long scrolling layout of the shared event report (used by both the Regional and Super Admin portals) with a tabbed layout.

## Layout after the change

Always visible at the top (outside the tabs):
- Back button, page title, and the region/global badge
- Event summary card (name, date, location, category)
- Day selector (All Days / Day 1 / Day 2 ...) for multi-day events, so switching day still filters every tab
- Region filter (Super Admin only) stays in the Participants tab where it belongs

Tabs:

```text
[ Overview ] [ Daily Attendance ] [ Participants ] [ Feedback ]
```

- **Overview** — the four KPI cards (Total Attendees, Composition, Gender Distribution, Join Interest) plus the per-day report description note.
- **Daily Attendance** — the day-by-day present-count table. Tab only shown for multi-day events; hidden otherwise.
- **Participants** — the attendee table with its search, filters, and CSV export button.
- **Feedback** — the existing feedback and testimonies panel.

## Behaviour

- Default tab is Overview.
- Selected day filter persists across tab switches and continues to drive KPIs, participants, and CSV export.
- Tabs scroll horizontally on mobile so they never wrap awkwardly.
- No data, query, or export logic changes — this is a presentation-only rearrangement.

## Technical notes

- All work is in `src/components/admin/EventReportView.tsx`, which both `src/pages/admin/regional/EventReport.tsx` and `src/pages/admin/super/EventReport.tsx` already render, so both portals update at once.
- Use the shadcn `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` primitives already imported in the file; add `TabsContent` to the import.
- The existing day-filter `Tabs` instance stays separate from the new section tabs (two independent `Tabs` roots), each with its own state value.
- Loading skeleton and error alert states remain as they are today.
