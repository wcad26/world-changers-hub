-- Create enum for regional permissions
CREATE TYPE public.regional_permission AS ENUM (
  'dashboard_view',
  'members_view', 'members_create', 'members_edit', 'members_export',
  'events_view', 'events_create', 'events_edit', 'events_delete',
  'finances_view', 'finances_create', 'finances_edit',
  'dcg_view', 'dcg_create', 'dcg_edit',
  'reports_view', 'reports_export',
  'communication_view', 'communication_create', 'communication_send',
  'locations_view', 'locations_create', 'locations_edit',
  'fundraising_view', 'fundraising_create', 'fundraising_edit',
  'settings_view', 'settings_edit'
);

-- Create regional_roles table
CREATE TABLE public.regional_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  region_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(region_id, name)
);

-- Create regional_user_roles table
CREATE TABLE public.regional_user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  region_id UUID NOT NULL,
  regional_role_id UUID NOT NULL REFERENCES public.regional_roles(id) ON DELETE CASCADE,
  assigned_by UUID,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(user_id, region_id, regional_role_id)
);

-- Enable RLS
ALTER TABLE public.regional_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regional_user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for regional_roles
CREATE POLICY "Regional admins can manage roles in their region"
ON public.regional_roles
FOR ALL
USING (has_role(auth.uid(), 'regional_admin'::app_role) AND region_id = get_user_region(auth.uid()))
WITH CHECK (has_role(auth.uid(), 'regional_admin'::app_role) AND region_id = get_user_region(auth.uid()));

CREATE POLICY "Super admins can manage all regional roles"
ON public.regional_roles
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for regional_user_roles
CREATE POLICY "Regional admins can manage user roles in their region"
ON public.regional_user_roles
FOR ALL
USING (has_role(auth.uid(), 'regional_admin'::app_role) AND region_id = get_user_region(auth.uid()))
WITH CHECK (has_role(auth.uid(), 'regional_admin'::app_role) AND region_id = get_user_region(auth.uid()));

CREATE POLICY "Super admins can manage all regional user roles"
ON public.regional_user_roles
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Users can view their own regional roles"
ON public.regional_user_roles
FOR SELECT
USING (user_id = auth.uid());

-- Function to check if user has regional permission
CREATE OR REPLACE FUNCTION public.has_regional_permission(_user_id uuid, _region_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.regional_user_roles rur
    JOIN public.regional_roles rr ON rur.regional_role_id = rr.id
    WHERE rur.user_id = _user_id
      AND rur.region_id = _region_id
      AND rur.is_active = true
      AND rr.is_active = true
      AND rr.permissions ? _permission
  ) OR has_role(_user_id, 'super_admin'::app_role);
$$;

-- Insert default "Full Access Admin" role for each region
INSERT INTO public.regional_roles (region_id, name, description, permissions)
SELECT 
  id as region_id,
  'Full Access Admin' as name,
  'Complete access to all regional portal features' as description,
  '["dashboard_view", "members_view", "members_create", "members_edit", "members_export", "events_view", "events_create", "events_edit", "events_delete", "finances_view", "finances_create", "finances_edit", "dcg_view", "dcg_create", "dcg_edit", "reports_view", "reports_export", "communication_view", "communication_create", "communication_send", "locations_view", "locations_create", "locations_edit", "fundraising_view", "fundraising_create", "fundraising_edit", "settings_view", "settings_edit"]'::jsonb as permissions
FROM public.regions 
WHERE is_active = true;

-- Create trigger for updated_at
CREATE TRIGGER update_regional_roles_updated_at
BEFORE UPDATE ON public.regional_roles
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();