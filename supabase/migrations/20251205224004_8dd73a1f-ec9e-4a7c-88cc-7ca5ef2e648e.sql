-- Merge duplicate attendance events for IGNITE CAMPUS REVOLUTION ESIAC 2025
-- The visitor-created event: 4896165f-e525-4fa8-8401-81380706013c (has source_event_id)
-- The admin-created duplicate: 789d851b-4ee7-4d58-9d8b-d55af3adfcd0

-- First, migrate any unique is_present=true records from the duplicate to the original
INSERT INTO attendance_records (event_id, member_id, is_present, recorded_at)
SELECT 
  '4896165f-e525-4fa8-8401-81380706013c' as event_id,
  ar.member_id,
  ar.is_present,
  ar.recorded_at
FROM attendance_records ar
WHERE ar.event_id = '789d851b-4ee7-4d58-9d8b-d55af3adfcd0'
  AND ar.is_present = true
  AND NOT EXISTS (
    SELECT 1 FROM attendance_records existing 
    WHERE existing.event_id = '4896165f-e525-4fa8-8401-81380706013c' 
    AND existing.member_id = ar.member_id
  )
ON CONFLICT (event_id, member_id) DO UPDATE SET is_present = true;

-- Delete the attendance records from the duplicate event
DELETE FROM attendance_records 
WHERE event_id = '789d851b-4ee7-4d58-9d8b-d55af3adfcd0';

-- Delete the duplicate attendance event
DELETE FROM attendance_events 
WHERE id = '789d851b-4ee7-4d58-9d8b-d55af3adfcd0';