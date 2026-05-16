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
  - Add `useUpdateFundraisingCampaign` (updates name, description, goal, dates, image, status, is_public).
  - Add `useDeleteFundraisingCampaign` (deletes campaign; donations cascade or are blocked—will verify and adjust). Invalidates `fundraising_campaigns`, `region_donations`, `fundraising_analytics`, `campaign_donations`.
  - Add `useFundraisingCampaign(id)` single fetcher for the report page.
- `src/components/admin/regional/FundraisingTabContent.tsx`
  - Add `useNavigate`; make `<TableRow>` `cursor-pointer` with `onClick` → navigate to report page.
  - Replace the View button cell with `<FundraisingCampaignRowActions campaign={campaign} />`, wrapped in a cell that `stopPropagation`s clicks.
- `src/App.tsx`
  - Register new protected route `finances/fundraising/:campaignId` under the existing regional admin shell, rendering `FundraisingCampaignReport`.

## Campaign Report page structure

Route: `/admin/regional/finances/fundraising/:campaignId`

Sections:
1. **Header** — back button, campaign name, status badge, share + edit actions (edit opens same dialog), period (start → end or "Ongoing").
2. **Hero KPIs** — Raised, Goal, Progress %, Donors count, Average donation, Days remaining/elapsed.
3. **Progress panel** — large `Progress` bar with raised/goal labels and % to goal (2 decimals).
4. **Trend chart** — donations over time (daily/weekly bar or line) using `recharts` (already in deps). Uses `campaign_donations` aggregated by day.
5. **Top donors** — table of top 10 donors by total contributed (respecting anonymous flag).
6. **Donation feed** — full paginated donations table (date, donor, amount, message, actions reusing existing `FundraisingDonationRowActions`).
7. **Description & meta** — campaign description, created date, visibility, image.

Data sources:
- `useFundraisingCampaign(id)` for campaign row.
- `useCampaignDonations(id)` for donation list (already exists).
- Region currency via `useRegionCurrency`.

## Technical notes

- Currency formatting uses `formatCurrencyWithSymbol` consistently.
- All new dialogs follow the glass-dialog standard already used by `CreateFundraisingCampaignDialog`.
- Row click handler must check `event.target` isn't inside the dropdown / action cell — solved by wrapping the actions `<TableCell>` with `onClick={e => e.stopPropagation()}` (same pattern already used in `FundraisingTransactionsCard`).
- No DB migration is required unless delete fails due to FK constraint; if so, a migration will add `ON DELETE CASCADE` for `fundraising_donations.campaign_id`. Will verify before implementing.
