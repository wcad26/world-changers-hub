I found the logout bug is very likely caused by the regional login page being wrapped in a fresh `RegionalSessionProvider`. When logout redirects from `/admin/regional/certificates` to `/auth/regional`, that new provider boots, sees the still-existing local Supabase session for a moment, and can treat the user as authorized again. Because the redirect also carries `state.from = /admin/regional/certificates`, the app can end up bouncing back to the page the user just logged out from.

Plan to eliminate the blank page and re-login loop:

1. Make `/auth/regional` a true public login page
   - Remove `RegionalSessionProvider` from the `/auth/regional` route in `App.tsx`.
   - The login page should not restore or authorize an existing regional session automatically.
   - This prevents the login page from immediately rehydrating the user after logout.

2. Stop preserving the protected page during logout redirects
   - Update `RegionalSessionRoute` so normal unauthorized redirects go to `/auth/regional` without carrying `state.from`.
   - This prevents `/admin/regional/certificates` from being remembered as the return destination after sign-out.

3. Add an explicit regional logout-in-progress guard
   - In `RegionalSessionContext.signOut`, set a short-lived marker in `sessionStorage` before clearing state.
   - Clear React Query cache and local regional state immediately, then redirect/render the login page.
   - On regional session boot, if that marker exists, force local Supabase sign-out cleanup and stay unauthorized instead of restoring the old session.

4. Make sign-out more deterministic
   - Await `queryClient.cancelQueries()` before clearing query cache.
   - Clear state synchronously before the Supabase network call.
   - Keep Supabase auth listener handling `SIGNED_OUT`, but ignore transient auth events while sign-out is in progress.

5. Harden the regional login page
   - Ensure successful manual login always sends users to `/admin/regional/dashboard`, not to an old `location.state.from` page.
   - Use local sign-out for “access denied” cleanup so it does not trigger global portal races.

Technical changes expected:

```text
App.tsx
  /auth/regional -> <RegionalAuth /> only
  /admin/regional/* -> keeps <RegionalSessionProvider> around protected routes

RegionalSessionRoute.tsx
  unauthorized -> <Navigate to="/auth/regional" replace />
  no state.from for regional logout

RegionalSessionContext.tsx
  add regional logout marker
  skip session restoration when marker is present
  clear marker after Supabase local signOut cleanup
  await cancelQueries before cache clear

RegionalAuth.tsx
  no auto-return to certificates or previous protected path
  access-denied cleanup uses local signOut
```

After this, pressing Logout from Certificate Management should produce a single clean transition to the Regional Portal login page, with no blank screen and no automatic return to `/admin/regional/certificates`.