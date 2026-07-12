## Full audit — issues found in the update profile flow

### 1. Gender option values don't match DB check constraint (the reported error)
- DB: `CHECK (gender IN ('male','female'))` — lowercase only.
- Form line 361: `<option value="Male">` / `<option value="Female">` — capitalized.
- Every submit violates `profiles_gender_check`.

**Fix:** lowercase the `value` attributes (keep "Male"/"Female" labels). Also lowercase `p.gender` on prefill so legacy capitalized records land on a valid option.

### 2. `member_relationships.created_by` FK to `auth.users` will break inserts
- Submit passes `created_by: profileId`. If the profile has no matching `auth.users` row (many legacy profiles), the insert throws a foreign-key error and the whole update fails.

**Fix:** in `profile-update-submit`, set `created_by: null`. It's already nullable and FK is `ON DELETE SET NULL`.

### 3. Self-relationship crash
- `CHECK (member_id <> related_member_id)` — if a user accidentally picks themselves in the family picker, the insert fails.

**Fix:** filter out `related_member_id === member.id` in the submit function before inserting.

### 4. Duplicate-relationship crash
- `UNIQUE (member_id, related_member_id, relationship_type)`. Two identical entries → constraint violation.

**Fix:** de-dupe the incoming list per `(related_member_id, relationship_type)` in the submit function.

### 5. Gender selection silently rejected in strict `Select` on tablet browsers
- Native `<select>` with `<option value="" disabled>` is fine; no change needed. Just noting we verified it.

### 6. Zod submit-time validation friction (no inline scroll to error)
- `onInvalid` shows a generic toast but doesn't tell the user which field failed. If phone is under 9 digits or DCG missing, they see just "Please complete the required fields."

**Fix:** enumerate the specific missing/invalid fields in the toast (e.g. "Missing: Date of Birth, Gender") using `form.formState.errors`.

### 7. DCG unique constraint edge case
- Submit deactivates all `dcg_members` rows for the member, then reactivates or inserts the chosen one. Safe today, but if the row was previously deactivated for another DCG and reactivated here, we reactivate correctly. Verified — no change needed.

### 8. Ministry interests: schema mismatch in prefill
- `lookup` already maps `preferred_service_areas` → `ministry_interests` in the response. Confirmed correct.

### 9. Members `member_type` never downgrades
- Intentional: unchecking Foundation School does not demote an existing member back to visitor. Confirmed desired behavior.

### 10. Minor rule not enforced on submit
- Schema doesn't require `relationships` for under-16 registrants; the UI shows a hint but submission still succeeds. For an update page (where minors already exist), this is acceptable.

---

## Implementation

### `src/pages/UpdateProfile.tsx`
- Change gender option values to `"male"` / `"female"` (line 361).
- On prefill (line 159): `gender: (p.gender || '').toLowerCase()`.
- Update `onInvalid` to list the specific invalid fields from `form.formState.errors` in the toast.

### `supabase/functions/profile-update-submit/index.ts`
- Normalize `gender` to lowercase before updating profiles (defense in depth — protects other clients too).
- Trim & normalize other text fields (phone digits kept as entered, but trim whitespace).
- When writing `member_relationships`:
  - Set `created_by: null` (avoid FK-to-auth.users failure).
  - Filter out `related_member_id === member.id` (self-relationship check constraint).
  - De-dupe on `(related_member_id, relationship_type)` before insert.
  - Wrap each insert in try/catch and continue on unique-violation so one bad row doesn't fail the whole update.
- Return a clearer error payload (`{ success: false, error, detail }`) so the client toast is informative.

No database migration is required — all fixes are in application code.
