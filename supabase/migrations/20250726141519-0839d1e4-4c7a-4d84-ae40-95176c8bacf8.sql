-- Add RLS policy to allow regional admins to update their own region
CREATE POLICY "Regional admins can update their own region" 
ON public.regions 
FOR UPDATE 
USING (has_role(auth.uid(), 'regional_admin'::app_role) AND (id = get_user_region(auth.uid())))
WITH CHECK (has_role(auth.uid(), 'regional_admin'::app_role) AND (id = get_user_region(auth.uid())));