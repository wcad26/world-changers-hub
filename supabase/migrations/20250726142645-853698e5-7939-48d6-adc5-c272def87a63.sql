-- Add hero slide images column to regions table
ALTER TABLE public.regions ADD COLUMN hero_slide_images JSONB DEFAULT '[]'::jsonb;