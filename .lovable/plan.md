## Goal
Add a collapsible "Fundraising Transactions" table to the Fundraising tab on `/admin/regional/finances`, **collapsed by default**, with a "Record Donation" button to manually log donations against any campaign in the region.

## Data model (already exists)
`public.fundraising_donations` (id, campaign_id, donor_name, donor_email, amount in cents, currency, anonymous, message, donation_date). A DB trigger already auto-updates `fundraising_campaigns.raised` on INSERT/DELETE.

Current RLS only allows **SELECT** for regional/super admins — no INSERT policy exists, so the dialog would fail without a migration.

## Changes

### 1. Migration — RLS for inserting donations
Add INSERT policies on `fundraising_donations`:
- `regional_admin` may insert when the parent campaign's `region_id = get_user_region(auth.uid())`.
- `super_admin` may insert any.
(Also mirror DELETE so admins can remove a mis-entered donation; optional but small.)

### 2. `src/hooks/useFundraisingCampaigns.ts`
- Add `useCreateDonation()` mutation — inserts into `fundraising_donations`, multiplies amount by 100 (cents), invalidates `fundraising_campaigns` and `region_donations` queries.
- Add `useRegionDonations(range, regionId)` — fetches donations joined to campaigns in the region within `[range.from, range.to]`, returns rows with campaign name + currency.

### 3. New component `src/components/admin/regional/finances/RecordDonationDialog.tsx`
Fields:
- Campaign (Select, populated from `useFundraisingCampaigns` filtered to Active campaigns by default)
- Donor name (optional, disabled when Anonymous)
- Donor email (optional)
- Amount (numeric, thousand-separator formatted, in region currency)
- Anonymous (checkbox)
- Message (textarea, optional)
- Donation date (defaults to today)

Uses the existing glass dialog styling pattern. Submits via `useCreateDonation`, toast on success/error.

### 4. New component `src/components/admin/regional/finances/FundraisingTransactionsCard.tsx`
Glass card matching the dashboard aesthetic (`rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6`), built with shadcn `Collapsible`:
- **Collapsed by default** (`open` state initialised `false`).
- Header row: `HeartHandshake` icon + "Fundraising Transactions" / "All donations across your region's campaigns" + right side: gradient "Record Donation" button + chevron toggle. Clicking the button must not toggle the collapsible (stop propagation; button sits outside `CollapsibleTrigger`).
- Body (when open): table with columns **Date | Campaign | Donor | Message | Amount**. Anonymous donations show "Anonymous". Empty state "No donations in this period." Loading state. Amounts formatted with each campaign's currency (fallback regionCurrency).

### 5. `src/components/admin/regional/finances/FundraisingLedgerTab.tsx`
- Render `<FundraisingTransactionsCard range={range} />` below the KPI grid, above `<FundraisingTabContent />`.
- No changes to existing KPI / campaigns list.

## Out of scope
- Stripe / online donation flow (this is internal admin entry only).
- Editing existing donations.
- Donations CSV export (can be added later if needed).
- Touching Regional / DCG tabs (already collapsible).

## Files
- new migration (RLS INSERT/DELETE on `fundraising_donations`)
- edit `src/hooks/useFundraisingCampaigns.ts`
- new `src/components/admin/regional/finances/RecordDonationDialog.tsx`
- new `src/components/admin/regional/finances/FundraisingTransactionsCard.tsx`
- edit `src/components/admin/regional/finances/FundraisingLedgerTab.tsx`
