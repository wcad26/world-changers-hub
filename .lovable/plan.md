## Goal
Change the Financial Trends chart to aggregate by week (instead of month), regardless of the selected period filter. Each week produces three points: Income (offerings + tithes + special giving + any other income), Expenses (all expense categories), and Net (Income − Expenses).

## Scope
Single file: `src/components/admin/regional/finances/LedgerTrendChart.tsx`.

No changes to data fetching, filters, business logic, or other tabs. The component already receives `rows: LedgerRow[]` already filtered by the active period — we just re-bucket those rows by week.

## Implementation

1. **Replace monthly bucketing with weekly bucketing** in the `useMemo` block:
   - Use `date-fns`'s `startOfWeek` (with `weekStartsOn: 1` for Monday) to derive a stable week key per transaction.
   - Bucket key: `format(weekStart, "yyyy-MM-dd")`; label: `format(weekStart, "MMM d")` (e.g. "Nov 17").
   - Sum **all** income-type categories into `Income` (already the case — current code sums by `category.type === "income"`, which correctly covers tithes, offerings, special giving, and any other income subcategory).
   - Sum **all** expense-type categories into `Expenses`.
   - Compute `Net = Income − Expenses` per week.

2. **Fill empty weeks** between the earliest and latest transaction in the filtered set so the line chart shows a continuous weekly cadence (no gaps when a week has zero transactions). Use `eachWeekOfInterval` from `date-fns` across `[min(transaction_date), max(transaction_date)]` with `weekStartsOn: 1`, defaulting missing weeks to `{ Income: 0, Expenses: 0, Net: 0 }`.

3. **X-axis tick label** updates from "MMM yyyy" to "MMM d" so weekly granularity is readable. If the number of weeks is large, rely on Recharts' default tick thinning (no manual interval needed for this scope).

4. **Description copy** (optional, small): update the default chart description shown by `RegionalLedgerTab` if it mentions monthly — confirm during implementation; if it does, change to "Weekly income, expenses and net for the selected period."

## Out of scope
- Period selector behavior
- Other tabs (DCG, Fundraising) — only Regional Financial Trends as selected
- Schema, hooks, RLS, summary cards
