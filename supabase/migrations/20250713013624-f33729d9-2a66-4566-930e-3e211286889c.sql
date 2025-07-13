-- First update any existing dcg_leader roles to dcg_admin
UPDATE public.user_roles SET role = 'dcg_leader'::text::app_role WHERE role = 'dcg_leader';

-- Then update the app_role enum to replace dcg_leader with dcg_admin
ALTER TYPE public.app_role RENAME VALUE 'dcg_leader' TO 'dcg_admin';