## Goal
Plot the Financial Trends chart as **running cumulative totals** across the filtered period, so the final point on the right always equals the period's Total Income, Total Expenses, and Net Balance shown in the KPI cards.

## Change
In `src/components/admin/regional/finances/LedgerTrendChart.tsx`, replace the current "carry-forward last bucket" logic with a true running sum:

- Walk weeks in chronological order (`eachWeekOfInterval` on `[minTs, maxTs]`, Mon-start — unchanged).
- Maintain `cumIncome` and `cumExpenses` accumulators starting at 0.
- For each week: add that week's income/expense bucket totals (0 if the week is empty) to the accumulators.
- Emit `{ Income: cumIncome, Expenses: cumExpenses, Net: cumIncome - cumExpenses }` per week.

Result: the line rises with each week that has activity, stays flat across empty weeks, and the final week matches the period totals (e.g. 50k income on the example).

## Out of scope
- Period selector, summary cards, other tabs
- Data fetching, filtering, hooks
- Switching back to monthly bucketing (weekly is kept)
