
Eliminate the login/logout loop by making DCG authentication use one single source of truth and by aligning every DCG access check to the same rule.

### What is actually causing the loop now

1. DCG access is defined in three conflicting ways
   - `src/contexts/AuthContext.tsx` says DCG access is allowed when the user has either:
     - `dcg_admin` role, or
     - a real DCG association (`userDcg`)
   - `src/pages/DcgAuth.tsx` currently allows login only if `user_roles` contains `dcg_admin`, `regional_admin`, or `super_admin`
   - `src/components/auth/MultiRoleProtectedRoute.tsx` only checks roles, not DCG association
   - `src/components/auth/DcgProtectedRoute.tsx` checks roles or `userDcg`

   Result:
   - login succeeds at Supabase
   - provider hydrates a valid DCG association
   - DCG login page may still sign the user out because it only checked `user_roles`
   - or `/dcg/dashboard` may reject them at the outer guard before `DcgProtectedRoute` can allow them
   - this creates the “in and out continuously” behavior

2. There are still multiple auth controllers fighting each other
   - `src/pages/DcgAuth.tsx` signs users in and may also directly sign them out
   - `src/pages/SuperAuth.tsx` still does its own timed redirect after login
   - `src/components/auth/RegionSpecificAuth.tsx` still does its own timed redirect after login
   - `src/pages/MemberAuth.tsx` still navigates immediately after `signInWithPassword`
   - `src/components/admin/DcgAdminLayout.tsx` calls `signOut()` and then also manually navigates to `/dcg-auth`

   Result:
   - the provider is no longer the only authority for post-login and post-logout routing
   - route changes can happen before auth hydration finishes
   - logout can trigger more than one redirect path

3. The provider still treats every authenticated auth event like a fresh route-relevant event
   - `src/contexts/AuthContext.tsx` runs `fetchUserData()` for any `session?.user` event, including refresh/update events
   - for same-user refresh events it does not re-enter guarded loading, but it still re-fetches and updates derived auth state
   - that is not the primary bug, but it adds churn and makes redirect races harder to reason about

4. The DCG dashboard is also throwing render-time console errors immediately after login
   - `src/pages/dcg/Dashboard.tsx` calls `formatWithCurrency(..., regionCurrency)` before `regionCurrency` is loaded
   - `src/utils/currencyUtils.ts` logs an error every time currency is missing
   - this is a secondary bug, but it makes the post-login experience look unstable and pollutes debugging

### Files that need to be aligned

```text
src/contexts/AuthContext.tsx
src/pages/DcgAuth.tsx
src/components/auth/MultiRoleProtectedRoute.tsx
src/components/auth/DcgProtectedRoute.tsx
src/components/admin/DcgAdminLayout.tsx
src/pages/MemberAuth.tsx
src/pages/SuperAuth.tsx
src/components/auth/RegionSpecificAuth.tsx
src/pages/dcg/Dashboard.tsx
src/utils/currencyUtils.ts
```

### Implementation plan

1. Make DCG access mean exactly one thing everywhere
   - Introduce one shared DCG-access check based on:
     - explicit `dcg_admin` role, or
     - hydrated `userDcg` association
   - Use that same rule in:
     - `DcgAuth.tsx`
     - `MultiRoleProtectedRoute.tsx` for DCG routes
     - `DcgProtectedRoute.tsx`
   - Remove the current mismatch where one component accepts association-based access and another rejects it

2. Stop `DcgAuth.tsx` from performing premature authorization sign-out
   - Keep login submission in the page
   - remove the current role-only gate that calls `supabase.auth.signOut()` immediately after successful login
   - let the provider hydrate first, then decide access using the shared DCG rule
   - only show an access-denied state after hydration proves the user has no DCG portal access at all

3. Remove remaining auth races outside the provider
   - `MemberAuth.tsx`, `SuperAuth.tsx`, and `RegionSpecificAuth.tsx` should stop doing immediate post-login navigation based on raw sign-in results
   - those pages should wait for `initialized && !loading` from `useAuth()`
   - access-denied flows should stop calling raw `supabase.auth.signOut()` and instead use the centralized provider logout path where needed
   - `DcgAdminLayout.tsx` should not navigate after `signOut()` because the provider already owns logout redirect decisions

4. Tighten the provider so it is the only route authority
   - In `AuthContext.tsx`, keep one listener and one hydration pipeline
   - narrow session-event handling so refresh/update events do not trigger unnecessary route-affecting churn
   - keep explicit loading/init transitions for true sign-in changes
   - preserve sign-out suppression only for stale restore, not for legitimate new sessions

5. Stabilize the first DCG render after login
   - In `DcgDashboard.tsx`, gate currency formatting until currency data is available
   - add a safe fallback so the dashboard can render while region/currency queries are still loading
   - avoid logging repeated “Currency not provided” errors during normal loading

### Technical details

Current broken flow is effectively:

```text
User logs in on /dcg-auth
  -> Supabase returns session
  -> AuthContext begins hydration
  -> DcgAuth does a separate role-only check
     -> may sign user out even if user has valid userDcg association
  -> or DcgAuth redirects to /dcg/dashboard
  -> MultiRoleProtectedRoute checks roles only
     -> may reject before DcgProtectedRoute sees userDcg
  -> page bounces or signs out
  -> auth listener + page redirects create repeated in/out loop
```

Target flow:

```text
User logs in on /dcg-auth
  -> Supabase returns session
  -> AuthContext hydrates profile/roles/userDcg once
  -> app waits for initialized && !loading
  -> shared DCG access rule is evaluated once
  -> user goes directly to /dcg/dashboard and stays there
```

### Expected outcome after the fix

1. A valid DCG user can log in from `/dcg-auth` and go straight to `/dcg/dashboard`
2. The app does not sign them out just because they lack a `dcg_admin` row when they already have a valid DCG association
3. The dashboard route does not reject a valid DCG-associated user at the outer guard
4. Logout remains stable and does not immediately bounce through a second manual navigation path
5. Console noise from missing currency data on first render is removed

### Verification

1. Log in with a user who has explicit `dcg_admin`
   - lands on `/dcg/dashboard`
   - no loop

2. Log in with a user who has DCG association but no explicit `dcg_admin`
   - still lands on `/dcg/dashboard`
   - no loop
   - no forced sign-out

3. Log out from the DCG portal
   - lands on `/dcg-auth`
   - stays signed out
   - no extra redirect churn

4. Log back in immediately after logout
   - no sign-out bounce
   - no repeated redirect cycle

5. Open console after DCG login
   - no repeated auth churn
   - no repeated currency-loading errors from the dashboard
