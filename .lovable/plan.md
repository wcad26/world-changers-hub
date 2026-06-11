## Goal

Reshape the special-event pre-registration flow on `src/pages/SpecialEventRegister.tsx` so step 1 only identifies the user. When the user is not found, the onboarding form moves to a new step that mirrors the full Member or Visitor registration UI (with a Region selector at the top), instead of the small inline form currently on step 1. Apply the same logic for family members added later.

## New step flow

Current steps: `identify → [details] → [extras] → done`

New steps (computed dynamically):

```text
identify
  └─ if user found  → mode select (Individual / Family) inline → next step
  └─ if user NOT found → Continue to "onboard"
onboard            (NEW — only when primary user is missing)
  └─ choose attendee type: Member | Visitor
  └─ full registration form (mirrors MemberRegister / VisitorRegister)
  └─ Region dropdown at top
details            (only when registrationMode === "family")
extras             (only when event collects lodging / meals / pledges)
done
```

Mode selector (Individual vs Family) is also shown on the `onboard` step after the form is filled, so a new user can still pick family registration.

## Step 1 — Identify (simplified)

- Keep the Email / Telephone toggle + input + Check button (already restyled in the previous change).
- When `lookupStatus === "found"`: keep the existing inline Individual / Family selector + Continue button (no change).
- When `lookupStatus === "missing"`: REMOVE the inline mini-form (Family Name / Other Names / Email / Phone / Address / DOB / Gender). Replace it with:
  - A short message + the **Continue** button that advances to the new `onboard` step.
  - `canProceedFromIdentify` becomes: `found` → needs `registrationMode`; `missing` → always allowed (validation happens on `onboard`).

## Step 2 — Onboard (NEW)

Rendered only when the primary user was not found. Two sub-sections inside one `GlassSection`:

1. **Attendee type chooser**
   - Message: "Select the attendee type to register below."
   - Two buttons styled like the existing Individual/Family selector: **Member** and **Visitor**.
   - Selection drives which form renders below and which schema validates on Continue.

2. **Full registration form**, replicating the section design of the existing pages:
   - **Member**: replicate every section from `src/pages/MemberRegister.tsx` — personal info, address, DOB/gender/occupation, ministry interests, foundation school (+ optional date), baptism (+ optional date), DCG selection, family relationships block, etc. Validation uses `memberRegistrationSchema` from `src/schemas/memberRegistrationSchema.ts`.
   - **Visitor**: replicate sections from `src/pages/VisitorRegister.tsx`, with two differences:
     - **No event-attended selector.** The `rated_event_id` / satisfaction rating section is removed (this event is already implicit).
     - The section currently titled "Event & Referral" is renamed to **"Referral"** and only shows the "How did you hear about us?" block (including the conditional `referral_member_ids` / `referral_social_media` / `referral_other_details` / `referral_relationship_type` fields and the `join_interest` field). Validation uses `visitorRegistrationSchema` with the rated_event/satisfaction fields omitted.
   - **Region dropdown at the very top** of BOTH forms (above every other section). Loaded with `useAllRegions()`. Required. The selected `region_id` is stored on the primary draft and sent to the backend so the new member/visitor is created in the right region — today the edge function uses the event's region; with the new "all regions" page we must pass `primary_region_id` explicitly.

The mode selector (Individual / Family) appears on this step too, after the form passes validation, so the user can opt into adding family.

## Step 3+ — Family details (unchanged structure, same onboard logic for new members)

In the existing "Family & Children" step, when a user types an email/phone for someone not in the system, the current behaviour is to show a short inline form on the same step. Update this so that:

- When a family lookup returns "missing", do NOT collect their details inline.
- Instead, show a Member / Visitor toggle and the same full registration form pattern as the primary `onboard` step for that family row (rendered inline within the family card or in an expanded panel), including a Region dropdown for each new person, the Member/Visitor section structure, and (for Visitor rows) the renamed "Referral" section without the event-rating fields.
- Already-onboarded family members continue to show only the tick checkbox tile (no change there).

## Data & submission changes

`src/pages/SpecialEventRegister.tsx`:
- Extend `primaryDraft` with all the extra fields the full forms need (region_id, ministry_interests, foundation_school + date, baptism + date, dcg_id, referral_source/social_media/member_ids/relationship_type/other_details, join_interest, address, attendee_type).
- Extend `FamilyRow` similarly so new family members carry full onboarding data + `attendee_type: "member" | "visitor"`.
- Update the `submit()` payload to send the new fields under `primary_new` and each `family[].new_registrant`, including `region_id` and `attendee_type`.

`supabase/functions/event-special-register/index.ts`:
- Accept the new optional fields on `primary_new` and `family[].new_registrant`.
- When `region_id` is present, create the member/visitor in that region instead of the event's region; otherwise fall back to the event's region (preserves behaviour for the in-region pre-register flow).
- When `attendee_type === "member"`, route to the member onboarding path (parallel to the visitor path the function already uses), persisting the member-specific fields (foundation school, baptism, dcg, ministry interests, family relationships).
- When `attendee_type === "visitor"`, persist the visitor-specific referral fields and `join_interest` (no `rated_event_id` / `event_satisfaction_rating`).

## Files to change

- `src/pages/SpecialEventRegister.tsx` — main restructuring (new step, expanded drafts, two embedded form renderers, family onboarding panel).
- `supabase/functions/event-special-register/index.ts` — accept and persist the new payload fields, support both member and visitor onboarding, honour per-person `region_id`.

No DB schema changes required — all target columns already exist on `profiles` / `members` / `member_relationships` / event_pre_registrations.

## Out of scope

- The "found" path (existing members / visitors) and the family tick-list for existing relations remain exactly as they are.
- The Extras step (lodging / meals / pledge) is unchanged.
- The final "done" screen is unchanged.
