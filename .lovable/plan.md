

## Problem

Super admin Timah (`chimbotimah@gmail.com`) opens the DCG portal and lands on a blank "DCG Dashboard" with no DCG name in the sidebar header, 0 members / 0 events / 0 income. Two underlying bugs:

### Bug 1 — Super admins implicitly get DCG/regional portal access via role bypass

In `src/hooks/useAuth.tsx`, `canAccessPortal` says:
```text
case 'dcg':       super_admin OR regional_admin OR dcg_admin
case 'regional':  super_admin OR regional_admin
```
This is wrong by the user's stated policy: `super_admin` is only a token for the Super Admin portal. Access to Regional/DCG portals must come from explicit membership/role assignment. The same flaw exists in `DcgProtectedRoute` (`hasRole('super_admin')` allows entry) and `MultiRoleProtectedRoute` (super_admin treated as regional). The Portal Selector and Portal Switcher inherit the bug since they call `canAccessPortal`.

### Bug 2 — `userDcg` only resolves for `dcg_admin` role

`fetchUserData` only fills `userDcg` when the user holds the `dcg_admin` role. Timah is a `super_admin` + `regional_admin` who happens to also be a regular member of KOTTO DCG (via `dcg_members`) — but she has no `dcg_user_sessions` row, so `get_user_dcg` returns null. The Dashboard reads `userDcg?.id`, which stays `undefined`, so all queries return empty data and the title shows "DCG Portal" placeholder. This is the "vague DCG that does not exist" the user described.

## Fix (code only, no schema changes)

### 1. `src/hooks/useAuth.tsx` — tighten portal access

Drop `super_admin` from the DCG/regional access checks. New rules:
- `canAccessPortal('super')`  → `hasRole('super_admin')`
- `canAccessPortal('regional')` → `hasRole('regional_admin') || userRegionalRoles.length > 0`
- `canAccessPortal('dcg')` → `hasRole('dcg_admin') || isDcgMember` (see #2)
- `canAccessPortal('member')` → `hasRole('member') || memberRecord != null`

Update `hasRegionalPortalAccess` to drop the `super_admin` shortcut for the same reason.

Note: `hasRegionalPermission` retains its `super_admin` bypass — that exists so super admins can read regional data via shared API hooks/RLS, not as a portal entry grant.

### 2. `src/hooks/useAuth.tsx` — resolve `userDcg` for any kind of DCG association

Replace the `if (hasDcgRole)` gate with a broader resolver that runs for every authenticated user:

1. Try `dcg_user_sessions` (current behaviour, used for dedicated DCG leaders provisioned by a regional admin).
2. If none, look up `dcgs` where `leader_id` IN (the user's member IDs) → user is a DCG leader.
3. If none, look up `dcg_members` → user is a DCG member; pick the active row (one row expected per user; if multiple, prefer leader/co-leader role).
4. Set `userDcg` to that DCG row, or leave `null`.

Also expose a derived flag `isDcgMember = userDcg !== null` so route guards and the portal selector know whether the user has any DCG association.

### 3. `src/components/auth/DcgProtectedRoute.tsx` — gate on association, not on super_admin

Replace:
```text
if (!hasRole('dcg_admin') && !hasRole('regional_admin') && !hasRole('super_admin'))
  → /unauthorized
```
With:
```text
if (!hasRole('dcg_admin') && !userDcg) → render NoDcgAssociation screen (not /unauthorized)
```
The `NoDcgAssociation` screen is a friendly inline message: "You don't belong to a DCG yet. Ask your regional admin to add you to one." with two buttons: "Back to my portals" (→ `/portal-selector` if multi-portal, else dashboard for top role) and "Sign Out". This is the user-requested explicit message instead of a silent bounce.

Also drop `hasRole('regional_admin')` from the implicit grant — regional admins manage DCGs from within the Regional portal, they don't need DCG portal access unless they're also assigned to one.

### 4. `src/components/auth/MultiRoleProtectedRoute.tsx` — drop super_admin shortcut

Remove the implicit assumption that super_admins satisfy regional access. Regional routes will still work for any user with a `regional_user_roles` entry.

### 5. `src/components/layout/PortalSwitcher.tsx` and `src/components/auth/PortalSelector.tsx`

No code change needed — they already call `canAccessPortal`, so they automatically tighten with #1. Visual result: Timah will see Super Admin + Regional + DCG (because she's a KOTTO DCG member); a pure super_admin with no other association will see only Super Admin.

### 6. `src/pages/dcg/Dashboard.tsx` and `src/components/admin/DcgAdminLayout.tsx`

No structural change. Once `userDcg` is properly populated by #2, the existing `userDcg?.name` in the layout header and the existing `useDcgMembers(userDcg?.id)` etc. on the dashboard will show real KOTTO DCG data automatically.

## Why this matches the user's policy statement

> "super admin status means that they have access to the super admin portal, not that they have access to all portals except granted access to the regional and dcg portals."

After the fix:
- A pure `super_admin` with no DCG/regional assignments sees only the Super Admin portal in the switcher and selector. Typing `/dcg/dashboard` shows the friendly "You don't belong to a DCG" screen.
- Timah (super_admin + regional_admin + KOTTO DCG member) sees Super Admin + Regional + DCG portals, and the DCG portal correctly shows KOTTO DCG with its members, events, and finances.
- Existing DCG leaders provisioned via `dcg_user_sessions` continue to work unchanged.

## Files to edit

```text
src/hooks/useAuth.tsx                          (canAccessPortal, hasRegionalPortalAccess, fetchUserData DCG resolver, expose isDcgMember)
src/components/auth/DcgProtectedRoute.tsx      (replace role-bypass with association check + NoDcgAssociation screen)
src/components/auth/MultiRoleProtectedRoute.tsx (drop super_admin shortcut)
```

No DB migrations. No changes to RLS. No changes to the DCG dashboard or layout components themselves.

## Verification

1. As Timah, click DCG Portal in the switcher → lands on `/dcg/dashboard` with header "KOTTO DCG", actual member list, events, finances populated.
2. As a pure super admin (no DCG/regional links), the Portal Selector shows only "Super Admin Portal". Typing `/dcg/dashboard` shows a friendly "You don't belong to a DCG" screen with Back and Sign Out buttons (not `/unauthorized`).
3. Existing dedicated DCG leaders (with a `dcg_user_sessions` row) continue to land on their DCG without regression.
4. A regional admin who's not a DCG leader nor member can no longer auto-enter `/dcg/dashboard` — they see the same friendly "no DCG" screen.

