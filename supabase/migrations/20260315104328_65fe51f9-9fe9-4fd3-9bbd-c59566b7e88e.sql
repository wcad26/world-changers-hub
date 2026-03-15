-- Nullify FK references for user decb0214-0f39-49bc-89d8-bec7e2c02cd1
UPDATE event_slug_history SET changed_by = NULL WHERE changed_by = 'decb0214-0f39-49bc-89d8-bec7e2c02cd1';
UPDATE events SET created_by = NULL WHERE created_by = 'decb0214-0f39-49bc-89d8-bec7e2c02cd1';
UPDATE attendance_events SET created_by = NULL WHERE created_by = 'decb0214-0f39-49bc-89d8-bec7e2c02cd1';
UPDATE communications SET created_by = NULL WHERE created_by = 'decb0214-0f39-49bc-89d8-bec7e2c02cd1';
UPDATE certificate_templates SET created_by = NULL WHERE created_by = 'decb0214-0f39-49bc-89d8-bec7e2c02cd1';
UPDATE certificates SET issued_by = NULL WHERE issued_by = 'decb0214-0f39-49bc-89d8-bec7e2c02cd1';
UPDATE global_content SET created_by = NULL WHERE created_by = 'decb0214-0f39-49bc-89d8-bec7e2c02cd1';
UPDATE global_content SET updated_by = NULL WHERE updated_by = 'decb0214-0f39-49bc-89d8-bec7e2c02cd1';

-- Now delete user data
DELETE FROM attendance_records WHERE member_id = '2c3bf9e6-f802-4dd8-b332-22b7f6520246';
DELETE FROM certificates WHERE member_id = '2c3bf9e6-f802-4dd8-b332-22b7f6520246';
DELETE FROM financial_transactions WHERE recorded_by = 'decb0214-0f39-49bc-89d8-bec7e2c02cd1';
DELETE FROM user_roles WHERE user_id = 'decb0214-0f39-49bc-89d8-bec7e2c02cd1';
DELETE FROM regional_user_roles WHERE user_id = 'decb0214-0f39-49bc-89d8-bec7e2c02cd1';
DELETE FROM dcg_user_sessions WHERE user_id = 'decb0214-0f39-49bc-89d8-bec7e2c02cd1';
DELETE FROM members WHERE profile_id = 'decb0214-0f39-49bc-89d8-bec7e2c02cd1';
DELETE FROM profiles WHERE id = 'decb0214-0f39-49bc-89d8-bec7e2c02cd1';
DELETE FROM auth.users WHERE id = 'decb0214-0f39-49bc-89d8-bec7e2c02cd1';