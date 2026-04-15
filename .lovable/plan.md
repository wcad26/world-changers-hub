
## Fix: Make Member Portal Available to All Authenticated Users

### Problem
The `getAvailablePortals()` function and both `PortalSelector`/`PortalSwitcher` components check for an explicit `member` role in the `user_roles` table. Users who only have `dcg_admin` or `regional_admin` roles don't have a `member` entry, so the Member Portal never appears for them.

### Solution
Update `getAvailablePortals()` in `useAuth.tsx` to always include the member portal for any authenticated user, matching the existing `canAccessPortal('member')` logic which already grants access to all role holders.

Update `PortalSelector.tsx` and both `PortalSwitcher.tsx` files to use `canAccessPortal()` instead of `hasRole()` for filtering available portals.

### Files Changed

| File | Change |
|------|--------|
| `src/hooks/useAuth.tsx` | Update `getAvailablePortals()` to always include `'member'` for any authenticated user |
| `src/components/auth/PortalSelector.tsx` | Use `canAccessPortal(portal.id)` instead of `hasRole(portal.requiredRole)` |
| `src/components/layout/PortalSwitcher.tsx` | Use `canAccessPortal(portal.id)` instead of `hasRole(portal.requiredRole)` |
| `src/components/admin/PortalSwitcher.tsx` | Use `canAccessPortal(portal.id)` instead of `hasRole(portal.requiredRole)` |

### Technical Detail
- `getAvailablePortals()` line 260-266: Always push `'member'` if user has any role at all
- PortalSelector/PortalSwitcher: Change filter from `hasRole(portal.requiredRole)` to `canAccessPortal(portal.id)` which already implements the cascading access logic (super_admin can access all, regional_admin can access regional+dcg+member, etc.)
