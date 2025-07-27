-- Create storage bucket for about us hero images
INSERT INTO storage.buckets (id, name, public) VALUES ('about-hero-images', 'about-hero-images', true);

-- Create policies for about hero images
CREATE POLICY "About hero images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'about-hero-images');

CREATE POLICY "Super admins can upload about hero images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'about-hero-images' AND has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can update about hero images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'about-hero-images' AND has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can delete about hero images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'about-hero-images' AND has_role(auth.uid(), 'super_admin'::app_role));