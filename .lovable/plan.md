

## DCG Portal Mobile & Tablet UI Revamp

### Problem
The DCG portal reuses the generic `AdminLayout` with a Shadcn sidebar that breaks on mobile/tablet -- content overflows, tables are unreadable, headers overlap, and there's no bottom navigation or hamburger menu.

### Approach
Create a dedicated DCG layout (similar to the existing `MemberLayout`) with three responsive modes:
- **Mobile** (<768px): Fixed header with hamburger menu, bottom tab bar, slide-out left menu, content with proper padding
- **Tablet** (768-1023px): Same as mobile but with more spacious cards and 2-column grids
- **Desktop** (1024+): Keep existing sidebar layout

Then update each DCG page to use responsive card layouts instead of tables on mobile.

### Files Changed

**1. `src/components/admin/DcgAdminLayout.tsx`** -- Complete rewrite

Replace the thin wrapper around `AdminLayout` with a full responsive layout:
- Desktop: Keep sidebar with menu items, header with portal switcher and email
- Mobile/Tablet: Fixed top header (region name + page title + hamburger icon), Sheet slide-out menu from left with all nav items + logout, fixed bottom tab bar with Dashboard/Members/Events/Finances/Reports icons
- Content area gets `pt-14 pb-24` padding on mobile to avoid header/footer overlap
- Use `useIsMobile` and `useIsTablet` hooks for breakpoint detection

**2. `src/pages/dcg/Dashboard.tsx`** -- Mobile-optimize layout

- Page title: smaller text on mobile (`text-2xl` vs `text-3xl`)
- Stats cards: `grid-cols-2` on mobile (already has this), ensure text doesn't overflow
- Members/Finances summary: stack vertically on mobile (single column)
- Quick actions: 2-column grid on mobile

**3. `src/pages/dcg/Members.tsx`** -- Replace table with card view on mobile

- Header buttons: stack vertically or use icon-only buttons on mobile
- Replace `<Table>` with member cards on mobile showing name, contact, role, and actions
- Keep table on desktop

**4. `src/pages/dcg/Events.tsx`** -- Responsive event cards

- TabsList: scrollable horizontally on mobile
- Replace event tables with card-based layout on mobile showing event name, date, location, and attendance action
- Keep table on desktop

**5. `src/pages/dcg/Finances.tsx`** -- Responsive finance layout

- Period filter buttons: horizontally scrollable on mobile
- KPI cards: 2-column grid on mobile
- Transaction table: card view on mobile showing date, description, amount
- Action buttons (Record Income/Expense): icon-only or stacked on mobile

**6. `src/pages/dcg/Reports.tsx`** -- Responsive reports

- KPI cards: 2-column grid on mobile
- Charts: full-width with reduced height on mobile
- Transaction table: card view on mobile

### Technical Details

- Bottom tab bar uses the same glassmorphic design as MemberLayout (primary bg, white active tab, rounded-2xl)
- Slide-out menu uses `Sheet` component from `@/components/ui/sheet` with `side="left"`
- All pages wrapped in new DcgAdminLayout get automatic responsive behavior
- Tables replaced with `useIsMobile`-gated card lists showing key info in stacked format
- The `signOut` function in the layout will navigate to `/dcg-auth` after sign out (matching existing DCG logout behavior)

### No Database Changes Required

