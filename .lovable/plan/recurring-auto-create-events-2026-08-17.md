# Recurring (Auto-Create) Events

Let event creators in the Regional, Super Admin and DCG portals mark an event as recurring. The system then keeps future occurrences created automatically, so weekly meetings never have to be duplicated by hand.

## How it works for the user

1. In the Create/Edit Event dialog there is a new "Repeat this event" switch.
2. When switched on, the creator sets:
   - Frequency: weekly, every 2 weeks, monthly (same weekday), or custom day-interval
   - Day(s) of the week (for weekly patterns)
   - Time and duration (taken from the first occurrence)
   - How far ahead to create events: 1 week / 1 month / 3 months (creator's choice)
   - Optional end date (blank = repeat forever)
3. Saving creates the first occurrences immediately, so the series is visible right away.
4. A daily background job tops the series up so the chosen lead time is always filled.
5. Every auto-created occurrence also gets its attendance session created automatically, so scanning and attendance recording work with no extra step.
6. In the events list, occurrences carry a "Recurring" badge. A new "Recurring Series" management view lets admins pause, resume, edit or end a series.

## Editing and deleting

- Editing a series (name, location, time, frequency) updates future, not-yet-started occurrences only; past ones stay untouched.
- Editing one occurrence detaches only that occurrence from the series.
- Deleting a series offers: delete future occurrences only, or keep them as standalone events.
- Pausing a series stops new occurrences without deleting anything.

## Scope by portal

- Regional admins: recurring events for their region.
- DCG admins: recurring events for their DCG.
- Super admins: recurring global events plus visibility over all series.

Permissions mirror the existing event create/edit rules in each portal.

## Technical approach

**Database**
- New table `event_recurrence_rules`: owner scope (`region_id`, `dcg_id`, nullable for global), `template_event_id`, frequency type, interval, `days_of_week`, `start_time`, duration minutes, `lead_time_days` (creator-chosen), `end_date` (nullable), `is_active`, `last_generated_until`, `created_by`, timestamps + update trigger.
- New columns on `events`: `recurrence_rule_id` (FK, nullable), `is_recurring_instance boolean default false`, `detached_from_series boolean default false`.
- GRANTs and RLS on the new table matching existing event policies: region admins scoped by `region_id`, DCG admins by `dcg_id`, super admins full access via `is_super_admin_user`, `service_role` full access for the generator.

**Generation logic**
- Shared generator in a new edge function `generate-recurring-events`:
  - Selects active rules where `last_generated_until < now() + lead_time_days`.
  - Computes missing occurrence dates from the pattern, skipping dates that already exist for that rule.
  - Copies template fields (name, description, category, location, address, capacity, cost, currency, image, public/featured flags, French fields).
  - Inserts an `attendance_events` row per occurrence linked via `source_event_id`.
  - Updates `last_generated_until`.
  - Deactivates rules past their `end_date`.
- Scheduled daily with `pg_cron` + `pg_net` (set up via the insert tool, not a migration, since it contains project URL and key).
- The same function is callable on demand from the UI ("Generate now") and is called right after a series is created so occurrences appear immediately.

**Frontend**
- `src/hooks/useRecurringEvents.ts`: CRUD hooks for rules plus a `generateNow` mutation.
- `RecurrenceSettings` component (shared) rendered inside:
  - `src/pages/admin/regional/Events.tsx` create/edit dialogs
  - `src/pages/admin/super/Events.tsx`
  - `src/components/admin/dcg/CreateEventDialog.tsx`
- `RecurringSeriesDialog` for listing/pausing/ending series, opened from each portal's Events page toolbar.
- Recurring badge and series filter added to the existing event tables.
- Edit/delete flows get the "this occurrence vs. future occurrences" choice.

Duplicate protection: a unique index on (`recurrence_rule_id`, `start_datetime`) prevents double generation if the job runs twice.
