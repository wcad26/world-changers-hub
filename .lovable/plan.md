

## Plan: Enhance Members Page KPIs, Visitor Differentiation, and Fix Filters

### Changes

**1. Fix Children Filter Bug**
The `filteredMembers` useMemo (line 133) is missing `memberRelationships` in its dependency array. When `memberRelationships` loads after the initial render, the filter doesn't recompute. Add it to the deps.

**2. Split Visitors into Special vs Regular KPIs**
Replace the single "Visitors" KPI card with two cards:
- **Event Visitors** — visitors whose `rated_event_id` links to an event with `is_special = true`
- **Regular Visitors** — visitors whose `rated_event_id` links to a non-special event or has no linked event

This requires fetching event data for visitors. Add a query to fetch events for all visitor `rated_event_id` values, then compute counts.

**3. Add Growth Percentage to Total and Members KPIs**
Compare current count vs count from 30 days ago (using `join_date`). Display a green/red percentage badge in the bottom-right of the Total and Members cards.

**4. Update Type Filter Dropdown**
Replace the single "Visitor" option with:
- `visitor_special` — "Special Event Visitors"
- `visitor_regular` — "Regular Visitors"

Update the filter logic to use the event linkage data.

**5. Expand Grid to 5 KPI Cards**
Change from `md:grid-cols-4` to `md:grid-cols-5` to accommodate the extra card.

### Technical Details

**New query** — Fetch events for visitor `rated_event_id`:
```tsx
const visitorEventIds = members?.filter(m => m.member_type === 'visitor' && m.rated_event_id)
  .map(m => m.rated_event_id) || [];

const { data: visitorEvents } = useQuery({
  queryKey: ['visitor-events', visitorEventIds.sort().join(',')],
  queryFn: async () => {
    const { data } = await supabase.from('events')
      .select('id, is_special')
      .in('id', visitorEventIds);
    return data || [];
  },
  enabled: visitorEventIds.length > 0,
});
```

**Growth calculation:**
```tsx
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
const newMembersThisMonth = members?.filter(m => 
  m.member_type === 'member' && m.join_date && new Date(m.join_date) >= thirtyDaysAgo
).length || 0;
const totalMembers = members?.filter(m => m.member_type === 'member').length || 0;
const growthPct = totalMembers > 0 ? Math.round((newMembersThisMonth / (totalMembers - newMembersThisMonth)) * 100) : 0;
```

**Filter logic update:**
```tsx
} else if (memberTypeFilter === 'visitor_special') {
  typeMatch = member.member_type === 'visitor' && specialEventIds.has(member.rated_event_id);
} else if (memberTypeFilter === 'visitor_regular') {
  typeMatch = member.member_type === 'visitor' && !specialEventIds.has(member.rated_event_id);
}
```

### Files Modified
- `src/pages/admin/regional/Members.tsx` — All changes in this single file

