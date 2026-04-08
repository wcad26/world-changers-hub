
-- 1. Allow DCG admins to view all regional events in their region
CREATE POLICY "DCG admins can view regional events"
ON public.events FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'dcg_admin'::app_role) 
  AND region_id = get_region_from_dcg(get_user_dcg(auth.uid()))
);

-- 2. Allow public to view active regional roles (for registration form)
CREATE POLICY "Public can view active regional roles"
ON public.regional_roles FOR SELECT
USING (is_active = true);
