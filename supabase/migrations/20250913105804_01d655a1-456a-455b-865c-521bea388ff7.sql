-- Update the default role name from "Full Access Admin" to "Regional Admin"
UPDATE public.regional_roles 
SET name = 'Regional Admin', 
    description = 'Complete access to all regional portal features'
WHERE name = 'Full Access Admin';