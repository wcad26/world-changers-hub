

## Comprehensive Dashboard Reporting Overhaul, DCG Regional Events, and Family Relationships

This is a large feature set with three main areas: (1) fixing and enriching dashboard report tabs, (2) showing regional events in DCG portals with attendance capability, and (3) introducing a family relationship system.

---

### Part 1: Fix and Enrich Dashboard Report Tabs

#### 1A. Members Tab — Add Real KPI Cards and Reports

**File: `src/components/admin/regional/dashboard/tabs/MembersTab.tsx`**

Currently this tab only renders a `TrendChart` with no KPI cards visible. The `activeMembers` and `inactiveVisitors` calculations use placeholder logic (`return true`). Fix:

- Add 6 KPI cards: Total Members, Total Visitors, New This Month, Active Members (attended at least 1 of last 3 events — requires querying `attendance_records` per member), Member-to-Visitor Ratio, Average Attendance Rate
- Replace placeholder attendance logic with real queries joining `attendance_records` to `members` to determine who actually attended
- Add a member growth chart (monthly new members over time, calculated from `members.join_date`)
- Add a gender distribution pie chart (from `profiles.gender`)
- Add a member type breakdown bar chart (members vs visitors over time)
- Add a recent joiners table showing last 10 members who joined

#### 1B. Finance Tab — Replace All Mock Data

**File: `src/components/admin/regional/dashboard/tabs/FinanceTab.tsx`**

Currently uses `mockSummaryData` with hardcoded values (58000, 39000, etc.). Fix:

- Use `useFinancialSummary` and `useFinancialTransactions` hooks (already exist) to pull real data
- Replace mock summary with actual `financialSummary` values
- Calculate real monthly growth by comparing current month income vs previous month
- Calculate real transaction count and average transaction size from `financial_transactions`
- Find actual top income and expense categories by aggregating `financial_transactions` grouped by `category_id`
- Use `formatWithCurrency` with `useRegionCurrency` (already partially done) for all currency displays

**File: `src/components/admin/regional/dashboard/tabs/FinancialTrendChart.tsx`**

Currently uses mock data array. Fix:

- Query `financial_transactions` grouped by month, summing income and expenses per month
- Replace `mockFinancialData` with real aggregated monthly data
- Add category breakdown pie chart (income by source, expenses by type)

#### 1C. Locations Tab — Fix Duplicate DCG Issue

**File: `src/components/admin/regional/dashboard/tabs/LocationsTab.tsx`**

The "DCG Locations" count comes from `locations.filter(l => l.type === 'DCG Location')` which queries the `locations` table. The duplicates are not from DCGs but from the locations table itself. Need to:

- Check if the `locations` table has duplicate entries and deduplicate in the query or display
- Add more KPI cards: Total Capacity, Locations with Fellowship Times, Locations by City/State breakdown
- Add a map view placeholder or city distribution chart
- Add a capacity utilization comparison if attendance data can be linked to locations

#### 1D. Discipleship Tab — Add More Reports

**File: `src/components/admin/regional/discipleship/DiscipleshipTab.tsx`**

Currently shows 4 KPI cards and nothing else (the table and filters are defined but the JSX cuts off at line 146). Fix:

- Add the relationship table back (it was removed/truncated) showing mentor-disciple pairs with status, start date, and latest milestone
- Add a milestone distribution chart showing how many disciples are at each stage (Talking Stage, First Visit, etc.)
- Add a trend chart showing new relationships created per month
- Add a mentor leaderboard showing top mentors by number of active disciples

#### 1E. Fundraising Tab — Replace Mock Data with Real Data

**File: `src/components/admin/regional/dashboard/tabs/FundraisingTab.tsx`**

Currently uses `Math.random()` to generate fake trend data and hardcoded trend percentages (+12.5%, +8.3%, +5.2%). Fix:

- Remove `generateTrendData()` random data generator
- Build real trend data from `fundraising_donations` grouped by month
- Use `useRegionCurrency` with `formatWithCurrency` instead of hardcoded USD formatting
- Calculate real success rate from campaigns where `raised >= goal`
- Calculate real growth by comparing current vs previous period donations
- Show actual campaign progress with real currency formatting

#### 1F. DCG Tab — Minor Cleanup

The DCG tab already uses real data via `useRegionalDcgReports`. No major changes needed, just ensure glass styling consistency.

---

### Part 2: DCG Portal Sees Regional Events + Records Attendance

#### 2A. Show Regional Events in DCG Portal

**File: `src/hooks/useDcgEvents.ts`**

