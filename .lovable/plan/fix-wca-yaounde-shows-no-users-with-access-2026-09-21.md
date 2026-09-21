# Fix: WCA Yaounde shows "No users with access"

## What actually happened

Nobody was deleted. WCA Yaounde still has **24 active access assignments** on file:

- Leaders WCA Yde — 22 people
- Regional Tech Assistant — 1 person
- Regional Admin — 1 person

The account viewing that page (whitstim@gmail.com) simply can no longer *see* them. During the recent clean-up of revoked access in the Super Admin portal, this account's regional-admin access was switched off. The access list and its counters are readable only by an active regional admin or a Super Admin, so for this account the list comes back empty and the page shows "No users with access yet" with 0 in every card.

So: the records are safe, the page is lying. Two things need fixing.

## The fix

1. **Restore the right access for the Yaounde admin.** Confirm with you who should run WCA Yaounde, then switch their regional-admin access back on so they can see and manage the Access page again.
2. **Stop the page from silently showing an empty list.** Two changes:
   - Allow people who hold an active regional role that includes access-management rights to read their own region's assignments — not only the legacy regional-admin label (the same gap that broke member deletion earlier).
   - When the list cannot be read because of permissions, show a clear "You don't have permission to view this" message instead of "No users with access yet", so an empty page never again looks like deleted data.
3. **Check every other region** for the same situation (assignments on file but no one able to see them) and report anything found.

## Technical notes

- Confirmed by query: `regional_user_roles` joined to `regional_roles` for region `309322eb-855a-45c4-9194-f0724f3df540` returns 24 rows, all `is_active = true`.
- `profiles` for whitstim@gmail.com: single `user_roles` row `regional_admin` with `is_active = false`; no `regional_user_roles`, no active `super_admin_user_roles`.
- RLS on `regional_user_roles` today: ALL for `has_role(auth.uid(),'regional_admin')` in own region, ALL for `has_role(auth.uid(),'super_admin')`, SELECT own rows. `has_role` requires `is_active = true`, hence zero visible rows.
- Migration: add a SELECT policy on `regional_user_roles` (and a matching one on `regional_roles` if needed) allowing users with an active `regional_user_roles` row in the same region whose role permissions contain `*` or `access_management`.
- Data fix via `run_sql`: reactivate the intended admin's `user_roles` row, or assign them an active regional role — decided after your confirmation.
- Frontend: `UsersWithAccessTable.tsx` and `AccessKpiCards.tsx` — surface permission errors instead of rendering the empty state; the table currently also drops rows when the profile lookup returns nothing, so count assignments even when a profile is unreadable.
