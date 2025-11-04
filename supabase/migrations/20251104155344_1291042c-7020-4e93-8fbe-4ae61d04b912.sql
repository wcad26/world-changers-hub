-- Create storage bucket for event images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for event images
CREATE POLICY "Public can view event images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'event-images');

CREATE POLICY "Authenticated users can upload event images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'event-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update event images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'event-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete event images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'event-images' AND auth.uid() IS NOT NULL);