# DCG Profile Page Rebuild

Make the DCG profile page (`src/pages/admin/regional/DcgProfile.tsx`) feel like the regional Dashboard, with a page-wide period filter, a real DCG-scoped attendance trend, and a members table styled like the Member Directory.

## 1. Page-wide period filter (header row)

Add filter controls on the same row as the "Edit Location" button in the header.

- Quick-period pill group: **1M · 3M · 6M · 1Y · Custom** (same UI as `Dashboard.tsx` lines 503–540).
- Custom range opens a Calendar Popover (range mode, 2 months).
- State: `quickPeriod` (default `"1-month"`) and `customRange`.
- Computed `dateRange` (`from`, `to`) drives every period-aware widget on the page.

Header layout becomes:
```text
[ DCG Name + description ]                     [ 1M 3M 6M 1Y Custom ] [ Edit Location ] [ Active ]
[ meta chips: Leader · Location · Day · Time · Contact ]
```

## 2. Period applied across the page

Filter these in-memory by `dateRange`:

- **KPIs**
  - Total Members → unchanged (active members in DCG, not period-bound).
  - Total Income → sum of DCG transactions where `transaction_date` ∈ range and category type = income.
  - Total Expenses → same with category type = expense.
  - Net Balance → income − expenses for the range.
- **Trend chart** uses the same range (see §3).
- **Financials tab "Recent Transactions"** restricted to range, sorted desc.

`useFinancialTransactions` is already returning all transactions; filter client-side by date.

## 3. DCG-scoped Attendance Trend (same look as Dashboard)

Replace the `<DcgAttendanceTrendChart />` card with an inline AreaChart that mirrors the regional Dashboard "Attendance Trend" (lines 612–692): gradient-filled `Members`, `Regular Visitors`, `Children` areas, custom tooltip, semantic tokens, 380px height, weekly buckets.

Data source: `useAttendanceHistoryWithMemberTypes(userRegion?.id)` (same hook used by the dashboard). Filter rows to **this DCG only** by matching `a.dcg_id === dcgId` OR attendance whose `source_event_id` resolves to an event with `dcg_id === dcgId` (so DCG-recorded entries are included).

Bucketing logic: copy the dashboard's "DCG" branch (weekly 7-day buckets, forward-walked from `dateRange.from`) since each DCG meets weekly. One point per week, summing `members_present`, `visitors_present`, `children_present` per bucket. Empty period → "No attendance data for the selected period".

Outcome: chart looks identical to the dashboard chart, but scoped to one DCG.

## 4. Members table rebuilt like Member Directory

Replace the current vertical list of member cards on the Members tab with a table styled exactly like `src/pages/admin/regional/Members.tsx` (lines 248–410):

- Glass card wrapper with header (icon + title "DCG Members" + subtitle + "Add Member" button — keep current dialogs if present, otherwise just a placeholder removed).
- Toolbar row: search input (name / phone / email), status filter (all / active / inactive), DCG-role filter (all / Leader / Assistant / Member), Export CSV button showing filtered count.
- Table columns: **Name** (Last First), **Address** (hidden on small), **Phone** (hidden on xs), **DCG Role** (Badge), **Member Status**, **Joined Date** (hidden on lg-down), **Actions** (dropdown: View → `/admin/regional/members/:id`, Remove from DCG via existing `useRemoveMemberFromDcg`).
- Row click → navigate to member profile.
- Skeleton + empty-state rows.

CSV export columns: Member ID, Name, Email, Phone, Address, DCG Role, Status, Joined Date.

## 5. Tabs

Keep the current 2-tab layout: **Members** | **Financials** (no Attendance tab).

## Technical notes

- File touched: `src/pages/admin/regional/DcgProfile.tsx` only.
- New imports: `useState`, `useMemo`, `format`, `subMonths`, recharts (`AreaChart`, `Area`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `Legend`, `ResponsiveContainer`), `Calendar`, `Popover`, `Select`, `Input`, `DropdownMenu`, `Table*`, `Papa` (papaparse), `cn`.
- Reuse: `useAttendanceHistoryWithMemberTypes`, `useRegionalEvents` (to resolve `source_event_id`→DCG), `useDcgMembers`, `useFinancialTransactions`, `useRemoveMemberFromDcg`, `GlassKPICard`, `GlassSection`.
- Remove dependency on `DcgAttendanceTrendChart` and `useRegionalDcgReports` from this page.
- Stay within frontend/presentation; no schema or hook changes.

## Verification

1. Open `/admin/regional/dcg/<id>`.
2. Header shows period buttons next to "Edit Location"; default 1M.
3. Switch to 6M / 1Y / Custom — Income, Expenses, Net Balance, Trend chart, and Financials list all update.
4. Trend chart renders DCG-only data with the same gradients/tooltip as the regional Dashboard chart.
5. Members tab shows table with search/status/role filters, CSV export with filtered count, row click → member profile, dropdown actions work.
