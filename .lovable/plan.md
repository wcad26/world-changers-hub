# Rebuild Record Offering Dialog

Modernize the regional "Record Offering" dialog so admins select the regional event the offering was collected at, instead of picking a date and category manually.

## Behavior changes

- Remove the **Date** field. The transaction date is taken from the selected event's `start_datetime`.
- Remove the **Category** field. All entries from this dialog are automatically categorized as the region's `Offerings` income category (existing behavior, just no longer user-selectable).
- Replace the **Service** free-pick dropdown with an **Event** dropdown listing the region's past + recent events (most recent first). Selecting an event sets the date and is used to label the transaction.
- Keep **Amount** and **Notes** (optional).
- Submitting writes a `financial_transactions` row with: `category_id` = Offerings, `transaction_date` = event date, `description` = `"Offering — {event title}"` plus any notes.

## Form layout (new fields, in order)

1. Event (required) — searchable Select
2. Amount (required) — numeric, currency symbol prefix
3. Notes (optional) — textarea

Selected event date is shown as a read-only hint under the Event field (e.g. "Date: May 12, 2026") so the admin can confirm.

## Visual design — glass dialog standard

Per `mem://design/glass-dialog-standard`:
- Gradient header band with a glow orb, `Receipt` icon, title and description.
- Glass panel wrapping the form fields with subtle border + backdrop blur.
- Gradient primary CTA ("Record Offering"), ghost "Cancel".
- Max height `max-h-[85vh]` with `ScrollArea` for safety on small screens.

## Technical notes

- File: `src/components/admin/regional/RecordOfferingDialog.tsx` (rewrite).
- New hook: `useRegionalEventsForOfferings(regionId)` in `src/hooks/useRegionalData.ts` — fetches events for the region ordered by `start_datetime desc`, limit ~50, no future-only filter (offerings are collected at events that have happened). Reuses existing `events` table.
- Categories: continue using `useFinancialCategories()` to resolve the `Offerings` income category id; show a toast error if not found (same pattern as today).
- Mutation: keep `useCreateFinancialTransaction()`. Payload becomes `{ amount, category_id: offeringCategory.id, transaction_date: format(event.start_datetime, 'yyyy-MM-dd'), description }`.
- Schema (zod): `{ event_id: z.string().uuid(), amount: z.coerce.number().positive(), notes: z.string().optional() }`.
- No database migration required — `financial_transactions` has no `event_id` column today and the user did not request linking at the schema level. The event title is preserved in `description`.

## Out of scope

- Adding an `event_id` foreign key to `financial_transactions`.
- Changing the DCG offering dialog.
- Editing existing offering rows to backfill event references.
