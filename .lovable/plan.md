

## Fix DCG Portal Events, Member Transfer, Role Registration, Super Admin Access, and UI Issues

### Issues and Solutions

---

### 1. DCG Portal Regional Events Not Showing All Events (RLS Issue)

**Root Cause**: The `events` table RLS only allows DCG admins to SELECT events where `dcg_id = get_user_dcg(auth.uid())`. Regional events have `dcg_id = NULL`, so they don't match. A user who is also a `regional_admin` can see them via the regional admin policy. The `Public can view public events` policy only shows events with `is_public = true`, so non-public regional events are invisible to pure DCG leaders.

**Fix**: Add an RLS SELECT policy on `events` allowing DCG admins to read events in their region (where `region_id` matches the DCG's region):

```sql
CREATE POLICY "DCG admins can view regional events"
ON public.events FOR SELECT
USING (
  has_role(auth.uid(), 'dcg_admin') 
  AND region_id = get_region_from_dcg(get_user_dcg(auth.uid()))
);
```

**Database migration required.**

---

### 2. Transferred Member Not Showing in New Region's Member List

**Root Cause**: The member `ngalimmarknmd@gmail.com` has `status = 'new'` after transfer. The members list page does not explicitly filter by status, but the `useMembers` hook returns them. Looking more carefully, the display likely filters or the member card hides `new` status members. The real fix: the transfer process should set `status = 'active'` on the member record.

**Fix in `useMemberTransfer.ts`**: Add `status: 'active'` to the member update:

```typescript
.update({
  region_id: params.toRegionId,
  member_id: newMemberCode,
  status: 'active',  // Ensure transferred members are active
  updated_at: new Date().toISOString(),
})
```

**Also fix existing data**: Migration to set the specific member's status to 'active'.

---

### 3. Regional Admin Registration Form -- Roles Not Showing

**Root Cause**: The `regional_roles` table only has RLS policies for `regional_admin` and `super_admin`. The registration form queries roles as an unauthenticated (anon) user or a freshly-signed-up user who has no roles yet. The query returns empty.

**Fix**: Add a public SELECT policy on `regional_roles` for active roles only:

```sql
CREATE POLICY "Public can view active regional roles"
ON public.regional_roles FOR SELECT
USING (is_active = true);
```

**Also**: Add a delete button to the `RoleManagementTab.tsx` that actually deletes (hard delete) roles, with a confirmation dialog. Currently `useDeleteRegionalRole` only soft-deletes (sets `is_active = false`). Add an option for hard delete when no users are assigned to the role.

---

### 4. Super Admin -- Regional President Selection from Members

**Current state**: Regional president is a free-text field in `CreateRegionDialog` and `EditRegionDialog`. 

**Change**: Replace the free-text `regional_president` field with a member selector that:
- Searches members of the selected region
- On selection, stores the member's name as `regional_president` and optionally grants them `regional_admin` role access

This is a significant feature change. For now, the practical fix:
- In `EditRegionDialog`, add a member search/select for the regional president field that queries members of that region
- When a president is selected, auto-create a `regional_admin` user_role entry for them (pending or active based on super admin action)

**Also**: Add a "Grant Super Admin Access" feature in the Super Admin User Management page. This already exists per the memory context (`super-admin-user-management-v5`). Verify it works.

---

### 5. Portal Switcher Mobile -- Show Full Portal Name

**Root Cause**: In `PortalSwitcher.tsx` line 79: `<span className="hidden sm:inline">`. The `hidden sm:inline` hides the text below 640px.

**Fix**: Remove the `hidden sm:inline` class so the portal name always shows:
```tsx
<span>{currentPortal?.title}</span>
```

---

### 6. DCG Events Page Slow Loading

**Root Cause**: The page waits for `authLoading` to resolve, then triggers two separate queries (`useDcgEvents` and `useRegionalEventsForDcg`). The `useRegionalEventsForDcg` depends on `userRegion?.id || userDcg?.region_id` which may resolve late.

**Fix**: Use `userDcg?.region_id` directly instead of waiting for `userRegion` to resolve. This avoids a cascading dependency. Also ensure queries are enabled as soon as `userDcg` is available, not waiting for `userRegion`.

---

### 7. Attendance Dialog -- Remove Cancel Button on Mobile, Fix Padding

**Fix in `EventAttendanceDialog.tsx`**:
- Hide the Cancel button on mobile: `{!isMobile && <Button variant="outline" onClick={onClose}>Cancel</Button>}`
- Add `pb-4` padding at the bottom of the ScrollArea content so names don't hide under the Record Attendance button

---

### Files Changed

| File | Change |
|------|--------|
| **Database migration** | Add SELECT policy on `events` for DCG admins to view regional events; Add public SELECT on `regional_roles`; Fix transferred member status |
| `src/hooks/useMemberTransfer.ts` | Add `status: 'active'` to member update on transfer |
| `src/components/admin/PortalSwitcher.tsx` | Remove `hidden sm:inline` from portal name span |
| `src/pages/dcg/Events.tsx` | Use `userDcg?.region_id` directly for regional events query |
| `src/components/admin/dcg/EventAttendanceDialog.tsx` | Hide Cancel button on mobile, add bottom padding to scroll content |
| `src/components/admin/regional/roles/RoleManagementTab.tsx` | Add hard-delete option for roles with no assigned users |
| `src/components/admin/super/regions/CreateRegionDialog.tsx` | Replace free-text president with member selector |
| `src/components/admin/super/regions/EditRegionDialog.tsx` | Replace free-text president with member selector |

