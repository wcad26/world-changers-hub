## Goal
Persist the region's currency on campaigns instead of defaulting to USD.

## Changes

**`src/hooks/useFundraisingCampaigns.ts`**
- `useCreateFundraisingCampaign`: fetch region's `currency_code` (via `useRegionCurrency(userRegion?.id)`) and include it on insert (`currency_code: regionCurrency?.code || 'USD'`).
- `useCreateDonation`: same — default to the region's currency rather than hard-coded `'usd'`.

**`src/components/admin/regional/CreateFundraisingCampaignDialog.tsx`**
- No structural change. (Already shows the region currency symbol; no extra UI needed.)

No DB migration required — `fundraising_campaigns.currency_code` already exists.
