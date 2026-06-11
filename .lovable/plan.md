## Super Admin Settings + Currency-Aware Finances

### 1. Database (single migration)

**New table `public.exchange_rates`** — admin-managed pairs:
- `id uuid pk`, `base_code text` (FK currencies.code), `quote_code text` (FK currencies.code)
- `bid numeric(18,8) not null` (buy / market buys quote with base)
- `ask numeric(18,8) not null` (sell)
- `mid numeric(18,8) generated always as ((bid+ask)/2) stored`
- `is_active bool default true`, `effective_at timestamptz default now()`
- `created_by uuid`, timestamps, `unique(base_code, quote_code)`
- RLS: super_admin full access; authenticated SELECT (rates are non-sensitive reference data). GRANTs for anon SELECT, authenticated SELECT, service_role ALL.

**New table `public.system_settings`** — singleton key/value for super-admin-wide prefs:
- `key text pk`, `value jsonb`, `updated_by uuid`, `updated_at timestamptz`
- Seeded row: `('base_currency', '"USD"')`
- RLS: SELECT for authenticated; INSERT/UPDATE/DELETE super_admin only.

No changes to `currencies` table.

### 2. Settings page — `src/pages/admin/super/Settings.tsx`

Cloned from regional Settings, **branch tab removed**. Tabs:
1. **General** — base currency selector (writes `system_settings.base_currency`), org-wide defaults.
2. **Currency** *(new — replaces standalone Currencies page)*
3. **Notifications** — same shape as regional.
4. **Communication** — email signature / templates.
5. **Security** — 2FA toggle, session timeout, audit logging.
6. **System** — status / maintenance read-outs.

Save button persists via `useSystemSettings` hook (upsert into `system_settings`).

### 3. Currency tab UI

Two stacked sections inside the tab:

**a) Currencies (existing CurrenciesTable extracted from `Currencies.tsx`)**  
The existing table, search, create/edit dialogs, and active toggle render here unchanged. A "Base currency" badge marks the row matching `system_settings.base_currency`; a "Set as base" action sets it.

**b) Exchange rates matrix**
- Table columns: Base → Quote · Bid · Ask · Mid (auto) · Spread · Updated · Actions.
- `CreatePairDialog` — two currency selects + bid + ask numeric inputs (validation: ask ≥ bid, both > 0).
- `EditPairDialog` — update bid/ask, toggle active.
- Inline-derived cross rates: when a pair to base currency exists, derive non-base pairs via base; show derived rows in muted style with no edit action (only directly-defined pairs are editable). This satisfies "all other currencies determined based on their exchange rate with the base currency".
- Sort by base then quote; filter input; empty state.

### 4. FX conversion utility — `src/utils/fx.ts`

```text
convert(amount, fromCode, toCode, baseCode, rates, side='mid'):
  if from == to → amount
  if direct pair from→to → amount * rate(side)
  if direct pair to→from → amount / rate(opposite side)
  else → via base: convert(amount, from, base) then convert(result, base, to)
  if no path → return null + flag (UI shows "—" with tooltip "no FX path")
```

`useFxRates()` hook fetches `exchange_rates` + `system_settings.base_currency` via react-query (cached, invalidated on mutation).

### 5. Super Admin Finance integration

`Finances.tsx` and global hooks (`useGlobalLedger`, `useGlobalFundraising`):
- Each transaction/donation row carries its region's `currency_code` (already joined) or `currencies.code` for global-scope.
- A new `useDisplayCurrency()` returns base currency object.
- Aggregation step converts every amount → base currency via `convert(...)` using mid rate before summing. Rows that fail conversion are excluded and surfaced in a small "Unconverted (N)" footnote per tab.
- All KPI cards, region breakdowns, and charts render with `formatWithCurrency(amount, baseCurrency)`.
- Per-row tables keep showing the original currency next to the converted amount: `KES 10,000 ≈ USD 77.50`.
- A header chip `Reporting in: USD (base)` linking to Settings → Currency.

Regional finance pages are not touched.

### 6. Routing & navigation

- `src/App.tsx`: add `/admin/super/settings` → `Settings`; remove `/admin/super/currencies` route (redirect to `/admin/super/settings?tab=currency`).
- `SuperAdminLayout.tsx`: remove **Currency Management** entry; add **Settings** (icon `Settings`) directly below **About Us**.
- Delete `src/pages/admin/super/Currencies.tsx` (its table/dialogs are extracted into `src/components/admin/super/settings/currency/`).

### 7. Files

**New**
- `src/pages/admin/super/Settings.tsx`
- `src/components/admin/super/settings/{GeneralTab,CurrencyTab,NotificationsTab,CommunicationTab,SecurityTab,SystemTab}.tsx`
- `src/components/admin/super/settings/currency/{CurrenciesPanel,ExchangeRatesPanel,CreatePairDialog,EditPairDialog,BaseCurrencyBadge}.tsx`
- `src/hooks/useExchangeRates.ts`, `src/hooks/useSystemSettings.ts`, `src/hooks/useDisplayCurrency.ts`
- `src/utils/fx.ts`
- `supabase/migrations/<ts>_exchange_rates_system_settings.sql`

**Edited**
- `src/pages/admin/super/Finances.tsx` + global ledger/fundraising hooks → currency-aware aggregation
- `src/components/admin/SuperAdminLayout.tsx` (menu)
- `src/App.tsx` (routes)

**Deleted**
- `src/pages/admin/super/Currencies.tsx`

### Validation
- Settings save round-trips base currency; Finance dashboard re-aggregates immediately on base-currency change (react-query invalidation).
- Creating a pair USD→KES with bid=128 ask=130 converts a KES 13,000 regional expense to ≈ USD 100 (using mid 129) in Finance KPIs.
- Removing the standalone Currency Management link leaves no broken nav.
