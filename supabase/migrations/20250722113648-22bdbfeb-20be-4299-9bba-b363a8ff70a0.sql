-- Create member targets table for regional admins to set membership goals
CREATE TABLE public.member_targets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  region_id UUID NOT NULL,
  target_members INTEGER NOT NULL,
  target_date DATE NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable Row Level Security
ALTER TABLE public.member_targets ENABLE ROW LEVEL SECURITY;

-- Create policies for member targets
CREATE POLICY "Regional admins can manage targets in their region" 
ON public.member_targets 
FOR ALL 
USING (has_role(auth.uid(), 'regional_admin'::app_role) AND (region_id = get_user_region(auth.uid())))
WITH CHECK (has_role(auth.uid(), 'regional_admin'::app_role) AND (region_id = get_user_region(auth.uid())));

CREATE POLICY "Super admins can manage all targets" 
ON public.member_targets 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_member_targets_updated_at
BEFORE UPDATE ON public.member_targets
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();