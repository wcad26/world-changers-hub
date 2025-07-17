-- Fix RLS policies to allow DCG admins to manage attendance events for their DCG
-- Drop existing restrictive policy for attendance_events
DROP POLICY IF EXISTS "Admins can manage attendance events in their region" ON public.attendance_events;

-- Create new policies that include DCG admins
CREATE POLICY "Regional and DCG admins can manage attendance events" ON public.attendance_events
FOR ALL 
USING (
  (has_role(auth.uid(), 'regional_admin'::app_role) AND region_id = get_user_region(auth.uid())) OR
  has_role(auth.uid(), 'super_admin'::app_role) OR
  (has_role(auth.uid(), 'dcg_admin'::app_role) AND dcg_id = get_user_dcg(auth.uid()))
);

-- Fix RLS policy for attendance_records to include DCG admins
DROP POLICY IF EXISTS "Admins can manage attendance records in their region" ON public.attendance_records;

CREATE POLICY "Regional and DCG admins can manage attendance records" ON public.attendance_records
FOR ALL 
USING (
  (has_role(auth.uid(), 'regional_admin'::app_role) AND EXISTS (
    SELECT 1 FROM attendance_events 
    WHERE attendance_events.id = attendance_records.event_id 
    AND attendance_events.region_id = get_user_region(auth.uid())
  )) OR
  has_role(auth.uid(), 'super_admin'::app_role) OR
  (has_role(auth.uid(), 'dcg_admin'::app_role) AND EXISTS (
    SELECT 1 FROM attendance_events 
    WHERE attendance_events.id = attendance_records.event_id 
    AND attendance_events.dcg_id = get_user_dcg(auth.uid())
  ))
);

-- Create function to generate recurring DCG attendance events
CREATE OR REPLACE FUNCTION public.generate_dcg_recurring_events(
  _dcg_id UUID,
  _weeks_ahead INTEGER DEFAULT 8
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  dcg_record RECORD;
  current_week DATE;
  event_date DATE;
  meeting_day_num INTEGER;
  events_created INTEGER := 0;
  week_counter INTEGER := 0;
BEGIN
  -- Get DCG information
  SELECT d.*, r.id as region_id 
  INTO dcg_record 
  FROM dcgs d 
  JOIN regions r ON d.region_id = r.id 
  WHERE d.id = _dcg_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'DCG not found';
  END IF;
  
  IF dcg_record.meeting_day IS NULL THEN
    RAISE EXCEPTION 'DCG meeting day not set';
  END IF;
  
  -- Convert meeting day to number (0=Sunday, 1=Monday, etc.)
  meeting_day_num := CASE dcg_record.meeting_day
    WHEN 'Sunday' THEN 0
    WHEN 'Monday' THEN 1
    WHEN 'Tuesday' THEN 2
    WHEN 'Wednesday' THEN 3
    WHEN 'Thursday' THEN 4
    WHEN 'Friday' THEN 5
    WHEN 'Saturday' THEN 6
    ELSE NULL
  END;
  
  IF meeting_day_num IS NULL THEN
    RAISE EXCEPTION 'Invalid meeting day: %', dcg_record.meeting_day;
  END IF;
  
  -- Start from current week
  current_week := DATE_TRUNC('week', CURRENT_DATE);
  
  -- Generate events for the specified number of weeks
  WHILE week_counter < _weeks_ahead LOOP
    -- Calculate the event date for this week
    event_date := current_week + (week_counter * INTERVAL '1 week') + (meeting_day_num * INTERVAL '1 day');
    
    -- Only create events for future dates or today
    IF event_date >= CURRENT_DATE THEN
      -- Check if event already exists for this date
      IF NOT EXISTS (
        SELECT 1 FROM attendance_events 
        WHERE dcg_id = _dcg_id 
        AND event_date = event_date
      ) THEN
        -- Create the attendance event
        INSERT INTO attendance_events (
          region_id,
          dcg_id,
          name,
          event_date,
          description,
          created_by
        ) VALUES (
          dcg_record.region_id,
          _dcg_id,
          dcg_record.name || ' - ' || dcg_record.meeting_day || ' Meeting',
          event_date,
          'Regular ' || dcg_record.meeting_day || ' meeting for ' || dcg_record.name,
          auth.uid()
        );
        
        events_created := events_created + 1;
      END IF;
    END IF;
    
    week_counter := week_counter + 1;
  END LOOP;
  
  RETURN events_created;
END;
$$;

-- Create function to get next DCG meeting
CREATE OR REPLACE FUNCTION public.get_next_dcg_meeting(_dcg_id UUID)
RETURNS TABLE(
  event_id UUID,
  event_name TEXT,
  event_date DATE,
  is_today BOOLEAN,
  is_upcoming BOOLEAN
)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT 
    id as event_id,
    name as event_name,
    event_date,
    event_date = CURRENT_DATE as is_today,
    event_date >= CURRENT_DATE as is_upcoming
  FROM attendance_events 
  WHERE dcg_id = _dcg_id 
    AND event_date >= CURRENT_DATE
  ORDER BY event_date ASC
  LIMIT 1;
$$;