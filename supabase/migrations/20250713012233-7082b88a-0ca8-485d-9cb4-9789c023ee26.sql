-- Update the app_role enum to replace dcg_leader with dcg_admin
ALTER TYPE public.app_role RENAME VALUE 'dcg_leader' TO 'dcg_admin';

-- Update any existing dcg_leader roles to dcg_admin (in case there are any)
UPDATE public.user_roles SET role = 'dcg_admin' WHERE role = 'dcg_leader';