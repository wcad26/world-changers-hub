## Goal
Ensure every existing visitor/member profile can sign in to the member portal with the default password `123456`, and admins can assign portal roles to any profile without foreign-key failures.

## What I found
- The backfill currently reports: `Scanned 526 · Created 0 · Merged 0 · Errors 526`.
- The report errors are not empty anymore; they show the real issue:
  - `duplicate key value violates unique constraint "profiles_pkey"`
  - This happens because inserting directly into `auth.users` fires the existing `on_auth_user_created` trigger, which calls `handle_new_user()` and tries to insert a duplicate `public.profiles` row using the same ID.
- Current database count:
  - `685` profiles total
  - `526` profiles have no matching `auth.users` row
  - `522` of those orphan profiles are attached to member/visitor records

## Fix plan

### 1. Make profile creation idempotent
Update the database trigger function `public.handle_new_user()` so it no longer fails when the profile already exists.

Instead of blindly inserting a profile, it will upsert/merge safely:
- If the profile does not exist, create it from auth metadata.
- If the profile already exists, keep the existing profile and only fill missing safe fields where appropriate.
- This prevents duplicate-profile errors when backfilling `auth.users` for existing profiles.

### 2. Keep the profile-auth safety trigger
Keep `profiles_require_auth_user()` in place so future flows do not create orphan profiles directly.

The existing visitor/member/event flows already use auth provisioning first, so this safety trigger should remain useful after `handle_new_user()` is fixed.

### 3. Harden the auth-user creation SQL function
Update `public.admin_create_auth_user_for_profile(...)` to be more robust:
- Preserve the existing profile ID as the `auth.users.id`.
- Create confirmed email/password login with password `123456`.
- Avoid duplicate email failures by suffixing only when needed.
- Ensure `auth.identities` is created idempotently.
- Return the created user ID.

### 4. Re-run the backfill safely
After the migration is approved:
- Re-run the Super Admin **Backfill sign-in accounts** flow, or call the deployed edge function with the authenticated super-admin session.
- Expected result: `Created 526`, with very few or zero errors.
- Existing member/visitor profiles stay intact; no member records are deleted.

### 5. Verify the outcome
Confirm through database checks that:
- Profiles without auth users drop from `526` to `0` or only intentional non-login system profiles remain.
- Member/visitor profiles without auth users drop to `0`.
- A newly backfilled profile can be assigned a regional/super role.
- That user can sign in using their email and default password `123456` unless they had already changed their password.

### 6. Improve the UI report if needed
If errors remain after the backend fix, update the Super Admin Access report dialog to show the exact remaining records and reasons so admins can resolve edge cases without guessing.