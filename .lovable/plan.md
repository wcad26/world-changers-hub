## Goal

Allow users to re-run the special event pre-registration flow at `/events/:slug/register` and have the system **detect their previous registration and update it** instead of creating a duplicate. This lets users correct mistakes or add missing details.

## Current behavior

- DB already enforces `UNIQUE (event_id, member_id)` on `event_pre_registrations`, and the edge function `event-special-register` already does an `upsert` on that key for the primary row.
- However, the UI doesn't recognize a returning user, so the experience feels like a brand-new registration. Worse, several side effects duplicate or go stale:
  - **Capacity check** counts the user's existing row, so a returning user near the cap gets a false "Event capacity reached".
  - **Family members** removed/changed by the user remain in the DB (orphan rows from the previous attempt).
  - **Pledge** inserts a brand-new row into `fundraising_pledges` every time, inflating `pledged_total`.
  - **Done screen** still says "Registered" with no hint that the prior submission was updated.

## Changes

### 1. Edge function `event-special-register`

- After resolving `primaryMember`, look up the existing pre-registration:
  ```sql
  select id, group_id from event_pre_registrations
   where event_id = :event_id and member_id = :primary.id
  ```
  - If found, treat the submission as an **update**: reuse `group_id` (or generate one only if family is now present and old was solo).
  - Capacity check: subtract previously-registered rows for this `group_id`/primary member from the total before comparing to `event.capacity`.
- Family rows:
  - Upsert all submitted family member rows on `(event_id, member_id)` as today.
  - **Delete stale family rows**: any existing `event_pre_registrations` rows with the prior `group_id` whose `member_id` is not in `{primary} ∪ submitted family member ids`. Limit deletion to rows linked to this primary's previous `group_id` so we never touch unrelated registrants.
- Pledge handling (only when `collect_pledges` + `linked_fundraising_campaign_id`):
  - On the primary row update, also update or insert a single `fundraising_pledges` row keyed by `(campaign_id, member_id)` — update `amount`, `pledger_name`, `pledger_phone`, `status='active'`; if amount cleared, mark prior pledge `status='cancelled'`. The existing `fr_sync_pledged_total` trigger keeps `pledged_total` correct.
  - Add a partial unique index `fundraising_pledges (campaign_id, member_id) where member_id is not null and status='active'` via migration to back the upsert and prevent duplicates going forward.
- Response payload adds `was_update: boolean` so the UI can show the right confirmation copy.

### 2. Lookup function `event-pre-register-lookup`

- Accept optional `event_id` in the request body. When provided and a member is found, also return:
  ```ts
  existing_registration: {
    is_primary: boolean;
    group_id: string | null;
    needs_lodging, lodging_party_size, meal_preferences, dietary_notes,
    arrival_date, departure_date, phone,
    pledge_amount, pledge_currency_code,
    family: [{ member_id, relationship_type, first_name, last_name, email, phone }]
  } | null
  ```
  Family list is built from rows sharing the same `group_id`, joined with `members`/`profiles`/`member_relationships` for the relationship label (same inverse logic already in the file).

### 3. UI `src/pages/SpecialEventRegister.tsx`

- Pass `event_id: ev.id` in the lookup payload (primary lookup only).
- When the lookup returns `existing_registration`, pre-populate state before letting the user advance:
  - `attending`, `needsLodging`, `lodgingPartySize`, `mealPreferences`, `dietaryNotes`, `arrival_date`, `departure_date`, `pledgeAmount`, `primary_phone`.
  - `family` rows: each known relative becomes a `FamilyRow` with `status: "found"`, `existing_member_id`, `lookupValue` set to their email/phone for display, and `attending: true`.
  - Set a new `isUpdatingExisting` flag.
- Banner on the "Who" step when `isUpdatingExisting`: localized message (EN/FR) — "We found your previous registration. Make any changes and re-submit to update it." Replace primary CTA label with "Update registration" / "Mettre à jour l'inscription".
- Stepper still walks through the same steps so the user can edit family/extras/pledge; nothing is locked.
- On success, when `was_update`, the Done screen shows "Registration updated" / "Inscription mise à jour" with adjusted body copy.
- Add ~6 i18n keys to `src/utils/languageUtils.ts` (`sr_update_banner_title`, `sr_update_banner_desc`, `sr_update_cta`, `sr_done_updated_title`, `sr_done_updated_desc`, `sr_family_prefilled_note`).

### 4. Database migration

- Add partial unique index on `fundraising_pledges (campaign_id, member_id) where member_id is not null and status = 'active'`.
- No table/column additions; everything else is supported by current schema.

## Out of scope

- Editing or removing the registration after the event has started.
- Self-service cancellation flow (would be a separate feature).
- Admin-side bulk edits.

## Technical notes

- `group_id`: if previous was individual and the user now adds family, generate a new `group_id` and backfill it on the primary's existing row in the same `update`. If previous had a group and the user removes everyone, set `group_id = null` and `registration_type = 'individual'` on the primary, and delete the stale family rows.
- All deletes/updates use the service role inside the edge function — no client-side privilege changes.
- The `(event_id, member_id)` unique constraint guarantees idempotency even on rapid double submits.
