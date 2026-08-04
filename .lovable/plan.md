# Event Report: trim table columns + add region filter

## What changes

1. **Participants table (both Super Admin and Regional event report)**
   - Remove the "Member ID" and "Join Interest" columns from the table and from the "All Interests" filter is kept? No — the Join Interest dropdown filter is also removed since its column is gone. Search still matches member ID text.
   - CSV export keeps all fields (no loss of exportable data).

2. **Region filter (Super Admin only)**
   - New "All Regions" dropdown next to the existing Type/Gender filters, listing only the regions actually present among the event's attendees.
   - Filters the participants table (and CSV export) to attendees from the selected region.
   - Not shown on the Regional report, where every attendee is already from one region.

3. **Region column**
   - When the region filter is available (Super Admin), the table shows a "Region" column so the filter result is readable.

## Technical notes

- `src/hooks/useEventReport.ts`: include `region_id` in the members select and resolve region names (`regions` lookup), exposing `region_id` / `region_name` on each attendee plus a deduped `regions` list on the report data.
- `src/components/admin/EventReportView.tsx`: drop the Member ID / Join Interest table cells and headers and the join-interest Select; add a `showRegionFilter` prop (true from `src/pages/admin/super/EventReport.tsx`) that renders the region Select and the Region column; extend the filter memo and CSV rows accordingly.
- KPI cards (including Join Interest KPI) stay unchanged.
