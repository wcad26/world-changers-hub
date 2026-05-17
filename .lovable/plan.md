## Plan to stop preview logout/reload loops across all portals

### What I found
- The earlier fix was partly undone structurally: `AuthProvider` is now mounted separately for Super Admin, DCG, Member, and Portal Selector routes instead of once around the app. That means every portal route mount/rebuild can restart Supabase session restoration.
- Regional portal uses a separate `RegionalSessionProvider`, but it still depends on fragile `getSession()`/auth events after the session bootstrap.
- The guards are mostly pass-through now, but they can still show loaders during transient auth-null states, which creates the “logged out / reload loop” feel in the Lovable preview.

### Implementation steps
1. **Restore one stable global auth provider**
   - Mount one `AuthProvider` once inside `BrowserRouter` so Super Admin, DCG, Member, Portal Selector, and auth pages share the same auth state machine.
   - Remove the separate per-portal `AuthProvider` wrappers from `App.tsx` to prevent remounting the auth listener on route changes or dashboard rebuilds.

2. **Make auth state sticky during preview glitches**
   - In `AuthProvider`, keep the last known authenticated user/session in memory.
   - Ignore spurious `SIGNED_OUT`, `INITIAL_SESSION null`, or `getSession()` null results unless the user explicitly clicked logout.
   - If Supabase temporarily reports no session, keep rendering the existing logged-in user instead of clearing state or re-entering a login flow.

3. **Keep explicit logout working**
   - Preserve the explicit logout flag so clicking Logout still clears user state and navigates to the correct auth page.
   - Make sure only this explicit path can clear the session in the UI.

4. **Stabilize the Regional portal too**
   - Keep the regional bootstrap behavior, but make `RegionalSessionProvider` retain the last known regional user/region during transient missing-session events.
   - Ensure it never switches to an unauthenticated/checking loop because of preview-only auth restoration gaps.

5. **Normalize all portal guards**
   - Update Super Admin, DCG, Member, and Regional route guards to be resilient pass-through gates: they can show a short first-load spinner, but they must not redirect or clear auth state due to transient null sessions.

6. **Verify no hidden redirect/logout triggers remain**
   - Search all portals for raw `supabase.auth.signOut()`, auth-page redirects, `window.location` reloads, and route guards that navigate to login.
   - Keep only user-clicked logout actions.

### Expected result
- Rebuilding or hot-reloading the Super Admin dashboard will not log users out.
- Logged-in users stay inside their portal even if the Lovable preview emits temporary null auth events.
- The continuous reload loop stops across Regional, Super Admin, DCG, and Member portals.
- Manual logout still works normally.