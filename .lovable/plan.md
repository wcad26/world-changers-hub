## Goal
Modernize the `FundraisingCampaignReport` page (`/admin/regional/finances/fundraising/:campaignId`) with:
1. A weekly-cumulative trend chart matching the regional finance page's `LedgerTrendChart` style (Income/Expenses/Net-style multi-area chart adapted for donations).
2. A `PeriodSelector` placed just before the Share/Edit buttons that filters every section of the page.

## Changes

### 1. `src/pages/admin/regional/FundraisingCampaignReport.tsx`

**Add period state**
- Import `PeriodSelector`, `resolvePeriod`, `PeriodKey`, `PeriodRange`.
- Add `useState<PeriodKey>("1y")` plus optional `customRange` state (mirrors `Finances.tsx`).
- Compute `range: PeriodRange` via `resolvePeriod(period, customRange)`.

**Filter donations by range**
- Derive `filteredDonations` from `donations` where `donation_date` falls within `[range.from, range.to]`.
- Use `filteredDonations` for KPI totals, trend, top donors, and the "All donations" table (table heading becomes `All donations (n)` for the selected period).
- "Goal" KPI stays based on the campaign's full goal; "Raised" + "Progress" + "Avg" + "Donors" recompute from filtered set. Add a small period hint under the section heading.

**Header layout**
- Insert `<PeriodSelector>` in the right-hand action cluster, before the Share button:
  `[ PeriodSelector ]  [ Share ]  [ Edit ]`
- On small screens the action row wraps below the title (existing `flex-col md:flex-row` already handles this).

**Rebuild trend chart (replace lines 205–235)**
Create a new inline chart that mirrors `LedgerTrendChart`:
- Bucket filtered donations into ISO weeks via `startOfWeek(date, { weekStartsOn: 1 })` and `eachWeekOfInterval` across the resolved `range` so empty weeks render flat.
- Two series per week:
  - `Donations` – sum raised that week (bar).
  - `Cumulative` – running total across weeks (area + line with dots = "weekly point record plot").
- Use a `ComposedChart` (recharts) with:
  - `<Bar dataKey="Donations" fill="hsl(var(--chart-1))" radius={[6,6,0,0]} />`
  - `<Area type="monotone" dataKey="Cumulative" stroke="hsl(var(--chart-4))" fill="url(#gradCumulative)" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />`
  - Gradient defs, dashed grid, themed axes, currency-formatted Y axis (`{symbol}{k}` short form), themed tooltip — all matching `LedgerTrendChart`.
- Title: "Donation trend" with `TrendingUp` icon and a subtitle showing the selected period range.
- Empty-state message reused.

### 2. No new files, no hook/schema changes
- `useCampaignDonations` already returns all donations for the campaign; filtering happens client-side, consistent with how `FundraisingLedgerTab` handles its KPIs.
- No DB migration.

## Technical notes
- Imports to add: `Bar`, `ComposedChart`, `Legend` from `recharts`; `startOfWeek`, `eachWeekOfInterval` from `date-fns`; `PeriodSelector`, `resolvePeriod`, types from `./components/admin/regional/finances/PeriodSelector`; `getCurrencySymbol` from `@/utils/currencyUtils`.
- Y-axis tick formatter: `(v) => ${symbol}${Math.abs(v) >= 1000 ? (v/1000).toFixed(0)+'k' : v}`.
- All colors via `hsl(var(--chart-*))` / `hsl(var(--border))` semantic tokens — no hardcoded colors.
- Default period: `1y` (covers most campaigns; user can switch).
