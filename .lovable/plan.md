## Goal
Add an Actions column to the DCG financial transactions table on the DCG profile page so regional admins can edit (and delete) transactions.

## Changes

### 1. `src/hooks/useDcgFinancials.ts`
Add two new mutation hooks:
- `useUpdateDcgTransaction(dcgId)` — updates `category_id`, `amount`, `description`, `transaction_date` on `financial_transactions` by id; invalidates `dcg_financial_transactions`, `dcg_financial_summary`, `recent_dcg_transactions`, and regional `financial_transactions`/`financial_summary`.
- `useDeleteDcgTransaction(dcgId)` — deletes by id; same invalidations.

### 2. New `src/components/admin/dcg/EditDcgTransactionDialog.tsx`
Reusable dialog (mirrors `RecordDcgIncomeDialog` / `RecordDcgExpenseDialog` styling) with fields:
- Category (Select, filtered by transaction's current type — income or expense — using `useFinancialCategories`)
- Amount (numeric)
- Date (date picker)
- Description (textarea)

Uses `dcgTransactionSchema` + `useUpdateDcgTransaction`. Shows toast on success/error.

### 3. `src/pages/admin/regional/DcgProfile.tsx` (financials table only)
- Add a new `Actions` `TableHead` (right-aligned, `w-[60px]`).
- For each row, add a `TableCell` with a `DropdownMenu` (`MoreVertical` trigger) containing:
  - **Edit** → opens `EditDcgTransactionDialog` with the selected transaction
  - **Delete** → confirmation via `AlertDialog`, calls `useDeleteDcgTransaction`
- Add local state `editingTransaction` and `deletingTransaction`.
- Update empty-state `colSpan` to 6.

## Out of scope
- No schema changes (existing RLS on `financial_transactions` already allows regional admins to update/delete their region's rows).
- No changes to the trend chart, member table, or other tabs.
- Type cannot be changed when editing (would require switching category to one of opposite type, which the category dropdown handles naturally).
