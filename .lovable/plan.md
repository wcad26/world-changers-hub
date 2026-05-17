Root cause found:
- The app still has hard browser navigations after auth (`window.location.assign` / `replace`) in portal login/logout paths. In Lovable preview, those full reloads can lose or delay Supabase session restoration, so the dashboard mounts with no session/bootstrap, shows a blank/loading fallback, and the preview keeps reloading.
- `RegionalSessionContext` marks itself ready immediately even when no user/region has been resolved, which lets regional dashboard queries render with missing context.
- The shared portal `AuthProvider` now ignores spurious sign-outs, but it still marks auth ready too early when `getSession()` returns transient null in preview.

Plan:
1. Replace hard browser reload navigation with React Router navigation
   - Change DCG login from `window.location.assign('/dcg/dashboard')` to `navigate('/dcg/dashboard', { replace: true })`.
   - Change DCG logout redirect from `window.location.assign('/dcg-auth')` to router navigation after explicit sign-out.
   - Change regional explicit logout redirects from `window.location.replace('/auth/regional')` to router navigation where possible.
   - Keep logout behavior only when the user clicks logout; no automatic logout on missing session/context.

2. Make regional session restoration wait instead of declaring “ready” with no user
   - In `RegionalSessionContext`, start `ready` as false.
   - Read regional bootstrap synchronously first.
   - Subscribe to Supabase auth changes before/alongside `getSession()`.
   - If no session and no bootstrap exists, keep the provider in a stable loading/checking state in development preview instead of letting dashboard render with missing region.
   - Only set `ready` true when a Supabase user or regional bootstrap is available, or after a clearly explicit logout.

3. Harden global portal auth against transient null sessions
   - In `AuthProvider`, do not set `initialized/loading/authReady` to “ready” immediately when `getSession()` returns null and no user exists.
   - Keep a loading state for a short restore window, and ignore null `INITIAL_SESSION` events.
   - Only clear auth state for explicit `signOut()`.

4. Update regional dashboard fallback
   - When regional session is still restoring, show the existing skeleton/loading UI.
   - Remove the inline “Logout” action from the missing-region notice so the page does not encourage clearing a valid-but-delayed preview session.
   - Keep Retry available.

5. Validate after implementation
   - Confirm no remaining non-user-triggered portal redirects/sign-outs exist.
   - Check dev server logs for runtime errors.
   - Confirm `/admin/regional/dashboard` shows loading instead of blank/reload when session data is delayed.