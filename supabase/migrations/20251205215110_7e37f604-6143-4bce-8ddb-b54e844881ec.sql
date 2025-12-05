-- Fix existing attendance event for IGNITE CAMPUS REVOLUTION ESIAC 2025
-- Link the attendance_event to its source event so certificate generation can find attendees
UPDATE attendance_events 
SET source_event_id = '7edcd6f3-83ab-4462-a7a7-95ae6096856b'
WHERE id = '4896165f-e525-4fa8-8401-81380706013c'
AND source_event_id IS NULL;