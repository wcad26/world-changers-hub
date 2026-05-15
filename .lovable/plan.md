## Goal
Fix the blank page on `/admin/regional/dcg/<id>` introduced after the recent edits adding the financial Edit/Delete actions.

## Diagnosis so far
- The list page `/admin/regional/dcg` itself renders fine; clicking a row navigates to the DCG profile, which is the URL you reported as the redirect target. So the DCG profile is the page that goes blank.
- Earlier in this session the same profile was loading data (members fetched in console). The blank state appeared after the financials Edit/Delete edit. Most likely a runtime render error in `DcgProfile.tsx`.
- I cannot read the failing browser console (the sandbox preview I can drive isn't authenticated as you), so I need the exact error text to be sure.

## Action

1. **You share the console error** — open the browser DevTools console on the blank page and paste the red error.

2. **In parallel, I will harden the suspect spots in `src/pages/admin/regional/DcgProfile.tsx` and `src/components/admin/dcg/EditDcgTransactionDialog.tsx`:**
   - Move `useDeleteDcgTransaction(dcgId || "")` so the empty-string fallback never runs (only call when `dcgId` exists, or guard inside the hook).
   - Cast `transaction as any` (not `DcgFinancialTransaction`) when passing to `setEditingTransaction` / `setDeletingTransaction` — the rows from `useFinancialTransactions` lack `member` field and the strict cast can mismatch.
   - Make `EditDcgTransactionDialog` resilient when `transaction` is `null` and when `categories` is `undefined` (don't crash on `.filter` of undefined; already covered, but double-check).
   - Confirm `AlertDialog` import path (`@/components/ui/alert-dialog`) is the actual file present.

3. **Verify** the page renders again on the same route, then confirm Edit and Delete still work.

## Out of scope
- No other tabs, hooks, or schema changes.
