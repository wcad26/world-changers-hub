-- Recreate certificate-templates storage policies to allow any authenticated user
DROP POLICY IF EXISTS "Admins can upload certificate templates" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update certificate templates" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete certificate templates" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view certificate templates" ON storage.objects;

CREATE POLICY "Authenticated users can upload certificate templates"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'certificate-templates');

CREATE POLICY "Authenticated users can update certificate templates"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'certificate-templates')
WITH CHECK (bucket_id = 'certificate-templates');

CREATE POLICY "Authenticated users can delete certificate templates"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'certificate-templates');

-- Same for certificates bucket (generated certificate files)
DROP POLICY IF EXISTS "Admins can upload certificates" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete certificates" ON storage.objects;

CREATE POLICY "Authenticated users can upload certificates"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'certificates');

CREATE POLICY "Authenticated users can update certificates"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'certificates')
WITH CHECK (bucket_id = 'certificates');

CREATE POLICY "Authenticated users can delete certificates"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'certificates');