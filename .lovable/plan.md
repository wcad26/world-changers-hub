# Fix: family coverage must cut across both spouses

## What is wrong today

I checked the real records behind your screenshot (Lukong Terence's household):

- Terence is recorded as spouse of **two separate "Kibula Fanny" records** — one is a duplicate profile (no date of birth) and carries all three children; the other (born 19/01/1985) carries only the spouse link.
- The pricing code accepts **only the first spouse it finds** and stops there. Everyone else, including the second Fanny record, falls out of the family and is billed on their own — which is exactly the "XAF 5,000 billed separately" line you saw.
- Children are only matched against the primary registrant and that one spouse, so a child linked to just one parent can also drop out when the linked parent is not the one who happens to be matched.

## The fix

Build the household as a small relationship web instead of a single pair:

1. **The couple**: the primary registrant plus **every** person in the group recorded as their spouse (and the spouse of a spouse), not just the first match.
2. **The children**: anyone under 16 with a parent/child/guardian link to **any** adult in that couple is covered — one parent link is enough, the spouse link carries it across.
3. **Siblings ride along**: an under-16 with a brother/sister link to a child already covered is covered too, so a missing parent link no longer costs the family.
4. Repeat steps 2–3 until nothing new is added, so a link chain (father → child → sibling) resolves fully.

The anti-abuse rules stay exactly as they are:

- an adult who is neither a spouse nor a parent of the covered children is still billed individually;
- a "child" aged 16 or over is still billed individually;
- someone with no recorded link to the household is still billed individually;
- a family package still needs at least two qualifying people;
- all of this is still decided on our side from the stored relationships — the browser cannot claim a family.

## Healing the missing links

When a family registration is submitted, the system will also record the links that were obviously missing: if one spouse is a parent of a child, the other spouse gets the same parent link saved. This is added quietly in the background, so the household is correct everywhere afterwards (member profiles, reports), not just at pricing time.

## The duplicate record

The two "Kibula Fanny" records are a data problem, not a pricing problem — one is a duplicate with no date of birth. After this fix both would be covered by the family package (both are recorded spouses), but the household will still show one person twice. I can merge the duplicate as a follow-up if you want.

## Technical details

`supabase/functions/_shared/eventFees.ts`
- Replace the single-`spouseId` logic in `resolveFamilyUnit` with a fixed-point expansion:
  - `adults = {primary} ∪ {a : spouse link to any adult in the set, or declared 'spouse'}` — iterate to closure.
  - `minors = {a : age < CHILD_AGE_LIMIT and (child|parent|guardian link to any adult, or declared parental) }`, then add `{a : age < limit and sibling link to any covered minor}` — iterate to closure.
  - `covered = adults ∪ minors`; everyone else → `separate`; keep the "needs ≥2 covered" rule and the unknown-DOB-is-an-adult rule.
- Keep the existing link index (both directions, `member_relationships`) and reuse it for spouse/parental/sibling lookups.

`supabase/functions/event-special-register/index.ts`
- After the family unit is resolved, insert missing mirrored `member_relationships` rows (`parent`/`child`) between each covered adult and each covered minor that lacks one, using the service-role client and `on conflict do nothing`-style guards (check before insert, since no unique index exists).

No database migration and no frontend change are needed — the registration page already renders "Family package" plus "Billed separately" from whatever the server returns.

## Verification

Re-run the fee quote for Terence's group and confirm one family line covering both spouses and the three under-16 children, no "billed separately" line, and a total equal to the single family rate.
