-- Complete the DCG creation process by creating the missing DCG
-- Using the location that was already created
INSERT INTO dcgs (
  name,
  description,
  location,
  meeting_day,
  meeting_time,
  contact_phone,
  leader_id,
  region_id,
  is_active
) VALUES (
  'Kotto DCG',
  'A Destiny Care Group led by Robert Akia Wiysenyuy',
  'Downtown Community Center',
  'Sunday',
  '10:00',
  '+237682082558',
  (SELECT id FROM members WHERE profile_id = '692a0530-10d0-4360-8f67-f27a9adbc788' LIMIT 1),
  'dbf432ef-5844-4558-b385-698e17be919e',
  true
) RETURNING id;

-- Create the DCG user session for the leader
INSERT INTO dcg_user_sessions (
  dcg_id,
  user_id,
  is_active
) VALUES (
  (SELECT id FROM dcgs WHERE name = 'Kotto DCG' AND region_id = 'dbf432ef-5844-4558-b385-698e17be919e'),
  '692a0530-10d0-4360-8f67-f27a9adbc788',
  true
);