-- Add RLS policy for super admins to access all DCG members
CREATE POLICY "Super admins can manage all dcg members"
ON public.dcg_members
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));