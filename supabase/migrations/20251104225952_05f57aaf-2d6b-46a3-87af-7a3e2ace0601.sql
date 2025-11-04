-- Create event_images table for multiple images per event
CREATE TABLE IF NOT EXISTS public.event_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_hero_image BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_event_images_event_id ON public.event_images(event_id);
CREATE INDEX IF NOT EXISTS idx_event_images_display_order ON public.event_images(event_id, display_order);

-- Enable RLS
ALTER TABLE public.event_images ENABLE ROW LEVEL SECURITY;

-- Public can view images for public events
CREATE POLICY "Public can view images for public events"
ON public.event_images
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_images.event_id 
    AND e.is_public = true
  )
);

-- Regional admins can manage images in their region
CREATE POLICY "Regional admins can manage images in their region"
ON public.event_images
FOR ALL
USING (
  has_role(auth.uid(), 'regional_admin'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_images.event_id 
    AND e.region_id = get_user_region(auth.uid())
  )
)
WITH CHECK (
  has_role(auth.uid(), 'regional_admin'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_images.event_id 
    AND e.region_id = get_user_region(auth.uid())
  )
);

-- DCG admins can manage images for their DCG events
CREATE POLICY "DCG admins can manage images for their DCG events"
ON public.event_images
FOR ALL
USING (
  has_role(auth.uid(), 'dcg_admin'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_images.event_id 
    AND e.dcg_id = get_user_dcg(auth.uid())
  )
)
WITH CHECK (
  has_role(auth.uid(), 'dcg_admin'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_images.event_id 
    AND e.dcg_id = get_user_dcg(auth.uid())
  )
);

-- Super admins can manage all event images
CREATE POLICY "Super admins can manage all event images"
ON public.event_images
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_event_images_updated_at
BEFORE UPDATE ON public.event_images
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();