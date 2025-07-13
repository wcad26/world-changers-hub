-- Grant RLS policies needed for complete DCG creation

-- Allow regional admins to insert/update profiles for users they create
CREATE POLICY "Regional admins can create profiles for users in their region"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'regional_admin') AND 
  region_id = get_user_region(auth.uid())
);

CREATE POLICY "Regional admins can update profiles in their region"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'regional_admin') AND 
  region_id = get_user_region(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'regional_admin') AND 
  region_id = get_user_region(auth.uid())
);

-- Allow regional admins to assign DCG leader roles
CREATE POLICY "Regional admins can assign DCG leader roles in their region"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'regional_admin') AND 
  role = 'dcg_leader' AND
  region_id = get_user_region(auth.uid())
);

-- Allow regional admins to create DCG user sessions
CREATE POLICY "Regional admins can create DCG sessions in their region"
ON public.dcg_user_sessions
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'regional_admin') AND 
  EXISTS (
    SELECT 1 FROM dcgs d 
    WHERE d.id = dcg_id AND d.region_id = get_user_region(auth.uid())
  )
);