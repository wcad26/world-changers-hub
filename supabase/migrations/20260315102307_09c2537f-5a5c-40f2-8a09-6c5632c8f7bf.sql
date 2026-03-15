CREATE POLICY "DCG admins can view profiles in their DCG region"
ON public.profiles
FOR SELECT
TO public
USING (
  has_role(auth.uid(), 'dcg_admin'::app_role) 
  AND region_id = get_region_from_dcg(get_user_dcg(auth.uid()))
);