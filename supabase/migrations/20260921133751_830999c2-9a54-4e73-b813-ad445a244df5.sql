CREATE OR REPLACE FUNCTION public.can_manage_regional_access(_user_id uuid, _region_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.regional_user_roles rur
    JOIN public.regional_roles rr ON rr.id = rur.regional_role_id
    WHERE rur.user_id = _user_id
      AND rur.is_active = true
      AND rr.is_active = true
      AND rr.region_id = _region_id
      AND rur.region_id = _region_id
      AND (rr.permissions ? '*' OR rr.permissions ? 'access_management')
  );
$$;

REVOKE EXECUTE ON FUNCTION public.can_manage_regional_access(uuid, uuid) FROM anon;

CREATE POLICY "Access managers can manage regional user roles in their region"
ON public.regional_user_roles FOR ALL TO authenticated
USING (public.can_manage_regional_access(auth.uid(), region_id))
WITH CHECK (public.can_manage_regional_access(auth.uid(), region_id));

CREATE POLICY "Access managers can manage regional roles in their region"
ON public.regional_roles FOR ALL TO authenticated
USING (public.can_manage_regional_access(auth.uid(), region_id))
WITH CHECK (public.can_manage_regional_access(auth.uid(), region_id));