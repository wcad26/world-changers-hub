-- Create locations table for WCA centers and DCG meeting locations
CREATE TABLE public.locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  region_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('WCA Center', 'DCG Location')),
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  capacity INTEGER,
  facilities TEXT,
  contact_person TEXT,
  contact_phone TEXT,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Create policies for location access
CREATE POLICY "Regional admins can manage locations in their region" 
ON public.locations 
FOR ALL 
USING (
  has_role(auth.uid(), 'regional_admin'::app_role) AND 
  region_id = get_user_region(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'regional_admin'::app_role) AND 
  region_id = get_user_region(auth.uid())
);

CREATE POLICY "Super admins can manage all locations" 
ON public.locations 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Add foreign key constraint
ALTER TABLE public.locations 
ADD CONSTRAINT locations_region_id_fkey 
FOREIGN KEY (region_id) REFERENCES public.regions(id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_locations_updated_at
BEFORE UPDATE ON public.locations
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();