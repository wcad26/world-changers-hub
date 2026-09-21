CREATE POLICY "Super admins can update all profiles"
ON public.profiles FOR UPDATE TO authenticated
USING (public.is_super_admin_user(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (public.is_super_admin_user(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "DCG admins can update profiles in their DCG region"
ON public.profiles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'dcg_admin'::app_role) AND region_id = public.get_region_from_dcg(public.get_user_dcg(auth.uid())))
WITH CHECK (public.has_role(auth.uid(), 'dcg_admin'::app_role) AND region_id = public.get_region_from_dcg(public.get_user_dcg(auth.uid())));