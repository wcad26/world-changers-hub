
## Plan: Rebuild Access Management + Enforce Permissions Across the Regional Portal

### Problems found

1. **Sidebar shows every page to every user.** `App.tsx` mounts the static `RegionalAdminLayout` (hardcoded menu). The permission-aware `EnhancedRegionalAdminLayout` exists but is never used — so a Children Ministry user still sees Finances, Settings, etc.
2. **No per-route guards.** A user can type `/admin/regional/finances` and load it even without `finances_view`. Permissions must be enforced at the route level too, not just the menu.
3. **Permission catalog is out of sync with current pages:**
   - Discipleship Management → no key, currently piggybacks on `members_view`
   - Certificate Management → no key, currently piggybacks on `members_view`
   - Reports & Analytics → exists as a route but isn't even in the sidebar
   - Fundraising → route exists but isn't in the sidebar
   - "Regional Website Info" + "Settings" share one key (`settings_view`)
   - "Access Management" itself isn't gated
4. **Access Management page UI is weak:**
   - KPIs are generic ("Total Roles", "Active Users: --", "Custom Roles") and one is a placeholder
   - User table has no avatar, no "assigned on" date, no per-role remove button, no role description hint
   - "Regional Admin" role appears 4× in dropdowns (one per region) and shouldn't be assignable here
5. **No visibility into what "no role" users can't do** — admins need a clearer mental model.

### What we'll build

#### 1. New permission catalog (single source of truth)
Create `src/config/regionalPermissions.ts` with one entry per actual portal page:

```ts
{ key: 'dashboard_view',     label: 'Dashboard',                 group: 'Overview',  route: '/admin/regional/dashboard' }
{ key: 'members_view/...',   label: 'Member Management',         group: 'People' }
{ key: 'discipleship_view',  label: 'Discipleship Management',   group: 'People' }   // NEW
{ key: 'events_view/...',    label: 'Event Management',          group: 'Programs' }
{ key: 'dcg_view/...',       label: 'DCG Management',            group: 'Programs' }
{ key: 'certificates_view',  label: 'Certificate Management',    group: 'Programs' } // NEW
{ key: 'finances_view/...',  label: 'Finance Management',        group: 'Money' }
{ key: 'fundraising_view/...', label: 'Fundraising',             group: 'Money' }
{ key: 'communication_view/...', label: 'Communication',         group: 'Outreach' }
{ key: 'locations_view/...', label: 'Locations',                 group: 'Outreach' }
{ key: 'website_info_view/edit', label: 'Regional Website Info', group: 'Admin' }    // split from settings
{ key: 'settings_view/edit', label: 'Settings',                  group: 'Admin' }
{ key: 'access_management',  label: 'Access Management',         group: 'Admin' }    // NEW — gates this page itself
```

Used by Create/Edit Role dialogs, by the menu filter, by route guards, and by KPI counts. (We'll also seed/backfill the new keys for existing roles via a migration.)

#### 2. Switch the regional portal to the permission-aware layout
- `App.tsx`: replace `RegionalAdminLayout` with `EnhancedRegionalAdminLayout` for `/admin/regional`.
- Update the menu config to include Reports, Fundraising, and to use the new permission keys.

#### 3. Add per-route permission guards
Create `<RegionalPermissionRoute permission="..."/>` wrapping each child route. Users without the permission get redirected to their first allowed page (or `/unauthorized`).
- `super_admin` and base `regional_admin` always pass.
- This makes pages truly invisible (and unreachable by URL) to users who don't have access.

#### 4. Rebuild the Access Management page

**KPI cards (4, real data):**
- Total Custom Roles (excludes the auto-created "Regional Admin")
- Users With Access (distinct users in `regional_user_roles` for this region)
- Pending Role Requests (count from `user_roles` where `status='pending'` and `requested_regional_role_id` is set)
- Most-Used Role (top role by assignment count, with count)

**Access Management body — two clean tabs:**

**Tab A — Users With Access (default)**
- Search + role filter + "Assign Access" button
- Columns: Member (avatar + Last First) · Email · Assigned Role(s) (badges with hover description) · Last Updated · Actions (Change Role, Revoke Access)
- Empty state explaining how to grant access
- Hide the base "Regional Admin" role from the assignable dropdown (it's region-owner only)

**Tab B — Manage Roles**
- Card grid (not just a table) per role: name, description, permission count, "Used by N users", actions (View, Edit, Deactivate, Delete)
- Filter the duplicate "Regional Admin" entries (one per region) out of UI listings — only show one read-only "Regional Admin (default)" card

**Create/Edit Role dialogs**
- Use the new grouped permission catalog (Overview / People / Programs / Money / Outreach / Admin)
- Each permission row shows label + short hint about which page/action it unlocks
- "Select all in group" + "Select all" helpers

#### 5. Gate the Access Management page itself
Wrap `/admin/regional/user-roles` with `permission="access_management"`. Only super admins, base regional admins, and users explicitly granted that permission can open it.

### Files to create / modify

**Create:**
- `src/config/regionalPermissions.ts` — permission catalog + groups
- `src/components/auth/RegionalPermissionRoute.tsx` — per-route guard
- `src/components/admin/regional/roles/AccessKpiCards.tsx` — real KPI cards
- `src/components/admin/regional/roles/UsersWithAccessTable.tsx` — redesigned table
- `src/components/admin/regional/roles/RoleManagementGrid.tsx` — card grid for roles

**Modify:**
- `src/App.tsx` — use `EnhancedRegionalAdminLayout`; wrap each child route with `RegionalPermissionRoute`
- `src/components/admin/EnhancedRegionalAdminLayout.tsx` — add Reports + Fundraising; use new keys
- `src/pages/admin/regional/UserRoles.tsx` — new KPIs + new tabs
- `src/components/admin/regional/roles/CreateRoleDialog.tsx` + `EditRoleDialog.tsx` + `RoleDetailsDialog.tsx` — use new catalog
- `src/components/admin/regional/roles/UserRoleAssignmentTab.tsx` — replaced by `UsersWithAccessTable`
- `src/components/admin/regional/roles/RoleManagementTab.tsx` — replaced by `RoleManagementGrid`

**Migration:**
- Add new permission keys (`discipleship_view`, `certificates_view`, `website_info_view`, `website_info_edit`, `access_management`) to the existing `Regional Admin`, `Administrator`, and `President` roles so current full-access users keep working.

### QA checklist after build
- A user with only "Children Ministry" role logs in: sidebar shows only Members/Events/DCG/Dashboard; typing `/admin/regional/finances` redirects away.
- A user with no regional role can't see Access Management, can't reach it by URL.
- KPI cards reflect real counts (no `--`).
- Assigning a role updates the table immediately and shows "Last Updated".
- Revoking access removes the user from the list.
- The duplicate "Regional Admin" entries don't pollute the role dropdowns.
