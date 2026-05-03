## Goal

Enforce the project's children rule on the member registration form: if the entered Date of Birth makes the registrant under 16 years old, the Family Relationships section must contain at least one relationship that links them to an adult (>=16). This guarantees children entries meet the global "child" criteria at registration time.

## Behavior

1. Compute age live from the `date_of_birth` field (watched via `form.watch`).
2. If `age < 16`:
   - Section title changes from "Family Relationships (Optional)" to "Family Relationships" with a red asterisk.
   - Show an inline notice: "Required: members under 16 must be linked to at least one adult guardian/parent."
   - Submission is blocked unless at least one relationship entry exists where at least one selected related member is an adult (DOB unknown OR age >= 16).
3. If `age >= 16` (or DOB empty), section remains optional — current behavior preserved.

## Validation

- In `onSubmit` (and a pre-submit guard in `onInvalid` flow), after computing age from `data.date_of_birth`:
  - If under 16 and `relationships.length === 0` → set form root error + toast "Family relationship to an adult is required for members under 16." and abort.
  - Else, fetch DOBs of all selected related members from `allMembers` (already loaded via `search_all_members`; if a related member's DOB is missing we treat them as adult per project rule). Confirm at least one related member qualifies as adult. If none qualify → error: "At least one linked family member must be an adult (16+)."
- Use `relationship_type` of `parent` or `guardian` as the recommended types but accept any type as long as the linked person is an adult (matches the existing project rule that ANY relationship_type counts).

## UI Changes (`src/pages/MemberRegister.tsx`)

- Add helper `computeAge(dobStr)` returning number | null.
- Watch `date_of_birth`; derive `isMinor = age !== null && age < 16`.
- Update GlassSection title dynamically: `"Family Relationships"` + `<Req />` when `isMinor`, else `"Family Relationships (Optional)"`.
- Add an Alert above the relationship editor when `isMinor` explaining the requirement.
- Disable the submit button's success path via validation (no need to disable button itself — error surface handles it).

## Schema

No change to `memberRegistrationSchema.ts` required (the rule is conditional and depends on external `allMembers` data, so handled in `onSubmit`). Keep `relationships` optional in schema.

## Files to Edit

- `src/pages/MemberRegister.tsx` — add age computation, conditional UI label/notice, and pre-submit child-linkage validation.

## Out of Scope

- No DB migration.
- Visitor form unchanged (request scoped to member form).
- Edit member form not touched here.
