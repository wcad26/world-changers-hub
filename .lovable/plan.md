
# Access Management — Regional + Super Admin (with Super Admin role tiers)

Goal: reinstate **Access Management** in the Regional portal (inside Settings) and rebuild the Super Admin **User Management** into a comprehensive Access hub inside Super Admin Settings — including a brand-new **Super Admin role catalog** so the principal Super Admin can limit what other super admins can see and do.

The plumbing already exists for the regional side (`regional_roles`, `regional_user_roles`, `user_roles` with `requested_regional_role_id` + `status`, `useAssignUserRole`, `PendingApprovalsList`). For the super admin side we will add a mirrored, simpler structure.

---

## 1. Regional Portal — Settings → "Access" tab

Add a new **Access** tab to `src/pages/admin/regional/Settings.tsx`, between *Branch Details* and *DCG Management*.

```text
[ Access KPI Cards: Roles, Users with Access, Pending Approvals, Last change ]

[ GlassSection: Access Management ]
   Tabs:
     - Users with Access   (table of users + their assigned roles + actions)
     - Roles & Permissions (role cards grid)
     - My Requests        (NEW — this admin's pending/approved/rejected requests)
   Header action: [ + Create Role ] / [ + Assign Access ] (context-aware per inner tab)
```

Reuses (re-skinned with `GlassSection`):
- `AccessKpiCards`
- `UsersWithAccessTable` + `AssignRoleDialog`
- `RoleManagementGrid` + `CreateRoleDialog` / `EditRoleDialog` / `RoleDetailsDialog`

Behavior reinstated:
- Create / edit / deactivate / hard-delete custom roles (reserved `Regional Admin` role stays read-only for regional admins).
- Assign one or more roles to a member; **every assignment goes to Super Admin for approval** (existing `useAssignUserRole({ requiresApproval: true })`).
- Edit a user's role set = revoke + re-assign (re-assignment goes through approval).
- Revoke (single or all roles) is immediate; no approval needed.
- **My Requests** lists requests submitted by the current admin with status badges and a "Cancel" button while pending.

Cleanup:
- Drop the standalone item from `EnhancedRegionalAdminLayout` sidebar; keep `/admin/regional/user-roles` as a redirect to `/admin/regional/settings?tab=access`.

---

## 2. Super Admin Portal — Settings → "Access" tab

Move and rebuild User Management.

`src/components/admin/SuperAdminLayout.tsx`: remove the "User Management" sidebar item.
`src/App.tsx`: keep `/admin/super/user-management` as a redirect to `/admin/super/settings?tab=access`.

New **Access** tab in `SuperSettings` (placed right after General):

```text
[ Global Access KPI Cards ]
  - Active super admins      (with role breakdown)
  - Active regional admins   (across all regions)
  - Pending approvals        (animated badge when > 0)
  - Regions without an admin (alert)

[ GlassSection: Global Access Management ]
   Tabs:
     1. Pending Approvals     (default when count > 0)
     2. Super Admins          (NEW — manage super-admin users & roles)
     3. Super Admin Roles     (NEW — create/edit super-admin role catalog)
     4. Regional Users        (all regional admins, all regions)
     5. Regional Roles        (browse/edit any region's role catalog)
     6. Create Regional Admin
     7. Activity Log
```

### 2.1 Pending Approvals
Modernized rewrite of `PendingApprovalsList`:
- Filters: region, requested role, submitter, date range.
- Row info: requester, region, requested regional role, submitter, age.
- Actions: **Approve**, **Reject (with reason)**, **View role permissions**.
- Bulk select + bulk approve / reject.
- Approve updates `user_roles.status='active'` and inserts `regional_user_roles` (existing logic), plus stamps `decided_by`/`decided_at`.

