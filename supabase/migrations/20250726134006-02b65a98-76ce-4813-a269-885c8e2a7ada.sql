-- Add the regional_president_photo column to store image URLs
ALTER TABLE public.regions 
ADD COLUMN regional_president_photo TEXT;

-- Rename regional_pastor to regional_president  
ALTER TABLE public.regions 
RENAME COLUMN regional_pastor TO regional_president;