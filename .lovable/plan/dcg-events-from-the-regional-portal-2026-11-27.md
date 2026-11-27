# DCG events from the Regional portal

## What admins will be able to do
1. **Create a DCG event** – In "Create New Event", a new choice at the top: **Regional event** or **DCG event**. Choosing DCG event shows a required **DCG** dropdown listing the region's DCGs (with member counts).
2. **Edit** – The Edit Event dialog shows the same choice, prefilled, so an event can be moved to another DCG or turned back into a regional event.
3. **See it clearly** – DCG events keep the "DCG" badge in the events list, now with the DCG name, and still count under the DCG KPI tile/filter (not in regional figures).
4. **Mark attendance** – When "Mark attendance" is opened on a DCG event, the list shows **only active members of that DCG** (header reads "DCG · <name>"). Saving writes attendance for that DCG only, so it shows in the DCG portal, the DCG's dashboard and the DCG's profile page exactly like attendance recorded by the DCG leader.
5. DCG leaders also see these events in their own DCG portal automatically.

## Rules
- A DCG event cannot also be a Special event (special-event options hidden when DCG is chosen).
- DCG must be chosen before saving a DCG event.
- Regional events behave exactly as today.

## Technical details
- `src/pages/admin/regional/Events.tsx`: add `event_scope` ('regional'|'dcg') + `dcg_id` to the form schema (refine: dcg_id required when scope=dcg); segmented control + DCG Select (from `useDcgs`) in create and edit dialogs; save `dcg_id` on insert/update and force `is_special=false` for DCG events; pass `dcg_id` to recurrence rules.
- `AttendanceManagementDialog.tsx`: accept `event.dcg_id`; when set, load `dcg_members` (active) for that DCG and restrict both the visible list and saved records to them; create the attendance event with `dcg_id` set (existing-attendance lookup unchanged, keyed on source event).
- No database changes needed: `events.dcg_id` and `attendance_events.dcg_id` already exist and regional admins already have region-scoped write access.
