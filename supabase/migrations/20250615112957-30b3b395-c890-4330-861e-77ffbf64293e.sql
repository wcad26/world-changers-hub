
-- Create enum for message type
CREATE TYPE public.communication_message_type AS ENUM (
  'announcement',
  'invitation',
  'reminder',
  'update',
  'urgent'
);

-- Create enum for communication status
CREATE TYPE public.communication_status AS ENUM (
  'draft',
  'sent',
  'scheduled',
  'failed',
  'cancelled'
);

-- Create table for communications
CREATE TABLE public.communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id UUID NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type public.communication_message_type,
  audience TEXT NOT NULL,
  channels TEXT[] NOT NULL,
  status public.communication_status DEFAULT 'draft' NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add trigger to communications table for updated_at
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.communications
FOR EACH ROW
EXECUTE PROCEDURE public.trigger_set_timestamp();

-- Enable RLS for communications table
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for communications
CREATE POLICY "Super admins can manage all communications"
ON public.communications FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Regional admins can manage communications in their region"
ON public.communications FOR ALL
USING (
  (public.has_role(auth.uid(), 'regional_admin') AND region_id = public.get_user_region(auth.uid()))
)
WITH CHECK (
  (public.has_role(auth.uid(), 'regional_admin') AND region_id = public.get_user_region(auth.uid()))
);

-- Create table for communication templates
CREATE TABLE public.communication_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id UUID REFERENCES public.regions(id) ON DELETE CASCADE, -- Null for global templates
  created_by UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  category TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add trigger to communication_templates table for updated_at
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.communication_templates
FOR EACH ROW
EXECUTE PROCEDURE public.trigger_set_timestamp();

-- Enable RLS for communication_templates table
ALTER TABLE public.communication_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for communication_templates
CREATE POLICY "Super admins can manage all templates"
ON public.communication_templates FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Regional admins can access templates in their region and global templates"
ON public.communication_templates FOR ALL
USING (
  (public.has_role(auth.uid(), 'regional_admin') AND (region_id IS NULL OR region_id = public.get_user_region(auth.uid())))
)
WITH CHECK (
  (public.has_role(auth.uid(), 'regional_admin') AND (region_id IS NULL OR region_id = public.get_user_region(auth.uid())))
);

CREATE POLICY "Regional admins can view global templates"
ON public.communication_templates FOR SELECT
USING (region_id IS NULL AND public.has_role(auth.uid(), 'regional_admin'));