Update `useDcgEvents` to also fetch events from the same region (not just DCG-specific events). Add a new hook `useRegionalEventsForDcg` that fetches events where `region_id = dcg.region_id` AND `dcg_id IS NULL` (regional events, not other DCGs' events).

**File: `src/pages/dcg/Events.tsx`**

Add a third tab "Regional Events" showing events created by the regional admin. These events should have a "Record Attendance" action so DCG leaders can track which of their members attended regional events.

#### 2B. RLS Policies for DCG Access to Regional Events

**Database migration:**

- Add SELECT policy on `events` table allowing `dcg_admin` users to read events where `region_id = get_region_from_dcg(get_user_dcg(auth.uid()))` — this lets them see regional events
- The existing attendance RLS policies already allow DCG admins to create `attendance_events` and `attendance_records` for their DCG, so no changes needed there since `findOrCreateAttendanceEvent` already sets `dcg_id`

---

### Part 3: Family Relationship System

#### 3A. New Database Table: `member_relationships`

**Database migration:**

```sql
CREATE TYPE public.family_relationship_type AS ENUM (
  'spouse', 'parent', 'child', 'sibling', 'guardian', 'other'
);

CREATE TABLE public.member_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  related_member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  relationship_type family_relationship_type NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  created_by uuid,
  UNIQUE(member_id, related_member_id)
);

ALTER TABLE public.member_relationships ENABLE ROW LEVEL SECURITY;
```

RLS policies:
- Regional admins can manage relationships in their region (via member's region)
- Super admins can manage all
- Members can view their own relationships

#### 3B. Reciprocal Relationship Logic

When "Member A is spouse of Member B" is created, automatically create the inverse "Member B is spouse of Member A". Handle via a database trigger or application logic. Mapping:
- spouse ↔ spouse
- parent ↔ child
- sibling ↔ sibling
- guardian ↔ child

#### 3C. New Hook: `useMemberRelationships`

**File: `src/hooks/useMemberRelationships.ts`** (new)

- `useMemberRelationships(memberId)` — fetch all relationships for a member with profile data
- `useCreateMemberRelationship()` — create relationship + reciprocal
- `useDeleteMemberRelationship()` — delete relationship + reciprocal

#### 3D. Add Relationship Management to Member Forms

**File: `src/components/admin/regional/RegisterMemberForm.tsx`**

Add an optional "Family Relationships" section at the bottom of the form. After member creation, allow linking to existing members as family.

**File: `src/components/admin/regional/EditMemberForm.tsx`**

Add a "Family Relationships" section showing existing relationships with ability to add/remove. Display a searchable member dropdown with relationship type selector.

**File: `src/pages/admin/regional/MemberProfile.tsx`**

Add a "Family" card showing linked family members with relationship type badges.

#### 3E. New Component: `FamilyRelationshipsSection`

**File: `src/components/admin/regional/FamilyRelationshipsSection.tsx`** (new)

Reusable component for viewing and managing family ties:
- Shows existing relationships in a compact list with badges (Spouse, Parent, Child, Sibling)
- "Add Relationship" button opens a dialog with member search and relationship type select
- Delete button to remove relationships

---

### Part 4: Data Cleanup

**Database operation (via insert tool):**

- Check for orphaned DCG references or duplicate location entries causing the inflation in the Locations tab
- Verify `Wolt-Test` and `Phose DCG` — these appear to be test DCGs. If the user confirms, they should be cleaned up (members reassigned or deleted)

---

### Files Changed Summary

| File | Action |
|------|--------|
| `src/components/admin/regional/dashboard/tabs/MembersTab.tsx` | Rewrite — add real KPI cards, growth chart, gender chart |
| `src/components/admin/regional/dashboard/tabs/FinanceTab.tsx` | Rewrite — replace all mock data with real queries |
| `src/components/admin/regional/dashboard/tabs/FinancialTrendChart.tsx` | Rewrite — real monthly data from transactions |
| `src/components/admin/regional/dashboard/tabs/LocationsTab.tsx` | Fix duplicates, add more KPIs |
| `src/components/admin/regional/dashboard/tabs/FundraisingTab.tsx` | Rewrite — remove random data, use real donations + region currency |
| `src/components/admin/regional/discipleship/DiscipleshipTab.tsx` | Add relationship table, milestone chart, mentor leaderboard |
| `src/hooks/useDcgEvents.ts` | Add `useRegionalEventsForDcg` hook |
| `src/pages/dcg/Events.tsx` | Add "Regional Events" tab |
| `src/hooks/useMemberRelationships.ts` | New — CRUD for family relationships |
| `src/components/admin/regional/FamilyRelationshipsSection.tsx` | New — reusable family management UI |
| `src/components/admin/regional/EditMemberForm.tsx` | Add family relationships section |
| `src/pages/admin/regional/MemberProfile.tsx` | Add family card |
| Database migration | `member_relationships` table + RLS + DCG events SELECT policy |

