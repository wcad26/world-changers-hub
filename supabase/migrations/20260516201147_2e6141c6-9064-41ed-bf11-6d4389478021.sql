-- Grant DCG portal access to chimbotimah@gmail.com (Kotto DCG)
-- so the DCG Finances page resolves and displays data.

-- Ensure dcg_admin role
INSERT INTO public.user_roles (user_id, role, region_id, is_active, status)
SELECT 'ec36395f-b2f4-4482-9380-c0ea85b48566'::uuid, 'dcg_admin'::app_role, 'dbf432ef-5844-4558-b385-698e17be919e'::uuid, true, 'active'
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = 'ec36395f-b2f4-4482-9380-c0ea85b48566'::uuid
    AND role = 'dcg_admin'::app_role
);

UPDATE public.user_roles
SET is_active = true, status = 'active'
WHERE user_id = 'ec36395f-b2f4-4482-9380-c0ea85b48566'::uuid
  AND role = 'dcg_admin'::app_role;

-- Ensure active DCG session for Kotto
INSERT INTO public.dcg_user_sessions (user_id, dcg_id, is_active)
SELECT 'ec36395f-b2f4-4482-9380-c0ea85b48566'::uuid, 'c7c38d97-3362-4125-ab23-0f79afcf3976'::uuid, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.dcg_user_sessions
  WHERE user_id = 'ec36395f-b2f4-4482-9380-c0ea85b48566'::uuid
);

UPDATE public.dcg_user_sessions
SET is_active = true, dcg_id = 'c7c38d97-3362-4125-ab23-0f79afcf3976'::uuid
WHERE user_id = 'ec36395f-b2f4-4482-9380-c0ea85b48566'::uuid;