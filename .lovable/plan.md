

## Plan: Make the Regional Admin Portal Mobile & Tablet Optimized

### Current state (verified)

- **Layout**: `AdminLayout.tsx` renders the shadcn `Sidebar` (collapsible="icon"). On mobile the sidebar still occupies space; the "trigger" lives only inside the sidebar header so once collapsed there's no easy way to reopen it from the main area. The header bar shows the user's full email which overflows on small screens.
- **Tables**: Members, Events, Communication, Reports, EventReport all use a 6-7 column `<Table>` that becomes unreadable below ~900px (some have `overflow-x-auto`, most don't).
- **Filter bars**: Dashboard, Members, Events use `flex flex-wrap gap-4` with fixed-width `Select w-[180px]` — they wrap badly on narrow screens and the search input collapses.
- **KPIs**: Dashboard already uses `grid-cols-2 lg:grid-cols-3 xl:grid-cols-6` (good). Members KPIs and Access KPIs need to be checked.
- **Dialogs**: Already correct (`max-w-3xl w-[95vw] max-h-[90vh]`).
- **Dashboard chrome**: Filter bar uses `flex flex-wrap` and is fine below md but the period pill group + custom-date popover + event-type select + search all on one row crowd on phones.

### Approach (mirror what already works in DCG and Member portals)

Keep desktop unchanged. For widths < 1024px (tablet + mobile, matching `useIsTablet`), switch the regional portal to a **mobile shell**: fixed top bar with a hamburger that opens the existing menu in a `Sheet`, fixed bottom navigation pill with the 4 most-used pages, and content padded to clear both. This is the exact pattern documented in `mem://ui/dcg-portal-layout-and-navigation` and `mem://ui/member-portal-mobile-tablet-layout`.

Then make every table and filter bar inside each page responsive.

### Part A — New responsive shell for the regional portal

Modify `src/components/admin/AdminLayout.tsx`:
- Add `useIsTablet()` (already exists). When `isMobile || isTablet`, render a mobile shell instead of the desktop sidebar.
- **Mobile shell:**
  - Fixed top header (`fixed top-0 h-14`) showing region name + page title (compact) + a `Sheet` trigger (hamburger).
  - The sheet contains the current `menuItems` list, the `PortalSwitcher`, and the Sign Out button.
  - Fixed bottom navigation pill (same visual style as MemberLayout) with 4 quick links chosen from `menuItems` (Dashboard, Members, Events, DCG — falling back to the user's first 4 permitted items if any are filtered out).
  - `<main>` gets `pt-14 pb-24` so content clears both bars (per memory rule).
- Desktop branch remains the existing shadcn sidebar.

Because `EnhancedRegionalAdminLayout` simply wraps `AdminLayout`, this single change covers every regional page.

### Part B — Per-page table & filter responsiveness

For each page below, two changes:
1. Wrap the `<Table>` in `<div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">` so it scrolls horizontally on phones without breaking the card padding.
2. Replace fixed-width selects (`w-[180px]`, `w-[160px]`, `w-[130px]`) with `w-full sm:w-[180px]` and put the filter row in `flex flex-col sm:flex-row sm:flex-wrap gap-3` so each control becomes full-width on phones.
3. Hide low-priority columns with `hidden md:table-cell` (e.g. Address, Join Date, Phone) so the table still fits. Keep Name + Status + Actions visible on mobile.

Pages to update:
- **Dashboard.tsx** — make filter bar stack on mobile; KPI grid is already responsive; charts already use `ResponsiveContainer`.
- **Members.tsx** — responsive filter row; hide Address + Join Date on mobile; horizontal scroll wrapper.
- **Events.tsx** — responsive filter row; the events table already has `overflow-x-auto`; just stack the filter selects on mobile.
- **Finances.tsx** — `Tabs` already wrap; verify the transactions tables get an `overflow-x-auto` wrapper.
- **Communication.tsx** — already wraps in `overflow-x-auto`; only the filter row needs stacking.
- **Reports.tsx** — same: tables wrap; stack filters.
- **EventReport.tsx** — already wraps; stack filters; reduce select widths on mobile.
- **Certificates.tsx** — verify the certificate cards grid uses `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`; add wrapper if missing.
- **Discipleship.tsx**, **DCG.tsx**, **UserRoles.tsx**, **UserManagement.tsx**, **Settings.tsx**, **BranchSettings.tsx** — verify they collapse cleanly; mostly already use cards/grids that work.

### Part C — Header polish on mobile

In the mobile top bar:
- Show the page title (already mapped in `AdminLayout`'s `getPageTitle`) instead of region name.
- Drop the user's email (it overflows). Move it into the side sheet's header along with the region name.

### Files to modify

- `src/components/admin/AdminLayout.tsx` — add the mobile/tablet shell branch.
- `src/pages/admin/regional/Members.tsx` — responsive filter row + table.
- `src/pages/admin/regional/Events.tsx` — responsive filter row only.
- `src/pages/admin/regional/Dashboard.tsx` — responsive filter row.
- `src/pages/admin/regional/Finances.tsx` — wrap transaction tables in `overflow-x-auto`.
- `src/pages/admin/regional/Communication.tsx` — stack filters on mobile.
- `src/pages/admin/regional/Reports.tsx` — stack filters on mobile.
- `src/pages/admin/regional/EventReport.tsx` — stack filters; full-width selects on mobile.
- `src/pages/admin/regional/Certificates.tsx` — verify/adjust grid breakpoints.
- `src/components/admin/regional/roles/UsersWithAccessTable.tsx` & `RoleManagementGrid.tsx` — responsive grid + table.
- `src/components/admin/regional/MemberKPICards.tsx` — confirm `grid-cols-2 lg:grid-cols-5` style.

### QA checklist (mobile 375px, tablet 768px, desktop ≥1024px)

1. At 375px: top bar visible, hamburger opens full menu sheet, bottom nav pill shows 4 icons, content not hidden behind either bar.
2. At 768px: same mobile shell (per project convention).
3. At ≥1024px: original sidebar layout returns unchanged.
4. Members/Events/Reports tables scroll horizontally without breaking the card; Name + Actions always visible.
5. All filter rows stack vertically on phones; selects are full-width.
6. Dashboard KPIs stay 2-up on phones, 6-up on desktop.
7. Permission filtering still drives both the sheet menu and the bottom nav (a Children Ministry user sees only their allowed quick-links).

