# Finance Management — Glass Redesign to Match Regional Dashboard

## Problem

The Finance Management page (`/admin/regional/finances`) uses plain shadcn `Card` defaults and a flat KPI tile, while the Regional Dashboard uses a soft, glassy aesthetic: `rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm`, gradient KPI cards, area charts with HSL chart tokens and a themed tooltip. The two pages feel like they belong to different products.

## Goal

Upgrade the entire Finance Management page (Regional, DCG, Fundraising tabs) to the same glass aesthetic as the dashboard. Frontend/presentation only — no changes to hooks, data flow, mutations, or dialogs.

## Reference patterns (from `Dashboard.tsx` & `KPICards.tsx`)

- **Section panel**: `rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6`
- **KPI card**: `bg-gradient-to-br from-card/95 to-muted/20 backdrop-blur-sm border border-border/30 rounded-2xl shadow-sm p-5 hover:shadow-md transition-all` with colored icon tile (`bg-{color}-500/10 text-{color}-600`)
- **Period pill row**: `bg-muted/40 rounded-xl p-1` with active state `bg-primary text-primary-foreground rounded-lg`
- **Chart**: Recharts `AreaChart` with `hsl(var(--chart-N))` gradients, no axis/tick lines, themed tooltip in `hsl(var(--card))` with rounded corners and soft shadow

## Files to change

1. **`src/pages/admin/regional/Finances.tsx`**
   - Wrap header + tabs in a sticky-feel glass bar: title row in a `bg-background/98 backdrop-blur-md border-b border-border/30` band like the dashboard, with the period pill on the right.
   - Restyle `TabsList` as a glass segmented control (`bg-muted/40 rounded-xl p-1`, active trigger `bg-card shadow-sm rounded-lg`).

2. **`src/components/admin/regional/finances/FinanceKpiCard.tsx`** (rewrite)
   - Adopt the dashboard `GlassKPICard` shape: title row (label + colored 8×8 icon tile), large value, hint line, optional trend chip. Keep the existing `tone` prop API and map tones to the same color tokens already in use (income/expense/neutral/info/warning/primary).
   - Drop the shadcn `Card` wrapper; use a `div` with the gradient/blur classes.

3. **`src/components/admin/regional/finances/LedgerTrendChart.tsx`**
   - Replace shadcn `Card` with the glass panel `div`.
   - Convert `LineChart` → `AreaChart` with three HSL-token gradients (`--chart-1` income, `--chart-2` expenses, `--chart-4` net).
   - Themed `Tooltip` matching dashboard (card bg, 12px radius, soft shadow, currency-formatted values).
   - Axes: no axis line / tick line, `hsl(var(--muted-foreground))` ticks, soft grid `hsl(var(--border))` at 0.4 opacity.

4. **`src/components/admin/regional/finances/RegionalLedgerTab.tsx`** & **`DcgLedgerTab.tsx`**
   - Wrap "Transactions", "Per-DCG Breakdown", and "DCG Transactions" sections in the glass panel `div` (drop `Card`/`CardHeader`/`CardContent`) with consistent heading style (`text-base font-semibold` + muted description).
   - Soften table chrome: `bg-muted/40` header row, no hard borders, rounded outer wrapper, hover row tint.
   - Keep the gradient "Record" button on Regional tab.

5. **`src/components/admin/regional/finances/FundraisingLedgerTab.tsx`** + nested **`FundraisingTabContent.tsx`**
   - Replace duplicated KPI block: collapse the old `<Card>`-based "Total Raised / Total Goal / Active Campaigns" trio (currently shown twice in the screenshot) by removing the inner KPI strip from `FundraisingTabContent` since the outer `FundraisingLedgerTab` already shows them with the new glass KPI cards.
   - Glass-panel the "Fundraising Campaigns" list section.
   - Restyle the filter row (search + status select + "New Campaign" button) to match the muted-pill aesthetic.

6. **`src/components/admin/regional/finances/FinanceFiltersBar.tsx`** & **`PeriodSelector.tsx`**
   - PeriodSelector already matches the dashboard — only minor polish (consistent height with new filter inputs).
   - Wrap the filter row in a subtle glass strip (`rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm px-3 py-2`) so it visually pairs with the panels below.

## Out of scope

- Hooks, queries, mutations, dialogs, RLS, schema, the `Dashboard` page itself.
- No new features — visual refresh only.
- The shared `Card` shadcn component is left untouched (we just stop using it inside the finance tabs).

## Verification

Open `/admin/regional/finances`, cycle Regional/DCG/Fundraising tabs at 1373×763 viewport. Confirm KPI cards, panels, charts and filter strip visually match the Regional Dashboard's glassy treatment, and that no duplicate KPI rows remain in the Fundraising tab.
