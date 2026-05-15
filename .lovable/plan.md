## Rebuild DCG Profile Page (`/admin/regional/dcg/:dcgId`)

Modernize the DCG report/profile page to match the look-and-feel of the rest of the admin portal (glassmorphism KPIs, cleaner header, refined sections), remove the Attendance tab, and surface the DCG-scoped attendance trend chart inline.

### Changes — `src/pages/admin/regional/DcgProfile.tsx`

1. **Back button (top of page)**
   - Add a "Back" button that uses `navigate(-1)` to return to the previous page.
   - Outline/ghost style with `ArrowLeft` icon, placed above the header card.

2. **DCG Header (modernized)**
   - Replace the plain Card with a glass-style header section using `GlassSection`/gradient background consistent with the regional dashboard aesthetic.
   - Larger DCG name as page title, description below, status badge + "Edit Location" action on the right.
   - Meta row (Leader, Location, Meeting Day, Time, Contact) rendered with subtle icon chips and refined typography.

3. **KPI Cards (modernized)**
   - Replace the four plain stat Cards with `GlassKPICard` components (same component used in the regional Dashboard) for: Total Members, Total Income, Total Expenses, Net Balance.
   - Color tokens: use semantic tokens (`text-primary`, `text-destructive`, success token) — no raw `text-green-600`/`text-red-600`.

4. **Inline DCG Attendance Trend chart**
   - Remove the `Attendance` tab entirely.
   - Add `<DcgAttendanceTrendChart dcgId={dcgId} />` directly below the KPI cards, above the tabs.
   - The component already accepts a `dcgId` prop and `useRegionalDcgReports({ dcgId })` already filters the trend to that DCG only — no hook changes required.

5. **Tabs simplified to 2**
   - Tabs become: `Members` | `Financials` (Attendance tab removed).
   - Members and Financials tab content kept, restyled with consistent spacing and semantic tokens.
   - Remove now-unused imports: `Table*` components and `useDcgAttendanceHistory` (no longer rendered here since the trend chart replaces the recent-attendance table).

### Technical notes

- File touched: `src/pages/admin/regional/DcgProfile.tsx` only.
- Reused as-is:
  - `DcgAttendanceTrendChart` (already DCG-scoped via `dcgId` prop).
  - `GlassKPICard` from `@/components/ui/GlassSection`.
  - `EditDcgDialog` (no change).
- `navigate(-1)` is the standard React Router way to "go to previous page visited" — works regardless of which page the user came from (DCG list, dashboard, deep link, etc.). If there's no history, it stays put; that's acceptable for an admin tool.
- No backend, schema, or hook changes required.
- No business-logic changes — purely UI/presentation.

### Verification
- Open `/admin/regional/dcg/<id>` in preview, confirm: back button works, header looks modern, 4 glass KPI cards render, trend chart shows DCG-scoped data, only Members + Financials tabs remain.
