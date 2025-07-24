-- Add missing fields to locations table for public page functionality
ALTER TABLE public.locations 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS fellowship_times JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_link TEXT,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Update locations table to allow public read access for active locations
DROP POLICY IF EXISTS "Public can view active locations" ON public.locations;

CREATE POLICY "Public can view active locations" 
ON public.locations 
FOR SELECT 
USING (status = 'Active');

-- Add some sample fellowship times structure
COMMENT ON COLUMN public.locations.fellowship_times IS 'JSONB array containing fellowship time objects with day, time, and type fields. Example: [{"day": "Sunday", "time": "10:00 AM", "type": "Main Service"}, {"day": "Wednesday", "time": "7:00 PM", "type": "Bible Study"}]';