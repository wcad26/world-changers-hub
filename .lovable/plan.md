I checked the current code paths and the database state. The affected accounts do have valid active regions assigned:

- `chimbotimah@gmail.com` → `WCA DOUALA`
- `preciousstone309@gmail.com` → `WCA Buea`

So the real problem is no longer “the account has no region”. The remaining triggers appear to be in the frontend boot sequence after login:

1. The regional session provider can still clear `user/profile/region` when Supabase briefly reports a null session.
2. The dashboard still blocks the page when `userRegion` is null.
3. The dashboard retry button uses `window.location.reload()`, which can restart the auth race and look like an eventual logout.
4. Several dashboard widgets begin querying only after region exists, so a missed region bootstrap leaves the portal in a bad recovery state.
5. There is no single authoritative regional-context bootstrap. The app still loads user → profile → region through separate frontend reads.

I will rebuild the regional auth/session path so login uses one deterministic bootstrap and no frontend role/access checks can blank or logout the portal.

Implementation plan:

1. Add a secure regional bootstrap RPC
   - Create a Supabase function like `get_my_regional_context()`.
   - It will return only the currently authenticated user's own profile and assigned region.
   - It will not check `user_roles`, `regional_user_roles`, or portal permissions.
   - It will use `auth.uid()` and `SECURITY DEFINER` so the frontend does not depend on several separate RLS-gated reads during login.
   - It will not expose other users' data.

2. Rebuild `RegionalSessionContext`
   - Replace the current event-driven flow with a deterministic bootstrap state machine:
     - first call `getSession()` and wait for a settled session;
     - if a session exists, call `get_my_regional_context()` once;
     - set `ready=true` only after bootstrap finishes;
     - never sign out automatically;
     - never redirect automatically;
     - ignore transient null auth events unless a manual logout is in progress.
   - Keep `onAuthStateChange` only for useful updates like `SIGNED_IN` / `TOKEN_REFRESHED`, not as a destructive source that clears the portal on a temporary null session.

3. Rebuild `RegionalAuth` login
   - After `signInWithPassword`, explicitly persist the returned session with `setSession` when tokens are present.
   - Immediately call the regional bootstrap RPC before navigating, so the dashboard does not open without a resolved context.
   - Navigate only after the session and context bootstrap have both had a chance to settle.
   - Do not check roles.
   - Do not check regional permissions.
   - Do not call `signOut()` on any missing profile/region/data condition.

4. Remove dashboard blocking triggers
   - Replace the `if (!userRegion) return ...` hard block in `RegionalDashboard`.
   - The dashboard will render a safe portal recovery state inside the shell instead of a blank/blocked page.
   - Remove `window.location.reload()` from the retry action and use `regionalSession.retry()` instead.
   - If region data is temporarily unavailable, widgets will show empty states/skeletons without forcing a logout-like reset.

5. Add a top-level app error boundary
   - Keep the existing regional error boundary, but also wrap the app route tree so provider/layout-level runtime errors cannot create a true blank screen.
   - The fallback will show a visible recovery panel with retry/back-to-login options instead of letting the app render nothing.

6. Audit and remove remaining automatic auth triggers
   - Re-scan the frontend for:
     - `supabase.auth.signOut()` calls outside manual logout buttons;
     - redirects to `/auth/regional`;
     - `window.location.reload()` inside regional portal pages;
     - client-side role/permission gating around regional pages.
   - Any remaining automatic trigger will be deleted or made non-destructive.

7. Keep security boundary server-side
   - Frontend role checks will remain removed for the regional portal.
   - I will not remove database RLS globally because that would expose private member/finance/user data.
   - The new bootstrap RPC will avoid the login blank-page problem without making the database public.

Expected result:

- Regional login should no longer land on a blank page.
- A temporary null session/auth event should no longer clear the regional portal.
- Missing/slow region context should show a visible recovery screen, not a blank page.
- The app should not auto-logout unless the user clicks a logout button or the Supabase session is genuinely invalid.
- Frontend role/access checks will not participate in regional login or rendering.