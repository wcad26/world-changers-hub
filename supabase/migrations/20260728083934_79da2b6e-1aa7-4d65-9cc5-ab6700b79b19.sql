
-- 1) Drop blanket authenticated_full_access policies on all listed tables
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'attendance_events','attendance_records','certificate_templates','certificates',
    'communication_templates','communications','currencies','dcg_members','dcg_user_sessions',
    'dcgs','discipleship_progress','discipleship_relationships','donors','event_faqs',
    'event_images','event_pre_registrations','event_slug_history','event_speakers',
    'event_testimonials','events','financial_transaction_categories','financial_transactions',
    'fundraising_campaigns','fundraising_donations','global_content','locations',
    'member_relationships','member_targets','member_transfers','members','occupations',
    'profiles','regional_plan_initiatives','regional_plan_targets','regional_plans',
    'regional_roles','regional_user_roles','regions','user_roles'
  ]) LOOP
    EXECUTE format('DROP POLICY IF EXISTS authenticated_full_access ON public.%I', t);
  END LOOP;
END $$;

-- Also drop the redundant certs_authenticated_all
DROP POLICY IF EXISTS certs_authenticated_all ON public.certificates;

-- 2) Remove overly-permissive public read policies exposing PII
DROP POLICY IF EXISTS certs_public_read_active ON public.certificates;
DROP POLICY IF EXISTS "Anyone can read pre-registrations" ON public.event_pre_registrations;
DROP POLICY IF EXISTS "Public can view pledges for public campaigns" ON public.fundraising_pledges;

-- 3) Storage: drop broad public SELECT (listing) policies on public buckets.
-- Direct /object/public/ URLs continue to work without any SELECT policy.
DROP POLICY IF EXISTS "About hero images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Campaign images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public can view event images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view member photos" ON storage.objects;
DROP POLICY IF EXISTS certs_bucket_public_read ON storage.objects;

-- 4) Fix function search_path on all SECURITY DEFINER / helper functions missing it
ALTER FUNCTION public.ensure_member_record_for_admin() SET search_path = public;
ALTER FUNCTION public.generate_member_id(uuid) SET search_path = public;
ALTER FUNCTION public.get_attendance_summary(uuid) SET search_path = public;
ALTER FUNCTION public.get_discipleship_impact_trend(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.get_global_attendance_summary() SET search_path = public;
ALTER FUNCTION public.get_member_discipleship_stats(uuid) SET search_path = public;
ALTER FUNCTION public.get_next_dcg_meeting(uuid) SET search_path = public;
ALTER FUNCTION public.get_user_dcg(uuid) SET search_path = public;
ALTER FUNCTION public.get_user_region(uuid) SET search_path = public;
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = public;
ALTER FUNCTION public.protect_reserved_super_admin_role() SET search_path = public;
ALTER FUNCTION public.trigger_set_timestamp() SET search_path = public;
ALTER FUNCTION public.user_belongs_to_region(uuid, uuid) SET search_path = public;

-- 5) Revoke EXECUTE from anon/authenticated on trigger-only SECURITY DEFINER functions.
-- These are invoked by triggers under the definer's privileges and should never be RPC-callable.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.profiles_require_auth_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.fr_sync_pledged_total() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_campaign_raised_amount() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.ensure_member_record_for_admin() FROM anon, authenticated, public;

-- Search RPC helpers should require auth (revoke from anon)
REVOKE EXECUTE ON FUNCTION public.search_all_donors(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.search_all_members(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.search_region_members(uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_my_regional_context() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_member_discipleship_stats(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_discipleship_impact_trend(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_next_dcg_meeting(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_principal_super_admin(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_super_permission(uuid, text) FROM anon, public;
