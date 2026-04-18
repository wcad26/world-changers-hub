

## Problem

Christian Collins's data is fully correct in the DB (base `regional_admin` role active, profile.region_id matches, granular "Regional Admin" role assigned). He successfully authenticates, but immediately gets bounced from `/admin/regional/dashboard` back to `/auth/regional`, looking like an instant sign-out.

## Root cause

Two race-condition bugs in the regional-portal guards, not a data/permissions issue.

### Bug 1 — `useAuth.tsx` flips `loading` to `false` on a transient null session

In `onAuthStateChange`, when an event arrives with no session (which happens momentarily during `INITIAL_SESSION` boot, token refresh hiccups, or when a second `useAuth()` instance mounts before Supabase has rehydrated), the hook does:

```text
setUser(null);
setLoading(false);   // ← problem
```

`MultiRoleProtectedRoute` then sees `loading=false && user=null` and redirects to `/auth/regional`. A few ms later the real session arrives, `user` is set, but the route has already navigated away. This is exactly the "sign in, then immediately sign out" symptom.

Christian is more affected than other admins because he holds two base roles (`regional_admin` + `dcg_admin`) and a granular regional role, so `fetchUserData` has more queries to run, lengthening the window where the transient-null state can be observed by guards.

### Bug 2 — `MultiRoleProtectedRoute` redirects on transient `user=null`

The guard treats `!user` as "log them out", with no grace for the boot phase. Combined with Bug 1, this makes the bounce inevitable. It should only redirect when `loading=false` AND we are confident there is genuinely no session (i.e. we have actually received a non-INITIAL auth event).

## Fix (code only, no DB or schema changes)

### 1. `src/hooks/useAuth.tsx`
- In `onAuthStateChange`, when a non-`SIGNED_OUT` event arrives without a session, do NOT immediately flip `loading` to `false` and clear state. Only treat the user as logged-out after the initial-session probe has resolved.
- Track an `initialized` ref. `getInitialSession` sets it to `true` once it has run. Auth-state-change events that report no session before initialization simply no-op (Supabase's INITIAL_SESSION will deliver the truth).
- Keep the `SIGNED_OUT` branch as-is (explicit logout still clears state and redirects).
- Verify the `fetchUserData` braces — they parse correctly today, but indentation is misleading; tidy it up so future edits don't accidentally nest the regional-roles fetch under `if (hasDcgRole)`.

### 2. `src/components/auth/MultiRoleProtectedRoute.tsx`
- While `loading` is true, render the spinner (already done).
- When `loading=false && !user`, also check that we haven't just transitioned from `user=truthy` within the same render burst. Simplest implementation: only redirect if `user` is null AND the hook has completed at least one fetch cycle (expose an `initialized` flag from `useAuth` and gate the redirect on it).

### 3. `src/components/auth/RegionalPermissionRoute.tsx`
- Same `initialized` gate so it doesn't redirect to `/unauthorized` while `userRegionalRoles` is still loading on first mount.

### 4. `src/components/auth/RegionSpecificAuth.tsx`
- Add a final log line in `checkRegionalAdminRole` (`Role check result: …`) so the next time we debug, we can see whether the function returned true/false vs. silently hung. Today the trail goes cold after `Checking regional access...`.

## Why this is the real fix, not another data patch

- Christian's DB rows are all correct — verified live: `user_roles` has `regional_admin` (active, status=active, region matches), `regional_user_roles` has the granular Regional Admin row (active), `profiles.region_id` matches.
- The `RegionSpecificAuth` form-side check would succeed (he passes both base role and granular role gates) and call `navigate('/admin/regional/dashboard')`.
- Therefore the bounce can only come from the dashboard's own guard, and the only way that guard sees `user=null` is the transient-null race in `useAuth`.

After this fix, any user (not just Christian) who had intermittent dashboard kick-outs after login will be unblocked.

## Verification steps

1. Christian re-logs in at `/auth/regions/wca-douala` and lands on `/admin/regional/dashboard` without bouncing.
2. Sidebar shows the full menu (he has the "Regional Admin" granular role with all permissions).
3. Hard refresh on `/admin/regional/dashboard` keeps him on the page (does not bounce to `/auth/regional`).
4. Confirm sign-out from the dashboard still works and lands on `/auth/regional`.

