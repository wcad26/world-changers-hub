-- Delete orphaned attendance events where source_event_id is NULL
-- This will cascade delete the associated attendance_records (30 records from 5 events)
DELETE FROM public.attendance_events
WHERE source_event_id IS NULL;