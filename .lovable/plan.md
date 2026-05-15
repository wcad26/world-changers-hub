## Goal
Allow regional admins to delete discipleship relationships from the Discipleship Management page.

## Scope
- Frontend only. RLS already permits DELETE for regional admins / region members / super admins on `discipleship_relationships`.
- Cascading `discipleship_progress` rows are handled by the existing FK (or remain orphaned per current schema — no schema change in this task).

## Changes

### 1. `src/hooks/useDiscipleship.ts`
Add `useDeleteDiscipleshipRelationship` mutation:
- `DELETE FROM discipleship_relationships WHERE id = :id`
- On success: invalidate `discipleship-relationships`, `member-discipleship-relationships`, `member-discipleship-stats`, and toast "Relationship deleted".
- On error: toast error.

### 2. `src/pages/admin/regional/Discipleship.tsx`
In the Actions cell of each row (next to the existing **Manage** button), add a destructive **Delete** icon button:
- Uses an `AlertDialog` confirmation ("Delete this discipleship relationship? This cannot be undone.")
- On confirm, calls the new delete mutation with `relationship.id`.
- Shows a small spinner / disabled state while pending.

### 3. `src/components/admin/regional/discipleship/ManageDiscipleshipDialog.tsx`
Also surface a **Delete Relationship** button at the bottom of the manage dialog (same confirm flow), so admins reviewing details can remove without backing out. Closes the dialog on successful deletion.

## Out of scope
- No DB migration. RLS already allows delete.
- No changes to member-portal discipleship views.
- No bulk delete.