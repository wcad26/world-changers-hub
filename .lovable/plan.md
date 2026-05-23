# Plan — Efficient Region Creation with Auto President Assignment

## Goal
Add a "Create Region" button in the WCA Regions directory card on the Super Admin Locations page. Opens a modern glass dialog where the Super Admin:
1. Fills in region details
2. Picks the regional president from an existing member (any region)
3. On submit: region is created, the selected member is transferred into the new region using the existing transfer flow, and they're granted the `regional_admin` role.

## Files

### 1. New: `src/components/admin/super/regions/CreateRegionGlassDialog.tsx`
Modern glass dialog (per `mem://design/glass-dialog-standard`) replacing the old `CreateRegionDialog` styling. Fields, grouped in glass panels:

- **Region Identity panel**: Name *, Code * (auto-uppercased, max 10), Description, Established Date
- **Contact panel**: Address, Contact Email, Contact Phone
- **Regional President panel**: searchable member combobox (Command/Popover) — required. Source: all active members across all regions via a new lightweight query (see hook). Shows "Last Name First Name • current region • member_id". Below the picker, an info note: "This member will be transferred into the new region and granted regional_admin access."

Footer: Cancel + gradient "Create Region" CTA.

Submit orchestration (sequential, with rollback messaging on partial failure):
1. `createRegion.mutateAsync(...)` (existing `useRegionMutations.createRegion`) — sets `regional_president` text to "Last First" of the selected member, `is_active: true`.
2. `transferMember.mutateAsync({ memberId, profileId, fromRegionId, toRegionId: newRegion.id, oldMemberCode, reason: 'Appointed Regional President', notes: 'Auto-transfer during region creation' })` — uses existing `useTransferMember` (regenerates `member_id`, updates `profiles.region_id`, logs to `member_transfers`).
3. Assign `regional_admin` role: insert into `user_roles` `{ user_id: profile_id, role: 'regional_admin', region_id: newRegion.id, is_active: true, status: 'active' }` (idempotent — check first). Existing `ensure_member_record_for_admin` trigger will see member already exists in region and skip.
4. Invalidate queries: `regions`, `all-regions`, `members`, `all-members`, `user_roles`, `locations`.
5. Toast success → close dialog.

If member has no `profile_id` (rare visitor-only record), block submit with inline error: "Selected member must have a login profile to serve as Regional President."

### 2. New: `src/hooks/useEligiblePresidentCandidates.ts`
Lightweight query of active members with profiles for the picker:
```
members (id, member_id, profile_id, region_id)
  → profiles!inner(id, first_name, last_name, email)
  → regions(name, code)
filter: status='active', profile_id NOT NULL
order: last_name, first_name
```
Returns enriched list for the combobox.

### 3. Edited: `src/components/admin/super/locations/RegionsLocationsTab.tsx`
- Add `<Button>` in `GlassSectionHeader` action slot: "Create Region" (Plus icon, gradient style).
- Wire to local `open` state → `<CreateRegionGlassDialog />`.

No changes to: `useRegionMutations`, `useTransferMember`, RLS, router, or schema.

## Reuse confirmation
- **Region creation**: existing `useRegionMutations.createRegion` (inserts into `regions`, invalidates `regions`).
- **Member transfer**: existing `useTransferMember` — generates new `member_id` via `generate_member_id` RPC, updates `members.region_id`, updates `profiles.region_id`, inserts `member_transfers` record. Identical behavior to manual transfer.
- **Role assignment**: direct insert into `user_roles` (the trigger `ensure_member_record_for_admin` already handles the "create member record if missing" case — but here the member already exists post-transfer, so it's a no-op).

## Out of scope
- No edit/deactivate buttons on the directory rows (existing Regions management page handles that).
- No bulk import.
- No schema changes — `regions.regional_president` remains a text label; the source of truth for the actual leader is the transferred member + `regional_admin` role.
