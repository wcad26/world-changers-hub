-- Add status field to user_roles table for pending approvals
DO $$ BEGIN
    CREATE TYPE public.user_role_status AS ENUM ('pending', 'active', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add status column to user_roles table
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS status user_role_status DEFAULT 'active';

-- Update existing records to have active status
UPDATE public.user_roles 
SET status = 'active' 
WHERE status IS NULL;

-- Update RLS policies to only allow active roles for portal access
DROP POLICY IF EXISTS "Regional admins can view roles in their region" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Updated policies that check for active status
CREATE POLICY "Regional admins can view active roles in their region" 
ON public.user_roles 
FOR SELECT 
USING (
  has_role(auth.uid(), 'regional_admin'::app_role) 
  AND ((region_id IS NULL) OR (region_id = get_user_region(auth.uid())))
  AND status = 'active'
);

CREATE POLICY "Users can view their own active roles" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid() AND status = 'active');

-- Super admins can view all roles including pending ones
CREATE POLICY "Super admins can view all user roles including pending" 
ON public.user_roles 
FOR SELECT 
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Super admins can update role status (for approvals/rejections)
CREATE POLICY "Super admins can update role status" 
ON public.user_roles 
FOR UPDATE 
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));