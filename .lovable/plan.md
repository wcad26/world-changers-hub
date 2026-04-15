

## Plan: Rename Menu Items, Add Discipleship Management Page, Rebuild Access Management

### 1. Rename sidebar menu items in `EnhancedRegionalAdminLayout.tsx`

| Current | New |
|---------|-----|
| Members | Member Management |
| Events | Event Management |
| Certificates | Certificate Management |
| User Roles | Access Management |

- Change the "User Roles" icon from `Shield` to `KeyRound` (better reflects access management)
- Add new menu item **"Discipleship Management"** after "Member Management" with `Heart` icon, path `/admin/regional/discipleship`, permission `members_view`

### 2. Update route title map in `AdminLayout.tsx`

- `/admin/regional/user-roles` → `'Access Management'`
- Add `/admin/regional/discipleship` → `'Discipleship Management'`

### 3. Update `UserRoles.tsx` page content

- Change all references from "User Roles" / "Role Management" to "Access Management" where appropriate (section titles, descriptions)
- Update icon usage from `Shield` to `KeyRound` where it represents the page identity

### 4. Create new page `src/pages/admin/regional/Discipleship.tsx`

A standalone page with:
- **KPI Cards** (4 cards, glassmorphism style):
  - Total Relationships (count all)
  - Active (count active, with growth % from last 30 days)
  - Completed (count completed)
  - Success Rate (% of relationships where disciple reached `became_member` milestone)
- **Main content section** — the discipleship table currently in Members.tsx (search, status filter, assign button, relationships table, manage dialog), rebuilt with glassmorphism styling matching other pages
- Uses `useDiscipleshipRelationships` hook and existing `AssignDiscipleDialog` / `ManageDiscipleshipDialog`

### 5. Remove discipleship from `Members.tsx`

- Remove the `Tabs` wrapper — render member directory content directly (no tabs needed anymore)
- Remove all discipleship-related state, imports, and the discipleship `TabsContent`
- Keep everything else (KPI cards, member table, register/edit dialogs, delete dialog)

### 6. Add route in `App.tsx`

- Import the new `RegionalDiscipleship` page
- Add route: `<Route path="discipleship" element={<RegionalDiscipleship />} />`

### Files Modified
- `src/components/admin/EnhancedRegionalAdminLayout.tsx` — rename items, add discipleship, change icon
- `src/components/admin/AdminLayout.tsx` — update route title map
- `src/pages/admin/regional/UserRoles.tsx` — update page content to "Access Management"
- `src/pages/admin/regional/Members.tsx` — remove discipleship tab and tabs wrapper
- `src/pages/admin/regional/Discipleship.tsx` — **new file**, standalone discipleship page with KPIs
- `src/App.tsx` — add discipleship route

