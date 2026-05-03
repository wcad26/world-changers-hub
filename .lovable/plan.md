I located the remaining triggers that can still cause the regional portal to go blank and then redirect back to `/auth/regional`.

Root cause list:

1. `RegionalSessionContext.tsx` still has a live `onAuthStateChange` listener.
   - Trigger: any `SIGNED_OUT` event from the shared Supabase client immediately sets regional status to `unauthorized`.
   - Effect: `RegionalSessionRoute` sees `unauthorized` and redirects to `/auth/regional`.
   - This is exactly the kind of global/event-based trigger we were trying to remove.

2. `RegionalSessionContext.tsx` still has a `regional_signing_out` sessionStorage condition.
   - Trigger: if `sessionStorage.regional_signing_out === '1'`, the provider calls `supabase.auth.signOut({ scope: 'local' })` during boot and forces `unauthorized`.
   - Effect: a stale marker or development remount can wipe a valid login.
   - This is an unnecessary condition and should be removed.

3. `RegionalSessionContext.tsx` still redirects when `getSession()` temporarily returns no session.
   - Trigger: initial boot does `supabase.auth.getSession()` once; if it returns null during a persistence/HMR/dev refresh race, status becomes `unauthorized`.
   - Effect: the guard redirects to login even though the login just succeeded.

4. `RegionalAuth.tsx` signs the user out if the immediate profile check cannot see `profile.region_id`.
   - Trigger: after login, it queries `profiles.region_id`; if that query returns no row/null due to timing/RLS/transient issue, it signs out.
   - Effect: this can create the blank/redirect flow during login.
   - The database confirms the affected user does have a valid `region_id`, so this check should not be allowed to destroy the session.

5. React `StrictMode` is enabled in `main.tsx`.
   - Trigger: in development, StrictMode intentionally mounts/unmounts effects twice.
   - Effect: it can amplify the boot/auth race above. It is not the root cause by itself, but it makes these auth side effects much easier to hit in the development environment.

Planned fix:

1. Simplify `RegionalSessionContext.tsx` into a non-destructive regional session reader.
   - Remove the `onAuthStateChange` subscription entirely from the regional portal.
   - Remove all `regional_signing_out` sessionStorage logic.
   - Remove automatic boot-time signOut.
   - On boot, read `getSession()` once and load profile/region.
   - If session is missing, show a stable recoverable state instead of immediately destroying anything.

2. Change the regional route guard so only a true unauthenticated state redirects.
   - Keep showing a spinner while auth is being restored.
   - For profile/region read errors, show the existing retry panel instead of redirecting.
   - Avoid instant login-page redirect from transient null session in development.

3. Make `RegionalAuth.tsx` non-destructive.
   - After password login, do not call `signOut()` just because the profile check returns no `region_id` once.
   - If the profile check fails, show an access/error message and do not wipe the Supabase session.
   - Navigate only after a valid region is confirmed, or let the regional provider retry instead of destroying the login.

4. Add targeted diagnostic logs for the regional boot path.
   - Log when boot starts, whether a session exists, when profile/region loads, and what condition would have caused a redirect.
   - This makes any remaining trigger visible in console without needing to guess.

5. Keep all security boundaries intact.
   - This does not grant public access to regional pages.
   - Regional pages still require an authenticated Supabase session plus a profile with `region_id`.
   - The change is only to stop transient checks and global auth events from signing the user out or causing blank redirects.

Expected result:

- Regional login should stop blanking after successful sign-in.
- Development remounts/HMR/StrictMode should no longer turn a valid session into `unauthorized`.
- A transient profile/region read issue should show a retry/error panel, not log the user out.
- The remaining causes, if any, will be visible through the new regional auth debug logs.