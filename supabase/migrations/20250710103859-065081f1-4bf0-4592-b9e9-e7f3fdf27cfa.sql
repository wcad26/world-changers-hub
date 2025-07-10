-- Create storage bucket for member photos
INSERT INTO storage.buckets (id, name, public) VALUES ('member-photos', 'member-photos', true);

-- Create policies for member photos
CREATE POLICY "Public can view member photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'member-photos');

CREATE POLICY "Regional admins can upload member photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'member-photos' 
  AND has_role(auth.uid(), 'regional_admin'::app_role)
);

CREATE POLICY "Regional admins can update member photos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'member-photos' 
  AND has_role(auth.uid(), 'regional_admin'::app_role)
);

CREATE POLICY "Regional admins can delete member photos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'member-photos' 
  AND has_role(auth.uid(), 'regional_admin'::app_role)
);

-- Add photo_url column to members table
ALTER TABLE public.members ADD COLUMN photo_url TEXT;