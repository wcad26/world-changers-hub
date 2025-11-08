-- Add French image support to events table
ALTER TABLE public.events
ADD COLUMN image_url_fr TEXT;

-- Add French image URL to event_images table
ALTER TABLE public.event_images
ADD COLUMN image_url_fr TEXT;

-- Add comment for clarity
COMMENT ON COLUMN public.events.image_url_fr IS 'French version of the event card image';
COMMENT ON COLUMN public.event_images.image_url_fr IS 'French version of hero or gallery images';