## Root cause

`user_roles.user_id` and `regional_user_roles.user_id` are FKs to `auth.users(id)`. **532 of 690 profiles have no matching `auth.users` row**, so the moment one of them is picked in a role-assignment dialog the insert fails with `user_roles_user_id_fkey`. Those same 532 people also cannot sign in to the member portal — there is literally no auth account behind their profile, default password or not.

The existing `create-member` edge function already mints an auth user with password `123456`, but other historical paths (bulk imports, early pre-registration, manual SQL) created `profiles` rows without ever calling it. We need a one-time backfill, a guarantee for new rows going forward, and a graceful UX in the role pickers.

## Plan

### 1. One-time backfill: give every profile an `auth.users` row

A new edge function `backfill-auth-users` (callable only by a Principal super admin) iterates over every profile where no `auth.users` row exists and creates one with the **service-role admin API**:

```ts
await supabaseAdmin.auth.admin.createUser({
  id: profile.id,                 // preserve profile.id == auth.users.id
  email: profile.email,
  password: '123456',
  email_confirm: true,
  user_metadata: { first_name, last_name },
});
```

Pre-flight handling for the edge cases we already measured:

| Case | Count | Resolution |
|---|---|---|
| Profile has no auth user, email is unique | ~523 | Create auth user with `id = profile.id`, password `123456`. |
| Two profiles share the same email, both missing auth | 3 emails / 6 profiles | Create auth user for the older profile; for the duplicate(s) append `+dup<n>@…` to the email so the create succeeds, log them in a `backfill_auth_users_report` table for the admin to reconcile. |
| Profile email collides with an existing `auth.users` row owned by a different id | 6 | Re-point all FKs from the orphan profile id to the existing auth user id (`members.profile_id`, `event_pre_registrations.profile_id`, `member_relationships.*`, `donors`, `dcg_members`, etc.), then delete the orphan `profiles` row. Done in a single SQL transaction in the same migration so nothing dangles. |

The function returns a JSON summary `{ created, merged, skipped, errors[] }` and writes it to `backfill_auth_users_report` for an audit trail. Idempotent — re-running it is a no-op once everyone has an auth row.

### 2. Guarantee for the future

Add a Postgres trigger `profiles_require_auth_user` (`BEFORE INSERT` on `public.profiles`) that raises an exception if `NEW.id` is not present in `auth.users`. This makes it impossible for any code path (admin import, edge function, manual SQL) to silently create a profile without an auth account again.

Audit the remaining profile-creating paths and route them through `auth.admin.createUser`:
- `create-member-registration` and `create-regional-admin` — already do this. ✓
- Bulk-import / CSV paths under `src/components/admin/regional/members/import/*` — wire through the new shared `create-member` flow instead of inserting into `profiles` directly.
- Special-event pre-registration (`event_pre_registrations`) — if it creates a profile for a brand-new attendee, route through the same flow.

### 3. Friendlier role-picker UX

Even after backfill, the dialogs should never show a raw FK error:
- `useAssignSuperAdminRole`, `useRegionalRoles` assign mutations: catch Postgres `23503` on `user_id` and translate to a toast: **"This user has no sign-in account yet. Click 'Provision account' to fix."**
- `PromoteSuperAdminDialog` and `AssignRoleDialog`: if a picked user has no auth row, show an inline **"Provision sign-in account"** button that calls a small `provision-auth-user` edge function (single-user version of step 1) before retrying the role assignment.

### 4. Verification

After the backfill runs, confirm:

```sql
select count(*) from profiles p
left join auth.users au on au.id = p.id
where au.id is null;       -- expect 0
```

Then sanity-test by signing in to the member portal as `chiangehamandine5@gmail.com` / `123456`, and re-trying the "Promote to Super Admin" action for "Chiangeh Amandine Dwin" — both should now succeed.

### Out of scope

- Forcing users to change `123456` on first sign-in (separate UX request).
- Sending notification emails to the 532 backfilled users — current request is to make sign-in work silently.

## Technical notes

- New tables / schema changes go through `supabase--migration`:
  - `backfill_auth_users_report (id, run_at, profile_id, action, note)` with grants + RLS limited to super admins.
  - `BEFORE INSERT` trigger on `profiles`.
- New edge functions: `backfill-auth-users` and `provision-auth-user`, both gated by `is_principal_super_admin(auth.uid())`.
- Existing code touched: `PromoteSuperAdminDialog.tsx`, `AssignRoleDialog.tsx`, `useSuperAdminUsers.ts`, `useRegionalRoles.ts`, bulk-import components under `src/components/admin/regional/members/import/`.
