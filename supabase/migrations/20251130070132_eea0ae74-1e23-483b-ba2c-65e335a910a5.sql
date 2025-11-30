-- Add source_event_id column to attendance_events with CASCADE delete
ALTER TABLE public.attendance_events 
ADD COLUMN source_event_id uuid REFERENCES public.events(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX idx_attendance_events_source_event_id ON public.attendance_events(source_event_id);

-- Link existing attendance_events to their corresponding events
-- This matches events based on date, region, and name pattern
UPDATE public.attendance_events ae
SET source_event_id = e.id
FROM public.events e
WHERE DATE(e.start_datetime) = ae.event_date 
  AND e.region_id = ae.region_id 
  AND ae.name = 'Attendance - ' || e.name
  AND ae.source_event_id IS NULL;