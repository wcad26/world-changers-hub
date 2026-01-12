-- Add requested_regional_role_id column to user_roles table
-- This stores which regional role the user requested during registration/assignment
ALTER TABLE public.user_roles 
ADD COLUMN requested_regional_role_id UUID REFERENCES public.regional_roles(id);

-- Create index for faster lookups
CREATE INDEX idx_user_roles_requested_regional_role_id 
ON public.user_roles(requested_regional_role_id) 
WHERE requested_regional_role_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.user_roles.requested_regional_role_id IS 'The regional role requested by the user during registration or assignment, pending super admin approval';