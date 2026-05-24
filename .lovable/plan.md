## Goal

Fix the Members count (KPI card + Members column) in `src/components/admin/super/locations/RegionsLocationsTab.tsx` so it follows the established formula:

**Members = Members + Regular Visitors − Children**, where a **Regular Visitor** is a unique visitor who has attended at least one regional meeting that is NOT a special event.

## Changes (single file)

`src/components/admin/super/locations/RegionsLocationsTab.tsx`

1. Fetch `events` ids where `is_special = true` → `specialEventIds` set.
2. Fetch `attendance_events` (id, region_id, source_event_id, dcg_id). Treat an attendance event as **regional non-special** when `dcg_id IS NULL` AND (`source_event_id IS NULL` OR `source_event_id NOT IN specialEventIds`).
3. Fetch `attendance_records` where `is_present = true` for those non-special regional event ids (chunked `in()` of 200). Build `regularAttendees: Set<member_id>`.
4. Recompute `membersByRegion`:
   - Skip children (existing `buildChildrenSet`).
   - `member_type = 'member'` → counts.
   - `member_type = 'visitor'` → counts only if `regularAttendees.has(m.id)`.
5. Both the **Total Members KPI card** and the **Members column** already read from `membersByRegion` — no UI changes needed.

Children and DCG Members logic untouched. No DB changes. No other files touched.
