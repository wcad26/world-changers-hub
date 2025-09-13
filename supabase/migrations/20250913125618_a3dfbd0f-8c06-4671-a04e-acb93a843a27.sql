-- First, let's see what data exists for this user
-- Delete from profiles table
DELETE FROM profiles WHERE id = '36243d46-de76-4cc6-b787-1165aeb61ff9';

-- Delete from members table (if they are a member)
DELETE FROM members WHERE profile_id = '36243d46-de76-4cc6-b787-1165aeb61ff9';

-- Delete from user_roles table (any remaining roles)
DELETE FROM user_roles WHERE user_id = '36243d46-de76-4cc6-b787-1165aeb61ff9';

-- Delete from dcg_user_sessions table
DELETE FROM dcg_user_sessions WHERE user_id = '36243d46-de76-4cc6-b787-1165aeb61ff9';

-- Delete from regional_user_roles table
DELETE FROM regional_user_roles WHERE user_id = '36243d46-de76-4cc6-b787-1165aeb61ff9';

-- Delete from discipleship_relationships (as mentor or disciple)
DELETE FROM discipleship_relationships WHERE mentor_id = '36243d46-de76-4cc6-b787-1165aeb61ff9' OR disciple_id = '36243d46-de76-4cc6-b787-1165aeb61ff9';

-- Delete from attendance_records
DELETE FROM attendance_records WHERE member_id = '36243d46-de76-4cc6-b787-1165aeb61ff9';

-- Delete from communications created by this user
DELETE FROM communications WHERE created_by = '36243d46-de76-4cc6-b787-1165aeb61ff9';

-- Delete from financial_transactions recorded by this user
UPDATE financial_transactions SET recorded_by = NULL WHERE recorded_by = '36243d46-de76-4cc6-b787-1165aeb61ff9';

-- Delete from attendance_events created by this user
UPDATE attendance_events SET created_by = NULL WHERE created_by = '36243d46-de76-4cc6-b787-1165aeb61ff9';

-- Delete from events created by this user
UPDATE events SET created_by = NULL WHERE created_by = '36243d46-de76-4cc6-b787-1165aeb61ff9';

-- Finally, delete from auth.users (this should cascade to related tables)
DELETE FROM auth.users WHERE id = '36243d46-de76-4cc6-b787-1165aeb61ff9';