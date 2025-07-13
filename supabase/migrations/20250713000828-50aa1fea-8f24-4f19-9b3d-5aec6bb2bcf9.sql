-- Fix the DCG leader user's roles and region
-- Update the user's region first
UPDATE profiles 
SET region_id = 'dbf432ef-5844-4558-b385-698e17be919e'
WHERE email = 'kottodcg@gmail.com';

-- Add DCG leader role
INSERT INTO user_roles (user_id, role, region_id, is_active)
VALUES ('692a0530-10d0-4360-8f67-f27a9adbc788', 'dcg_leader', 'dbf432ef-5844-4558-b385-698e17be919e', true);

-- Check if there are any locations that were created but no DCGs
-- This will help us understand what failed in the creation process
-- Also check for any partial DCG creation data