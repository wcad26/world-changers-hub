# Family Registration Fee Option

## What you'll get

A fourth fee category — **Family** — alongside Leader, Member and Child in the event fee editor, available in every portal that creates or edits events (Super Admin and Regional).

- If the event creator sets a **Family** fee, a genuine family unit registering together is billed **one flat family fee** instead of the sum of the individual fees.
- If no Family fee is set, everything behaves exactly as today: each person is billed by their own category.
- People registering alone always pay their individual category fee (Leader / Member / Child), even when a Family fee exists.

## Who actually counts as a family (anti-abuse)

The system never accepts the group as a family just because people registered together. It builds the family unit itself from the recorded relationships:

- The family core is the **primary registrant plus their spouse** (a recorded `spouse` relationship between the two).
- Also included: **children of the primary or the spouse** (recorded `child`/`parent`/`guardian` link) who are **under the child age limit (16)**.
- **Excluded and billed individually:**
  - any adult in the group who is neither the spouse nor a parent of the children in the group (friend, sibling, cousin, colleague);
  - anyone recorded as a child of the primary but who is **16 or older** — they are an adult and pay their own Leader/Member rate;
  - anyone with no recorded relationship to the primary at all.
- A "family" needs at least two qualifying people (e.g. spouse, or primary + one under-16 child). A single adult with only excluded companions pays individual rates for everyone.
- Relationships are read server-side from the stored family links — the browser cannot declare someone a spouse or child to unlock the discount.

## How it works for the person registering

- The Registration Fees card shows, in one place:
  - **Family package** — the family rate, listing exactly who it covers; and, when applicable
  - **Billed separately** — a per-person line for each excluded adult or over-age child, with their own category badge and amount,
  - plus a single group total combining both parts.
- If nobody qualifies as a family, the card is the current per-person breakdown.
- Adding or removing people during registration re-prices the group instantly.
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
