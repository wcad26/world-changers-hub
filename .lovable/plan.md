## Trend chart: per-event points for Regional, weekly max for DCG

In `src/pages/admin/regional/Dashboard.tsx` `trendChartData` useMemo:

### Regional (`eventType === "regional"`)
Drop bucketing entirely. Return one point per event in `perEventPoints`, in chronological order:

```ts
return perEventPoints.map(p => ({
  date: format(p.eventDate, "MMM d"),
  Members: p.Members,
  "Regular Visitors": p["Regular Visitors"],
  Children: p.Children,
}));
```

Each point is a real regional event with its actual attendance numbers — no averaging, no max, no empty buckets.

### DCG (`eventType === "dcg"`)
Keep the existing weekly (7-day) forward-walk max-bucket logic unchanged. DCGs hold weekly across many groups, so weekly max still aggregates them sensibly.

### Implementation
Branch on `eventType` after computing `perEventPoints`:
- `if (eventType === "regional")` → return per-event mapping (no bucket loop needed).
- else (DCG) → run the existing 7-day forward-walk bucket logic.

No changes to filters, KPIs, dropdown, or the rest of the dashboard.

## Validation
- Regional view, any period: one chart point per regional event in the period, labeled by event date, showing that event's actual member/visitor/children counts.
- DCG view, any period: weekly points showing the week's max attendance across DCGs.
- Empty period (no events): empty chart, no crash.
