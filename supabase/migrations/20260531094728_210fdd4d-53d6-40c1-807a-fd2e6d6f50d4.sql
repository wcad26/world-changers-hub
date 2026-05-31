
-- Remove all restrictive certificate access rules; allow any signed-in user full control.

-- certificate_templates table
DROP POLICY IF EXISTS "Regional admins manage templates in region" ON public.certificate_templates;
DROP POLICY IF EXISTS "Super admins manage all templates" ON public.certificate_templates;
DROP POLICY IF EXISTS "Public can view active templates" ON public.certificate_templates;
DROP POLICY IF EXISTS "Authenticated users can manage certificate templates" ON public.certificate_templates;
DROP POLICY IF EXISTS "Public can view active certificate templates" ON public.certificate_templates;

CREATE POLICY "Public can view active certificate templates"
ON public.certificate_templates FOR SELECT
USING (is_active = true);

CREATE POLICY "Authenticated users can manage certificate templates"
ON public.certificate_templates FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- certificates table
DROP POLICY IF EXISTS "Regional admins manage certificates in region" ON public.certificates;
DROP POLICY IF EXISTS "Super admins manage all certificates" ON public.certificates;
DROP POLICY IF EXISTS "Members view own certificates" ON public.certificates;
DROP POLICY IF EXISTS "Public can view active certificates" ON public.certificates;
DROP POLICY IF EXISTS "Authenticated users can manage certificates" ON public.certificates;

CREATE POLICY "Public can view active certificates"
ON public.certificates FOR SELECT
USING (is_active = true);

CREATE POLICY "Authenticated users can manage certificates"
ON public.certificates FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

GRANT SELECT ON public.certificates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificates TO authenticated;
GRANT ALL ON public.certificates TO service_role;

GRANT SELECT ON public.certificate_templates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificate_templates TO authenticated;
GRANT ALL ON public.certificate_templates TO service_role;

-- Storage: ensure public read + any signed-in user full control on both buckets
DROP POLICY IF EXISTS "Public can view certificates" ON storage.objects;
DROP POLICY IF EXISTS "Public read for certificate templates" ON storage.objects;

CREATE POLICY "Public read for certificates bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'certificates');

CREATE POLICY "Public read for certificate-templates bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'certificate-templates');
