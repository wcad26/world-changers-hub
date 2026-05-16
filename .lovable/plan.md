## Plan

1. **Resolve the active DCG directly for the DCG portal**
   - Add a DCG-specific hook/function that resolves the current signed-in user's active DCG via `get_user_dcg(auth.uid())` and fetches that exact `dcgs` row.
   - Stop depending on regional `useDcgs()` for the DCG finance page, because that hook requires `userRegion` and can be empty in DCG-only sessions.

2. **Make finance reads uniquely DCG-scoped**
   - Update the finance page to pass only the resolved DCG ID into `useDcgFinancialTransactions`.
   - Ensure the query filters by `.eq('dcg_id', activeDcg.id)` and does not use region-wide filtering.
   - Use the DCG's own `region_id` only for currency display, not for broadening data access.

3. **Fix record income / expense dialogs for DCG-only sessions**
   - Replace the regional `useCreateFinancialTransaction()` calls with `useCreateDcgTransaction(activeDcg.id)` so new entries are inserted with the current DCG ID and the DCG-derived region.
   - Remove the dependency on `useDcgs()` in those dialogs and use the current `userDcg`/passed DCG context instead.

4. **Add a clear loading/error state**
   - While the active DCG is being resolved, show a loading state instead of zero KPIs.
   - If Supabase/RLS blocks the DCG query, show an actionable error message instead of silently displaying blank data.

5. **Verification**
   - Confirm the database already has DCG transactions and RLS policies for `dcg_admin` users scoped by `get_user_dcg(auth.uid())`.
   - After implementation, verify `/dcg/finances` uses the active DCG only and should show Kotto’s existing 20 transactions when logged in as its DCG leader.

## Technical details

- Main files to change:
  - `src/pages/dcg/Finances.tsx`
  - `src/components/admin/dcg/RecordDcgIncomeDialog.tsx`
  - `src/components/admin/dcg/RecordDcgExpenseDialog.tsx`
  - possibly `src/hooks/useDcgFinancials.ts` for a reusable `useCurrentDcg` helper if needed.
- No database schema change is planned unless testing shows the logged-in DCG user is missing the expected `dcg_user_sessions` or `dcg_admin` role.