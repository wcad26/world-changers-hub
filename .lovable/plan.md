
Goal

Fix the regional dashboard so the filter bar is locked under the portal header and never moves, while the event/search filters drive every dashboard section consistently.

What I found

- The dashboard filter bar is already outside the inner content scroll, but the shared admin shell still uses a brittle height setup (`min-h-screen` + `h-[calc(100vh-56px)]`). That can still allow page-level scrolling, so the filter rail appears to move.
- The dashboard currently applies `eventType` only to `filteredAttendance`. The KPI cards still use partially unfiltered event/attendance data, so the dropdown does not fully affect the page.
- The current attendance shaping aggregates by date too early, which makes event-name/search filtering unreliable for dashboard-wide reporting.

Implementation plan

1. Rebuild the dashboard route shell in `src/components/admin/AdminLayout.tsx`
- Replace the current dashboard height logic with a true full-height flex shell (`h-svh`, `flex-1`, `min-h-0`).
- Keep the shared page header as fixed top chrome.
- Make `main` a non-scrolling container for `/admin/regional/dashboard` so the body/page itself no longer scrolls.

2. Rebuild the dashboard page layout in `src/pages/admin/regional/Dashboard.tsx`
- Split it into two explicit layers:
  - fixed filter rail under the header (`shrink-0`, bordered surface, z-index)
  - scrollable dashboard body only (`flex-1 min-h-0 overflow-y-auto`)
- This fully separates the filter section from KPIs/charts, so content scrolls underneath it.

3. Create one source of truth for dashboard filters
- Build a single filtered event set that applies:
  - period
  - search query
  - event type (all / regional / dcg)
  - special-event exclusion
- Derive `filteredEventIds` from that set and use those IDs for all downstream calculations.

4. Make every dashboard section use the same filtered dataset
- Recompute from the same filter pipeline:
  - KPI event counts
  - average attendance
  - attendance target %
  - attendance trend chart
  - gender/age distribution
- For members/children/demographics, use the filtered participant cohort when the event filter/search is narrowing the view; keep region-wide totals only when the dashboard is not narrowed.

5. Fix event search/event-type behavior at the data layer
- Filter by real source event metadata first, then aggregate attendance after filtering.
- This avoids the current issue where date-grouped attendance rows break event-based filtering.

6. Preserve existing reporting rules
- Keep special event visitors excluded.
- Keep child/member/visitor categorization aligned with the Members page KPI rules.
- Preserve the current branded styling and popover behavior.

Files to update

- `src/components/admin/AdminLayout.tsx`
- `src/pages/admin/regional/Dashboard.tsx`
- Possibly `src/hooks/useAttendance.ts` only if a small hook extension is cleaner than a dashboard-local query

QA after implementation

- On `/admin/regional/dashboard`, only the dashboard body scrolls.
- The page header and filter rail stay fixed at all times.
- Switching All / Regional / DCG updates every section consistently.
- Searching by event name updates every dashboard output consistently.
- Custom date range still works and opens correctly above the content.
