# Global Financial Management — Display Currency Switcher

Make every tab fully FX-aware, add a global display-currency switcher (defaults to the base currency), reorder tabs so **Global Books** and **Global Campaigns** come first, and default the page to **Global Books**.

## 1. Tab order & default

In `src/pages/admin/super/Finances.tsx`:
- Reorder `TabsList` to: `Global Books → Global Campaigns → Regional → DCG → Fundraising`.
- Change `<Tabs defaultValue="regional">` → `defaultValue="global-books"`.

## 2. Display currency switcher (new)

New component `src/components/admin/super/finances/DisplayCurrencySelect.tsx`:
- Dropdown listing all active currencies from `useCurrencies()`.
- Shows the base currency with a "Base" badge and pre-selects it.
- Renders next to `RegionFilterSelect` and `PeriodSelector` in the page header.

State `displayCurrency` (string code) lives in `Finances.tsx` and is passed to every tab as a prop. When unset, falls back to base.

## 3. FX hook upgrade

Extend `src/hooks/useDisplayCurrency.ts`:
- Add a second hook `useFxConverterFor(targetCode?: string)` that converts **from any source currency → the chosen target** (not just base). Internally calls `convert(amount, fromCode, targetCode, baseCode, rates)` from `src/utils/fx.ts` (already supports arbitrary target via base routing).
- Returns `{ targetCode, targetCurrency, convert, baseCode }`.
- Keep existing `useFxConverter` as a thin wrapper for back-compat (target = base).

`src/utils/fx.ts` already supports arbitrary `toCode`; no change needed there.

## 4. Wire every tab to the display currency

Each tab accepts a new `displayCurrency` prop and uses `useFxConverterFor(displayCurrency)` instead of `useFxConverter()`. The "Reporting in" chip shows the selected currency.

- **GlobalBooksTab**: convert each transaction `amount` (source = `currency_code`) → displayCurrency. KPIs, trend chart series, transactions table all render in displayCurrency. Sub-line still shows source currency + original amount when different from display.
- **GlobalLedgerTab (Regional)**: same conversion; per-region breakdown and aggregations roll up in displayCurrency.
- **GlobalDcgLedgerTab (DCG)**: same — per-DCG and per-region aggregations in displayCurrency.
- **GlobalFundraisingTab**: KPIs (Total Raised, Combined Goal, Progress) computed in displayCurrency by converting each donation (using `d.currency_code || d.campaign.currency_code`) and each campaign goal (using `c.currency_code`). 
  - **Campaign rows keep their native currency by default** (Goal, Raised columns use `c.currency_code`). Add a small "Show in {displayCurrency}" toggle above the Campaigns table; when on, each row's Goal/Raised is converted, with the original native amount shown beneath in small muted text. Donation rows behave the same way (native by default, converted when toggle is on).
- **GlobalCampaignsTab**: KPIs (Total Raised, Combined Goal, Progress) computed in displayCurrency (currently hard-coded USD). Campaign rows native by default + same "Show in {displayCurrency}" toggle as Fundraising tab. Donations linked to global campaigns also follow toggle.

Unconverted-row counter (when no FX path exists between source and display) stays — used across all four converted tabs.

## 5. Trend charts

`LedgerTrendChart` currently receives raw rows. We'll keep passing the **already-converted** rows (where `amount` has been overwritten to the displayCurrency value) so the chart aggregates in the chosen currency. The chart's axis label/tooltip uses `displayCurrency` symbol via `formatWithCurrency`.

## 6. Edge cases
- If selected display currency has no FX path from a row's source, that row is excluded from KPIs (counted as "unconverted") and the table cell shows `—` with the original amount underneath. Identical to current base-only behavior.
- Switching display currency does **not** change stored data; conversions are display-only.
- If exchange rates aren't loaded yet, `convert` returns the amount as-is when source equals target, otherwise null — KPIs render as 0 until rates load.

## Files

**New**
- `src/components/admin/super/finances/DisplayCurrencySelect.tsx`

**Edited**
- `src/pages/admin/super/Finances.tsx` — reorder tabs, default `global-books`, mount `DisplayCurrencySelect`, thread `displayCurrency` prop.
- `src/hooks/useDisplayCurrency.ts` — add `useFxConverterFor(target)`.
- `src/components/admin/super/finances/GlobalBooksTab.tsx`
- `src/components/admin/super/finances/GlobalLedgerTab.tsx`
- `src/components/admin/super/finances/GlobalDcgLedgerTab.tsx`
- `src/components/admin/super/finances/GlobalFundraisingTab.tsx`
- `src/components/admin/super/finances/GlobalCampaignsTab.tsx`

No database/migration changes — exchange_rates + system_settings already in place.
