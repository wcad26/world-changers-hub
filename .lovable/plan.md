## Plan: Fix the Attendance Trend chart

1. **Fix the attendance data source**
   - Update `useAttendanceHistoryWithMemberTypes` so it returns one chart record per attendance event instead of collapsing all events that share the same `event_date`.
   - Keep event identity (`event_id`, `event_name`, `source_event_id`) intact so multiple meetings on the same day can all be plotted.

2. **Preserve filter behavior**
   - Keep using the dashboard’s existing period, event type, and search filters.
   - For `1M`, plot every matching attendance event in chronological order.
   - For periods greater than `1M`, aggregate by month and average attendance across all matching events in each month.

3. **Improve chart labels for multiple same-day events**
   - For per-event mode, include a stable label key so Recharts does not visually merge same-date points into one x-axis category.
   - Display readable labels like `Apr 15` while keeping unique internal points for each event.

4. **Validation**
   - Run a focused verification to confirm the chart data array contains all events for `1M` and monthly buckets for longer periods.