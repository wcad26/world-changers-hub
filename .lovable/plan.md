# Rebuild Super Admin Global Members Page

Mirror the Regional Members page (`src/pages/admin/regional/Members.tsx`) on the Super Admin global Members page (`src/pages/admin/super/Members.tsx`), aggregating across all regions instead of one.

## Scope

UI/presentation only. No changes to auth, route guards, `AuthProvider`, login pages, or any session/cache code — the sticky session fix (`mem://constraints/portal-session-guards-must-be-sticky`) remains untouched.

## What to build

### 1. New global KPI component
Create `src/components/admin/super/GlobalMemberKPICards.tsx`, modeled exactly on `src/components/admin/regional/MemberKPICards.tsx`, with one change to the data source:

- Drop the `regionId` prop.
- Replace the recent-attendance query with a global version that fetches the last 5 `attendance_events` where `dcg_id IS NULL` and `region_id IS NOT NULL` (regional events across ALL regions), then loads their `attendance_records`. Same ≥50% activity threshold logic.
- Same 5 cards in the same order, same styling, same growth/active math: **Total, Members, Regular Visitors, Children, Special Event Visitors**.

### 2. Rebuilt page
Rewrite `src/pages/admin/super/Members.tsx` to mirror `regional/Members.tsx`:

- Use `useAllMembers()` (already global) instead of `useMembers(regionId)`.
- Fetch member relationships globally via `fetchMemberRelationshipsForMembers` over all returned member IDs (chunked — already handled by the util, matches the core memory rule).
- Fetch `events.is_special` for any visitor `rated_event_id` to build `specialEventIds` (same as regional).
- Use `buildChildrenSet` for the strict children rule.
- Render `<GlobalMemberKPICards>` at top with the same loading skeleton.
- Same glassy "Member Directory" panel with title "Global Member Directory" and subtitle "A list of all members across all regions".
- Same search input, Status filter, Type filter (All / Member / Special Event Visitors / Regular Visitors / Children), Export CSV button.
- Table columns mirror regional, **plus a "Region" column** (since this is global): Name, Address, Phone, **Region**, Role, Status, Join Date, Actions. Row click navigates to `/admin/super/members/:id`.
- Actions dropdown: View → `/admin/super/members/:id`. **No Register / Edit / Delete** on the global page (members are managed at the regional level; super admin is read-only oversight here — matches current Super Members behavior). If you want write actions later, they can be added.
- Same name format "Last Name First Name" (memory rule).
- Same status color helper, same badges, same loading skeleton.

### 3. CSV export
Mirror regional `handleExportMembers` with Papa Parse, add a `Region` column to the export rows.

## Files

- **Create:** `src/components/admin/super/GlobalMemberKPICards.tsx`
- **Rewrite:** `src/pages/admin/super/Members.tsx`

No router, layout, auth, or hook changes. `SuperAdminLayout` menu entry already points to `/admin/super/members`.

## Safety / non-regression

- Do not import or touch `AuthProvider`, `SuperAdminSessionRoute`, `portalAuthCache`, `usePortalSession`, or any auth page. The page already runs inside `SuperAdminLayout` which already works; only the page body changes.
- Keep using `useAuth` only if needed for display (not required here — `useAllMembers` doesn't depend on it).
- Reuse existing utilities (`buildChildrenSet`, `fetchMemberRelationshipsForMembers`, `useAllMembers`) — no schema or RLS changes.
