# Rebuild Super Admin Global Events + Fix Blank/Reroute Loop

## Goals

1. Rebuild `src/pages/admin/super/Events.tsx` so it looks and feels like `src/pages/admin/regional/Events.tsx`, but aggregating across **all regions**.
2. Stop the blank-screen + reroute-to-previous-page behavior in the Super Admin portal without touching the sticky auth fix.

## Scope

UI / presentation + one safety wrapper. **No changes** to `AuthProvider`, `SuperAdminSessionRoute`, `portalAuthCache`, `usePortalSession`, login pages, or RLS. The sticky session guard memory (`mem://constraints/portal-session-guards-must-be-sticky`) stays intact.

---

## 1. Rebuilt Super Events page

Mirror the regional page structure (header → PeriodFilter → filters → KPI cards → events table) using global data.

**Data sources (global, no `regionId`):**
- `useGlobalEvents()` — already returns all events with `regions(name, code)` join.
- New helper hook **`useGlobalAttendanceHistoryWithMemberTypes()`** in `src/hooks/useAttendance.ts` — same shape as `useAttendanceHistoryWithMemberTypes(regionId)` but with the region filter dropped (selects all `attendance_events`). Reuses the same member-type / strict-children logic so KPI numbers are computed identically.

**KPI cards (5 cards, mirroring regional):**
- **Total Events** — count + avg attendance + growth %
- **Regional Events** — events with `region_id IS NOT NULL` AND `!dcg_id` AND `!is_special` across all regions
- **DCG Events** — events with `dcg_id IS NOT NULL` across all regions
- **Special Events** — events with `is_special = true`
- **Attendance Target** — total attendees / total capacity %

Same card styling, same growth math (current month vs last month), same color-coded `+/- avg attendance` chip.

**Filters bar (mirror regional):**
- `PeriodFilter` (1M / 3M / 6M / 1Y / Custom), defaulting to 1Y
- Search input
- Event Type select: `All Types / Regional / DCG / Special`
- Time select: `All Events / Upcoming / Past`
- **+ Add Event** button (uses existing `useCreateGlobalEvent`)

**Events table (mirror regional + Region column):**
Columns: Event Name • Type (badge: Regional/DCG/Special/Global) • Date • Time • Location • **Region** (regions.name, or "Global" pill for `region_id IS NULL`) • Capacity • Attendance • Actions (Edit / Mark Attendance / Copy Attendance Link / Delete via existing global mutations and `GlobalAttendanceDialog`).

**Keep existing behaviors that already work on the super page:**
- Create / Edit dialogs (already wired to `useCreateGlobalEvent`, `useUpdateGlobalEvent`).
- `GlobalAttendanceDialog` for "Mark Attendance".
- Slug generation + history insert on edit.
- Delete confirmation via `AlertDialog`.

**Page title:** "Global Event Management" (already in `AdminLayout` header map — no router change).

## 2. Stop the blank / reroute loop on Super Admin pages

Root cause: the Super Admin route tree has **no error boundary** (regional has `RegionalErrorBoundary`). When a Super page throws during render (e.g. a transient null on `events`, a hook reading from a not-yet-restored session, or a query error), React unmounts the subtree → the page goes blank → the Lovable preview's blank-page detector reloads → the browser lands on whatever the previous URL was. That is the "blank then back to previous page" symptom.

Fix:

- **Create `src/components/auth/SuperAdminErrorBoundary.tsx`** — copy of `RegionalErrorBoundary` (same shape, same reset-on-pathname-change behavior, same fallback UI), labeled `[SuperPortal] render error:`.
- **Wrap the super admin route element** in `src/App.tsx`:

  ```tsx
  <Route element={
    <SuperAdminSessionRoute>
      <SuperAdminErrorBoundary resetKey={location.pathname}>
        <SuperAdminLayout />
      </SuperAdminErrorBoundary>
    </SuperAdminSessionRoute>
  }>
  ```

  (The boundary lives **inside** the pass-through session route, so it catches page errors but never gates auth — RLS still decides data access. No `Navigate`, no redirects.)

- **Harden the new Super Events page** against transient nulls:
  - All `useMemo`/derived arrays guard for `events == null`.
  - All numeric KPI math handles zero-length arrays without dividing by zero.
  - Never throw on missing `attendance` data — render skeletons instead.

This matches exactly what already saved the Regional portal. **No change** to auth code, route guards, or session caching.

## 3. Files

- **Edit:** `src/pages/admin/super/Events.tsx` — full rebuild as above.
- **Edit:** `src/hooks/useAttendance.ts` — add `useGlobalAttendanceHistoryWithMemberTypes()` (no signature change to existing exports).
- **Create:** `src/components/auth/SuperAdminErrorBoundary.tsx`.
- **Edit:** `src/App.tsx` — wrap the Super Admin route subtree with the new boundary (single-line addition inside the existing route).

No router restructure, no schema change, no RLS change, no auth/login/session file touched.

## 4. Memory update after build

Append a new rule to `mem://constraints/portal-session-guards-must-be-sticky` (or a new sibling note): every portal layout subtree must be wrapped in a pathname-keyed error boundary so a render error never blanks the page and triggers the preview's reload-to-previous-route behavior. Regional already has it; Super Admin must keep it too. DCG and Member portals will be audited next time they exhibit the symptom.

## 5. Non-regression checks

- Sticky auth fix untouched (no edits to `AuthProvider.tsx`, `portalAuthCache.ts`, `usePortalSession.ts`, `SuperAdminSessionRoute.tsx`, or any `*Auth.tsx` login page).
- Page header "Global Event Management" still rendered by `AdminLayout` (already mapped).
- KPI math reuses existing helpers (`fetchMemberRelationshipsForMembers`, `buildChildrenSet`) — no new util needed.
- No new dependency.
