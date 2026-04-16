

## Plan: Rebuild Regional Admin Dashboard — Single-Page Overview

Complete rewrite of `src/pages/admin/regional/Dashboard.tsx` to replace the tabbed layout with a single scrollable dashboard providing a global view of all management areas.

### Layout Structure

```text
┌─────────────────────────────────────────────────────┐
│ STICKY FILTER BAR                                   │
│ [1M][3M][6M][1Y][Custom]  [Regional▾/DCG]  [🔍]    │
├─────────────────────────────────────────────────────┤
│ KPI ROW (6 cards)                                   │
│ Members | Children | Discipleship | Regional Events │
│         | DCG Events | Attendance Target            │
├─────────────────────────────────────────────────────┤
│ ATTENDANCE TREND CHART (full width)                 │
│ Lines: Members, Regular Visitors, Children          │
│ Horizontal dashed line = attendance target          │
├─────────────────┬───────────────────────────────────┤
│ GENDER DIST.    │  TITHERS & INCOME                 │
│ Bar Chart (2/3) │  Card (1/3)                       │
│ Adult F, Young F│  Total tithers count              │
│ Adult M, Young M│  Income growth indicator          │
│ Unknown (cond.) │                                   │
└─────────────────┴───────────────────────────────────┘
```

### 1. Sticky Filter Bar (top, fixed on scroll)

- **Period filter**: 1M, 3M, 6M, 1Y, Custom (reuse `PeriodFilter` component pattern)
- **Event type dropdown**: "All Events", "Regional Events", "DCG Events"
- **Search input**: filters events by keyword (event name)
- Wrapped in `sticky top-0 z-10 bg-background/95 backdrop-blur-sm` to stay fixed during scroll

### 2. KPI Cards (6 cards, glassmorphism style)

| Card | Value | Sub-metric |
|------|-------|------------|
| Members | members + regular visitors count | Active %, 30-day growth |
| Children | children count | Active %, 30-day growth |
| Discipleship Success Rate | % (became_member milestone) | "Reached membership milestone" |
| Regional Events | count of non-DCG/non-special events | Avg attendees, attendance growth |
| DCG Events | count of DCG events | Avg attendees, attendance growth |
| Attendance Target | % of capacity reached | Based on sum of regional event `attendance_target` vs actual attendance |

### 3. Attendance Trend Chart (full width, Recharts)

- **Lines**: Members (blue), Regular Visitors (green), Children (pink)
- **Horizontal reference line**: attendance target from `member_targets` or event capacity
- Uses `useAttendanceHistoryWithMemberTypes` data, filtered by period and event type
- Smooth curves (`type="monotone"`), modern styling with gradients
- Responsive container, clean axis formatting

### 4. Bottom Row: Gender Distribution + Tithers Card

**Gender Distribution Bar Chart (2/3 width)**:
- Query members' `gender` and `date_of_birth` from profiles
- Categories: Adult Females (≥16, female), Young Females (<16, female), Adult Males (≥16, male), Young Males (<16, male)
- "Unknown" bar only if count > 0
- Vertical bar chart with distinct colors

**Tithers & Income Card (1/3 width)**:
- Count distinct members who have tithe transactions in the period
- Income growth: compare current period income to previous equivalent period
- Glassmorphism card matching other KPI cards

### Data Sources

- `useMembers(regionId)` — member/visitor/child categorization
- `useAttendanceHistoryWithMemberTypes(regionId)` — attendance trend with member type breakdown
- `useDiscipleshipRelationships(regionId)` + `discipleship_progress` — success rate
- `useRegionalEvents()` — event counts and capacity/attendance_target
- `useFinancialSummary(filters)` + `useFinancialTransactions(filters)` — tithe count, income growth
- `useCurrentMemberTarget()` — attendance target line
- Activity query (reuse pattern from `MemberKPICards`) — active %

### Files Modified
- `src/pages/admin/regional/Dashboard.tsx` — **full rewrite**, no tabs, single-page dashboard with all sections

### Technical Notes
- Recharts `LineChart`, `BarChart`, `ReferenceLine` for charts
- All computations filtered by period filter state and event type dropdown
- Gender query uses existing `profiles.gender` and `profiles.date_of_birth` fields
- Tithe transactions identified by `financial_transaction_categories.name === 'Tithes'`
- Mobile responsive: KPI grid collapses to 2 cols, charts stack vertically

