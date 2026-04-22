
Fix the post-login failure by removing the remaining auth races and making the app wait for one fully-hydrated auth state before any redirect or role check.

### Root causes still present in the current code

1. `src/contexts/AuthContext.tsx` still blocks real logins after a recent sign-out:
   - the listener ignores any `session?.user` event while `wca:just_signed_out` exists
   - that flag is meant to suppress stale session rehydration, but it currently also suppresses a legitimate new login done within the TTL window

2. `src/contexts/AuthContext.tsx` does not re-enter a loading/init phase when a new user signs in:
   - `user` is set immediately
   - but `loading` stays false and `initialized` stays true from the previous state
   - route guards then evaluate half-loaded auth data (`userRoles`, `userDcg`, `memberRecord`, `userRegionalRoles` still empty/null), which can bounce the user back out right after login

3. Some login pages still bypass the shared auth context and do their own `supabase.auth.getSession()` + redirect logic:
   - `src/pages/SuperAuth.tsx`
   - `src/components/auth/RegionSpecificAuth.tsx`
   - `src/pages/MemberAuth.tsx` partly uses its own session flag too
   These independent checks can fight the provider and recreate the same instability.

4. `src/components/auth/PortalSelector.tsx` is still effectively public and does not wait for auth hydration, so users can land there before roles are loaded and see an empty/no-portal state.

### Implementation plan

1. Stabilize the auth provider in `src/contexts/AuthContext.tsx`
   - Keep one listener, but change the event handling rules:
     - only suppress stale restore during the initial boot path
     - do not ignore a real `SIGNED_IN` event because of `wca:just_signed_out`
     - clear the sign-out flag immediately when a fresh sign-in is confirmed
   - On any new authenticated session:
     - set `loading = true`
     - set `initialized = false`
     - reset derived user state (`profile`, `userRoles`, `userRegion`, `userDcg`, `memberRecord`, `userRegionalRoles`)
     - then fetch user data
     - only set `initialized = true` and `loading = false` after that fetch completes
   - Keep sign-out handling centralized in the provider.

2. Narrow the sign-out race protection so it no longer blocks valid logins
   - Use the sign-out flag only to prevent immediate stale rehydration after logout
   - Remove the current broad `isJustSignedOut()` early-return from the general authenticated listener path
   - Preserve the protection in the initial restore path, not during active sign-in

3. Convert auth pages to follow the provider instead of probing sessions themselves
   - `src/pages/SuperAuth.tsx`:
     - remove mount-time `getSession()` redirect logic
     - use `useAuth()` and redirect only when `initialized && !loading && user` and role access is confirmed
   - `src/components/auth/RegionSpecificAuth.tsx`:
     - remove mount-time `getSession()` redirect logic
     - keep region-specific access validation for login, but rely on provider state for post-login redirect
   - `src/pages/MemberAuth.tsx`:
     - remove the separate `just_signed_out` logic
     - use the shared auth state and shared flag behavior only
   - `src/pages/DcgAuth.tsx`:
     - gate redirects on `initialized && !loading`
     - stop relying on half-loaded auth state immediately after sign-in

4. Make portal selection wait for hydrated auth
   - Update `src/components/auth/PortalSelector.tsx` to:
     - show a loading state while auth is hydrating
     - redirect away if there is no authenticated user
     - only render portal cards after roles/associations are loaded

5. Tighten route guards for consistency
   - Update guards that still rely only on `loading` to also respect `initialized` where needed:
     - `src/components/auth/ProtectedRoute.tsx`
     - `src/components/auth/MemberProtectedRoute.tsx`
   - This prevents redirecting during the short window between session creation and role/profile hydration.

### Files to update

```text
src/contexts/AuthContext.tsx
src/pages/DcgAuth.tsx
src/pages/SuperAuth.tsx
src/components/auth/RegionSpecificAuth.tsx
src/pages/MemberAuth.tsx
src/components/auth/PortalSelector.tsx
src/components/auth/ProtectedRoute.tsx
src/components/auth/MemberProtectedRoute.tsx
```

### Technical details

- The key bug is in the current provider flow:
  - sign-out sets `wca:just_signed_out`
  - a quick new login fires `SIGNED_IN`
  - the listener currently ignores that authenticated event
  - app state stays effectively logged out even though Supabase login succeeded
- A second bug happens even without that flag:
  - `user` becomes truthy before roles/DCG/member/region data is ready
  - route guards run too early and misclassify the user
- The simplest stable model is:
  - one provider
  - one auth listener
  - one hydrated/auth-ready state
  - all auth pages and guards wait for that state before redirecting

### Verification

1. Log in, including immediately after a prior sign-out:
   - user stays signed in
   - no bounce back to the login page
2. Log out:
   - user stays logged out
   - refreshing does not re-authenticate them
3. Log back in within 5 seconds of logout:
   - login succeeds normally
   - no false “logged out again” behavior
4. Multi-role users:
   - `/portal-selector` loads once, stably, with the correct portal cards
5. Single-role users:
   - DCG, regional, super, and member logins land on the correct dashboard without looping
6. Console:
   - no repeated auth-churn redirects during idle navigation

### No database work

No Supabase schema or RLS changes are needed for this fix.
