## Plan: Dashboard Brand Colors, Filter Fixes, Tithers Card Upgrade, Menu Restructuring & Events KPI

### Summary

Fix dashboard chart colors to use WCA brand palette, exclude special event visitors, make filter bar truly sticky, restructure the Tithers/Income card into a 4-quadrant layout, rename and restructure menu items, and add Attendance Target KPI to Events page.

### 1. Define Chart CSS Variables (`src/index.css`)

Add `--chart-1` through `--chart-5` in both light and dark themes using WCA brand colors:

- `--chart-1`: WCA purple (#773b6e) — Members
- `--chart-2`: WCA teal (#35adaf) — Regular Visitors
- `--chart-3`: WCA violet (#542a8f) — Adult Males
- `--chart-4`: Soft pink (derived) — Children
- `--chart-5`: Muted gray — Unknown

### 2. Dashboard (`src/pages/admin/regional/Dashboard.tsx`)

**Brand colors for charts**: Replace any hardcoded black/default colors with the CSS var-based brand colors. Update area chart gradients and bar chart fills to use the new `--chart-*` vars.

**Exclude special event visitors**: Replicate the `MemberKPICards` logic — visitors whose `rated_event_id` maps to a special event are excluded from:

- Members KPI count
- Children KPI count
- Attendance trend
- Gender & Age Distribution (remember the criteria for Young Male and Young Female are our criteria for Children (age and relationship basis) but now separated into male and female. the adult male and adult female are the members and regular visitors that are not children.  
This requires fetching special event IDs (events where `is_special = true`) and filtering them out.

**Sticky filter bar**: Update the sticky div to use `sticky top-0 z-20` with proper background to ensure it stays fixed. Add `overflow-y-auto` to the parent if needed.

**Income growth as percentage**: Calculate income growth by comparing current period income to the equivalent previous period income, display as `+X%` or `-X%` instead of an amount.

**Tithers card → 4-quadrant card**: Restructure the 1/3 card into a 2x2 grid with cross-line separators:

- **Top-left**: Tithers (unique tithe payers count)
- **Top-right**: Givers (unique individuals who gave any income transaction)
- **Bottom-left**: Income Growth (% comparing current vs previous period)
- **Bottom-right**: Fundraising Target (% of total raised / total goal across all campaigns)

### 3. Menu Restructuring (`src/components/admin/RegionalAdminLayout.tsx`)

- Remove "Fundraising" from menu items (will be accessed from Finance page)
- Rename "Finances" → "Finance Management"
- Rename "Communication" → "Communication Mgmt"

### 4. Update route title map (`src/components/admin/AdminLayout.tsx`)

- `/admin/regional/finances` → "Finance Management"
- `/admin/regional/communication` → "Communication Mgmt"
- Remove fundraising route title

### 5. Finance page integration (`src/pages/admin/regional/Finances.tsx`)

Add a "Fundraising" tab or section link within the Finance Management page so fundraising is accessible from there.

### 6. Events page Attendance Target KPI (`src/pages/admin/regional/Events.tsx`)

Add a 5th KPI card "Attendance Target" to the Events page KPI grid (change from `md:grid-cols-4` to `md:grid-cols-5`). Calculate attendance target % the same way as the dashboard: sum of actual attendance / sum of regional event capacity.

### Files Modified

- `src/index.css` — Add chart color CSS variables
- `src/pages/admin/regional/Dashboard.tsx` — Brand colors, exclude special visitors, sticky fix, income growth %, 4-quadrant tithers card, fundraising target
- `src/components/admin/RegionalAdminLayout.tsx` — Rename menu items, remove Fundraising
- `src/components/admin/AdminLayout.tsx` — Update route title map
- `src/pages/admin/regional/Finances.tsx` — Add Fundraising access
- `src/pages/admin/regional/Events.tsx` — Add Attendance Target KPI card