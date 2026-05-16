## Goal
Rebuild `/dcg/finances` as a DCG-only finance page that does not depend on regional portal context, and make sure existing Kotto DCG transactions can display for the correct DCG leader.

## Findings
- The page is blank because the currently logged-in preview user `chimbotimah@gmail.com` / `chimbotimah21@gmail.com` has no active `dcg_user_sessions` row and no `dcg_admin` role.
- The Kotto DCG does have 20 financial transactions, but its active DCG leader/session is currently `nkwemiclara@gmail.com`.
- Current RLS requires both:
  - an active `dcg_user_sessions` row matching the DCG, and
  - an active `dcg_admin` role.

## Rebuild plan
1. **Create one DCG-only data source**
   - Replace the fragile finance-page DCG lookup with a single hook that resolves the current user's DCG from `dcg_user_sessions`, validates active DCG access, and returns DCG metadata needed by the page.
   - Do not use `userRegion`, regional DCG lists, or regional finance hooks for this page.

2. **Make transaction loading DCG-scoped only**
   - Fetch finance rows only by `dcg_id = currentDcg.id`.
   - Keep region data only for currency display, derived from the resolved DCG row.
   - Surface query/RLS errors visibly instead of showing an empty page.

3. **Rebuild the page UI flow**
   - Show a clear loading state while resolving the DCG.
   - Show the finance dashboard when a DCG is resolved: KPI cards, filters, trend chart, transaction table, export, and record income/expense dialogs.
   - Show an access/setup message only when the signed-in user truly has no active DCG session or role.

4. **Make record/edit/delete actions DCG-only**
   - Ensure income/expense dialogs create records with the resolved `dcg_id` and derived `region_id`.
   - Ensure row actions invalidate DCG-specific queries after changes.

5. **Database access fix if needed**
   - If the intended DCG leader is `chimbotimah@gmail.com`, add/repair that user's active `dcg_user_sessions` row and `dcg_admin` role via a migration.
   - Otherwise, the rebuilt page will correctly show Kotto's data when signed in as `nkwemiclara@gmail.com`, the currently configured Kotto DCG leader.

## Files to update
- `src/hooks/useDcgFinancials.ts`
- `src/pages/dcg/Finances.tsx`
- `src/components/admin/dcg/RecordDcgIncomeDialog.tsx`
- `src/components/admin/dcg/RecordDcgExpenseDialog.tsx`
- Possibly `src/components/admin/regional/finances/DcgTransactionRowActions.tsx` if actions still depend on regional context

## Verification
- Confirm the finance page no longer shows a blank/error state for a valid DCG leader.
- Confirm Kotto's 20 transactions are visible for the configured Kotto leader.
- Confirm invalid/misconfigured users get a clear setup/access message instead of an empty dashboard.