

## Rebuild Regional Admin Dashboard: Fix Reporting, Include DCG Events, Modern Glassy UI

### Problems Identified

1. **Events tab does NOT include DCG events in reporting** -- `useAttendanceHistoryWithMemberTypes` filters by `region_id` only, but DCG attendance events have `dcg_id` set (not `region_id` in some cases). The attendance trend chart and category breakdown miss DCG Meeting events entirely.
2. **Card overlap issues** -- KPI cards grid uses `md:grid-cols-4` but some tabs render 3 cards while MemberCards also renders 4 cards below, causing visual collision. The KPICards component renders for some tabs but not others, creating inconsistent spacing.
3. **Hardcoded/mock values** -- `dcgAttendance = 85` (line 78), `utilizationRate = 75` (line 84), `+12%` hardcoded in Events tab (line 179), "Expected" attendance is fabricated (`* 0.85`).
4. **useMemo inside JSX** -- EventsTab uses `React.useMemo` inline inside JSX return (lines 202-275), which is an anti-pattern and can cause rendering issues.
5. **Bland card design** -- Standard `Card` components with no visual distinction. No glassmorphism or soft design despite having CSS custom properties for it.
6. **Category matching uses event name** -- `attendanceData.filter(a => events.find(e => e.name === a.event_name)?.category === category)` is fragile; should use event ID linkage.

### Plan

#### 1. Fix `useAttendanceHistoryWithMemberTypes` to include DCG events

**File: `src/hooks/useAttendance.ts`**

Update the query to fetch attendance events where `region_id = regionId` OR where the DCG belongs to the region (via `dcg_id` linked to `dcgs.region_id`). This ensures DCG Meeting attendance records appear in the Events tab charts and KPI calculations.

Change: Remove the strict `.eq('region_id', regionId)` filter. Instead, fetch all attendance events for the region including those linked via DCG:
- First fetch DCG IDs for the region
- Then query attendance_events where `region_id = regionId` OR `dcg_id IN (regional_dcg_ids)`

#### 2. Rebuild Dashboard.tsx with glassy UI

**File: `src/pages/admin/regional/Dashboard.tsx`**

- Remove the separate KPICards component rendering outside tab content (causes overlap)
- Each tab content is self-contained with its own KPI section
- Apply `glass-panel-soft` styling to the tab container
- Use softer rounded cards with gradient backgrounds and subtle shadows
- Remove the top-level period filter (each tab has its own PeriodFilter)

#### 3. Rebuild EventsTab with proper data inclusion

**File: `src/components/admin/regional/dashboard/tabs/EventsTab.tsx`**

- Fix the inline `useMemo` anti-pattern -- move all calculations to the top of the component
- Remove hardcoded `+12%` -- calculate real month-over-month change
- Remove fabricated "Expected" values
- Include DCG events in category breakdown by using the updated attendance hook
- Apply glassy card styling with `backdrop-blur`, soft gradients, and rounded corners
- Show event source (Regional vs DCG) in category breakdown

#### 4. Rebuild KPICards with glass design

**File: `src/components/admin/regional/dashboard/KPICards.tsx`**

- Replace plain `Card` with glass-styled cards: `bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-lg border border-white/20 shadow-lg rounded-2xl`
- Remove mock values (`dcgAttendance = 85`, `utilizationRate = 75`)
- Only render for tabs that actually use it (finance, dcg, locations)
- Add subtle icon background circles for visual appeal

#### 5. Rebuild MemberCards with glass design

**File: `src/components/admin/regional/dashboard/MemberCards.tsx`**

- Apply same glass card styling
- Fix the placeholder attendance logic (lines 64-67 return `true` always)

#### 6. Update EventAttendanceTrendChart

**File: `src/components/admin/regional/dashboard/tabs/EventAttendanceTrendChart.tsx`**

- Remove mock "Expected" line (calculated as `total * 0.85`)
- Use actual `attendance_target` from events table if available
- Apply glass card styling

#### 7. Style consistency across all dashboard tabs

Apply glass-panel styling to DCGTab, FinanceTab, LocationsTab, FundraisingTab cards using:
```css
className="bg-gradient-to-br from-white/90 to-purple-50/30 backdrop-blur-sm border-white/40 shadow-soft rounded-2xl"
```

### Files Changed

| File | Action |
|------|--------|
| `src/hooks/useAttendance.ts` | Update `useAttendanceHistoryWithMemberTypes` to include DCG events |
| `src/pages/admin/regional/Dashboard.tsx` | Restructure layout, remove overlap, add glass styling |
| `src/components/admin/regional/dashboard/KPICards.tsx` | Glass card design, remove mock data |
| `src/components/admin/regional/dashboard/MemberCards.tsx` | Glass card design |
| `src/components/admin/regional/dashboard/tabs/EventsTab.tsx` | Fix inline useMemo, remove hardcoded values, glass UI |
| `src/components/admin/regional/dashboard/tabs/EventAttendanceTrendChart.tsx` | Remove mock Expected line, glass styling |

### No Database Changes Required

All attendance data already exists. The fix is in query logic to include DCG-linked attendance events.

