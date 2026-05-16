## Goal

Replace the current `src/pages/dcg/Finances.tsx` with a redesigned page that mirrors the look and feel of the Regional portal's Finance Management (`src/pages/admin/regional/Finances.tsx` + its `finances/*` components), but scoped to the logged-in DCG only. Top-grade, glass aesthetic, recharts trend, KPI cards, filters, export, itemized ledger.

## Scope

- Only the single DCG bound to the logged-in user (`userDcg.id`). No DCG picker. No regional/fundraising tabs.
- Uses existing data hook `useDcgFinancialTransactions(dcgId, { from, to })` from `src/hooks/useDcgFinancials.ts`.
- Keep the existing Record Income / Record Expense dialogs.

## Page structure

```text
┌─ Glass Header ──────────────────────────────────────────────┐
│  DCG Financial Management          [PeriodSelector 1M..1Y] │
│  Track income, expenses and giving for <DCG name>           │
│                                          [Record Income]    │
│                                          [Record Expense]   │
└─────────────────────────────────────────────────────────────┘

┌── KPI cards (4) ────────────────────────────────────────────┐
│ Income | Expenses | Net | Offerings  (FinanceKpiCard)       │
└─────────────────────────────────────────────────────────────┘

┌── Filters bar ──────────────────────────────────────────────┐
│ [search]  [Type: all/income/expense]  [Income type]         │
│ [Expense category]                          [Export CSV]    │
└─────────────────────────────────────────────────────────────┘

┌── LedgerTrendChart (Income / Expenses / Net, weekly cum.) ──┐
└─────────────────────────────────────────────────────────────┘

┌── Category Breakdown card ──────────────────────────────────┐
│  Category | Type | Count | Total                            │
└─────────────────────────────────────────────────────────────┘

┌── Collapsible: Transactions (itemized) ─────────────────────┐
│ Date | Category | Description | Type | Amount | Actions     │
└─────────────────────────────────────────────────────────────┘
```

## Components reused (no new files unless noted)

- `PeriodSelector` + `resolvePeriod` from `components/admin/regional/finances/PeriodSelector.tsx`
- `FinanceKpiCard`
- `FinanceFiltersBar` (already supports search + type + income-type + expense-category)
- `LedgerTrendChart` (accepts rows shaped like `LedgerRow`; our DCG rows already include `category` and `amount`/`transaction_date`)
- `EditDcgTransactionDialog` + `DcgTransactionRowActions` for row actions (Edit/Delete already wired through `useDcgFinancials`)
- `exportCsv` from `utils/csvExport`
- Existing `RecordDcgIncomeDialog` / `RecordDcgExpenseDialog`

## Data

- `useAuth()` → `userDcg`, current DCG `region_id` via `useDcgs()`
- `useRegionCurrency(region_id)` for currency formatting via `formatCurrencyWithSymbol`
- `useDcgFinancialTransactions(userDcg.id, { from, to })` for rows in range
- Client-side filtering for search / type / income type / expense category (mirrors regional behavior)
- Derived: total income, total expenses, net, offerings total; category aggregation for breakdown table

## Styling

- Glass header card: `rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-5`
- Same KPI/tab/table treatments as `DcgLedgerTab` (muted header bar, hover rows, tabular-nums)
- All colors via semantic tokens; no raw hex
- Mobile: KPIs collapse to 2-col grid, filters stack, table inside `overflow-x-auto`

## Files changed

- Rewrite: `src/pages/dcg/Finances.tsx` (single file change)
- No route, layout, or hook changes

## Out of scope

- No DB schema changes
- No new dialogs (reuse existing)
- Reports/analytics page (already removed)
