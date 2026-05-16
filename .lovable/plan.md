## Goal
1. Replace the single "View" button in the Fundraising Campaigns table actions column with a 3-dot dropdown offering **View**, **Edit**, **Delete**.
2. Make the campaign row itself clickable, navigating to a new dedicated **Campaign Report** page.
3. Build that Campaign Report page with rich, accurate reporting per campaign.

## Files to add

- `src/components/admin/regional/finances/FundraisingCampaignRowActions.tsx`
  - 3-dot `DropdownMenu` mirroring the donation row actions pattern.
  - **View** → navigates to `/admin/regional/finances/fundraising/:campaignId`.
  - **Edit** → opens an `EditFundraisingCampaignDialog` (new).
  - **Delete** → `AlertDialog` confirmation, calls a new `useDeleteFundraisingCampaign` mutation.
- `src/components/admin/regional/EditFundraisingCampaignDialog.tsx`
  - Reuses the same form schema and glass-dialog styling as the create dialog; pre-populates values; calls a new `useUpdateFundraisingCampaign` mutation.
- `src/pages/admin/regional/FundraisingCampaignReport.tsx`
  - Detailed report page (see structure below).

## Files to modify

- `src/hooks/useFundraisingCampaigns.ts`
  - Add `useUpdateFundraisingCampaign` (name, description, goal, dates, image, status, is_public).
  - Add `useDeleteFundraisingCampaign` (donations cascade via existing FK ON DELETE CASCADE — verified).
  - Add `useFundraisingCampaign(id)` single fetcher for the report page.
- `src/components/admin/regional/FundraisingTabContent.tsx`
  - Add `useNavigate`; make `<TableRow>` clickable → navigate to report page.
  - Replace the View button cell with `<FundraisingCampaignRowActions campaign={campaign} />`, wrapped in a cell that stops click propagation.
- `src/App.tsx`
  - Register protected route `finances/fundraising/:campaignId` under the regional admin shell.

## Campaign Report page structure

Route: `/admin/regional/finances/fundraising/:campaignId`

Sections:
1. **Header** — back button, campaign name, status + visibility badges, share + edit actions, period (start → end or "Ongoing").
2. **Hero KPIs** — Raised, Goal, Progress %, Donors count, Average donation, Days remaining/elapsed.
3. **Progress panel** — large progress bar with raised/goal labels and % to goal (2 decimals).
4. **About** — campaign description.
5. **Trend chart** — donations over time aggregated by day (recharts area chart).
6. **Top donors** — table of top 10 donors by total contributed (respecting anonymous flag).
7. **All donations** — full donations table reusing `FundraisingDonationRowActions` and `ViewDonationDialog`.

## Technical notes

- Currency formatting uses `formatCurrencyWithSymbol` with the campaign currency (falls back to region currency).
- All new dialogs follow the glass-dialog standard.
- No DB migration required — `fundraising_donations.campaign_id` already has ON DELETE CASCADE.
