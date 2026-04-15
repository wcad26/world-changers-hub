

## Plan: Fix Events Table, Add Attendance Column, Add Period Filter

### 1. Fix Build Error
Line 1595 has a duplicate `};` causing the syntax error. Remove the extra closing brace.

### 2. Fix Table Column Alignment
The Actions dropdown button currently shows "Actions" text. Change to only show the `MoreHorizontal` icon (three dots) so it fits properly under the Actions column header.

### 3. Replace Status Column with Attendance Column
- Remove the "Status" column header and cell
- Add "Attendance" column after Capacity
- For each event, look up attendance via `attendanceData` (which has `source_event_id` mapping to `event.id`) and show `total_present`
- For future events (`start_datetime >= now`), show "-" instead of a number

### 4. Add Period Filter at Top of Page
Reuse the existing `PeriodFilter` component pattern from the dashboard. Place it at the very top of the page, above the KPI cards.

Add state:
```tsx
const [periodFilters, setPeriodFilters] = useState<PeriodFilters>({
  dateRange: { from: undefined, to: undefined },
  quickDateRange: '1-year',
});
```

Initialize with a default range (e.g., 1Y).

### 5. Apply Period Filter to Events and KPIs
- Filter `events` by `start_datetime` within the selected date range before computing `analyticsData` and `filteredEvents`
- Create a `periodFilteredEvents` intermediate that applies date range, then pass that into both analytics and table filtering

### Files Modified
- `src/pages/admin/regional/Events.tsx` — Fix duplicate `};`, add period filter state, import PeriodFilter, add attendance column, remove status column, apply period filtering to analytics and table

### Technical Details

**Attendance lookup per event:**
```tsx
const getEventAttendance = (eventId: string) => {
  if (!attendanceData) return 0;
  const matched = attendanceData.filter(a => a.source_event_id === eventId);
  return matched.reduce((sum, a) => sum + a.total_present, 0);
};
```

**Period filtering applied before analytics:**
```tsx
const periodFilteredEvents = React.useMemo(() => {
  if (!events) return [];
  return events.filter(e => {
    const d = new Date(e.start_datetime);
    if (periodFilters.dateRange.from && d < periodFilters.dateRange.from) return false;
    if (periodFilters.dateRange.to && d > periodFilters.dateRange.to) return false;
    return true;
  });
}, [events, periodFilters]);
```

Then `analyticsData` and `filteredEvents` use `periodFilteredEvents` instead of raw `events`.

