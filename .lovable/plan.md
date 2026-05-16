## Goal

Add an **Actions** column to the DCG Transactions table on `/admin/regional/finances` (DCG tab). Each row gets a dropdown menu with **View**, **Edit**, and **Delete**. Edit opens a glass-style dialog to modify the transaction; Delete asks for confirmation; View shows read-only details.

## UX

- New rightmost column "Actions" with a `MoreHorizontal` icon trigger.
- DropdownMenu items:
  - **View details** — opens a read-only glass dialog showing all fields (date, DCG, category, type, description, amount, recorded by/at if available).
  - **Edit** — opens the edit dialog pre-filled with the transaction.
  - **Delete** — opens an AlertDialog ("Delete transaction? This cannot be undone."). On confirm, removes the record.
- After edit/delete, the ledger query refetches so all KPIs, per-DCG breakdown, and the trend chart update.

## Files

**New:**
- `src/components/admin/regional/finances/EditDcgTransactionDialog.tsx` — glass-standard edit dialog (gradient header + glow orbs, glass body, gradient CTA). Fields: DCG (read-only), Category (select, scoped to DCG financial categories), Type (derived from category), Amount, Date (popover calendar), Description (textarea). Uses zod + react-hook-form. Submits via a new region-scoped update mutation.
- `src/components/admin/regional/finances/ViewDcgTransactionDialog.tsx` — small read-only glass dialog.
- `src/components/admin/regional/finances/DcgTransactionRowActions.tsx` — encapsulates the dropdown + the three dialogs for one row (keeps `DcgLedgerTab.tsx` tidy).

**Edited:**
- `src/components/admin/regional/finances/DcgLedgerTab.tsx`
  - Add `<TableHead className="text-right w-12">Actions</TableHead>` and `<TableCell>` rendering `<DcgTransactionRowActions row={r} />` at the end of each row.
- `src/hooks/useRegionalLedger.ts`
  - Add `useUpdateRegionalTransaction()` and `useDeleteRegionalTransaction()` mutations that operate on `financial_transactions` scoped to the current region (`region_id = userRegion.id`) so RLS holds. Invalidate `["regional_ledger", regionId]` and existing `dcg_financial_transactions` / `financial_summary` keys on success.

## Technical notes

- The existing `useUpdateDcgTransaction` / `useDeleteDcgTransaction` in `useDcgFinancials.ts` require a `dcgId` and invalidate DCG-portal caches. Since the regional Finance page operates on transactions across many DCGs, we add region-scoped mutations alongside them rather than refactor those.
- All dialogs follow `mem://design/glass-dialog-standard` (gradient header, glow orbs, glass panels, gradient CTA).
- No DB schema changes; existing RLS on `financial_transactions` (regional admin + super admin) already permits update/delete within region.
- Category dropdown uses `useFinancialCategories()` (already used in the existing DCG edit dialog).

## Out of scope

- Bulk actions / multi-select.
- Audit log of edits (can be added later if needed).
- Changing the DCG assignment of a transaction (kept read-only in edit).