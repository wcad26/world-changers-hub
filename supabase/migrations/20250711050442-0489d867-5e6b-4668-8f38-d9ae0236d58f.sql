-- Add latitude and longitude columns to locations table for map coordinates
ALTER TABLE public.locations 
ADD COLUMN latitude DECIMAL(10, 8),
ADD COLUMN longitude DECIMAL(11, 8);

-- Add index for geospatial queries if needed later
CREATE INDEX idx_locations_coordinates ON public.locations(latitude, longitude);