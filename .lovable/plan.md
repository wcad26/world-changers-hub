I located the remaining frontend triggers that can still block rendering, redirect to login, or explicitly sign the user out. The key point is: the regional portal is already mostly free of role checks, but the app still has multiple portal guards and login-page access checks elsewhere, and the regional guard still has a session condition that can show a blocking state when Supabase temporarily returns no session.

Important security note: removing portal checks means the frontend routes will render for anyone who can reach the URL. Supabase RLS/database policies may still block real data mutations/reads server-side, but the UI itself will no longer be protected by client-side checks. Since you explicitly asked to eliminate these checks to stop the blank/logout loop, I will remove only the frontend blocking/redirect/sign-out behavior and leave database RLS policies intact.

Current remaining triggers found

1. Regional portal route/session trigger
- `src/contexts/RegionalSessionContext.tsx`
  - Still sets `status = 'unauthorized'` when `getSession()` returns no user after retries.
  - Still sets `status = 'error'` if profile/region lookup fails.
- `src/components/auth/RegionalSessionRoute.tsx`
  - Does not auto-redirect anymore, but still blocks the portal behind `ready/status` and shows a recovery panel instead of rendering the app.

2. Super admin role checks
- `src/pages/SuperAuth.tsx`
  - After password login, queries `user_roles` for `super_admin`.
  - If missing, it calls `supabase.auth.signOut({ scope: 'local' })` and shows access denied.
- `src/components/auth/SuperAdminSessionRoute.tsx`
  - On every protected route mount, checks session and `user_roles.super_admin`.
  - If denied, redirects to `/auth/super`.

3. DCG association checks
- `src/pages/DcgAuth.tsx`
  - After password login, checks `dcg_user_sessions`, `members`, and `dcg_members`.
  - If not associated, it signs out.
- `src/components/auth/DcgSessionRoute.tsx`
  - Checks session and DCG association.
  - If denied, redirects to `/dcg-auth`.

4. Shared protected route checks
- `src/components/auth/ProtectedRoute.tsx`
  - Redirects when no user, missing required role, or missing allowed role.
- `src/components/auth/MultiRoleProtectedRoute.tsx`
  - Redirects when no user or insufficient roles/portal access.
- `src/components/auth/MemberProtectedRoute.tsx`
  - Redirects to member login when missing user/member/regional role.
- `src/components/auth/DcgProtectedRoute.tsx`
  - Redirects if no user and blocks if no DCG role/association.

5. Permission gates and role-derived portal filtering
- `src/components/auth/PermissionGate.tsx`
  - Uses `useHasPermission()` and role checks to hide children.
- `src/hooks/useUserPermissions.ts`
  - `useHasPermission()` calls `has_regional_permission` RPC.
- `src/components/auth/PortalSelector.tsx`
  - Filters available portal cards through `canAccessPortal()`.
- `src/contexts/AuthContext.tsx`
  - Fetches `user_roles` and `regional_user_roles` and exposes role-based helpers used by guards/components.

Implementation plan

1. Make all route guards pass-through renderers
- Convert these components so they always render `children` and never perform role/session redirects:
  - `RegionalSessionRoute.tsx`
  - `SuperAdminSessionRoute.tsx`
  - `DcgSessionRoute.tsx`
  - `ProtectedRoute.tsx`
  - `MultiRoleProtectedRoute.tsx`
  - `MemberProtectedRoute.tsx`
  - `DcgProtectedRoute.tsx`
- Remove `Navigate` usage from these guards.
- Remove loader states that depend on auth/role checks.

2. Make regional context non-blocking
- Update `RegionalSessionContext.tsx` so missing session/profile/region never becomes a blocking `unauthorized`/`error` portal state.
- Keep optional best-effort session/profile/region loading for data scoping, but default to a non-blocking `authorized/ready` state so UI can mount.
- Keep `signOut()` only for explicit user logout clicks.

3. Remove post-login access checks that sign users out
- `RegionalAuth.tsx`: keep password authentication and navigate to `/admin/regional/dashboard`; remove profile/region pre-check as a blocking concern.
- `SuperAuth.tsx`: remove the `user_roles.super_admin` query and the access-denied sign-out. Successful password login navigates to super dashboard.
- `DcgAuth.tsx`: remove DCG association checks and access-denied sign-out. Successful password login navigates to DCG dashboard.

4. Disable permission gates from hiding UI
- Update `PermissionGate.tsx` to always render `children`.
- Update `useHasPermission()` to return `true` without calling the `has_regional_permission` RPC, so permission checks cannot blank/hide sections or trigger role-query races.

5. Stop portal selector from filtering by roles
- Update `PortalSelector.tsx` so it shows all portal cards, not only `canAccessPortal()` results.
- Avoid “No portals available” states based on role data.

6. Neutralize role helper behavior in global auth context
- Keep `AuthContext` available for user/profile/member/region data that pages rely on.
- Remove or stop relying on `user_roles` / `regional_user_roles` fetches for portal access.
- Make helpers non-blocking:
  - `hasRole()` returns `true` for UI gating compatibility.
  - `hasAnyRole()` returns `true`.
  - `canAccessPortal()` returns `true`.
  - `hasRegionalPermission()` returns `true`.
  - `hasRegionalPortalAccess` returns `true`.
- This prevents older components from continuing to enforce role gates indirectly.

7. Keep database security untouched
- I will not remove Supabase RLS policies or server/database functions like `has_role()` / `has_regional_permission()` in this pass.
- Reason: frontend checks are the source of the blank/logout loop, while RLS is the backend safety layer. Removing backend policies would expose or mutate protected data globally and may break many assumptions.

Expected result
- No portal route should redirect to a login page because of a missing/slow session, missing role, missing region, or missing DCG association.
- No portal login page should sign the user out after a successful password login because of role/access checks.
- Regional portal pages should mount even if session-derived profile/region data is still unavailable; individual data hooks may show empty/loading/error states based on RLS, but the whole app should not blank and eject the user.
- All role access checks in the frontend portal gating path will be removed or neutralized.