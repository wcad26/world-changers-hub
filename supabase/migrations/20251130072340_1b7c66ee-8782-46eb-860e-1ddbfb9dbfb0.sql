-- Fix incorrect visitor event data for Bertony TCHUATA
-- 1. Update member's rated_event_id to correct Ignite event
UPDATE public.members
SET rated_event_id = '394776f2-d3cb-43bb-9f05-d970e530930e'
WHERE id = '9501f0b0-c563-4ec6-a514-a598262bbf5b';

-- 2. Move attendance record to correct attendance_event (Ignite)
UPDATE public.attendance_records
SET event_id = '4db623f5-ac90-4e01-ba65-70f00cb3a9fc'
WHERE id = 'a9f940bd-19f2-4757-9dea-03b3f650221d';

-- 3. Delete orphaned attendance_event (Grace Celebration Meeting - Nov 30)
DELETE FROM public.attendance_events
WHERE id = 'bb0f042d-a6c8-4726-aeff-505d87574264';