### 2.2 Super Admins (NEW)
Table of every user holding `user_roles.role='super_admin'`:
- Columns: User, Email, Super Admin Role (chip), Assigned by, Assigned at, Last login, Actions.
- Actions: **Change role**, **Revoke super admin**, **Promote member to super admin** (top-right button opens a member-picker + role-picker dialog).
- Only the **Principal Super Admin** (see §3) can promote, revoke, or change the Principal flag.

### 2.3 Super Admin Roles (NEW)
Mirror of the regional role catalog, but with a global permission set:
- Card grid of `super_admin_roles` (Principal Super Admin role is reserved + read-only — full access).
- Create / Edit / Deactivate / Hard-delete custom super-admin roles.
- Each role holds a `permissions jsonb` array keyed against a new `SUPER_PERMISSION_CATALOG` (see §4).
- "Used by N super admins" usage count per card.

### 2.4 Regional Users (all regions)
Single global table joining `regional_user_roles` + `profiles` + `regions`:
- Columns: User, Email, Region, Roles (chips), Assigned by, Last updated, Actions.
- Filters: region, role, search.
- Row actions: **Edit roles**, **Revoke role**, **Revoke all access**, **View profile**.
- "Edit roles" reuses `AssignRoleDialog` with `requiresApproval=false` (super admin bypasses approval) and a `regionIdOverride` prop.

### 2.5 Regional Roles
- Region selector (defaults to first).
- Reuses `RoleManagementGrid` / `CreateRoleDialog` / `EditRoleDialog` with `regionIdOverride`.
- Super admin can edit the reserved `Regional Admin` role's permissions too.

### 2.6 Create Regional Admin
Existing `CreateRegionalAdminForm` dropped into a `GlassSection`.

### 2.7 Activity Log
Read-only feed (last 50) of role assignments, revocations, approvals, rejections — derived from `user_roles` + `regional_user_roles` timestamps. No new audit table for v1.

---

## 3. Super Admin role model

DB additions (schema migration):

```sql
-- Catalog of super-admin roles (global, no region scope)
CREATE TABLE public.super_admin_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_reserved boolean NOT NULL DEFAULT false,  -- the Principal role
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Which super-admin users hold which super-admin role
CREATE TABLE public.super_admin_user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  super_admin_role_id uuid NOT NULL REFERENCES public.super_admin_roles(id) ON DELETE RESTRICT,
  assigned_by uuid,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE (user_id, super_admin_role_id)
);

-- Mark the first existing super admin as Principal and seed the reserved role.
-- A separate idempotent INSERT handles seeding "Principal Super Admin" with all permissions.
```

GRANTs (authenticated + service_role), RLS:
- `super_admin_roles`: SELECT for any super admin; INSERT/UPDATE/DELETE only when caller has the `manage_super_admin_roles` permission (checked via security-definer helper `public.has_super_permission(_user_id, _perm text)`).
- `super_admin_user_roles`: SELECT for any super admin; INSERT/UPDATE/DELETE only for callers with `manage_super_admin_users` (the Principal role, by default).
- Reserved role row can never be deleted or edited (trigger).

Helper SQL functions:
- `public.has_super_permission(_user_id uuid, _perm text) returns boolean security definer`
- `public.is_principal_super_admin(_user_id uuid) returns boolean security definer`

The existing `has_role(_user_id, 'super_admin')` keeps gating super-admin login; super admin permissions are then layered on top via `has_super_permission`.

---

## 4. Super admin permission catalog

New file `src/config/superAdminPermissions.ts` mirroring `regionalPermissions.ts`. Each entry maps to one super-admin page or capability.

