-- Delete all data for user christian.nyutchco@gmail.com (ID: 32815440-bd47-4bb5-a191-30ef007b0aac)

-- Delete from profiles table
DELETE FROM profiles WHERE id = '32815440-bd47-4bb5-a191-30ef007b0aac';

-- Delete from members table (if they are a member)
DELETE FROM members WHERE profile_id = '32815440-bd47-4bb5-a191-30ef007b0aac';

-- Delete from user_roles table (any remaining roles)
DELETE FROM user_roles WHERE user_id = '32815440-bd47-4bb5-a191-30ef007b0aac';

-- Delete from dcg_user_sessions table
DELETE FROM dcg_user_sessions WHERE user_id = '32815440-bd47-4bb5-a191-30ef007b0aac';

-- Delete from regional_user_roles table
DELETE FROM regional_user_roles WHERE user_id = '32815440-bd47-4bb5-a191-30ef007b0aac';

-- Delete from discipleship_relationships (as mentor or disciple)
DELETE FROM discipleship_relationships WHERE mentor_id = '32815440-bd47-4bb5-a191-30ef007b0aac' OR disciple_id = '32815440-bd47-4bb5-a191-30ef007b0aac';

-- Delete from attendance_records
DELETE FROM attendance_records WHERE member_id = '32815440-bd47-4bb5-a191-30ef007b0aac';

-- Delete from communications created by this user
DELETE FROM communications WHERE created_by = '32815440-bd47-4bb5-a191-30ef007b0aac';

-- Update financial_transactions recorded by this user (set to NULL to preserve data integrity)
UPDATE financial_transactions SET recorded_by = NULL WHERE recorded_by = '32815440-bd47-4bb5-a191-30ef007b0aac';

-- Update attendance_events created by this user (set to NULL to preserve data integrity)
UPDATE attendance_events SET created_by = NULL WHERE created_by = '32815440-bd47-4bb5-a191-30ef007b0aac';

-- Update events created by this user (set to NULL to preserve data integrity)
UPDATE events SET created_by = NULL WHERE created_by = '32815440-bd47-4bb5-a191-30ef007b0aac';

-- Finally, delete from auth.users (this should cascade to related tables)
DELETE FROM auth.users WHERE id = '32815440-bd47-4bb5-a191-30ef007b0aac';