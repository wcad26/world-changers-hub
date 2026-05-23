# Regions Directory — Actions & Per-Region Report

## 1. Actions column in `RegionsLocationsTab.tsx`

Replace the **Status** column with an **Actions** column.

- Region name cell becomes a button-styled link → `/admin/super/regions/{id}/report` (cursor pointer, hover underline). Whole row also clickable (except the actions cell, which stops propagation).
- Add a small Active/Inactive dot indicator next to the name (so status info isn't lost), but no dedicated column.
- Actions cell: shadcn `DropdownMenu` with trigger `MoreHorizontal` and items:
  - **View Report** → navigate to report page
  - **Edit** → opens existing `EditRegionGlassDialog` (we'll create a thin glass wrapper if only the legacy `EditRegionDialog` exists; otherwise use `EditRegionDialog` directly — confirmed it exists at `src/components/admin/super/regions/EditRegionDialog.tsx`)
  - **Deactivate / Reactivate** (red destructive style for deactivate) → uses existing `useRegionMutations().deleteRegion` / `reactivateRegion` with an `AlertDialog` confirm (replacing `window.confirm`)
- Track `selectedRegion`, `editOpen`, `confirmOpen`, `confirmAction` local state.

## 2. New route: per-region report

- Add route in `src/App.tsx` under the existing `/admin/super` block:
  `<Route path="regions/:regionId/report" element={<SuperAdminPage><SuperRegionReport /></SuperAdminPage>} />`
- New page `src/pages/admin/super/RegionReport.tsx` — reads `regionId` from params, fetches the region row (`useAllRegions` or a direct `regions` select by id), then renders `<RegionalDashboardView region={region} />` with a back button + breadcrumb header showing the region name.

## 3. Refactor Regional Dashboard for reuse

Today `src/pages/admin/regional/Dashboard.tsx` reads its region from `useRegionalSession()`. We extract the dashboard body into a presentational component so the Super Admin report can render it for any region.

```
src/pages/admin/regional/Dashboard.tsx
  └─ thin wrapper: pulls region from useRegionalSession → <RegionalDashboardView region={userRegion} />

src/components/admin/regional/dashboard/RegionalDashboardView.tsx  (new)
  └─ accepts { region: Region | null | undefined, showAuthSkeleton?: boolean }
     all hooks (useMembers(region?.id), useRegionalEvents — see below, useFinancialSummary, …) take region.id from props
```

### `useRegionalEvents` consideration

`useRegionalEvents()` currently scopes to the logged-in user's region (regional admin). For the Super Admin report, we must scope events by the **viewed** region. Two options:
- Preferred: switch the view to use `useEvents({ regionId: region.id })` (or whichever variant accepts a region id — confirm during implementation). All other dashboard hooks already accept `regionId` so this is the only one needing the swap.

If no region-scoped variant exists, add a `regionId?: string` parameter to `useRegionalEvents` that defaults to the session region when omitted, preserving current behavior.

## 4. Out of scope

- No DB/schema changes
- No styling change to the Regional Dashboard itself
- No change to KPI cards above the directory
- No filters

## Files touched

- `src/components/admin/super/locations/RegionsLocationsTab.tsx` — actions column + row navigation + confirm/edit dialogs
- `src/App.tsx` — new route + import
- `src/pages/admin/super/RegionReport.tsx` — new
- `src/components/admin/regional/dashboard/RegionalDashboardView.tsx` — new (extracted from Dashboard.tsx)
- `src/pages/admin/regional/Dashboard.tsx` — slim wrapper around the new view
- (Maybe) `src/hooks/useEvents.ts` — accept explicit `regionId` if not already supported
