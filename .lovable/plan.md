

## Problem

In the regional portal "Assign Access" dialog, the **Regional Admin** role is missing from the dropdown — only Finance, Children Ministry, and Integration appear. So a regional admin cannot delegate full admin access to another member.

## Root cause

In `src/components/admin/regional/roles/AssignRoleDialog.tsx`, the role list is built with:

```text
availableRoles = roles.filter(role =>
  role.is_active
  && role.name !== 'Regional Admin'   // ← always hides it
  && !alreadyAssigned
)
```

The hardcoded exclusion was added under the assumption that "Regional Admin" is a region-owner-only role and shouldn't be re-assignable. But that's the exact role the user now wants to delegate, so the filter is the bug. The same constant (`RESERVED_ROLE_NAME = 'Regional Admin'`) is also used in `UsersWithAccessTable.tsx` to hide it from the *filter* dropdown — that one is fine and we'll leave it.

The downstream flow is already safe for this: `useAssignUserRole` is called with `requiresApproval: true`, which writes a row to `user_roles` with `role='regional_admin'`, `status='pending'`, `is_active=false`, and `requested_regional_role_id = <Regional Admin granular role id>`. Super Admin then approves it from the Pending Approvals tab — no privilege escalation risk.

DB confirms WCA Douala has the active "Regional Admin" granular role (`50b48078-…`); it's just being filtered out client-side.

## Fix

Single-file change in `src/components/admin/regional/roles/AssignRoleDialog.tsx`:

- Remove the `role.name !== 'Regional Admin'` filter so the role appears in the dropdown.
- Keep the "already assigned" filter (don't show roles the user already holds).
- Keep the `is_active` filter.

No DB changes, no schema migration, no changes to the assignment flow itself, no changes to the Users-with-Access table filter.

## Verification

1. As regional admin, open Access Management → Assign Access.
2. Pick a member who doesn't currently hold the Regional Admin role.
3. The role dropdown now lists **Regional Admin** alongside Finance, Children Ministry, Integration.
4. Selecting it and submitting shows the existing toast: "Role request submitted… for Super Admin approval."
5. The request appears in Super Admin → User Management → Pending Approvals.
6. After approval, the assigned member gets full regional portal access on next login.

