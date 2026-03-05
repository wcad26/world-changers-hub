
-- Allow regional admins to submit pending role assignment requests
CREATE POLICY "Regional admins can submit pending role requests in their region"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'regional_admin')
  AND role = 'regional_admin'
  AND region_id = get_user_region(auth.uid())
  AND status = 'pending'
  AND is_active = false
);

-- Allow regional admins to update existing roles to pending in their region
CREATE POLICY "Regional admins can update roles to pending in their region"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'regional_admin')
  AND region_id = get_user_region(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'regional_admin')
  AND region_id = get_user_region(auth.uid())
  AND status = 'pending'
  AND is_active = false
);
