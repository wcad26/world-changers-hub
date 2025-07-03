
-- Fix RLS policies to allow role creation during signup
-- The current policies are too restrictive for initial role creation

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Regional admins can view roles in their region" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Create more permissive policies that allow initial role creation
CREATE POLICY "Users can insert their own roles during signup" ON public.user_roles
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Super admins can manage all roles" ON public.user_roles
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Regional admins can view roles in their region" ON public.user_roles
FOR SELECT 
USING (
  has_role(auth.uid(), 'regional_admin'::app_role) 
  AND (region_id IS NULL OR region_id = get_user_region(auth.uid()))
);

-- Also need to allow profile creation during signup
-- Drop existing restrictive profile policies
DROP POLICY IF EXISTS "Regional admins can view profiles in their region" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create more permissive profile policies
CREATE POLICY "Users can insert their own profile during signup" ON public.profiles
FOR INSERT 
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can view and update their own profile" ON public.profiles
FOR ALL 
USING (id = auth.uid());

CREATE POLICY "Super admins can view all profiles" ON public.profiles
FOR SELECT 
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Regional admins can view profiles in their region" ON public.profiles
FOR SELECT 
USING (
  has_role(auth.uid(), 'regional_admin'::app_role) 
  AND region_id = get_user_region(auth.uid())
);
