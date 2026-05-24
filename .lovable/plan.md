## Scope

Single file: `src/components/admin/super/locations/RegionsLocationsTab.tsx`. No DB changes.

## Definitions (mirrors `MemberKPICards.tsx`)

Working set: all rows from `members` where `status != 'inactive'`. Apply per-row in this order:

1. **Child** → in `buildChildrenSet(members, relationships)` (age<16 AND linked to an adult via `member_relationships`). Excluded from every other bucket.
2. **Special Event Visitor** → `member_type='visitor'` AND `rated_event_id IN specialEventIds`. Excluded from Members count.
3. **Regular Visitor** → `member_type='visitor'` AND not special.
4. **Member** → `member_type='member'`.

**"Members" KPI + table column = Members + Regular Visitors** (i.e. every non-child row that is NOT a special-event visitor).

## Data fetched

- `members`: `id, region_id, member_type, rated_event_id, profiles(date_of_birth)` where `status != 'inactive'`.
- `member_relationships` via `fetchMemberRelationshipsForMembers(allMemberIds)`.
- `events`: `id, region_id` where `is_special = true` → build `specialEventIdsByRegion: Map<region, Set<eventId>>` (using global Set is fine — `rated_event_id` is unique enough; matches the regional KPI approach).
- DCG attendants (last 4 weeks):
  - `attendance_events`: `id, dcg_id` where `dcg_id IS NOT NULL` AND `event_date >= today-28d`. Resolve `dcg_id → region_id` via `dcgs` (already useful to fetch once: `id, region_id`).
  - `attendance_records`: `event_id, member_id` where `event_id IN (...)` AND `is_present = true`.
  - Per region: count of distinct `member_id`.

## Per-region aggregation

For each region build counts:
- `members` = non-child rows that are Member OR Regular Visitor.
- `children` = child rows.
- `dcgMembers` = unique attendant count for region (last 28d).
- `dcgs` (existing) unchanged.

KPI cards:
- **Total Members** = sum of new per-region `members`.
- **Total DCG Members** = sum of per-region unique attendants (replaces the old `dcg_members.is_active` count so KPI matches the column).
- Total Regions / Total DCGs unchanged.

## Table

New column order: `Name | Code | President | Members | DCGs | DCG Members | Children | Actions`. Empty-state `colSpan` → 8.

## Out of scope

Regional Dashboard, Region report page, sorting/filtering, schema changes.
