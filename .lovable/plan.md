

## Plan: Redesign Events Page KPIs and Merge Tables

### KPI Cards Redesign

Replace the 4 current KPI cards (Total Events, Total Attendance, Avg Attendance, Monthly Trend) with:

1. **Total Events** — count of all events, avg attendance across all, growth rate bottom-left
2. **Regional Events** — count where `dcg_id IS NULL && !is_special`, avg attendance, growth rate
3. **DCG Events** — count where `dcg_id IS NOT NULL`, avg attendance, growth rate
4. **Special Events** — count where `is_special === true`, avg attendance, growth rate

Each card shows:
- Top: icon + label, count as large number
- Middle: "Avg: X attendees" as secondary text
- Bottom-left: growth percentage badge (comparing avg attendance this month vs last month)

**Attendance mapping**: Link events to attendance data via `source_event_id` on `attendanceData`. For each event, find matching attendance records and compute average attendance per category.

### Unified Events Table

Remove the `Tabs` (Upcoming/Past) and replace with a single glass panel containing:
- Header with "Events" title + "Add Event" button
- Filter row: search input + event type dropdown (All, Regional, DCG, Special) + time filter dropdown (All, Upcoming, Past)
- Single table showing all events with columns: Event Name, Type, Date, Time, Location, Status, Capacity, Actions

New state variables: `eventTypeFilter` and `timeFilter` replacing the tabs.

Filter logic:
- **Regional**: `dcg_id === null && !is_special`
- **DCG**: `dcg_id !== null`
- **Special**: `is_special === true`
- **Upcoming**: `start_datetime >= now`
- **Past**: `start_datetime < now`

Add a "Status" column showing Upcoming/Completed/Cancelled badge.

### Files Modified
- `src/pages/admin/regional/Events.tsx` — KPI cards, analytics computation, table structure, filter state

### Technical Details

Update `analyticsData` useMemo to compute per-category metrics:

```tsx
const regionalEvents = events.filter(e => !e.dcg_id && !e.is_special);
const dcgEvents = events.filter(e => !!e.dcg_id);
const specialEvents = events.filter(e => e.is_special);

// Map attendance to events via source_event_id
const getAvgAttendance = (eventList) => {
  const matched = attendanceData.filter(a => 
    eventList.some(e => e.id === a.source_event_id)
  );
  return matched.length > 0 ? Math.round(matched.reduce((s, a) => s + a.total_present, 0) / matched.length) : 0;
};

// Growth: compare this month's avg vs last month's avg per category
```

