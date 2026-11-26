CREATE OR REPLACE FUNCTION public.is_portal_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id,'super_admin'::app_role)
      OR public.has_role(_user_id,'regional_admin'::app_role)
      OR public.has_role(_user_id,'dcg_admin'::app_role)
      OR EXISTS (SELECT 1 FROM public.regional_user_roles WHERE user_id=_user_id AND is_active)
      OR EXISTS (SELECT 1 FROM public.super_admin_user_roles WHERE user_id=_user_id AND is_active);
$$;

DROP POLICY IF EXISTS "Authenticated users can manage FAQs" ON public.event_faqs;
CREATE POLICY "Staff manage FAQs" ON public.event_faqs FOR ALL TO authenticated
  USING (public.is_portal_staff(auth.uid())) WITH CHECK (public.is_portal_staff(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can manage testimonials" ON public.event_testimonials;
CREATE POLICY "Staff manage testimonials" ON public.event_testimonials FOR ALL TO authenticated
  USING (public.is_portal_staff(auth.uid())) WITH CHECK (public.is_portal_staff(auth.uid()));

DROP POLICY IF EXISTS "tpl_authenticated_all" ON public.certificate_templates;
CREATE POLICY "tpl_staff_all" ON public.certificate_templates FOR ALL TO authenticated
  USING (public.is_portal_staff(auth.uid())) WITH CHECK (public.is_portal_staff(auth.uid()));

-- Storage write policies: staff only
DROP POLICY IF EXISTS "Authenticated users can delete campaign images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update campaign images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload campaign images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete event images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update event images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload event images" ON storage.objects;
DROP POLICY IF EXISTS "certs_bucket_auth_delete" ON storage.objects;
DROP POLICY IF EXISTS "certs_bucket_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "certs_bucket_auth_insert" ON storage.objects;

CREATE POLICY "Staff upload event and campaign images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('event-images','campaign-images','certificates','certificate-templates') AND public.is_portal_staff(auth.uid()));
CREATE POLICY "Staff update event and campaign images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id IN ('event-images','campaign-images','certificates','certificate-templates') AND public.is_portal_staff(auth.uid()))
  WITH CHECK (bucket_id IN ('event-images','campaign-images','certificates','certificate-templates') AND public.is_portal_staff(auth.uid()));
CREATE POLICY "Staff delete event and campaign images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('event-images','campaign-images','certificates','certificate-templates') AND public.is_portal_staff(auth.uid()));