
-- Create enum for event categories
CREATE TYPE public.event_category AS ENUM (
  'Conference',
  'Worship',
  'Revival',
  'Outreach',
  'Training',
  'Workshop',
  'Community Service',
  'Bible Study',
  'Retreat',
  'Seminar',
  'DCG Meeting',
  'Other'
);

-- Create enum for event status
CREATE TYPE public.event_status AS ENUM ('Upcoming', 'Completed', 'Cancelled', 'Draft');

-- Create table for events
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id UUID REFERENCES public.regions(id) ON DELETE CASCADE, -- Can be null for global events
  dcg_id UUID REFERENCES public.dcgs(id) ON DELETE CASCADE, -- Optional, if it's a DCG event
  created_by UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  category public.event_category,
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE,
  location_name TEXT,
  address TEXT,
  image_url TEXT,
  capacity INT,
  is_public BOOLEAN DEFAULT true NOT NULL,
  is_featured BOOLEAN DEFAULT false NOT NULL,
  status public.event_status DEFAULT 'Upcoming' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add function to trigger updated_at
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to events table
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE PROCEDURE public.trigger_set_timestamp();

-- Enable RLS for the new table
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for events
CREATE POLICY "Super admins can manage all events"
ON public.events FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Regional admins can manage events in their region"
ON public.events FOR ALL
USING (
  (public.has_role(auth.uid(), 'regional_admin') AND region_id = public.get_user_region(auth.uid()))
)
WITH CHECK (
  (public.has_role(auth.uid(), 'regional_admin') AND region_id = public.get_user_region(auth.uid()))
);

CREATE POLICY "Public can view public events"
ON public.events FOR SELECT
USING (is_public = true);
