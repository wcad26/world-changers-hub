-- Delete attendance records for the duplicate event
DELETE FROM attendance_records WHERE event_id = '789d851b-88b1-4bc7-ba57-20521c927fd6';

-- Delete the duplicate attendance event
DELETE FROM attendance_events WHERE id = '789d851b-88b1-4bc7-ba57-20521c927fd6';