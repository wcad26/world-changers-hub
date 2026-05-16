## Plan

1. **Fix the database overflow**
   - Add a Supabase migration to convert monetary cent fields from 32-bit `integer` to `bigint`:
     - `fundraising_campaigns.goal`
     - `fundraising_campaigns.raised`
     - `fundraising_donations.amount`
   - This directly fixes the current error: `value "4000000000" is out of range for type integer`.

2. **Keep currency behavior intact**
   - Preserve the current campaign creation code that stores the region currency via `currency_code`.
   - No new UI changes are needed for this failure.

3. **Verify the creation path**
   - Confirm the campaign insert can store large goals like `40,000,000` after conversion to cents.
   - Check that donation updates still work with the existing `update_campaign_raised_amount()` trigger after the columns become `bigint`.

## Technical details

The form stores amounts in major currency units, then `useCreateFundraisingCampaign` converts them to cents with:

```ts
goal: Math.round(campaignData.goal * 100)
```

So `40,000,000` becomes `4,000,000,000`, which exceeds PostgreSQL `integer` max (`2,147,483,647`). Changing the affected amount columns to `bigint` is the correct fix.