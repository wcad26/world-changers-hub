
## 1. Fix Pledges KPI currency symbol (Fundraising Campaign Report)

In `src/pages/admin/regional/FundraisingCampaignReport.tsx` and `src/pages/admin/super/FundraisingCampaignReport.tsx`, render the Pledges KPI with the campaign currency formatter (same one used by Raised/Goal) instead of the raw `pledge_currency_code`. Convert pledge sums into campaign currency via the existing FX util so the symbol matches ("₣ 50,000").

## 2. Cross-region donation recording

Anyone with finance access (regional admin or super admin) can record a donation against ANY campaign across all regions. Listing of campaigns is still scoped: regions see only their own campaigns in their Fundraising tab; super admin sees all in the Global Campaigns tab.

- `RecordDonationDialog.tsx` (regional): broaden its campaign loader to fetch all `fundraising_campaigns` (regional + global), with the region name shown next to each campaign in the dropdown.
- `GlobalCampaignsTab.tsx`: add a "Record Donation" button next to "Create Campaign", reusing the same dialog component.
- RLS: verify and (if needed) relax the `fundraising_donations` INSERT policy so an authenticated user with a finance role can insert against any campaign regardless of region. SELECT policy stays as-is (regional admins still only see their own donations in their tab; super admin sees all). Surface a migration if the current policy blocks this.

## 3. Replace "Top donors" with "Pledges" table (both report pages)

Replace the Top Donors card in `src/pages/admin/regional/FundraisingCampaignReport.tsx` and `src/pages/admin/super/FundraisingCampaignReport.tsx` with a Pledges table.

**Source:** `event_pre_registrations` joined to its `event` (where `linked_fundraising_campaign_id = campaignId`), `pledge_amount > 0`, `pledge_status != 'cancelled'`. Paid % per pledge = sum(`fundraising_donations.amount` where `event_pre_registration_id = preReg.id`) / `pledge_amount` × 100 (capped at 100). Donor name/region/type comes from `members` → `profiles` + `regions` when `member_id` is set; otherwise from the pre-reg `email`/`phone` and labeled Visitor.

**Columns:** Name · Region · Type (Member/Visitor) · Pledge (amount + currency) · Status (paid % with progress bar + remaining) · Actions:
- **Redeem** — opens `RecordDonationDialog` pre-filled with campaign + donor + remaining balance, and stamps `event_pre_registration_id` on the new donation.
- **Edit** — new `EditPledgeDialog` to adjust amount / currency / status / notes (updates `event_pre_registrations`).
- **Delete** — confirmation, then delete the pledge fields from the pre-reg (or hard-delete the row if it has no attendance dependency — decided at build time).

**Filters above the table:** search by name/email, region filter, type filter (member/visitor), status filter (unpaid / partial / fully paid).

New files: `PledgesCard.tsx`, `EditPledgeDialog.tsx`, and a `useCampaignPledgesDetailed(campaignId)` hook.

## 4. Rebuild Special Event Report (`src/pages/admin/super/SpecialEventReport.tsx` + regional equivalent)

Planning-focused dashboard for the event team. No pledge/financial data — that lives in the finance module.

### Terminology fix
"Party size" is removed as a user-facing concept. Today the field is not collected on the registration form, so the column is empty. Lodging unit size is computed from the family group (`group_id` + primary + linked family members). If a future need arises for non-family parties, the form needs a new question — flagged but out of scope here.

### Header
Event name, date range, back link, Export CSV (current selection / current tab).

### Top KPI row (glass cards)
- Total Registered (individuals · families)
- Adults / Youth (15–17) / Children (<15)
- Gender split (M / F)
- Lodging needed (families + individuals needing lodging, total beds across all nights)
- Total person-nights (sum of nights across attendees)
- Meal coverage (count of attendees by meal preference, top tag)

### Tabs (modern glass design)

1. **Overview** — at-a-glance charts:
   - Age group pie · Gender pie · Region distribution bar
   - Member vs Visitor split
   - Daily attendance curve (headcount per date between any attendee's arrival and departure)
   - Daily beds-needed curve (headcount per date among parties needing lodging)

2. **Attendees** — full searchable/filterable table:
   - Columns: Name · Region · Type (Member/Visitor) · Age Group (Adult ≥18 / Youth 15–17 / Child <15) · Gender · Phone · Arrival · Departure · Nights · Family group indicator · Meal pref tags · Allergy flag.
   - Filters: search · region · type · age group · gender · arrival date · departure date · meal preference · "has allergy/dietary note" · "needs lodging".
   - CSV export of the filtered set.

3. **Families & Lodging** — primary unit for room planning:
   - Grouped list by `group_id`: primary attendee at the top, then each family member with age group, gender, relationship hint (child/adult).
   - Per family: total size, adults / youth / children breakdown, arrival → departure, nights, "needs lodging" flag, dietary notes summary, meal preferences summary.
   - Side panel: daily beds-needed chart broken down by family vs individual.
   - Filters: needs lodging only · has children · region · arrival/departure window.
   - Individual (non-family) registrants needing lodging shown separately so the planner can match singles into shared rooms.

4. **Meals & Dietary** — full reporting on what we currently collect but don't show:
   - Stacked bar / pie of meal_preferences counts across all attendees.
   - Breakdown by day (using arrival/departure to compute who is on-site each day × their meal pref) so the kitchen can plan portions per day per preference.
   - Allergy & dietary notes list: every attendee with a non-empty `dietary_notes`, alongside name, region, and the raw note. Simple keyword highlight for common allergens (nuts, gluten, dairy, shellfish, etc.) for quick visibility.
   - Filter by meal pref / dietary keyword / day.

5. **Travel & Schedule** — arrival/departure planning:
   - Table of arrival dates × headcount, departure dates × headcount.
   - List of attendees grouped by arrival day for pickup coordination.
   - Nights distribution histogram.

### Data layer
- New hook `useSpecialEventReport(eventId)`:
  - `event_pre_registrations` for the event (all fields).
  - Join `members` → `profiles` (name, DOB → age group, gender, region) when `member_id` is set; otherwise use pre-reg `email`/`phone` and label Visitor / region "—".
  - Family grouping via `group_id` + `is_primary`.
  - Per-day rollups computed in the hook (`arrival_date` → `departure_date` inclusive).
- Empty/missing data handled gracefully (the form doesn't collect everything — show "—" rather than crash).

### Filters
Global filter bar (search, region, type, age group, gender, needs-lodging, has-allergy, date range) that applies across every tab. Each tab can layer its own extra filters.

## Technical notes
- Reuse existing `formatMoney`, FX converter, glass UI primitives (`GlassSection`, `GlassKPICard`).
- All new dialogs follow the glass dialog standard.
- No schema changes other than possibly the donations RLS relaxation in §2.
- Charts via existing `recharts` setup used elsewhere.

## Execution order
1. §1 (currency symbol — trivial).
2. §2 (RLS check → migration if needed → UI: regional dialog campaign list + super admin button).
3. §3 (Pledges card + Edit/Delete + Redeem wiring).
4. §4 (Special Event Report rebuild).
