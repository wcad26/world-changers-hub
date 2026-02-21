
## Fix: Certificate Recipients Not Showing for Global Events

### Root Cause

The self-service attendance form is working correctly -- 7 people have successfully recorded their attendance for "WCA Leadership Academy". The data exists in the database.

The problem is in how the Super Admin Certificates page retrieves event attendees. The `useEventAttendees` hook (in `src/hooks/useAttendance.ts`) requires both an `eventId` AND a `regionId` to work:

```text
if (!eventId || !regionId) return [];  // <-- Returns empty immediately
```

In the Super Admin Certificates page (`src/pages/admin/super/Certificates.tsx`), `regionId` is passed as `undefined` because global events have no region:

```text
useEventAttendees(selectedEventId, undefined)  // regionId = undefined = always empty
```

Additionally, even if `regionId` were passed, the hook filters attendance_events by `.eq('region_id', regionId)`, which would never match global events where `region_id` is NULL.

### The Fix

**File: `src/hooks/useAttendance.ts`** -- Update the `useEventAttendees` hook to support global context:

- Remove the strict requirement for `regionId` -- only require `eventId`
- When `regionId` is provided, filter attendance_events by that region (existing behavior)
- When `regionId` is omitted, fetch attendance_events for the source event across ALL regions (including NULL region_id for global events)
- Update the `enabled` condition to only require `eventId`

**File: `src/pages/admin/super/Certificates.tsx`** -- No changes needed once the hook is fixed, since it already passes `undefined` for regionId which will now trigger the "global" behavior.

### Technical Details

The updated query logic in `useEventAttendees` will be:

```text
// Build query for attendance_events with source_event_id = eventId
let query = supabase
  .from('attendance_events')
  .select('id')
  .eq('source_event_id', eventId);

// If regionId provided, filter by region; otherwise get ALL (global)
if (regionId) {
  query = query.eq('region_id', regionId);
}
```

This change is backward-compatible -- regional admin usage that passes a `regionId` will continue to work exactly as before. Only when `regionId` is omitted (as in the super admin context) will it return attendees across all regions.

### Verification

After the fix, selecting "WCA Leadership Academy" as the associated event in the certificate generation form should show 7 recipients (Adrien Mbougue, Akia Robert, Comfort Takang, Grateful Enyong-Eta, Oben Ayuketah Pearl, Whitney Mbougue, Bernadette Ayungha).
