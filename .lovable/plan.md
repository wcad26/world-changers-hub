## Changes to `src/pages/admin/regional/Dashboard.tsx`

### 1. Remove "All Events" from the event type filter

- Drop the `<SelectItem value="all">All Events</SelectItem>` option (line 528).
- Change the default state to `useState("regional")` (line 46).
- The two filter branches in `kpis` (lines 198, 231) already handle only `"regional"` and `"dcg"` — the implicit "all" fallback becomes unreachable, no further logic change needed.

### 2. Make the current month appear even when the bucket window hasn't fully elapsed

Today the trend buckets are built by walking **backwards** from `endDate` (today) in fixed `bucketDays` (14 for regional, 7 for DCG) steps. This anchors the most recent bucket so its start hugs `endDate` (e.g. `[Apr 30, May 14]` labeled "Apr 30"), so May events get folded into an "Apr 30" point and no May label ever appears.

Fix: anchor buckets at `startDate` and walk **forward**. The last bucket is allowed to be partial — clamped to `endDate` (inclusive). This way:

- 3M view ending May 14: …, `Apr 25–May 9`, `May 9–May 14` (partial, label "May 9"). Any May event falls into a bucket whose label is in May.
- 1M view ending May 14: `Apr 14–28`, `Apr 28–May 12`, `May 12–May 14` (partial). The current week/biweek of the month is preserved as its own point even before the full window has elapsed.
- DCG view: same forward-walk logic, `bucketDays = 7`.

Empty partial buckets (no events) stay at 0 and still render — that's acceptable since by construction the partial bucket only exists when it falls inside the selected period.

### Technical edit (lines 363–379)

Replace the backward-walk loop with a forward-walk that produces `[start, end)` windows of `bucketDays`, clamping the final window's `end` to `endDate + 1ms`. Keep the existing max-aggregation logic and the chronological order (no `reverse()` needed).

```ts
const buckets: { start: Date; end: Date; label: string;
  m: number; v: number; c: number }[] = [];
const periodEnd = new Date(endDate);
periodEnd.setHours(23, 59, 59, 999);
let cursor = new Date(startDate);
cursor.setHours(0, 0, 0, 0);
while (cursor <= periodEnd) {
  const next = new Date(cursor);
  next.setDate(next.getDate() + bucketDays);
  const end = next > periodEnd ? new Date(periodEnd.getTime() + 1) : next;
  buckets.push({
    start: new Date(cursor),
    end,
    label: format(cursor, "MMM d"),
    m: 0, v: 0, c: 0,
  });
  cursor = next;
}
```

Drop the `n` field (already unused since switching to max).

## Validation

- Filter shows only "Regional Events" / "DCG Events"; default loads Regional.
- 3M Regional view on May 14 shows a final bucket labeled in May reflecting the May regional event(s).
- 1M DCG view on May 14 shows a final partial weekly bucket labeled in May when DCG attendance exists for that week.
