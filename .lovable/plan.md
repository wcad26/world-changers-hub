
# Super Admin Finances — Global Rebuild Plan

Replace the placeholder Super Admin Finances page with a full-featured page modeled on the regional finance page (`src/pages/admin/regional/Finances.tsx`), aggregating across all regions, with region/DCG/campaign filters, plus a dedicated "Global" scope for finances and fundraising the super admin operates themselves (distinct from any region).

## Goals

1. Aggregate finances across all regions (Regional / DCG / Fundraising tabs) with a Region filter.
2. Let super admins record their own Global income/expenses and run Global fundraising campaigns, separate from regional books.
3. Remove the standalone Super Admin **Fundraising** menu item and page — all fundraising lives inside the Finances page.

---

## 1. Database changes (single migration)

Currently `financial_transactions.region_id` and `fundraising_campaigns.region_id` are `NOT NULL`. To represent "Global" (super-admin-owned) records we make them nullable, with `NULL` = global scope.

- `ALTER TABLE public.financial_transactions ALTER COLUMN region_id DROP NOT NULL;`
- `ALTER TABLE public.fundraising_campaigns ALTER COLUMN region_id DROP NOT NULL;`
- Add `scope text NOT NULL DEFAULT 'regional' CHECK (scope IN ('regional','global'))` on both tables for fast filtering and clarity. Backfill existing rows to `'regional'`.
- Keep existing RLS (`authenticated` full access pattern already in place from prior migrations) — no policy changes needed; `NULL region_id` rows are simply "global".
- No grants change (tables already granted).

## 2. Shared hook updates

`src/hooks/useRegionalLedger.ts` and `src/hooks/useFundraisingCampaigns.ts` currently scope by `userRegion.id`. Add a sibling "global aggregator" variant rather than mutating the regional ones:

- New `src/hooks/useGlobalLedger.ts` — same shape as `useRegionalLedger` but:
  - Accepts `regionId?: string | "all" | "global"`.
  - `regionId = "global"` → `.is("region_id", null)`.
  - `regionId = "all"` (default) → no region filter.
  - Otherwise filter on that region id.
  - Joins region name for aggregation.
- New `useGlobalFundraisingCampaigns(regionFilter)` and `useGlobalDonations(range, regionFilter)` with the same convention.

The existing regional finance components (`RegionalLedgerTab`, `DcgLedgerTab`, `FundraisingLedgerTab`, `FundraisingTransactionsCard`, dialogs) keep working untouched for the regional portal.

## 3. New super-admin finance components

Create `src/components/admin/super/finances/` that mirrors the regional folder, but consumes the global hooks and adds a Region selector:

- `GlobalLedgerTab.tsx` — KPI cards + ledger table aggregated across regions, plus a "By Region" breakdown card (income / expenses / net per region).
- `GlobalDcgLedgerTab.tsx` — DCG aggregation across all regions, grouped by region with drill-down per DCG.
- `GlobalFundraisingTab.tsx` — campaigns table across regions + donations + KPI cards; "Region" column visible.
- `GlobalFinanceTab.tsx` — *super-admin's own books* (NULL region_id). Reuses regional record-income / record-expense dialogs but inserts with `region_id = null, scope = 'global'`.
- `GlobalFundraisingCampaignsTab.tsx` — super-admin's own campaigns (`region_id = null`). Reuses the existing campaign dialog with `region_id = null`.
- `RegionFilterSelect.tsx` — dropdown listing every region + "All Regions" + "Global Only".

## 4. Rewrite `src/pages/admin/super/Finances.tsx`

Glass header (matches regional finances style) with:
- Title "Global Financial Management".
- `PeriodSelector` (reused from regional).
- `RegionFilterSelect`.

Tabs:
1. **Overview** — aggregate KPIs (total income, expenses, net, donations) + region breakdown table + trend chart (reuses `LedgerTrendChart`).
2. **Regional** — `GlobalLedgerTab` (all regions' financial_transactions where `dcg_id is null`).
3. **DCG** — `GlobalDcgLedgerTab`.
4. **Fundraising** — `GlobalFundraisingTab` (all campaigns + donations across regions).
5. **Global Books** — `GlobalFinanceTab` — super-admin's own income/expense ledger.
6. **Global Fundraising** — `GlobalFundraisingCampaignsTab` — super-admin's own campaigns.

All Region/Period filters apply to tabs 1–4; tabs 5–6 are pinned to global (NULL region) but still respect Period.

## 5. Remove standalone Fundraising page

- Delete `src/pages/admin/super/Fundraising.tsx`.
- Remove the `Fundraising` route from `src/App.tsx`.
- Remove the `Fundraising` menu entry from `src/components/admin/SuperAdminLayout.tsx`.
- Remove the `SuperFundraising` import in `App.tsx`.

## 6. Recording dialogs (reuse, with scope=global)

The regional record-income, record-expense, and create-campaign dialogs accept `region_id` from context. We'll pass an explicit `scope` prop:
- For Global Books tab the dialogs are invoked with `region_id = null, scope = 'global'`.
- Existing regional flows unchanged.

## Technical notes

- `summarizeLedger` and `aggregateByDcg` from `useRegionalLedger.ts` are reused as-is on the aggregated row set — they already operate on a plain array.
- Region breakdown card uses a new helper `aggregateByRegion(rows)` placed next to them.
- Charts/colors/cards reuse `FinanceKpiCard`, `LedgerTrendChart`, `PeriodSelector` from `src/components/admin/regional/finances/` (kept where they are; super components import from that path).
- CSV export across all tabs uses existing `csvExport` util.

## Validation

- Open `/admin/super/finances` — see all 6 tabs, filters work, "All Regions" matches the sum of every regional finance page.
- Switch Region filter to one region → numbers match that region's portal exactly.
- Switch Region filter to "Global Only" → shows only super-admin-recorded rows.
- Create a Global income/expense in tab 5 → does NOT appear in any regional portal; appears under "Global Only".
- Create a Global fundraising campaign in tab 6 → not visible in regional fundraising lists; visible under Global Only.
- Sidebar no longer shows "Fundraising"; `/admin/super/fundraising` returns 404.
