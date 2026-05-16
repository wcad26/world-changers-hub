## Plan: Rebuild DCG Financial Management from scratch

### Goal
Create a DCG-only finance page that reliably shows the current DCG user's available financial data, instead of depending on regional finance logic or mixed admin context.

### What I found
- The Kotto DCG has financial data available: 20 transactions, income 60,675 and expenses 45,350.
- The current page renders the shell, but the selected period/filters can show zero values and no chart data.
- The current implementation still reuses regional finance components and row types, which makes the DCG page fragile.
- RLS policies already allow DCG admins to access transactions where `dcg_id = get_user_dcg(auth.uid())`, so the rebuild should query by the resolved DCG only.

### Rebuild steps
1. **Create a dedicated DCG finance data layer**
   - Keep `useCurrentDcg()` as the source of truth for the active DCG.
   - Replace the transaction query with a DCG-only hook that fetches by `dcg_id` only.
   - Include category data directly for every row.
   - Return visible error states if Supabase/RLS blocks access.

2. **Rebuild `src/pages/dcg/Finances.tsx` as a standalone DCG finance page**
   - Remove dependency on regional ledger normalization and shared regional finance components.
   - Build local summary calculations for income, expenses, net, offerings, and transaction count.
   - Show all available DCG data by default, with period filters still available.
   - Add a clear “All time” or default broad period so existing historical data is not hidden.

3. **Build DCG-specific UI sections**
   - Header showing the current DCG name and quick actions.
   - KPI cards for Income, Expenses, Net Balance, Offerings, and Transactions.
   - Filters for search, type, category, and period.
   - A DCG trend chart/table summary that uses only the current DCG rows.
   - A transaction ledger table that is open and visible by default, not hidden behind a collapsible.

4. **Ensure create/edit/delete remains DCG-only**
   - Keep `RecordDcgIncomeDialog` and `RecordDcgExpenseDialog` tied to the resolved `currentDcg.id`.
   - Ensure new records always include the current DCG id and derived region id.
   - Invalidate only DCG finance query keys after mutations.

5. **Improve empty/error states**
   - If no active DCG session exists, show an access/setup message.
   - If the DCG exists but has no transactions, show a real empty state with record buttons.
   - If filters hide data, show a filter-empty message with a reset action.

6. **Validate after implementation**
   - Confirm Kotto’s known transaction total can be represented by the new page.
   - Check that the page no longer depends on regional finance hooks for display.
   - Use the preview/network/debug signals to verify the page is not blank and that finance rows are requested by DCG scope only.

### Files to update
- `src/hooks/useDcgFinancials.ts`
- `src/pages/dcg/Finances.tsx`
- `src/components/admin/dcg/RecordDcgIncomeDialog.tsx`
- `src/components/admin/dcg/RecordDcgExpenseDialog.tsx`
- Possibly `src/components/admin/regional/finances/DcgTransactionRowActions.tsx` only if actions still assume regional context

### Database changes
No database schema change is planned initially. If implementation confirms RLS still blocks the signed-in DCG user despite the active session/role, I will add a targeted RLS/function migration separately.