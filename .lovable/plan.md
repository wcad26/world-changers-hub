## Global Location Management — Simplify to Regions Only

### Scope
Remove tabs, drop DCGs tab entirely, surface Regions content directly on the page, refresh the KPI row, and add a filter row above the directory table.

### Changes

**1. `src/pages/admin/super/Locations.tsx`** — Rewrite to render `<RegionsLocationsTab />` directly (rename usage). Remove `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` and the DCGs import. Keep the short subtitle.

**2. `src/components/admin/super/locations/DcgsLocationsTab.tsx`** — Delete file (no longer referenced).

**3. `src/components/admin/super/locations/RegionsLocationsTab.tsx`** — Update:

- **KPI cards (4 instead of 3):**
  - Total Regions — `regions.length`
  - Total Members — sum of `membersByRegion` values (all active members across regions)
  - Total DCGs — sum of `dcgsByRegion` values
  - Total DCG Members — new query: count of `dcg_members` where `is_active = true`
- Change grid to `md:grid-cols-2 lg:grid-cols-4`.
- Add new `useQuery` for total active DCG members count.

- **Filter row** (above the table, replaces the lone search input):
  - Search input (existing, name/code/president)
  - Status select: All / Active / Inactive
  - DCG presence select: All / With DCGs / Without DCGs
  - Sort select: Name (A–Z), Name (Z–A), Members (high→low), DCGs (high→low)
  - Layout: `flex flex-col md:flex-row gap-3`, search grows, selects fixed width.
- Apply filters + sort in the `filtered` `useMemo`.

### Out of scope
- No schema changes
- No edits to the Create Region dialog
- No changes to `useAllRegions` or `useAllDcgs` (latter becomes unused for this page but stays for any future use)