```ts
export const SUPER_PERMISSION_CATALOG = [
  // Overview
  { key: 'super_dashboard_view',    group: 'Overview', label: 'View Dashboard' },

  // People & Access
  { key: 'super_members_view',      group: 'People',   label: 'View Global Members' },
  { key: 'super_members_edit',      group: 'People',   label: 'Edit / Delete Members' },
  { key: 'manage_regional_users',   group: 'Access',   label: 'Manage Regional Users & Roles' },
  { key: 'approve_role_requests',   group: 'Access',   label: 'Approve Role Requests' },
  { key: 'manage_super_admin_users',group: 'Access',   label: 'Manage Super Admin Users' },   // Principal only by default
  { key: 'manage_super_admin_roles',group: 'Access',   label: 'Manage Super Admin Roles' },   // Principal only by default

  // Programs
  { key: 'super_events_view',       group: 'Programs', label: 'View Events' },
  { key: 'super_events_manage',     group: 'Programs', label: 'Manage Global Events' },
  { key: 'super_certificates_view', group: 'Programs', label: 'View Certificates' },
  { key: 'super_certificates_manage', group: 'Programs', label: 'Manage Certificates' },

  // Money
  { key: 'super_finances_view',     group: 'Money',    label: 'View Finances' },
  { key: 'super_finances_manage',   group: 'Money',    label: 'Manage Finances' },
  { key: 'super_reports_view',      group: 'Money',    label: 'View Reports' },

  // Outreach
  { key: 'super_communication_view',group: 'Outreach', label: 'View Communications' },
  { key: 'super_communication_send',group: 'Outreach', label: 'Send Communications' },

  // Admin
  { key: 'super_regions_view',      group: 'Admin',    label: 'View Regions' },
  { key: 'super_regions_manage',    group: 'Admin',    label: 'Create / Edit Regions' },
  { key: 'super_locations_manage',  group: 'Admin',    label: 'Manage Locations' },
  { key: 'super_homepage_manage',   group: 'Admin',    label: 'Edit Homepage / About' },
  { key: 'super_settings_view',     group: 'Admin',    label: 'View Settings' },
  { key: 'super_settings_edit',     group: 'Admin',    label: 'Edit System Settings' },
] as const;

export const SUPER_PAGES = [
  { permission: 'super_dashboard_view',     path: '/admin/super/dashboard',     title: 'Dashboard' },
  { permission: 'super_members_view',       path: '/admin/super/members',       title: 'Members' },
  { permission: 'super_events_view',        path: '/admin/super/events',        title: 'Events' },
  { permission: 'super_locations_manage',   path: '/admin/super/locations',     title: 'Locations' },
  { permission: 'super_finances_view',      path: '/admin/super/finances',      title: 'Finances' },
  { permission: 'super_regions_view',       path: '/admin/super/regions',       title: 'Regions' },
  { permission: 'super_reports_view',       path: '/admin/super/reports',       title: 'Reports' },
  { permission: 'super_communication_view', path: '/admin/super/communication', title: 'Communication' },
  { permission: 'super_homepage_manage',    path: '/admin/super/homepage-settings', title: 'Homepage Settings' },
  { permission: 'super_certificates_view',  path: '/admin/super/certificates',  title: 'Certificates' },
  { permission: 'super_homepage_manage',    path: '/admin/super/about-settings', title: 'About Us' },
  { permission: 'super_settings_view',      path: '/admin/super/settings',      title: 'Settings' },
];
```

Seeded built-in super-admin roles:
- **Principal Super Admin** — `is_reserved=true`, every permission. Cannot be edited or removed; cannot be revoked from the original principal.
- **Operations Admin** — everything except `manage_super_admin_users`, `manage_super_admin_roles`, destructive region/finance edits.
- **Finance Admin** — finances/reports + read-only elsewhere.
- **Content Admin** — homepage, about, certificates, communications.
- **Read-Only Auditor** — only `*_view` permissions.

Principals may edit or delete any non-reserved seeded role.

---

## 5. Enforcement in the Super Admin portal

- New hook `useSuperAdminPermissions()` loads the caller's effective permission set (union of all active super-admin roles via `super_admin_user_roles`, or all permissions when Principal).
- New route guard `<SuperPermissionRoute permission="...">` wrapping each `/admin/super/*` route in `App.tsx`. On missing permission → redirect to `/admin/super/dashboard` and toast "You don't have access to that page."
- `SuperAdminLayout` sidebar items filtered by `useSuperAdminPermissions().has(permission)` so each admin only sees pages they can open.
- Buttons/menu items for destructive or scoped actions use a small `<SuperPermissionGate>` (mirrors regional `PermissionGate`).

