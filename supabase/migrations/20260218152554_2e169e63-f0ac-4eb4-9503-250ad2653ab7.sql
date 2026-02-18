-- Allow attendance_events to have NULL region_id for global/inter-regional events
ALTER TABLE public.attendance_events ALTER COLUMN region_id DROP NOT NULL;