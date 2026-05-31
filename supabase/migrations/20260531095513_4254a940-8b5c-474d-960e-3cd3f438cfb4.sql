-- Consolidate certificate access: any signed-in user has full control; public can read.

-- certificates table
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='certificates' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.certificates', p.policyname);
  END LOOP;
END $$;

CREATE POLICY "certs_public_read_active" ON public.certificates
  FOR SELECT TO public USING (is_active = true);
CREATE POLICY "certs_authenticated_all" ON public.certificates
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT SELECT ON public.certificates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificates TO authenticated;
GRANT ALL ON public.certificates TO service_role;

-- certificate_templates table
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='certificate_templates' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.certificate_templates', p.policyname);
  END LOOP;
END $$;

CREATE POLICY "tpl_public_read_active" ON public.certificate_templates
  FOR SELECT TO public USING (is_active = true);
CREATE POLICY "tpl_authenticated_all" ON public.certificate_templates
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT SELECT ON public.certificate_templates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificate_templates TO authenticated;
GRANT ALL ON public.certificate_templates TO service_role;

-- Storage policies for both certificate buckets: public read, authenticated full control
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies
           WHERE schemaname='storage' AND tablename='objects'
             AND (policyname ILIKE '%certificate%' OR policyname ILIKE '%certificates%') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p.policyname);
  END LOOP;
END $$;

CREATE POLICY "certs_bucket_public_read" ON storage.objects
  FOR SELECT TO public USING (bucket_id IN ('certificates','certificate-templates'));

CREATE POLICY "certs_bucket_auth_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('certificates','certificate-templates'));

CREATE POLICY "certs_bucket_auth_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id IN ('certificates','certificate-templates'))
  WITH CHECK (bucket_id IN ('certificates','certificate-templates'));

CREATE POLICY "certs_bucket_auth_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id IN ('certificates','certificate-templates'));