## Plan: simplify all portals to Supabase-auth-only access

### Goal
Make every portal page accessible to any signed-in Supabase user, with no client-side role, permission, region, DCG, or member-gating checks that can refresh, blank, redirect, or log users out.

### What I found
- The main route guards are already partly disabled, but `DcgSessionRoute` still blocks access when `userDcg` is missing.
- `AuthProvider` still fetches `user_roles`, `regional_user_roles`, profile, member, region, and DCG context during auth initialization. Those extra queries can delay or destabilize portal loading even though role checks are meant to be disabled.
- `RegionalAuth` still performs region/profile lookup before allowing dashboard navigation.
- The browser logs show repeated visits to `/auth/admin`, but the app has no `/auth/admin` route, causing repeated 404s. This should be aliased to the regional login page.
- Several shared components/hooks still contain role/permission concepts even when they currently return pass-through values.

### Implementation steps

1. **Create one simple auth model for portals**
   - Keep using Supabase `signInWithPassword`, `getSession`, and `onAuthStateChange`.
   - Treat `session.user` as the only requirement for protected portal access.
   - Remove role-based auth state from runtime loading paths: no `user_roles`, no `regional_user_roles`, no role resolution during login/page mount.
   - Keep optional profile/member/region/DCG context as non-blocking data only where screens need labels or filters, never as access criteria.

2. **Stop login-page refresh/redirect loops**
   - Ensure all login pages are mounted without auth providers or redirect effects.
   - Update Regional, DCG, Super Admin, and Member login pages to only:
     1. submit credentials to Supabase,
     2. show Supabase auth errors,
     3. navigate to that portal dashboard on success.
   - Remove regional pre-login region checks from `RegionalAuth`.
   - Add `/auth/admin` as a compatibility redirect to `/auth/regional` so old links/bookmarks do not hit 404.

3. **Convert every portal route guard to “signed-in only”**
   - `DcgSessionRoute`: wait for auth session, redirect only if no Supabase user; do not require `userDcg`.
   - `RegionalSessionRoute`: keep pass-through/error-boundary behavior, but no region authorization.
   - `SuperAdminSessionRoute`, `MemberProtectedRoute`, `ProtectedRoute`, `MultiRoleProtectedRoute`, `DcgProtectedRoute`: keep pass-through or signed-in-only behavior; remove role props from logic.
   - Portal pages should never call sign-out automatically because a role, region, member record, or DCG record is missing.

4. **Remove role/permission UI gates**
   - Keep `PermissionGate` and `PermissionButton` as compatibility wrappers that always render children.
   - Update `useAuth` fallback values so role helpers return permissive values consistently if older components still call them.
   - Update `PortalSelector` copy/logic so it lists all portals for any signed-in user and no longer says selection is based on role.

5. **Simplify logout behavior**
   - Logout remains explicit only when the user clicks Sign Out/Logout.
   - Use local Supabase sign-out plus navigation to the portal’s login page.
   - Remove any automatic sign-out tied to failed role/context lookup.

6. **Preserve portal data behavior without access checks**
   - Pages that need region/DCG/member context should render safely if that context is missing.
   - Data hooks should remain enabled only when their required data filter exists, but absence of that filter should show an empty/loading-friendly state instead of redirecting or blanking.
   - No database migration is planned unless you also want Supabase RLS changed to allow every authenticated user to read/write all portal data. This plan removes app/page role checks, not backend data policies.

### Files likely to change
- `src/App.tsx`
- `src/contexts/AuthProvider.tsx`
- `src/contexts/AuthContext.ts`
- `src/contexts/RegionalSessionContext.tsx`
- `src/hooks/useAuth.ts`
- `src/pages/RegionalAuth.tsx`
- `src/pages/DcgAuth.tsx`
- `src/pages/SuperAuth.tsx`
- `src/pages/MemberAuth.tsx`
- `src/components/auth/DcgSessionRoute.tsx`
- `src/components/auth/*ProtectedRoute.tsx`
- `src/components/auth/*SessionRoute.tsx`
- `src/components/auth/PermissionGate.tsx`
- `src/components/auth/PortalSelector.tsx`
- `src/components/admin/*Layout.tsx` where logout or role-dependent display remains

### Validation
- Open each login page and confirm typing is stable with no refresh:
  - `/auth/regional`
  - `/auth/admin`
  - `/dcg-auth`
  - `/auth/super`
  - `/auth/member`
- Confirm successful Supabase login lands on the correct dashboard.
- Confirm no portal page redirects/logs out because a user lacks a role, region, DCG assignment, or member record.
- Search the codebase after changes for remaining active role checks and automatic sign-out paths.