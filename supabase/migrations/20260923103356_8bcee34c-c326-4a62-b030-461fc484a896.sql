
-- Grants (table currently has none, so PostgREST blocks all access)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificates TO authenticated;
GRANT ALL ON public.certificates TO service_role;
GRANT SELECT (id, certificate_number, member_id, region_id, certificate_type, issued_date,
              event_name, event_date, recipient_name, certificate_url, verification_code,
              qr_code_data, created_at, updated_at, is_active, output_type, pre_registration_id)
  ON public.certificates TO anon;

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins manage all certificates" ON public.certificates;
CREATE POLICY "Super admins manage all certificates"
ON public.certificates FOR ALL TO authenticated
USING (public.is_super_admin_user(auth.uid()))
WITH CHECK (public.is_super_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Regional admins manage certificates in their region" ON public.certificates;
CREATE POLICY "Regional admins manage certificates in their region"
ON public.certificates FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'regional_admin'::app_role)
  AND region_id IS NOT NULL
  AND region_id = public.get_user_region(auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'regional_admin'::app_role)
  AND region_id IS NOT NULL
  AND region_id = public.get_user_region(auth.uid())
);

DROP POLICY IF EXISTS "Members view their own certificates" ON public.certificates;
CREATE POLICY "Members view their own certificates"
ON public.certificates FOR SELECT TO authenticated
USING (
  member_id = ANY (COALESCE(public.get_member_ids_for_user(auth.uid()), ARRAY[]::uuid[]))
);

DROP POLICY IF EXISTS "Anyone can verify certificates" ON public.certificates;
CREATE POLICY "Anyone can verify certificates"
ON public.certificates FOR SELECT TO anon
USING (COALESCE(is_active, true) = true);
