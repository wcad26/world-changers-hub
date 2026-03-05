
-- Drop existing SELECT policy for regional admins that only shows active roles
DROP POLICY IF EXISTS "Regional admins can view active roles in their region" ON public.user_roles;

-- Create broader SELECT policy so regional admins can see active AND pending roles in their region
CREATE POLICY "Regional admins can view roles in their region"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'regional_admin')
  AND (region_id IS NULL OR region_id = get_user_region(auth.uid()))
  AND status IN ('active', 'pending')
);
