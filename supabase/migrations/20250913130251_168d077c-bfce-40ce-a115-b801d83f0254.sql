-- Delete all data for user adrien.juin@gmail.com (ID: ffca7292-5e9b-48a3-9c49-524e53b5e56f)

-- Delete from profiles table
DELETE FROM profiles WHERE id = 'ffca7292-5e9b-48a3-9c49-524e53b5e56f';

-- Delete from members table (if they are a member)
DELETE FROM members WHERE profile_id = 'ffca7292-5e9b-48a3-9c49-524e53b5e56f';

-- Delete from user_roles table (any remaining roles including regional admin requests)
DELETE FROM user_roles WHERE user_id = 'ffca7292-5e9b-48a3-9c49-524e53b5e56f';

-- Delete from dcg_user_sessions table
DELETE FROM dcg_user_sessions WHERE user_id = 'ffca7292-5e9b-48a3-9c49-524e53b5e56f';

-- Delete from regional_user_roles table
DELETE FROM regional_user_roles WHERE user_id = 'ffca7292-5e9b-48a3-9c49-524e53b5e56f';

-- Delete from discipleship_relationships (as mentor or disciple)
DELETE FROM discipleship_relationships WHERE mentor_id = 'ffca7292-5e9b-48a3-9c49-524e53b5e56f' OR disciple_id = 'ffca7292-5e9b-48a3-9c49-524e53b5e56f';

-- Delete from attendance_records
DELETE FROM attendance_records WHERE member_id = 'ffca7292-5e9b-48a3-9c49-524e53b5e56f';

-- Delete from communications created by this user
DELETE FROM communications WHERE created_by = 'ffca7292-5e9b-48a3-9c49-524e53b5e56f';

-- Update financial_transactions recorded by this user (set to NULL to preserve data integrity)
UPDATE financial_transactions SET recorded_by = NULL WHERE recorded_by = 'ffca7292-5e9b-48a3-9c49-524e53b5e56f';

-- Update attendance_events created by this user (set to NULL to preserve data integrity)
UPDATE attendance_events SET created_by = NULL WHERE created_by = 'ffca7292-5e9b-48a3-9c49-524e53b5e56f';

-- Update events created by this user (set to NULL to preserve data integrity)
UPDATE events SET created_by = NULL WHERE created_by = 'ffca7292-5e9b-48a3-9c49-524e53b5e56f';

-- Update fundraising campaigns created by this user (set to NULL to preserve data integrity)
UPDATE fundraising_campaigns SET created_by = NULL WHERE created_by = 'ffca7292-5e9b-48a3-9c49-524e53b5e56f';

-- Update member_targets created by this user (set to NULL to preserve data integrity)
UPDATE member_targets SET created_by = NULL WHERE created_by = 'ffca7292-5e9b-48a3-9c49-524e53b5e56f';

-- Update regional_roles created by this user (set to NULL to preserve data integrity)
UPDATE regional_roles SET created_by = NULL WHERE created_by = 'ffca7292-5e9b-48a3-9c49-524e53b5e56f';

-- Update communication_templates created by this user (set to NULL to preserve data integrity)
UPDATE communication_templates SET created_by = NULL WHERE created_by = 'ffca7292-5e9b-48a3-9c49-524e53b5e56f';

-- Update global_content created by this user (set to NULL to preserve data integrity)
UPDATE global_content SET created_by = NULL WHERE created_by = 'ffca7292-5e9b-48a3-9c49-524e53b5e56f';
UPDATE global_content SET updated_by = NULL WHERE updated_by = 'ffca7292-5e9b-48a3-9c49-524e53b5e56f';

-- Finally, delete from auth.users (this should cascade to related tables)
DELETE FROM auth.users WHERE id = 'ffca7292-5e9b-48a3-9c49-524e53b5e56f';