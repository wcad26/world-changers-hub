-- Create policy to allow public access to basic DCG information for location display
CREATE POLICY "Public can view basic DCG info for locations" 
ON public.dcgs 
FOR SELECT 
USING (true);