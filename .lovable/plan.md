

## Plan: Allow Users with Regional Roles to Access the Regional Portal

### Problem

The regional admin granted access to users via the Access Management page, which assigns **regional roles** (stored in `regional_user_roles` table with granular permissions like `dashboard_view`, `members_view`). However, the login page and route guard both require the user to have a `regional_admin` role in the `user_roles` table — a completely separate system. So users get "Access Denied" even though they have legitimate regional permissions.

For example, `tsiviola@gmail.com` has an "Integration" regional role with dashboard, members, DCG, and communication permissions, but only has `member` and `dcg_admin` in `user_roles` — no `regional_admin`, so login is blocked.

### Solution

Update the login gate and route guard to also accept users who have active regional role assignments, not just those with the `regional_admin` base role.

### Changes

**1. `src/components/auth/RegionSpecificAuth.tsx`** — Update `checkRegionalAdminRole`
- After checking for `regional_admin` in `user_roles`, also check for any active entry in `regional_user_roles` for that user + region
- If either check passes, allow login

**2. `src/hooks/useAuth.tsx`** — Add a new helper
- Add a `hasRegionalAccess()` method that returns true if the user has `regional_admin` OR has any active `regional_user_roles` entry
- This is already partially covered by `userRegionalRoles` state, which is fetched on login

**3. `src/components/auth/MultiRoleProtectedRoute.tsx`** — Update the route guard for regional admin routes
- For the regional portal specifically, also check if the user has active regional role assignments (not just `regional_admin` in `user_roles`)

**4. `src/App.tsx`** — Widen the allowed roles on the regional admin route
- The current guard uses `allowedRoles={['regional_admin', 'super_admin']}`. We need to incorporate users with regional roles. This could be done by passing a custom check or adding the regional role check inside the protected route.

### Technical approach

The cleanest fix:
- In `useAuth`, expose a computed boolean `hasRegionalPortalAccess` that checks: `hasRole('super_admin') || hasRole('regional_admin') || userRegionalRoles.length > 0`
- Update `RegionSpecificAuth.checkRegionalAdminRole` to also query `regional_user_roles` for the user+region
- Update `MultiRoleProtectedRoute` (or create a dedicated `RegionalProtectedRoute`) to use this combined check

### Files to modify
- `src/components/auth/RegionSpecificAuth.tsx`
- `src/hooks/useAuth.tsx`
- `src/App.tsx` (route guard adjustment)
- Possibly `src/components/auth/MultiRoleProtectedRoute.tsx`

