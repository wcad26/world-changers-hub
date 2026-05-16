## Problem

On `/admin/regional/finances` → Fundraising tab, the KPI cards show `Total Raised ₣ 0`, `Combined Goal ₣ 0`, `Goal Progress 0%`, `Active Campaigns 0`, even though the campaigns table clearly shows `WCA ARENA DLA` with `Raised ₣ 100,000` / `Goal ₣ 40,000,000` and the Transactions card lists a ₣ 100,000 donation.

Root cause is in `FundraisingLedgerTab.tsx`:

```ts
const inRange = campaigns.filter(c => {
  const start = new Date(c.start_date).getTime();
  const end   = new Date(c.end_date).getTime(); // c.end_date is nullable → NaN/0
  return end >= range.from.getTime() && start <= range.to.getTime();
});
```

When a campaign has no `end_date` (open-ended), `new Date(null).getTime()` is `0`, so the `end >= range.from` test fails and the campaign is dropped → all KPIs collapse to 0.

There is also a semantic gap: "Total Raised" currently uses each campaign's lifetime `raised` total instead of donations actually made within the selected period, which doesn't match the "In selected period" hint under the KPI.

## Plan

### 1. Fix the period-overlap filter (KPI denominator)
In `FundraisingLedgerTab.tsx`:
- Treat `end_date = null` as "ongoing" (overlaps any period that starts on/after `start_date`).
- Treat invalid/missing `start_date` as `-Infinity` so legacy rows are not silently excluded.
- Keep filter inclusive: `start <= range.to && (end == null || end >= range.from)`.

### 2. Make "Total Raised" reflect period donations (not lifetime)
Use the existing `useRegionDonations(range.from, range.to)` hook (already powering the Transactions card) to sum donation amounts whose `donation_date` falls inside the selected period. Convert from cents.

This matches the "In selected period" hint and stays consistent with the transactions list.

### 3. Recompute KPIs from the corrected sets
- `Total Raised` = sum of in-period donations (from hook above) / 100.
- `Combined Goal` = sum of `goal` for campaigns overlapping the period / 100.
- `Goal Progress` = `Total Raised / Combined Goal * 100`, rounded, capped at 100, `0%` when goal is 0.
- `Active Campaigns` = count of overlapping campaigns whose `status = 'Active'`.

### 4. Verify the other sections already use real data
- `FundraisingTabContent` already lists real campaigns from `useFundraisingCampaigns` — no change needed beyond status filter behavior.
- `FundraisingTransactionsCard` already pulls live donations from `useRegionDonations` and formats per campaign currency — no change.
- The Refresh button added previously already invalidates `fundraising_campaigns`, `region_donations`, `fundraising_analytics`, `campaign_donations`, and `useCreateDonation` invalidates the same on submit, so KPIs auto-refresh after a new donation.

### 5. Edge cases to handle
- Campaign with `end_date` in the past but donations inside selected period → still count its donations (donations are filtered by `donation_date`, not by campaign window).
- Multiple currencies across campaigns: keep current behavior (display in region currency); a follow-up could group by `currency_code` if needed — out of scope unless requested.

## Files to modify

- `src/components/admin/regional/finances/FundraisingLedgerTab.tsx` — fix overlap filter, wire in `useRegionDonations`, recompute the four KPIs.

No DB, hook, or other component changes required.
