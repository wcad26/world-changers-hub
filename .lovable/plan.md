# Rebuild Super Admin Global Location Management

Replace the placeholder at `src/pages/admin/super/Locations.tsx` with a reporting-focused, tabbed view that mirrors the visual language of the regional DCG overview (KPI cards + glass directory section + searchable table).

## Page structure

`Global Location Management` (title already rendered by `SuperAdminLayout` header — keep page body only).

- Short subtitle: "Overview of all WCA regional centers and DCG locations across the organization."
- Top-level `Tabs` with two tabs:
  1. **WCA Regions** (default)
  2. **DCGs**

Each tab follows the same pattern as `DcgOverviewTab`: KPI row → `GlassSection` directory with search + table. Read-only — no add/edit/delete (this page is for reporting).

## Tab 1 — WCA Regions

Data: `useAllRegions({ includeInactive: true })` (already exists).

KPI cards (3, `GlassKPICard`):
- Total Regions (count)
- Active Regions (`is_active === true`)
- Countries Represented (distinct `country`)

Directory table columns:
- Name (region.name)
- Code
- Country
- Regional President (`regional_president`)
- DCGs (count of DCGs whose `region_id` matches — from a new aggregated query, see below)
- Members (count of members in that region — same aggregated query)
- Status (Active / Inactive badge)

Client-side search across name / code / country / president.

## Tab 2 — DCGs

Data: new hook `useAllDcgs()` (global, no region filter) returning every DCG with:
- leader name (same join shape as `useDcgs`)
- region name + code (join `regions(name, code)`)
- member_count (same `dcg_members` aggregation as `useDcgs`, but unscoped)

KPI cards (3):
- Total DCGs
- Total DCG Members (sum of member_count)
- Regions with DCGs (distinct region_id)

Directory table columns:
- Name
- Region (region.name + small code chip)
- Leader (Last First, same `getLeaderName` helper)
- Location
- Members
- Meeting Schedule (`meeting_day, formatted meeting_time`)

Client-side search across name / leader / location / region name.

Read-only: no add/edit/delete actions, no row navigation (Super Admin doesn't currently have a per-DCG page in this route group).

## Files

- **Edit:** `src/pages/admin/super/Locations.tsx` — full rewrite with `Tabs` + two tab components.
- **Create:** `src/components/admin/super/locations/RegionsLocationsTab.tsx` — KPI + directory for regions, uses `useAllRegions` plus a lightweight aggregation query for per-region DCG and member counts (single `dcgs` + `members` count query grouped client-side).
- **Create:** `src/components/admin/super/locations/DcgsLocationsTab.tsx` — KPI + directory for global DCGs, uses new `useAllDcgs`.
- **Create:** `src/hooks/useAllDcgs.ts` — global variant of `useDcgs` (no `region_id` filter, joins `regions(name, code)`).

## Visual consistency

- Reuse `GlassSection`, `GlassSectionHeader`, `GlassKPICard`, `GlassTableSkeleton` exactly like `DcgOverviewTab` so the look matches the uploaded screenshot.
- Use shadcn `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` for the tab shell.
- Name display follows the global "Last Name First Name" rule.

## Out of scope

- No CRUD on regions or DCGs (Regions already has its own management page at `/admin/super/regions`; DCGs are managed regionally).
- No schema changes, no RLS changes, no router changes.
- No edits to `AdminLayout` or auth code.
