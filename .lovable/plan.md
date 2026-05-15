I’ll make the admin events page resilient against data/render crashes that can occur after the page initially loads.

Plan:
1. Harden the regional events rendering logic in `src/pages/admin/regional/Events.tsx`:
   - Safely handle missing/null event fields such as `location_name`, `category`, `end_datetime`, and optional booleans.
   - Prevent date formatting from throwing if any event has an invalid or unexpected datetime value.
   - Show fallback text instead of letting one bad event row crash the whole page.

2. Add graceful query error UI for the page:
   - If event or attendance loading fails, show a clear error message inside the page instead of a blank screen.
   - Keep existing loading skeletons and normal page layout unchanged.

3. Reduce risky attendance dependency behavior:
   - Treat missing/failed attendance data as an empty list for KPI and table calculations so event management still loads.
   - Preserve existing attendance calculations when data is available.

4. Verify after implementation:
   - Reopen `/admin/regional/events` in the development preview.
   - Confirm the page no longer turns blank and either displays events or a controlled error state.