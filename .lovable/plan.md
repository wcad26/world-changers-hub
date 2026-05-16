# Fundraising — use region currency everywhere

## Problem

All fundraising UI hardcodes a `$` prefix (e.g. `${totalRaised.toLocaleString()}`), even though every region has its own currency stored in the DB and a working `useRegionCurrency` hook + `formatCurrencyWithSymbol` helper. A Douala admin therefore sees `$ 0` instead of `F 0` (FCFA) for raised/goal totals, donations, and analytics.

## Goal

Render every fundraising amount (admin tabs, dashboard tab, campaign details, analytics chart, public/member donation pages) using the campaign's region currency. No DB or schema changes — amounts stay in minor units (cents) as today.

## Approach

Reuse the existing pattern already used in `dashboard/tabs/FundraisingTab.tsx`:
```ts
const { data: regionCurrency } = useRegionCurrency(userRegion?.id);
const fc = (amount) => formatCurrencyWithSymbol(amount, regionCurrency);
```

Replace every hardcoded `$...toLocaleString()` / `$...toFixed(2)` with `fc(...)`.

## Files to change

1. **`src/components/admin/regional/finances/FundraisingLedgerTab.tsx`**
   - Already imports `formatCurrencyWithSymbol` but isn't wired to a currency. Add `useAuth` → `useRegionCurrency(userRegion?.id)` and pass it into the three KPI cards (Total Raised, Combined Goal) plus the embedded `FundraisingTabContent`.

2. **`src/components/admin/regional/FundraisingTabContent.tsx`**
   - Accept optional `currency` prop (or call `useRegionCurrency` directly).
   - Replace the 4 hardcoded `$` usages: Total Raised KPI, Total Goal KPI, table Raised cell, table Goal cell.
   - Replace `DollarSign` icon (USD-specific) with a neutral icon (`TrendingUp` / `Target`).
   - "Fundraising Goal ($)" label in `CreateFundraisingCampaignDialog` → "Fundraising Goal ({symbol})".

3. **`src/components/admin/regional/CreateFundraisingCampaignDialog.tsx`**
   - Use region currency symbol in the Goal field label and placeholder.

4. **`src/components/admin/regional/CampaignDetailsDialog.tsx`**
   - Resolve currency from the campaign's `region_id` via `useRegionCurrency`.
   - Replace 4 hardcoded `$` usages (raised, of goal, per-donation amount, average donation).

5. **`src/components/admin/regional/FundraisingAnalyticsChart.tsx`**
   - Accept `currency` prop from parent and format chart tooltips/labels with `formatCurrencyWithSymbol` instead of `$`.

6. **Public + member donation pages** (`src/pages/Fundraising.tsx`, `src/pages/member/Fundraising.tsx`)
   - Use the campaign's region currency for displayed totals, progress text, donation history, and the suggested-amount quick buttons. Quick-pick amounts ($25/$50/$100) become region-appropriate presets sourced from the currency object (or a sensible multiplier when none are defined).

## Out of scope

- DB schema, RLS, currency conversion across regions, multi-currency campaigns, or changing how amounts are stored. Goals/donations remain integers in the campaign's region currency minor units.
- Super Admin global fundraising (`src/pages/admin/super/Fundraising.tsx`) unless it also displays regional totals — will only adjust if a quick scan shows the same `$` issue; otherwise flagged but untouched to keep this PR focused.

## Verification

Open `/admin/regional/finances` → Fundraising tab on a non-USD region (e.g. Douala/XAF) and confirm KPI cards, campaign table, details dialog, analytics chart, and public donation page all render the region's symbol (e.g. `F`) with correct decimal places.
