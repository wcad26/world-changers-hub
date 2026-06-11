## 1. Default display currency to Super Admin base currency (EUR), not USD

**Problem:** `useBaseCurrencyCode()` in `src/hooks/useSystemSettings.ts` returns `"USD"` while the query is loading (`q.data || "USD"`). `SuperFinances`'s `useEffect` sees that `"USD"` fallback first, sets `displayCurrency = "USD"`, and never re-syncs when the real base (`EUR`) arrives.

**Fix in `src/pages/admin/super/Finances.tsx`:**
- Use the raw query data (not the fallback) to decide when to sync.
- Track whether the user has manually changed the display currency. Until they do, keep `displayCurrency` mirrored to the resolved base currency.
- Effect logic: when `!userOverride && baseCode` resolves, set `displayCurrency = baseCode`. `setDisplayCurrency` from `DisplayCurrencySelect` flips `userOverride = true`.

This way the initial render (and any subsequent base-currency change) shows EUR for this Super Admin.

## 2. Global Campaigns table — add Pledges column + row actions dropdown

File: `src/components/admin/super/finances/GlobalCampaignsTab.tsx`

**Pledges column (inserted right after Goal):**
- Pledges per campaign = sum of `event_pre_registrations.pledge_amount` for all `events` where `events.linked_fundraising_campaign_id = campaign.id` (excluding `pledge_status = 'cancelled'`).
- Add a hook `useGlobalCampaignPledges(campaignIds)` in `src/hooks/useGlobalFundraising.ts` that returns `{ [campaignId]: { amount, currency_code } }`. Strategy:
  1. Query `events` for `id, linked_fundraising_campaign_id` where the campaign id is in the provided list.
  2. Query `event_pre_registrations` for those event ids, summing `pledge_amount` grouped by event → campaign.
- Display amount uses the same `renderAmount` logic (native or converted to display currency via `convert`).

**Row actions dropdown (replaces the red trash icon):**
- Three-dot `MoreHorizontal` trigger → `DropdownMenu` with:
  - **View report** → `navigate(`/admin/super/finances/fundraising/${campaign.id}`)`
  - **Edit** → opens an `EditFundraisingCampaignDialog` (reuses the regional component, which works against `fundraising_campaigns` directly).
  - **Delete** → opens `AlertDialog` confirmation, then calls `useDeleteGlobalCampaign`. (Replaces the current `window.confirm`.)

Mirrors the regional `FundraisingCampaignRowActions` pattern.

## 3. Super Admin Fundraising Campaign Report page (identical to regional)

**New route:** `/admin/super/finances/fundraising/:campaignId`

**New file:** `src/pages/admin/super/FundraisingCampaignReport.tsx`
- Copy the regional `FundraisingCampaignReport.tsx` and adapt:
  - Back link → `/admin/super/finances`.
  - Currency: don't depend on `userRegion`; resolve currency from `campaign.currency_code` against the `useCurrencies()` list. No region fallback needed (global campaigns have `region_id = null`).
  - Same KPIs (Raised, Goal, Progress, Donors, Avg, Days), goal progress bar, description, weekly donation trend chart, top donors collapsible, all-donations collapsible with `FundraisingDonationRowActions` and `ViewDonationDialog`.
  - Add a "Pledges" KPI sourced from the new pledges query (count + total amount) — useful since the user is explicitly tracking pledges now.
  - Edit button reuses `EditFundraisingCampaignDialog`.

**Register route in `src/App.tsx`** under the Super Admin section, wrapped by the existing Super Admin auth guard, same way other Super Admin routes are wired.

## Technical notes

- `event_pre_registrations.pledge_currency_code` may differ from campaign currency — when aggregating across events, sum per currency and convert through `useFxConverterFor(displayCurrency)` for the table cell; in the per-campaign report, show native total with a converted line if it differs from campaign currency.
- No DB changes required.
- No edge function changes.

```text
Files touched
─ src/hooks/useSystemSettings.ts            (expose raw base code if needed)
─ src/pages/admin/super/Finances.tsx        (effect: sync to base until user override)
─ src/hooks/useGlobalFundraising.ts         (+ useGlobalCampaignPledges, + useCampaignPledges)
─ src/components/admin/super/finances/GlobalCampaignsTab.tsx  (Pledges col, actions dropdown)
─ src/components/admin/super/finances/GlobalCampaignRowActions.tsx  (new)
─ src/pages/admin/super/FundraisingCampaignReport.tsx  (new)
─ src/App.tsx                                (new route)
```
