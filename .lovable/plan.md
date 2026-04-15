

## Plan: Upgrade Member KPI Cards with Active % and Events-Style Design

### What Changes

Update the 5 KPI cards on the Members page to match the Events page design pattern, adding:
1. **30-day growth rate** with trend icons (TrendingUp/TrendingDown) — already calculated, just needs visual upgrade
2. **Active percentage** — new metric showing what % of individuals in each card category attended ≥50% of the last 5 regional events

### Data Fetching (New Query)

Add a query to fetch the last 5 regional (non-DCG) attendance events and their attendance records for the region:

```tsx
const { data: recentAttendance } = useQuery({
  queryKey: ['member-kpi-activity', userRegion?.id],
  queryFn: async () => {
    // Get last 5 regional events (no dcg_id)
    const { data: events } = await supabase
      .from('attendance_events')
      .select('id')
      .eq('region_id', userRegion!.id)
      .is('dcg_id', null)
      .order('event_date', { ascending: false })
      .limit(5);
    if (!events?.length) return { eventCount: 0, records: [] };
    const eventIds = events.map(e => e.id);
    // Get attendance records for those events
    const { data: records } = await supabase
      .from('attendance_records')
      .select('member_id, is_present')
      .in('event_id', eventIds)
      .eq('is_present', true);
    return { eventCount: events.length, records: records || [] };
  },
  enabled: !!userRegion?.id,
});
```

### Active Percentage Calculation

Build a `Set` of active member IDs (attended ≥50% of last 5 regional events), then for each KPI category compute:
- `activeCount` = members in that category who are in the active set
- `activePercent` = `Math.round((activeCount / totalInCategory) * 100)`

### KPI Card Visual Upgrade

Match the Events page pattern — each card gets 3 rows:
1. **Icon + Label** (top)
2. **Count** (large number)
3. **Active: X%** (small text, like "Avg: N attendees" on events)
4. **Growth trend** with TrendingUp/TrendingDown icons and colored text

### Files Modified
- `src/pages/admin/regional/Members.tsx` — Add attendance query, compute active %, update KPI card rendering to match Events page style

