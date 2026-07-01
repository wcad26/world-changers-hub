## Root Cause

The recent `profiles_require_auth_user` trigger (added to enforce that every profile has an `auth.users` row for role assignment) now blocks all flows that create a profile without a paired auth account. Edge function logs confirm it:

```
create-visitor: Profile creation failed: {
  code: "23503",
  message: "Profile aeb55c0c-... cannot be created without a matching auth.users row.
            Create the auth account first."
}
```

The same failure will hit any public-facing flow that inserts into `profiles` without first creating an `auth.users` row:
- `create-visitor` (visitor registration link — the reported bug)
- `create-member-registration` (member self-registration)
- `event-special-register` / `event-pre-register` (event pre-registration for new attendees)
- `create-member` (admin-created members)

## Fix Strategy

Provision an `auth.users` row FIRST in every profile-creating edge function, then insert the profile with that user's id. Password defaults to `123456` (per project convention), email confirmed automatically so users can sign in later. This satisfies the trigger AND keeps the "every profile is sign-in ready" invariant the user asked for previously.

### Changes

1. **`supabase/functions/_shared/cors.ts` (or new `_shared/provisionAuthUser.ts`)** — add a shared helper `ensureAuthUser(admin, { email, password?, metadata })` that:
   - Looks up an existing auth user by email (via `admin.auth.admin.listUsers` filter).
   - If missing, calls `admin.auth.admin.createUser({ email, password: '123456', email_confirm: true, user_metadata })` and returns the new id.
   - If email is missing/blank (rare visitor edge case), generates a placeholder like `visitor+<uuid>@placeholder.wcaglobal.org` so the auth row can exist. Store the real contact info on the profile only.

2. **`supabase/functions/create-visitor/index.ts`** — replace `crypto.randomUUID()` profile id generation with `ensureAuthUser({ email, metadata: { first_name, last_name, region_id } })` and use the returned id for the profile insert. Keep the existing duplicate-check behavior.

3. **`supabase/functions/create-member-registration/index.ts`** — same treatment: provision auth user first, then insert profile.

4. **`supabase/functions/event-special-register/index.ts`** and **`supabase/functions/event-pre-register/index.ts`** — audit the paths that create new attendee profiles; route them through `ensureAuthUser` before the profile insert. Existing-attendee updates are unaffected.

5. **`supabase/functions/create-member/index.ts`** — same pattern, so admin-created members also become sign-in ready automatically.

6. **No schema changes.** The trigger stays in place — it is the correct enforcement, we're aligning the writers with it.

### Verification

- Re-run the failing visitor registration on `/visitor/register/wca-buea` from the preview; confirm success and that a new row exists in both `auth.users` and `public.profiles` with matching ids.
- Check `create-visitor` edge function logs — no more `23503` errors.
- Spot-check member self-registration and event pre-registration for a brand-new email.
