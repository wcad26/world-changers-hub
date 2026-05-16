## Goal
Let regional admins record donations from **non-member donors** (external supporters) and reuse them in future donations, alongside existing member-based donor selection.

## Data model

### New table: `public.donors`
External donor registry — separate from `members` to keep concerns clean.

Columns:
- `id` (uuid, pk)
- `region_id` (uuid, not null) — donor "belongs" to the region that registered them; search will still include all regions for super admins
- `first_name` (text, not null)
- `last_name` (text, not null)
- `email` (text, nullable, lowercased)
- `phone` (text, nullable) — same 9+ digit rule as members
- `address` (text, nullable)
- `notes` (text, nullable)
- `created_by` (uuid)
- `created_at`, `updated_at`

Constraints / indexes:
- Unique partial index on `(region_id, lower(email))` where `email is not null` to prevent dupes within a region.
- Trigram or simple index on `last_name`, `first_name` for search.

### `fundraising_donations` — add donor link
Add nullable `donor_id uuid` referencing `public.donors(id)` AND keep existing `member_id` plan path. Effectively a donation can be tied to **one of**:
- a member (resolved via members table), OR
- an external donor (`donor_id`), OR
- anonymous (`anonymous = true`, both null)

(We already store `donor_name` as a denormalized snapshot — keep it for historical display when a donor record is later deleted.)

Note: the current dialog stores the selected member's display name into `donor_name`. We'll add an explicit `member_id` column too so member donations are queryable. If you'd rather keep it minimal, we can skip `member_id` and rely on `donor_name` for member donations — confirm in step below.

### RLS for `donors`
- `regional_admin`: full CRUD where `region_id = get_user_region(auth.uid())`.
- `super_admin`: full CRUD.
- No public select.

### New RPC: `search_all_donors(_search text)`
Mirrors `search_all_members` — returns `id, first_name, last_name, email` across all regions, limit 50, security definer.

## UI changes — `RecordDonationDialog.tsx`

Replace the single member combobox with a **Donor Type** segmented control / radio group:

```
Donor type:  ( ) Member   ( ) External donor   ( ) Anonymous
```

- **Member** (default): existing member combobox (search_all_members).
- **External donor**: a donor combobox using `search_all_donors`, with a `+ Register new donor` action inside the popover footer (and an empty-state CTA). Clicking it opens a small inline `RegisterDonorDialog` (name, email, phone, address, notes — zod validated, phone 9+ digit rule, email optional). On success, the new donor is auto-selected.
- **Anonymous**: collapses donor input, sets `anonymous = true`.

Remove the standalone "Mark as anonymous" checkbox — it becomes one of the three radio options.

Submit payload:
- Member: `{ member_id, donor_name: "Last First" snapshot, donor_id: null, anonymous: false }`
- External: `{ donor_id, donor_name: snapshot, donor_email: snapshot, member_id: null, anonymous: false }`
- Anonymous: `{ anonymous: true, donor_name: null, ... }`

## New files
- `src/components/admin/regional/finances/RegisterDonorDialog.tsx` — small nested dialog with the donor form.
- `src/hooks/useDonors.ts` — `useSearchDonors(search)`, `useCreateDonor()`, plus optional `useDonor(id)` for the transactions card display.

## Edited files
- migration: create `donors`, RPC `search_all_donors`, add `donor_id` (+ optional `member_id`) to `fundraising_donations`, RLS, indexes.
- `src/components/admin/regional/finances/RecordDonationDialog.tsx` — radio-driven donor selector + inline registration.
- `src/hooks/useFundraisingCampaigns.ts` — extend `NewDonationInput` and `useCreateDonation` to pass `donor_id` / `member_id`.
- `src/components/admin/regional/finances/FundraisingTransactionsCard.tsx` — Donor column already shows `donor_name`; no change needed unless you want a "Member"/"Donor"/"Anonymous" badge.

## Out of scope
- Donor profile pages / donor history view (can be a follow-up: `/admin/regional/finances/donors`).
- Donor CSV import.
- Merging duplicate donors.
- Public-facing donor portal.

## One question before I build
Do you want a **separate Donors directory page** (list, edit, view donation history) now, or just the registration + selection inside the donation dialog for this round?
