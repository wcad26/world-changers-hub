## Goal
Stop the Lovable development preview from blanking portal screens or navigating users back to login unless they explicitly click Logout.

## Findings
- The main route guards are now pass-through, but there are still vulnerable session paths outside those guards.
- `AuthProvider` can still move back into a restoring/loading state when Supabase reports a transient null session.
- Successful login pages do not immediately write the sticky portal user cache, so navigation can beat the auth listener and leave portal screens without a stable user during preview races.
- The old `usePortalSession` hook still treats any `SIGNED_OUT` as anonymous; even if mostly unused, it can reintroduce the same bug later.
- Only the regional portal has a non-navigating error boundary. Super, DCG, and member portals can still appear blank if a portal page throws during auth/data restoration.

## Plan
1. **Create one shared sticky auth utility**
   - Centralize cache keys and helpers for:
     - last authenticated user
     - explicit logout flag
     - reading/writing/clearing portal auth cache
   - Make explicit logout the only allowed reason to clear cached portal state.

2. **Harden `AuthProvider` permanently**
   - Initialize as ready even from cached user state.
   - Never set portal auth back to `loading: true`, `initialized: false`, or `authReady: false` because of transient null `INITIAL_SESSION`, `TOKEN_REFRESHED`, or preview `SIGNED_OUT` noise.
   - Ignore `SIGNED_OUT` unless the current session initiated it through explicit `signOut()`.
   - Clear stale explicit-logout flags on successful sign-in/session restoration.

3. **Write sticky cache immediately on login**
   - Update Super, Regional, DCG, and Member login pages so successful `signInWithPassword()` immediately writes the authenticated user cache before navigating into the portal.
   - This prevents a blank screen when navigation happens before Supabase’s auth listener finishes restoring.

4. **Neutralize stale session hook risk**
   - Replace `usePortalSession` behavior with the same sticky explicit-logout rules, or reduce it to a safe non-redirecting session observer.
   - This prevents future portal code from importing a hook that reintroduces anon/login redirects.

5. **Add non-redirecting portal error boundaries across all portals**
   - Keep Regional’s current boundary.
   - Wrap Super, DCG, and Member portal route layouts with an error boundary that shows a recoverable error state on the same URL instead of a blank screen or login redirect.

6. **Update project memory rule**
   - Strengthen the existing memory to include: login pages must write sticky cache immediately, auth providers must not enter blocking loading states from null sessions, and old session hooks must follow explicit-logout-only semantics.

## Validation
- Search the codebase to confirm no automatic portal redirects to `/auth/super`, `/auth/regional`, `/auth/member`, or `/dcg-auth` remain except explicit Logout buttons and public login-page controls.
- Check dev-server logs for HMR/runtime errors.
- Verify the Super Admin dashboard route remains renderable after session restoration and that portal guards remain pure pass-through.