Plan to fix the blank screen and login redirect loop efficiently:

1. Stabilize the Regional session module
- Split `RegionalSessionContext.tsx` into Fast Refresh-safe pieces, so the context/hook exports do not invalidate the whole route tree during development updates.
- Keep the provider as the only React component export in its component file, matching the pattern already used for `AuthProvider`.
- Add a small compatibility re-export if needed so existing imports continue to work.

2. Make regional auth state non-destructive
- Update `RegionalSessionProvider` so it never treats a transient missing Supabase session as logout.
- Only clear regional user/bootstrap state after explicit logout.
- Preserve the last known regional user and region during preview reloads, HMR updates, and temporary `INITIAL_SESSION null` / `SIGNED_OUT` events.

3. Fix auth hook precedence
- Adjust `useAuth()` so the global `AuthProvider` remains the primary source when present, while regional session data overlays only the regional fields inside the regional portal.
- This avoids accidentally replacing a valid global auth context with a minimal regional context that may temporarily have `user: null`.

4. Remove lingering loader/blank-screen traps across portals
- Update Super Admin, DCG, and Member guards so they do not hold the app on a full-screen loader indefinitely when auth restoration gets a temporary null session.
- Keep manual logout behavior intact: clicking Logout still clears the cache and redirects to that portal’s login page.

5. Verify the actual failure path
- Re-check recent Vite logs for Fast Refresh invalidation after the refactor.
- Confirm there are no remaining automatic redirects to `/auth/regional`, `/auth/super`, `/auth/member`, or `/dcg-auth` except explicit logout/login navigation.
- Use the preview/session signals to confirm login lands on the portal page instead of blanking and bouncing back to login.

Technical focus:
- The recent dev-server logs show `RegionalSessionContext.tsx` repeatedly triggering Vite Fast Refresh invalidation. That can remount the auth/session tree and produce the blank-screen/login-loop behavior you’re seeing.
- The fix will be targeted: session file split + sticky auth state + guard cleanup, without changing dashboard metrics or unrelated portal features.