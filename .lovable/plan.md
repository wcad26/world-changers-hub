# Rebuild Record Expense Dialog

Restyle `src/components/admin/regional/RecordExpenseDialog.tsx` to match the modern glass dialog standard already used by `RecordTitheDialog` and `RecordOfferingDialog`, add new fields, and persist directly to the database.

## Form fields (in order)

1. **Date** — date picker, defaults to today (kept from current form).
2. **Category** — dropdown sourced from `financial_transaction_categories` where `type = 'Expense'` (replaces the current hard-coded list, so values stay in sync with the DB).
3. **Member in charge** — searchable combobox (Popover + Command) listing all members in the user's region via `useMembers(userRegion?.id)`. Same touch-pad-scrollable pattern as the Tithe dialog member list (`h-72 max-h-72 overflow-y-scroll overscroll-contain pr-1 touch-pan-y` + `onWheelCapture` stopPropagation). Displayed as "Last First".
4. **Item or service** — text input (required) for what was bought.
5. **Payee** — text input (kept, required).
6. **Amount** — formatted decimal input with currency symbol, using the existing `formatAmountInput` / `parseAmount` helpers.
7. **Receipt image (optional)** — keep current upload UI as-is (no storage wiring requested).
8. **Description (Optional)** — textarea, styled like the Tithe/Offering "Notes" field. Replaces both the old Description input and the old Notes textarea.

The bottom **Notes** field is removed entirely.

## Visual design

Match the existing glass dialog standard:
- Gradient `DialogContent` (`from-card/95 to-muted/20`), sticky gradient header with blurred orbs and an icon tile (use `Receipt` lucide icon), glass panel wrapping the fields, glass inputs (`bg-background/60 border-border/50`), uppercase tracked field labels.
- Sticky `DialogFooter` with Cancel + gradient "Record Expense" submit button (`from-primary to-purple-600`).
- `max-h-[90vh] flex flex-col overflow-hidden` with a scrollable body so the header and footer stay fixed.

## Database persistence

The `financial_transactions` table has no columns for member, payee, or item. To avoid a schema change, persist via `useCreateFinancialTransaction` with:
- `category_id` — selected expense category id
- `amount` — parsed number
- `transaction_date` — `format(date, 'yyyy-MM-dd')`
- `dcg_id: null`
- `description` — composed string: `"<item> — Payee: <payee> · In charge: <Last First>" + (notes ? ": <notes>" : "")`

This matches the descriptive-string pattern used by the Tithe and Offering dialogs and keeps all entered information persisted and visible in the ledger.

## Wiring

`RegionalLedgerTab.tsx` currently renders `<RecordExpenseDialog ... onSubmit={...}/>`. Drop the `onSubmit` prop (the dialog will handle persistence itself) — update the prop type and the call site accordingly.

## Out of scope

- No DB schema changes (no new columns for member/payee/item — all encoded into `description`).
- No receipt-image upload to Supabase Storage (UI kept as-is for now).
- No changes to the DCG expense dialog.
