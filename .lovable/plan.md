I found a new likely trigger: the regional dashboard is not fully blank in my reproduction, but it is stuck forever on dashboard skeletons. That means the portal shell renders, but `userRegion` never resolves for the dashboard data hooks. After that, the preview can look like a blank/loading screen and Lovable’s blank-page recovery or a later navigation can make it appear as an eventual logout.

The most important issue is that `RegionalSessionContext` currently does only one `supabase.auth.getSession()` call on mount. If that call happens before Supabase finishes restoring the persisted login, it exits early and never listens for the later signed-in session. Since `ready` is always hardcoded to `true`, pages think auth is complete but still have no user/profile/region. The dashboard then waits on `!userRegion` forever.

I will implement the next elimination pass as follows:

1. Make regional session hydration deterministic
- Update `RegionalSessionContext` to use `supabase.auth.onAuthStateChange` again, but safely:
  - subscribe once on mount,
  - update only lightweight `session/user` state inside the callback,
  - do not run nested Supabase queries inside the callback,
  - do not sign out on missing session,
  - do not redirect from the provider.
- Add a separate effect that loads profile and region whenever `user.id` becomes available.
- Keep client-side access checks disabled, but make `ready` mean “session restoration has completed”, not a hardcoded value.

2. Eliminate the permanent dashboard skeleton condition
- Change regional pages that wait on `!userRegion` to stop showing endless skeletons after auth is ready.
- For the dashboard specifically, show a visible “Region is still loading / retry” fallback instead of a blank-looking skeleton wall if region data is unavailable.
- Ensure the regional dashboard can recover when the region arrives after initial render.

3. Remove stale and misleading regional login assumptions
- Clean up `RegionalAuth.tsx` comments that still say the login checks profile region and signs out. The code no longer does that, but the comment is misleading.
- After `signInWithPassword`, wait briefly for the signed-in session to be persisted before navigation, without checking roles and without signing out.

4. Add targeted diagnostics that do not expose secrets
- Add temporary-safe console diagnostics around regional session states: session restored, profile loaded, region loaded, or no region found.
- Add a global unhandled error/rejection logger so if the remaining “blank screen” is caused by a runtime exception rather than auth, it becomes visible in the console instead of silently blanking.

5. Keep role/access checks removed
- Do not restore role checks.
- Do not add frontend redirects for unauthorized/role states.
- Do not call `supabase.auth.signOut()` except from explicit user logout buttons.

6. Verify the remaining triggers
- Re-scan for any remaining frontend `signOut`, auth redirects, `return null`, and role-gated routes that could affect the regional portal.
- Re-test `/auth/regional -> /admin/regional/dashboard` and confirm the page reaches real dashboard content instead of the skeleton wall.