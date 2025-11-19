-- Mark visitors who registered on IGNITE event day (2025-11-15) as present attendees
-- This backfills attendance data for visitors who attended but couldn't select the event during registration

INSERT INTO attendance_records (
  id,
  event_id,
  member_id,
  is_present,
  recorded_at
)
SELECT 
  gen_random_uuid(),
  'bebd3f09-bde8-4c84-b8ca-b56978860395'::uuid, -- IGNITE attendance event ID
  m.id,
  true,
  now()
FROM members m
WHERE m.member_type = 'visitor'
  AND DATE(m.created_at) = '2025-11-15'
  AND m.region_id = 'dbf432ef-5844-4558-b385-698e17be919e'
  AND NOT EXISTS (
    SELECT 1 
    FROM attendance_records ar 
    WHERE ar.member_id = m.id 
      AND ar.event_id = 'bebd3f09-bde8-4c84-b8ca-b56978860395'
  );