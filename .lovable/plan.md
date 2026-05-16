
## Goal

Rebuild `/admin/regional/finances` into a finance director console with **segregated accounting** across three top-level tabs, shared filters, and the same visual language as the Regional Dashboard (glass cards, gradient KPIs, period selector).

## Top-level structure

```
Header  ─ Title + period selector + Record Transaction dropdown
Tabs    ─ [ Regional ] [ DCG ] [ Fundraising ]
Body    ─ Tab-specific KPIs, filters, trend chart, transactions table
```

### Tab 1 — Regional Finances
Scope: `financial_transactions WHERE dcg_id IS NULL` (region-level only, excludes DCG ledgers).
- KPI strip (6): Total Income, Total Expenses, Net Balance, Tithes, Offerings, Special Giving.
- Sub-filters: Category (multi), Type (Income/Expense/All), Search.
- Trend chart: monthly income vs expenses (reuse `FinancialTrendChart`).
- Transactions table: Date, Category, Description, Type, Amount.
- Record buttons: Tithe, Offering, Special Giving, Expense (existing dialogs).

### Tab 2 — DCG Finances
Scope: `financial_transactions WHERE dcg_id IS NOT NULL` across all DCGs in the region.
- KPI strip (4): Total DCG Income, Total DCG Expenses, Net DCG Balance, Active DCG Count.
- Sub-filters: DCG (dropdown of region's DCGs + "All DCGs"), Category, Type, Search.
- Breakdown card: per-DCG totals table (DCG name, Income, Expenses, Net, Tx count) with click-through to `/admin/regional/dcg/{id}`.
- Transactions table: Date, DCG, Category, Description, Type, Amount.
- Read-only here (DCG admins record from DCG portal); regional admin may still edit via existing dialogs if needed.

### Tab 3 — Fundraising Finances
Scope: `fundraising_campaigns` + `fundraising_donations` for the region.
- KPI strip (4): Total Raised, Total Goal, Active Campaigns, Donor Count.
- Sub-filters: Campaign Status (Active/Completed/All), Campaign (dropdown), Search.
- Trend chart: donations over selected period (reuse `FundraisingAnalyticsChart`).
- Campaigns grid + donations table (reuse `FundraisingTabContent` content, restyled to match).
- "Create Campaign" button (existing dialog).

## Shared header controls

- **Period selector** (top-right, like dashboard): This Month / Last Month / Last 3M / Last 6M / YTD / 1Y / Custom range. Drives all three tabs' KPIs, charts, and tables.
- **Record Transaction** dropdown stays in header, contextual to active tab (Regional → tithe/offering/expense items; DCG → "Go to DCG portal" hint; Fundraising → Create Campaign).
- **Export CSV** button per tab (current filtered view).

## Visual treatment (match Regional Dashboard)

- Glass KPI cards: `bg-gradient-to-br from-background to-muted/30 backdrop-blur-sm border-border/50 shadow-sm` with small colored icon tile (green/red/blue/purple/amber).
- Section cards with subtle gradient backgrounds.
- Use design tokens only (`text-primary`, `bg-muted`, etc.) — no hard-coded colors except the established KPI semantics (green income / red expense).
- Responsive: 2-col KPI on mobile, 4–6 on lg.

## Data layer

- Extend `useFinancialTransactions(filters)` to accept `dcgScope: 'regional' | 'dcg' | 'all'` and `categoryIds[]`, `type`. Implement as a new lightweight hook `useRegionalLedger` to avoid breaking existing consumers, OR add optional filter fields and keep behavior backward-compatible.
- Add `useDcgAggregatedSummary(regionId, filters)` — groups regional financial_transactions by dcg_id for the per-DCG breakdown.
- Fundraising tab reuses `useFundraisingCampaigns`, `useFundraisingAnalytics`, `useCampaignDonations`.
- All queries respect the active period filter.

## File changes

- Rewrite `src/pages/admin/regional/Finances.tsx` as a thin shell mounting:
  - `src/components/admin/regional/finances/RegionalLedgerTab.tsx` (new)
  - `src/components/admin/regional/finances/DcgLedgerTab.tsx` (new)
  - `src/components/admin/regional/finances/FundraisingLedgerTab.tsx` (new — wraps existing `FundraisingTabContent` with consistent KPIs/filters)
  - `src/components/admin/regional/finances/FinanceFiltersBar.tsx` (new — period + category + type + search)
  - `src/components/admin/regional/finances/FinanceKpiCard.tsx` (new — glass KPI primitive)
- New hook: `src/hooks/useRegionalLedger.ts` (regional-only and per-DCG aggregations).
- No DB schema changes. No changes to existing record-transaction dialogs.

## Out of scope

- DCG portal finance page (separate surface, untouched).
- Budgeting, reconciliation, or multi-currency conversion (current per-region currency only).
- Changes to RLS or financial_transactions schema.
