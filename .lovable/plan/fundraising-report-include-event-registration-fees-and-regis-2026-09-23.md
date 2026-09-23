# Fundraising report: include event registration fees and registration pledges

## What's wrong today
The campaign report (Regional and Super Admin) counts only recorded donations. Linked special events already hold money people committed to at registration, but none of it shows:

- WCA Douala Annual Retreat 2026: 19 registrations, F 248,000 in fees, F 900 in pledges (stored in minor units), 0 marked paid
- WCA Yaounde Annual Retreat: 14 registrations, F 85,000 in fees
- DESCO CMR 2026: 165 registrations, F 31,750 in pledges

## What the report will show
KPI cards split into:
- **Collected**: donations received plus fees marked paid
- **Committed (awaiting cash)**: unpaid registration fees plus active pledges (from registration and from the campaign), counted as "requested to pay, deposit pending"
- **Total committed**: collected plus committed, measured against the goal
- Goal, Progress, Contributors, Average, Days remaining keep working on the new totals

Goal progress bar: two segments, solid for collected and lighter for pending, with a legend showing both amounts and percentages.

New **Contribution breakdown** card: registration fees (paid / unpaid / waived), registration pledges, campaign pledges, and direct donations, each with a count and amount. Waived fees are listed but not counted.

Donation trend chart: adds a "Committed" line built from registration dates next to collected donations, using the finance colours (income = emerald, pledges = violet, fees = amber).

New collapsible **Registration contributions** list: name, category (Leader/Member/Child/Family), fee, fee status, pledge, and date, with search. The existing Pledges list gets registration pledges added and labelled "via registration".

The 1M/3M/6M/YTD/1Y/Custom filters apply to all of these.

## Scope
Both portals' campaign report pages. Regional admins see only their own region's campaigns and events. Nothing changes in how fees or pledges are saved or calculated.

## Technical details
- New shared hook `useCampaignContributions(campaignId)`: loads `events` where `linked_fundraising_campaign_id = campaignId`, then `event_pre_registrations` (fee amount/status/category, `fee_is_group`, pledge fields, created_at), `fundraising_pledges`, and `fundraising_donations`. Amounts are stored in minor units (divide by 100).
- Group-billed fees (`fee_is_group`) count once per group (primary row) so families aren't double counted.
- Shared `CampaignContributionSummary` module for the calculations; both `src/pages/admin/{regional,super}/FundraisingCampaignReport.tsx` use it.
- Check that admins can read the registration fields under current access rules. If not, add a read-only rule for the right admins in one migration.
- Verify: the totals match the numbers above, the build passes, and both pages work at mobile and desktop sizes.
