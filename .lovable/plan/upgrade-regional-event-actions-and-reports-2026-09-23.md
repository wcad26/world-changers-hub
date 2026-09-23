# Upgrade Regional Event Actions and Reports

## Goal
Make each Regional Admin event action menu match the optimized Super Admin version, while keeping every action and report limited to the administrator’s own region.

## Regional event menu
Replace the current regional menu with the same order, labels, icons, and grouping used in Super Admin:

1. **Edit** — open the existing regional edit dialog.
2. **Mark Attendance** — open the existing regional attendance workflow.
3. **View Report** — open the standard regional event report.
4. **Copy Attendance Link** — copy the public self-attendance URL using the event slug when available, otherwise its ID, and show confirmation.
5. For special events only:
   - **Copy Registration Link** — copy the public pre-registration URL and show confirmation.
   - **Special Event Report** — open the new regional special-event report page.
6. **Delete** — retain the confirmation step and destructive styling.

As selected, remove the regional-only **Duplicate** and **Make Public/Private** entries from this dropdown so it is an exact match. Their underlying event data and creation/edit behavior will not be changed.

## Regional report pages
- Keep the existing standard report at `/admin/regional/events/:eventId/report`, including attendance overview, daily attendance, participants, feedback, filters, and export.
- Add `/admin/regional/events/:eventId/special-report` for special-event registration reporting.
- Refactor the existing Super Admin special report into a shared report view so both portals receive the same features and future fixes:
  - registration and attendee totals
  - family and individual breakdowns
  - adult, youth, and child breakdowns
  - lodging, nights, meals, allergies, and health information
  - arrival/departure and daily summaries
  - search and relevant filters
  - downloadable report data
- Preserve portal-specific navigation: Regional returns to Regional Events; Super Admin returns to Global Event Management.
- Keep cross-region filtering available only in Super Admin. Regional Admin sees only its own region’s event and registrations.

## Access and data safety
- Continue using the existing database access rules that restrict regional event, attendance, feedback, fee, and pre-registration records by region.
- Add an explicit page-level event ownership check before showing either regional report, so a manually entered event ID from another region cannot display a report.
- Keep the existing pass-through regional session wrapper unchanged.
- Use the existing `events_view` access model; no new permission or database table is required.

## Technical implementation
- Extract the shared action-menu presentation or align it through a reusable configuration so Regional and Super Admin menus do not drift again.
- Parameterize the special-event report with the event ID, allowed region, return destination, and whether cross-region filters are permitted.
- Add the new TanStack regional special-report route with the existing Regional Admin shell and error boundary pattern.
- Use router navigation for report pages and preserve slug-or-ID public links for copied attendance and registration URLs.
- Add route-specific metadata for the new report page.

## Verification
- Test regular and special events in the Regional Admin menu.
- Confirm regular events do not show registration or special-report actions.
- Confirm copied attendance and registration links open the correct public pages.
- Confirm both Regional report pages load, filter, export, and return correctly.
- Confirm Regional Admin cannot display another region’s report by changing the URL.
- Confirm the existing Super Admin menu and both Super Admin report pages still work.
- Check phone, tablet, and desktop layouts, then confirm the preview builds without errors.
