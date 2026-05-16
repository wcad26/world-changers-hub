# Rebuild Record Tithe Dialog

Align `RecordTitheDialog` with the modern glass dialog standard used by `RecordOfferingDialog`, simplify date handling, and add an optional event link.

## Changes to `src/components/admin/regional/RecordTitheDialog.tsx`

### 1. Remove the date field
- Drop the `date` form field entirely.
- Transaction date logic:
  - If no event selected → use **today** (`new Date()`, formatted `yyyy-MM-dd`) as the registration date.
  - If an event is selected → use that event's `start_datetime` as the transaction date.

### 2. Add optional "Linked Event" selector
- New optional field `event_id` (nullable).
- Use the same searchable `Popover` + `Command` combobox pattern as the Offering dialog.
- Data source: `useRegionalEventsForOfferings(userRegion?.id)` (regional events only, excludes DCG events — already implemented).
- Include a clear option ("No event — general tithe") so users can record a non-event tithe.
- When an event is selected, show a helper line: `Date: <event date>`.

### 3. Fix member dropdown scroll (trackpad/mouse)
- Apply the same fix used in the Offering dialog to the member `CommandList`:
  - `className="h-72 max-h-72 overflow-y-scroll overscroll-contain pr-1 touch-pan-y"`
  - `onWheelCapture={(e) => e.stopPropagation()}`
  - `CommandGroup` gets `className="overflow-visible"`.

### 4. Amount input with thousand separators
- Reuse `formatAmountInput` / `parseAmount` helpers (same as Offering dialog).
- Manage display state via `amountText`; sync raw numeric to form via `field.onChange(parseAmount(...))`.
- Switch schema `amount` to `z.coerce.number().positive(...)`.

### 5. Modern glass design
- Match the Offering dialog shell exactly:
  - `DialogContent` with `sm:max-w-lg max-h-[90vh] overflow-y-auto p-0 gap-0 border border-border/40 bg-gradient-to-br from-card/95 to-muted/20 backdrop-blur-xl shadow-2xl rounded-2xl`.
  - Gradient header band with two blurred orbs, icon tile (`HandCoins` or `Coins` from lucide), title + subtitle.
  - Body wrapped in a glass panel: `rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm p-4 space-y-4`.
  - Inputs use `bg-background/60 border-border/50`; labels use `text-xs font-medium uppercase tracking-wider text-muted-foreground`.
  - Footer: `border-t border-border/30 bg-card/40 backdrop-blur-sm rounded-b-2xl`, gradient submit button `from-primary to-purple-600`.

### 6. Description string on save
- Build description: `Tithe — <Member Name>` + (event ? ` · ${event.name}` : '') + (notes ? `: ${notes}` : '') + ` (${method})`.

## Schema (new)
```ts
const titheSchema = z.object({
  memberId: z.string().uuid('Please select a member'),
  event_id: z.string().uuid().optional().nullable(),
  amount: z.coerce.number().positive('Amount must be positive'),
  method: z.string().min(1, 'Please select a payment method'),
  notes: z.string().optional(),
});
```

## Out of scope
- No DB schema changes.
- No changes to `useFinancials` mutation signature (still passes `transaction_date`, `category_id`, `amount`, `description`).
- No changes to other dialogs.
