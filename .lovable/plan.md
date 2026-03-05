## Fix Role Assignment RLS and Clarify Super Admin Approval Flow

### Problem

The error "new row violates row-level security policy for table user_roles" occurs because there is no RLS policy allowing regional admins to INSERT pending role requests into the `user_roles` table. The only INSERT policy for regional admins is restricted to `role = 'dcg_leader'`.

### Root Cause

In `useAssignUserRole`, when `requiresApproval: true`, the code either:

1. **Updates** an existing `user_roles` row to `status: 'pending'` -- no UPDATE policy for regional admins
2. **Inserts** a new `user_roles` row with `role: 'regional_admin', status: 'pending'` -- no INSERT policy for this case

### Fix: Add RLS Policy (Database Migration)

Add two policies to `user_roles`:

1. **INSERT policy** -- allow regional admins to create pending role requests in their region
2. **UPDATE policy** -- allow regional admins to update roles in their region to pending status

```sql
-- Allow regional admins to submit pending role assignment requests
CREATE POLICY "Regional admins can submit pending role requests in their region"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'regional_admin')
  AND role = 'regional_admin'
  AND region_id = get_user_region(auth.uid())
  AND status = 'pending'
  AND is_active = false
);

-- Allow regional admins to update existing roles to pending in their region
CREATE POLICY "Regional admins can update roles to pending in their region"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'regional_admin')
  AND region_id = get_user_region(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'regional_admin')
  AND region_id = get_user_region(auth.uid())
  AND status = 'pending'
  AND is_active = false
);
```

These policies are secure because they only allow creating/updating rows with `status = 'pending'` and `is_active = false`, preventing privilege escalation. Only Super Admins can set `status = 'active'`.

### How the Super Admin Approval Works

The approval flow is already implemented and functional:

1. **Regional Admin** assigns a role via the dialog -- creates a pending `user_roles` entry with the `requested_regional_role_id`
2. **Super Admin** goes to **User Management > Pending Approvals** tab in the Super Admin portal
3. The `PendingApprovalsList` component shows all pending requests with the user's name, email, region, and the specific regional role requested
4. Super Admin clicks **Approve** -- this updates `user_roles` to `status: active, is_active: true` and inserts a corresponding entry into `regional_user_roles`
5. Or clicks **Reject** -- sets `status: rejected, is_active: false`

No code changes needed in the Super Admin portal -- the approval UI and logic already exist and work correctly once the RLS fix allows the initial request to be created.

### Summary

- **1 database migration** to add INSERT and UPDATE RLS policies on `user_roles` for regional admins (restricted to pending/inactive only)
- **No application code changes** needed  
  
also ensure that regional admins can change roles and strip users off roles but it should still require super admin confirmation.