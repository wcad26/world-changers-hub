# Rebuild Record Special Giving Dialog

Restyle `src/components/admin/regional/RecordSpecialGivingDialog.tsx` to match the modern glass dialog standard, mirroring the structure of `RecordDonationDialog`, and persist directly to `financial_transactions` under the existing "Special Giving" income category.

## Form fields (in order)

1. **Date** — date input, defaults to today (the date the payment came in).
2. **Amount** — formatted decimal input with currency symbol prefix, using the existing `formatAmountInput` / `parseAmount` helpers from the Tithe dialog.
3. **Payment Method** — Select dropdown with the same options as the Tithe dialog (Cash, Check, Bank Transfer, Mobile Payment, etc.). Required.
4. **Giver Type** — segmented radio (Member · External · Anonymous), identical to the "Donor Type" control in `RecordDonationDialog`.
5. **Giver selector** — conditional on type:
   - `member`: searchable Popover + Command combobox via `supabase.rpc("search_all_members", ...)`.
   - `external`: searchable donor combobox via `useSearchDonors` + "Register new donor" button opening `RegisterDonorDialog`.
   - `anonymous`: no selector.
6. **Description** — required textarea describing the purpose of the special giving (replaces the old Fund/Project dropdown).

The old **Fund/Project** select and the **Notes (Optional)** field are removed entirely.

## Visual design

Match the existing glass dialog standard already used by `RecordDonationDialog`:
- Gradient `DialogContent` (`from-card/95 to-muted/20`), sticky gradient header with blurred orbs and a `PiggyBank` icon tile.
- Glass panels (`rounded-xl border-border/40 bg-card/50 backdrop-blur-sm`) grouping (a) Date + Amount + Payment Method, (b) Giver type + giver selector, (c) Description.
- Glass inputs (`bg-background/60 border-border/50`), uppercase tracked field labels.
- Sticky `DialogFooter` with Cancel + gradient "Record Special Giving" submit button (`from-primary to-purple-600`).
- `max-h-[90vh] flex flex-col overflow-hidden` with a scrollable body.

## Database persistence

The "Special Giving" income category already exists (id `80baa1d0-5a31-49eb-a3fd-592da26cfb00`). Resolve it at runtime via `useFinancialCategories` by filtering for `type === 'Income'` and `name === 'Special Giving'` (avoids hard-coding the UUID).

Persist via `useCreateFinancialTransaction`:
- `category_id` — resolved Special Giving category id
- `amount` — parsed number
- `transaction_date` — `format(date, 'yyyy-MM-dd')`
- `dcg_id: null`
- `description` — composed string:
  `"<description> · Giver: <Last First | External donor name | Anonymous> (<method>)"`

This matches the descriptive-string pattern used by the Tithe/Offering/Expense dialogs and keeps all entered info visible in the ledger. No schema changes.

## Wiring

`RegionalLedgerTab.tsx` currently renders `<RecordSpecialGivingDialog open={specialOpen} onOpenChange={setSpecialOpen} />` — no prop changes needed since the dialog handles its own persistence.

## Out of scope

- No DB schema changes (giver info encoded into `description`).
- No changes to the DCG income dialog.
- No changes to `RegisterDonorDialog` itself (reused as-is).
