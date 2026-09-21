# Family Registration Fee Option

## What you'll get

A fourth fee category — **Family** — alongside Leader, Member and Child in the event fee editor, available in every portal that creates or edits events (Super Admin and Regional).

- If the event creator sets a **Family** fee, any group registering together (a person plus at least one family member) is billed **one flat family fee** instead of the sum of the individual fees.
- If no Family fee is set, everything behaves exactly as today: each person is billed by their own category.
- People registering alone always pay their individual category fee (Leader / Member / Child), even when a Family fee exists.

## How it works for the person registering

- The Registration Fees card shows either:
  - **Family package** — one line, the family rate, listing who it covers; or
  - the current per-person breakdown, when no family rate exists or the person registers alone.
- Adding or removing family members during registration re-prices the group instantly.
- Existing registrations that were already recorded (paid or waived) keep their stored amount; unpaid ones are re-priced on re-submission, as they are today.

## Where the option appears

- Super Admin event create/edit dialog → Special Event Settings → Registration Fees
- Regional event create/edit dialog → Special Event Settings → Registration Fees
- (DCG meetings stay free/non-special, unchanged)

The editor gains a short hint under the Family row: "Charged once per family registering together; replaces the individual fees for that group."

## Technical details

**Database (one migration)**
- Widen the `event_registration_fees.category` check constraint to allow `'family'`.
- Add to `event_pre_registrations`: `fee_is_group boolean default false` — marks rows priced under a family package, so reports can tell a group fee from individual fees.
- Family pricing storage: the primary registrant's row carries `registration_fee_category = 'family'` with the full amount; the other members of the same `group_id` get category `'family'`, amount `0`, `fee_is_group = true`. The group total therefore stays correct in every existing sum.

**Shared logic (`supabase/functions/_shared/eventFees.ts`)**
- Add `'family'` to `FeeCategory`.
- New `priceGroup(fees, attendees, resolvedCategories)` helper: if a family fee row exists **and** the group has 2+ attendees, return one family line plus zero-amount covered lines; otherwise return today's per-person lines. All group/family detection stays server-side.

**Edge functions**
- `event-fee-quote`: accept the attendee list as a group, run it through `priceGroup`, and return `pricing_mode: 'family' | 'individual'` along with the lines and total.
- `event-special-register`: use `priceGroup` for the snapshot written to each row; set `fee_is_group`; keep paid/waived rows locked as today.

**Frontend**
- `src/hooks/useEventRegistrationFees.ts`: add the `family` entry to `FEE_CATEGORIES` with its hint.
- `src/components/admin/events/RegistrationFeesEditor.tsx`: allow the Family row, show the hint, and exclude Family from the "no fee set for…" warning (it is optional, not a gap).
- `src/pages/SpecialEventRegister.tsx`: render the family package line when `pricing_mode === 'family'` (FR + EN), with the covered names underneath and the single total.
- Admin pre-registration lists and the special event report: show a "Family package" badge on grouped rows so a 0 fee is not mistaken for a missing fee.

## Assumptions

- A "family" = the people submitted together in one registration (primary + family members), which is how `group_id` already works.
- Children inside a family are covered by the family fee; they are not billed again.
- One family fee per event (single amount), not tiered by family size — say the word if you want size tiers instead.
