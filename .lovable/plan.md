## Problem

The Super Admin "Backfill sign-in accounts" button ran but produced **1052 error rows and only 6 merges** in `backfill_auth_users_report`, leaving **526 profiles still orphaned** (684 profiles vs 159 auth users). All error notes are empty (`{}`), and every subsequent role assignment for those profiles still fails with FK code `23503`, so the inline `provision-auth-user` fallback in the dialogs also fails.

### Root cause

Both `backfill-auth-users` and `provision-auth-user` call `admin.auth.admin.createUser({ id: p.id, ... })`. The GoTrue JS admin SDK **silently drops the `id` field** (and other create-user quirks), so either the create fails or a new random id is generated — either way `auth.users.id` never matches `profiles.id`, and the orphan stays orphaned. Errors returned by the SDK stringify to `{}` in our logger, hiding this.

## Fix

Move auth-user creation into a **Postgres SECURITY DEFINER function** that inserts directly into `auth.users` with the exact profile id and a bcrypted default password. This is deterministic, avoids SDK quirks, and lets us handle 500+ rows in one pass.

### 1. New DB function (migration)

```sql
create or replace function public.admin_create_auth_user_for_profile(
  p_profile_id uuid,
  p_email text,
  p_password text default '123456'
) returns uuid
language plpgsql security definer set search_path = public, auth, extensions
as $$
declare v_id uuid;
begin
  -- idempotent
  select id into v_id from auth.users where id = p_profile_id;
  if v_id is not null then return v_id; end if;

  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token,
    email_change_token_new, email_change
  ) values (
    p_profile_id, '00000000-0000-0000-0000-000000000000', 'authenticated',
    'authenticated', lower(p_email),
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb, now(), now(), '', '', '', ''
  );

  insert into auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
  values (gen_random_uuid(), p_profile_id, p_profile_id::text,
          jsonb_build_object('sub', p_profile_id::text, 'email', lower(p_email)),
          'email', now(), now(), now());

  return p_profile_id;
end $$;

revoke all on function public.admin_create_auth_user_for_profile(uuid,text,text) from public, anon, authenticated;
grant execute on function public.admin_create_auth_user_for_profile(uuid,text,text) to service_role;
```

(pgcrypto is already installed on Supabase.)

### 2. Rewrite `backfill-auth-users/index.ts`

- Iterate every orphan profile in batches of 100.
- For each row:
  - If another auth user already owns that email → merge (repoint `members.profile_id`, delete orphan profile) — keep existing behavior.
  - Otherwise call `admin.rpc('admin_create_auth_user_for_profile', { p_profile_id, p_email })`.
- Fix the logger: use `JSON.stringify(err, Object.getOwnPropertyNames(err))` and include `err.code / err.details / err.hint` so we never write empty `{}` again.
- Clear old error rows for the profile before re-logging (so re-runs are clean).
- Return `{ created, merged, skipped, errors_count, errors: first 20 }`.

### 3. Rewrite `provision-auth-user/index.ts`

- Same RPC path (`admin_create_auth_user_for_profile`).
- If profile lacks an email, generate placeholder `visitor+<uuid>@placeholder.wcaglobal.org` and update the profile, then create auth row.
- Keep the "already exists" short-circuit.
- Return better error text (`err.message + err.details`) so the Settings toast is actionable.

### 4. Settings page UX (`SuperAdminsTable.tsx`)

- After the backfill call, show summary: `Created X · Merged Y · Skipped Z · Errors N` with a "View report" link that opens a small dialog reading the last 50 rows of `backfill_auth_users_report`.
- Disable the button while running; auto-refresh the orphan count.

### 5. Verify

- Re-run backfill → expect 526 → 0 orphans.
- Assign a role to a previously-orphan profile in both Regional (`useAssignUserRole`) and Super Admin (`useAssignSuperAdminRole`) portals → succeeds without invoking `provision-auth-user`.
- Attempt sign-in with default password `123456` for a backfilled user → works.

## Files touched

- `supabase/migrations/<new>_admin_create_auth_user_for_profile.sql` (via migration tool)
- `supabase/functions/backfill-auth-users/index.ts`
- `supabase/functions/provision-auth-user/index.ts`
- `src/components/admin/super/access/SuperAdminsTable.tsx` (result summary + report dialog)
