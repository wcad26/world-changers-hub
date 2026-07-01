## Problems observed

**1. Duplicate emails / phones inside a single submission are silently swallowed.**
Nothing in `SpecialEventRegister.tsx` or `event-special-register/index.ts` checks that the primary and each family member use distinct emails and phones. When a user reuses one email for several people:
- `resolveOrCreateMember` resolves both entries to the same profile → same member id.
- `event_pre_registrations.upsert` with `onConflict: "event_id,member_id"` collapses two rows into one.
- The submission "succeeds" with fewer people than the user filled in, OR fails with a cryptic Postgres duplicate-key error that surfaces to the toast as raw SQL text.
- Users have no idea which field is wrong.

**2. Some registrations still fail with the profile/auth issue.**
`supabase/functions/_shared/ensureAuthUser.ts` still calls `admin.auth.admin.createUser`, the same GoTrue path that was unreliable during the backfill (it can't reuse an existing profile id, and it fails when the email is already attached to an orphan profile with no auth row). This affects any new visitor whose email matches an already-existing profile that lacks an auth.users row — exactly the population we just backfilled, plus any profile created between the backfill and now via a path that bypassed auth.

## Plan

### A. Frontend duplicate validation (`src/pages/SpecialEventRegister.tsx`)
- Add a `collectDuplicates()` helper that gathers `{ email, phone }` from the primary registrant + every attending family row (both existing-member rows and new-onboard rows), normalises them (`trim().toLowerCase()` for email, digits-only for phone), and returns any value that appears more than once with the labels of the rows that share it.
- Run this check inside `submit()` before invoking the edge function and also when the user tries to advance past the family step. If duplicates exist, show a targeted `toast.error` naming the field ("Two people share the email x@y.com — please give each attendee a unique email") and mark the offending fields (red border + inline helper text) instead of calling the function.
- Add the same check inside `SpecialEventOnboardForm` so newly typed contact info that collides with another attendee is flagged immediately.
- Add French + English strings (`sr_dup_email`, `sr_dup_phone`, `sr_dup_hint`) via `LanguageContext`.

### B. Backend duplicate + friendly-error handling (`supabase/functions/event-special-register/index.ts`)
- Before touching the DB, build a set of normalised emails and phones across primary + family. If any collide, return `{ error: "duplicate_contact", field: "email"|"phone", value }` with HTTP 409.
- Wrap `resolveOrCreateMember` results in a `Map<memberId, label>`; if the same member id resolves twice (existing member reused across two family slots), return `{ error: "duplicate_member", label }` so the frontend can point to the row.
- Catch Postgres errors from the upsert and translate common ones (`23505` unique-violation on profiles.email, `23503` foreign-key on profiles/auth) into human-readable error codes so the toast is never raw SQL.

### C. Frontend error surface
- Extend the `catch (e)` block in `submit()` to inspect the returned `error` / `field` / `value` and render a translated, actionable toast (e.g. "The email jane@x.com is used twice — please correct the highlighted rows"). Fallback to the current generic message when the code is unknown.

### D. Reuse the reliable auth-provisioning path (`supabase/functions/_shared/ensureAuthUser.ts`)
- Rewrite the helper to prefer the SQL function `admin_create_auth_user_for_profile` (the one that fixed the backfill) instead of `admin.auth.admin.createUser`:
  1. If an email is provided, look it up in `auth.users` via `admin.auth.admin.listUsers` (kept as a fast path).
  2. If not found, look up `public.profiles` by email; if a profile exists, call `admin_create_auth_user_for_profile(profile_id, email)` so the auth row is created with the profile's id — no orphan, no duplicate profile.
  3. Only when neither an auth row nor a profile exists do we mint a fresh id and call the SQL function with that id, then let the existing `handle_new_user` `ON CONFLICT DO UPDATE` trigger populate the profile.
- This keeps the helper's public signature (`{ id, email, created }`) so callers (`event-special-register`, `create-visitor`, any future function) don't change.
- Add structured logging (`console.error` with the branch taken + error) so future failures are diagnosable from Edge Function logs.

### E. Verification
- Reproduce the duplicate-email case with two family rows sharing the primary's email — confirm the new toast fires and the request never reaches the DB.
- Attempt registration with an email belonging to one of the recently backfilled profiles — confirm it succeeds and reuses the existing profile/member.
- Confirm French locale delivers the new duplicate messages.
- Tail edge function logs for `event-special-register` and `create-visitor` to make sure no unhandled errors remain.

## Technical notes
- No schema changes required; all fixes are in the edge function and frontend.
- `admin_create_auth_user_for_profile` already exists and is `SECURITY DEFINER`; no new grants needed.
- `SpecialEventOnboardForm` already exposes `value.email` / `value.phone`, so duplicate marking can be driven by a `duplicates: Set<string>` prop passed from the parent.
