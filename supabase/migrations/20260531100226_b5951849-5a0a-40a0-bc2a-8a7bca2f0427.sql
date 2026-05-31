-- Unrestricted access for any signed-in user on regional portal tables.
-- RLS stays enabled; we add a permissive ALL policy for `authenticated`
-- on every table the regional portal reads or writes, plus explicit grants.

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'profiles','regions','members','user_roles','regional_roles','regional_user_roles',
    'events','attendance_events','attendance_records',
    'dcgs','dcg_members','dcg_user_sessions','locations',
    'communications','communication_templates',
    'financial_transactions','financial_transaction_categories','donors',
    'fundraising_campaigns','fundraising_donations',
    'discipleship_relationships','discipleship_progress',
    'regional_plans','regional_plan_targets','regional_plan_initiatives','member_targets',
    'event_faqs','event_images','event_speakers','event_testimonials',
    'event_pre_registrations','event_slug_history','member_relationships',
    'member_transfers','occupations','currencies','global_content',
    'certificates','certificate_templates'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    -- ensure RLS is on
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    -- drop our previous unrestricted policy if it exists, then recreate
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',
                   'authenticated_full_access', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      'authenticated_full_access', t
    );

    -- grants
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;
END $$;