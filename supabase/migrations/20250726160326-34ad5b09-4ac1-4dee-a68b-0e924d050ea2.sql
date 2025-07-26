-- Allow super admins to upload member photos
CREATE POLICY "Super admins can upload member photos" ON storage.objects
FOR INSERT TO public
WITH CHECK (bucket_id = 'member-photos' AND has_role(auth.uid(), 'super_admin'::app_role));

-- Allow super admins to update member photos  
CREATE POLICY "Super admins can update member photos" ON storage.objects
FOR UPDATE TO public
USING (bucket_id = 'member-photos' AND has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (bucket_id = 'member-photos' AND has_role(auth.uid(), 'super_admin'::app_role));

-- Allow super admins to delete member photos
CREATE POLICY "Super admins can delete member photos" ON storage.objects  
FOR DELETE TO public
USING (bucket_id = 'member-photos' AND has_role(auth.uid(), 'super_admin'::app_role));

-- Allow super admins to view member photos
CREATE POLICY "Super admins can view member photos" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'member-photos' AND has_role(auth.uid(), 'super_admin'::app_role));