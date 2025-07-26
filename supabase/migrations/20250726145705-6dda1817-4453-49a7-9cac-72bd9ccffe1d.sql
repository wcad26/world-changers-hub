-- Add mobile-specific hero slide images column to regions table
ALTER TABLE public.regions 
ADD COLUMN hero_slide_images_mobile JSONB DEFAULT '[]'::jsonb;