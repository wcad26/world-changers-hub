DROP POLICY IF EXISTS "Region members can manage members in their region" ON public.members;
CREATE POLICY "Region members can manage members in their region"
ON public.members
FOR ALL
TO authenticated
USING (public.user_belongs_to_region(auth.uid(), region_id))
WITH CHECK (public.user_belongs_to_region(auth.uid(), region_id));

DROP POLICY IF EXISTS "Region members can update profiles in their region" ON public.profiles;
CREATE POLICY "Region members can update profiles in their region"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.user_belongs_to_region(auth.uid(), region_id))
WITH CHECK (public.user_belongs_to_region(auth.uid(), region_id));