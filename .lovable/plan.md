## Goal

Allow individuals to pre-register to attend **special events** (so admins can plan capacity), with optional **family** registration that also captures family relationships in the database. Existing members register by email lookup; unknown emails are routed through the member onboarding form.

## 1. Database changes

**New column on `events`:**
- `requires_pre_registration boolean NOT NULL DEFAULT false`
- Only meaningful when `is_special = true`.

**New table `event_pre_registrations`:**
- `id uuid pk`
- `event_id uuid` (events)
- `member_id uuid` (members) — the registrant
- `registration_type text` — `'individual' | 'family'`
- `group_id uuid` — same value for everyone in a single family submission (null for individual)
- `is_primary boolean` — true for the person who submitted
- `email text` — captured at submission time
- `created_at timestamptz`
- Unique (`event_id`, `member_id`)
- RLS: public INSERT (event must be public, special, requires_pre_registration); SELECT for regional admins of `events.region_id` and super admins; Super/regional admins can DELETE.

**Relationships:** when a family submission includes member B related to primary A with `relationship_type`, insert into existing `member_relationships` (skip if a row between the two already exists in either direction).

## 2. Event creation/edit forms

Files: `src/pages/admin/regional/Events.tsx` and `src/pages/admin/super/Events.tsx`.

- Add field `requires_pre_registration` (Switch) in both create and edit forms.
- Only visible/enabled when `is_special` is true. If `is_special` flips off, reset to false.
- Persist on insert and update; include in zod schema, defaults, and edit reset.

## 3. Public event page — pre-registration UI

File: `src/components/events/EventRegistrationSection.tsx` (+ a new `EventPreRegistrationDialog.tsx`).

- Show a "Reserve your spot" button only when: `event.is_special && event.requires_pre_registration && canRegister`. Keep existing register/whatsapp logic intact for other cases.
- Dialog flow:
  1. Toggle: **Individual** or **Family**.
  2. Primary email input → "Continue".
  3. Edge function `event-pre-register-lookup` resolves email to a member. If not found, dialog shows "You need to be onboarded first" with a CTA linking to the member registration form (`/member-register`) prefilled with email and a `returnTo` back to the event.
  4. If **Family** selected: dynamic list of additional members — each row = email + relationship-type select (spouse/parent/child/sibling/guardian/other). Same lookup per row; unknown emails are flagged with an inline "Onboard this person" link before submission can complete.
  5. Submit → edge function `event-pre-register` creates the rows in `event_pre_registrations` and the `member_relationships` rows.
- Show success state with count of registered attendees and capacity remaining (if `capacity` set).

## 4. Edge functions

**`event-pre-register-lookup`** (POST `{ email }`): validates with zod, returns `{ found: boolean, member: { id, first_name, last_name } | null }`. Uses service role to bypass RLS for safe email→member resolution; only returns minimal non-sensitive fields.

**`event-pre-register`** (POST `{ event_id, registration_type, primary_email, family?: [{ email, relationship_type }] }`):
- Validate event exists, `is_special && requires_pre_registration && is_public`.
- Resolve all emails to members; fail if any unknown (frontend should have onboarded them first).
- Enforce capacity if `event.capacity` set (count existing + new ≤ capacity).
- Insert pre-registration rows (one per person, shared `group_id` for families, `is_primary` on the submitter).
- Insert missing `member_relationships` rows (check both directions before insert).
- Idempotent on `(event_id, member_id)` — skip duplicates with friendly message.

Both functions: `verify_jwt = false`, CORS headers, zod validation, no service-role exposure to client.

## 5. Admin visibility

Lightweight addition in regional & super event lists: show a "Pre-registrations: N" badge on special events that require pre-registration (read-only count via aggregate query). Full management screen is out of scope for this iteration unless requested.

## 6. Out of scope

- Editing/cancelling a pre-registration from the public page (admins can delete from DB).
- Email confirmations to registrants (can be added later via Resend).
- Converting pre-registrations into attendance records on event day (separate feature).

## Technical notes

- `members.profile_id → profiles.email` is the lookup path; case-insensitive match on `profiles.email`.
- Reuse existing relationship invalidation helper `useMemberRelationships` cache keys after admin views.
- Frontend types regenerated automatically after the migration; do not hand-edit `types.ts`.
