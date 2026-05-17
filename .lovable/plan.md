I found the DCG portal is doing multiple independent auth checks during login: `/dcg` mounts `AuthProvider`, each DCG page is wrapped by `DcgSessionRoute`, and `DcgSessionRoute` separately calls `supabase.auth.getSession()` and listens for auth changes. At the same time the dashboard starts DCG/regional data queries. This can race while Supabase restores the just-saved login session, leaving the route stuck on a spinner or redirecting back to `/dcg-auth`.

Plan:

1. **Make DCG auth initialization single-source**
   - Update `DcgSessionRoute` to use the already-mounted `AuthProvider` state (`authReady`, `loading`, `user`) instead of starting its own Supabase auth listener.
   - Only redirect to `/dcg-auth` after the provider is definitely ready and there is no user.
   - Keep a stable loading screen while the auth session is being restored.

2. **Harden `AuthProvider` against login-session races**
   - Avoid clearing the user from an early `INITIAL_SESSION` event if `getSession()` is still resolving.
   - Ensure `authReady` becomes true only after session restoration has completed.
   - Keep context data fetches best-effort, so failed profile/DCG lookups cannot log the user out or blank the portal.

3. **Make the DCG dashboard DCG-only and auth-ready**
   - Stop the dashboard from relying on regional hooks like `useDcgs()` and `useFinancialTransactions()` during DCG login.
   - Resolve the active DCG via `useCurrentDcg()` / `get_user_dcg()` and fetch dashboard data only after the DCG is known.
   - Show visible access/error states instead of a blank page if the user has no active DCG session.

4. **Preserve portal isolation**
   - Keep `/dcg-auth` as the login page and `/dcg/*` protected by Supabase session only.
   - Do not add client-side role checks that could incorrectly block valid DCG users; RLS remains the server-side source of truth.

5. **Validate the fix**
   - Check the Vite logs for compile/runtime errors after implementation.
   - Verify the DCG route no longer redirects after login and that the dashboard/finance pages render with loading, data, or explicit access messages.