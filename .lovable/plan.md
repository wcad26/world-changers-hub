## Plan: permanently stop preview auth logout/blank loops

### Goal
Keep portal pages rendered in the Lovable development preview even when Supabase/dev-preview emits transient `SIGNED_OUT` or null session events. Users should only leave a portal when they click Logout.

### Changes to implement
1. **Create one sticky portal session standard**
   - Add a small shared session utility/hook that caches the last authenticated user in localStorage.
   - Treat transient null sessions and unexpected `SIGNED_OUT` events as non-fatal unless an explicit logout marker exists.
   - Rehydrate from the cached user immediately so the UI does not blank during preview auth restoration.

2. **Apply the standard to all portal guards**
   - Update `SuperAdminSessionRoute`, `DcgSessionRoute`, and `MemberProtectedRoute` so they do not redirect or block on preview auth instability.
   - Align them with the already-pass-through regional route pattern.
   - Keep RLS as the source of truth for protected data access.

3. **Harden the global auth provider**
   - Make `AuthProvider` fully sticky: it should not clear `user`, profile context, or cached user on unexpected auth noise.
   - Only `signOut()` should clear cached portal state and navigate users to login.

4. **Fix Fast Refresh instability that can reintroduce blank screens**
   - Ensure context files remain Fast Refresh-safe: pure context exports separated from provider components.
   - Avoid editing patterns that mix component and non-component exports in a way that causes Vite HMR invalidation.

5. **Persist the rule in project memory**
   - Add a memory entry that says: portal session guards must remain sticky/pass-through in Lovable preview, no automatic redirects to login on null session/SIGNED_OUT, and logout must be explicit only.
   - This prevents future changes from reverting the fix while working on dashboards or other portal pages.

### Validation
- Inspect dev-server logs after implementation for HMR/auth-related errors.
- Verify the final code has no automatic portal redirects to `/auth/super`, `/auth/regional`, `/auth/member`, or `/dcg-auth` except explicit logout buttons and public auth-page navigation.
- Confirm the Super Admin route can render without a blank auth guard state after login/session restoration.