Approval workflow stays unchanged for regional requests: any super admin with `approve_role_requests` can act on them.

---

## 6. Approval flow (unchanged, with audit columns)

```text
Regional admin assigns role
  └─► useAssignUserRole({ requiresApproval: true })
        └─► UPSERT user_roles {role:'regional_admin', status:'pending',
                               requested_regional_role_id, is_active:false}

Super admin (with `approve_role_requests`) opens Access → Pending Approvals
  ├─► Approve  → user_roles.status='active', is_active=true,
  │              decided_by=auth.uid(), decided_at=now()
  │              + INSERT regional_user_roles(user_id, region_id, regional_role_id)
  └─► Reject   → user_roles.status='rejected', is_active=false,
                  rejection_reason, decided_by, decided_at
```

Migration adds to `user_roles`: `rejection_reason text`, `decided_by uuid`, `decided_at timestamptz`.

---

## 7. Files to touch

New:
- `src/config/superAdminPermissions.ts`
- `src/hooks/useSuperAdminRoles.ts`         (CRUD + list)
- `src/hooks/useSuperAdminUsers.ts`         (list + assign / revoke / change)
- `src/hooks/useSuperAdminPermissions.ts`   (effective permission set for current user)
- `src/components/auth/SuperPermissionRoute.tsx`
- `src/components/auth/SuperPermissionGate.tsx`
- `src/components/admin/regional/access/AccessTab.tsx`
- `src/components/admin/regional/access/MyRequestsList.tsx`
- `src/components/admin/super/access/AccessTab.tsx`
- `src/components/admin/super/access/GlobalAccessKpiCards.tsx`
- `src/components/admin/super/access/PendingApprovalsTable.tsx`
- `src/components/admin/super/access/SuperAdminsTable.tsx`
- `src/components/admin/super/access/PromoteSuperAdminDialog.tsx`
- `src/components/admin/super/access/SuperAdminRolesGrid.tsx`
- `src/components/admin/super/access/CreateSuperAdminRoleDialog.tsx`
- `src/components/admin/super/access/EditSuperAdminRoleDialog.tsx`
- `src/components/admin/super/access/RegionalUsersTable.tsx`
- `src/components/admin/super/access/RegionalRolesPanel.tsx`
- `src/components/admin/super/access/AccessActivityFeed.tsx`

Edited:
- `src/pages/admin/regional/Settings.tsx`              (add Access tab)
- `src/pages/admin/super/Settings.tsx`                 (add Access tab)
- `src/components/admin/SuperAdminLayout.tsx`          (remove User Management; filter items by permission)
- `src/components/admin/EnhancedRegionalAdminLayout.tsx` (drop standalone Access link)
- `src/App.tsx`                                        (redirects + `<SuperPermissionRoute>` wrappers)
- `src/components/admin/regional/roles/CreateRoleDialog.tsx`,
  `EditRoleDialog.tsx`, `AssignRoleDialog.tsx`         (accept `regionIdOverride`, `bypassApproval`)
- `src/hooks/useRegionalRoles.ts`                      (accept explicit regionId in mutations)

Migrations:
1. `user_roles`: add `rejection_reason`, `decided_by`, `decided_at`.
2. Create `super_admin_roles` + `super_admin_user_roles` with GRANTs, RLS, reserved-row trigger.
3. Helper functions `has_super_permission`, `is_principal_super_admin`.
4. Seed reserved + built-in super-admin roles; mark the earliest active super admin as Principal.

---

## 8. Out of scope (callouts)
- Email / in-app notifications on approve / reject (follow-up).
- Dedicated immutable audit log table — current "Activity Log" reads existing timestamps; we can add `access_audit_log` later if you want tamper-proof history.
