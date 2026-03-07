

## Comprehensive DCG Reporting Across All Portals

This is a large feature that touches 4 portals. The plan is organized by portal with shared hooks.

### 1. New Shared Hook: `useRegionalDcgReports`

**File: `src/hooks/useRegionalDcgReports.ts`** (new)

A reusable hook that fetches real DCG attendance and financial data for a region, with optional filtering by specific DCG ID and date range. Returns:
- Per-DCG breakdown: attendance events, attendance rate, member count, financial summary (income/expenses/net), growth rate
- Aggregated regional totals
- Trend data (monthly attendance rates and financial totals over last 6 months)
- Uses `useRegionCurrency` for proper currency formatting

This hook queries:
- `attendance_events` + `attendance_records` (where `dcg_id IS NOT NULL`) for attendance
- `financial_transactions` (where `dcg_id IS NOT NULL`) for financials
- `dcgs` + `dcg_members` for member counts

### 2. Regional Admin Dashboard DCG Tab

**File: `src/components/admin/regional/dashboard/tabs/DCGTab.tsx`** (rewrite)

Replace the current minimal view (just a mock chart) with:
- **KPI Cards**: Total DCGs, Total DCG Members, Average Attendance Rate (real data), DCG Growth Rate
- **Real Attendance Trend Chart**: Replace `DcgAttendanceTrendChart` mock data with actual monthly attendance from `attendance_events`/`attendance_records`
- **DCG Comparison Table**: Each DCG with columns: Name, Members, Attendance Rate, Income, Expenses, Net Balance -- clickable rows to drill into `/admin/regional/dcg/{id}`
- **Financial Trend Chart**: Monthly income vs expenses across all DCGs
- Uses `useRegionCurrency` + `formatWithCurrency` for all amounts

**File: `src/components/admin/regional/dashboard/tabs/DcgAttendanceTrendChart.tsx`** (rewrite)

Accept optional `dcgId` prop. Fetch real attendance data from `attendance_events` grouped by month. No more mock data.

### 3. Regional Admin DCG Profile Page

**File: `src/pages/admin/regional/DcgProfile.tsx`** (update)

- Replace hardcoded `₦` with `useRegionCurrency` + `formatWithCurrency`
- Add real attendance data in the Attendance tab using `useDcgAttendanceHistory`
- Show attendance trend chart (reuse updated `DcgAttendanceTrendChart` with `dcgId` prop)
- Show financial trend chart in Financials tab
- Fix name order to "Last First" in member list
- Fix financial category type comparison (currently checking `'Income'`/`'Expense'` but DB stores lowercase `'income'`/`'expense'`)

### 4. Regional Admin DCG Reports (DcgReportsTab)

**File: `src/components/admin/regional/dcg/DcgReportsTab.tsx`** (rewrite)

Replace placeholder with functional reports:
- DCG selector dropdown (single DCG or "All DCGs")
- Date range filter
- KPI summary cards (attendance rate, member growth, income, expenses)
- Attendance trend chart
- Financial summary table
- CSV export capability

### 5. DCG Portal Reports Page

**File: `src/pages/dcg/Reports.tsx`** (rewrite)

Replace "coming soon" with real reports for the logged-in DCG leader's DCG:
- Date range filter
- KPI cards: Members, Attendance Rate, Total Income, Total Expenses, Net Balance
- Attendance trend chart (monthly)
- Financial trend chart (monthly income vs expenses)
- Recent attendance events table with drill-down
- Recent transactions table
- CSV export for attendance and financials
- Uses `useRegionCurrency` for currency, `useDcgAttendanceHistory` and `useDcgFinancialTransactions` for data

### 6. Super Admin DCG Reports

**File: `src/pages/admin/super/Reports.tsx`** (update existing DCG section)

Enhance the existing "Regional DCG Performance" table:
- Add clickable region rows that expand to show individual DCGs within that region
- Add financial columns: Total Income, Total Expenses per region's DCGs
- Add a "Global DCG Summary" section with aggregate KPIs
- Add attendance trend chart across all regions

**File: `src/pages/admin/super/Dashboard.tsx`** (update DCG overview tab)

Enhance the existing `dcg-overview` tab:
- Add per-DCG drill-down within each region
- Add financial summary columns
- Add attendance rate column with color coding

### 7. Remove All Mock Data

- `DcgAttendanceTab.tsx`: Replace mock arrays with real queries
- `DcgAttendanceTrendChart.tsx`: Replace mock chart data with real attendance history
- `DcgFinancialsTab.tsx`: Replace hardcoded `$` with `formatWithCurrency`

### Files Changed (Summary)

| File | Action |
|------|--------|
| `src/hooks/useRegionalDcgReports.ts` | New - shared DCG reporting hook |
| `src/components/admin/regional/dashboard/tabs/DCGTab.tsx` | Rewrite - real KPIs, tables, charts |
| `src/components/admin/regional/dashboard/tabs/DcgAttendanceTrendChart.tsx` | Rewrite - real data, accept dcgId prop |
| `src/pages/admin/regional/DcgProfile.tsx` | Update - currency, attendance tab, name order |
| `src/components/admin/regional/dcg/DcgReportsTab.tsx` | Rewrite - functional reports |
| `src/components/admin/regional/dcg/DcgAttendanceTab.tsx` | Rewrite - real data |
| `src/components/admin/regional/dcg/DcgFinancialsTab.tsx` | Update - use region currency |
| `src/pages/dcg/Reports.tsx` | Rewrite - full DCG portal reports |
| `src/pages/admin/super/Reports.tsx` | Update - DCG drill-down, financials |
| `src/pages/admin/super/Dashboard.tsx` | Update - DCG tab enhancements |
| `src/hooks/useSuperAdminReports.ts` | Update - add DCG financial data |

### No Database Changes Required

All data already exists in `attendance_events`, `attendance_records`, `financial_transactions`, `dcgs`, and `dcg_members` tables with appropriate RLS policies.

