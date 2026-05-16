# Regional Ledger: Add row actions and clickable rows

Reuse the existing DCG transaction row actions (View / Edit / Delete) in the regional Transactions table on `/admin/regional/finances` and make rows clickable.

## Findings

The "DCG transaction table" actions referenced live in:
- `src/components/admin/regional/finances/DcgTransactionRowActions.tsx` — dropdown menu (View · Edit · Delete) using `useDeleteRegionalTransaction`.
- `src/components/admin/regional/finances/EditDcgTransactionDialog.tsx` — already uses `useUpdateRegionalTransaction` and works on any `LedgerRow` (DCG name shown only when present).
- `src/components/admin/regional/finances/ViewDcgTransactionDialog.tsx` — read-only details, also generic.

These three already operate on `LedgerRow` from `useRegionalLedger`, so the same components used for DCG rows in `DcgLedgerTab.tsx` will work for regional rows in `RegionalLedgerTab.tsx` with no code changes to the action/dialog components themselves.

## Changes to `src/components/admin/regional/finances/RegionalLedgerTab.tsx`

1. Import `DcgTransactionRowActions` and `ViewDcgTransactionDialog`.
2. Add an "Actions" column header (right-aligned, narrow) after Amount.
3. Render `<DcgTransactionRowActions row={r} />` in each row's last cell.
4. Make each `TableRow` clickable:
   - Add `onClick` that sets the selected row and opens a single shared `ViewDcgTransactionDialog`.
   - Add `cursor-pointer` styling.
   - The actions cell already calls `e.stopPropagation()` on the dropdown trigger so clicking the menu won't trigger the row click.
5. Add local state `const [selectedRow, setSelectedRow] = useState<LedgerRow | null>(null)` and a `viewOpen` boolean; render `<ViewDcgTransactionDialog open={viewOpen} onOpenChange={setViewOpen} transaction={selectedRow} />` alongside the other record dialogs at the bottom.

## Out of scope

- No changes to the action components, hooks, or DCG ledger.
- No changes to the recording dialogs.
- No schema changes.
