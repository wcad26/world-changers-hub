-- Allow regional admins to insert/delete donations for campaigns in their region
CREATE POLICY "Regional admins can insert donations in their region"
ON public.fundraising_donations
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'regional_admin'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.fundraising_campaigns
    WHERE id = campaign_id
      AND region_id = get_user_region(auth.uid())
  )
);

CREATE POLICY "Regional admins can delete donations in their region"
ON public.fundraising_donations
FOR DELETE
USING (
  has_role(auth.uid(), 'regional_admin'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.fundraising_campaigns
    WHERE id = campaign_id
      AND region_id = get_user_region(auth.uid())
  )
);

CREATE POLICY "Super admins can insert any donations"
ON public.fundraising_donations
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can delete any donations"
ON public.fundraising_donations
FOR DELETE
USING (has_role(auth.uid(), 'super_admin'::app_role));