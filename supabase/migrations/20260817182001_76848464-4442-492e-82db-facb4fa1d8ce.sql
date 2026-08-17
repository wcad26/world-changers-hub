CREATE TABLE public.event_recurrence_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  region_id uuid REFERENCES public.regions(id) ON DELETE CASCADE,
  dcg_id uuid REFERENCES public.dcgs(id) ON DELETE CASCADE,
  name text NOT NULL,
  frequency text NOT NULL DEFAULT 'weekly',
  interval_count integer NOT NULL DEFAULT 1,
  days_of_week integer[] NOT NULL DEFAULT '{}',
  start_time time NOT NULL DEFAULT '09:00',
  duration_minutes integer NOT NULL DEFAULT 120,
  lead_time_days integer NOT NULL DEFAULT 30,
  end_date date,
  is_active boolean NOT NULL DEFAULT true,
  last_generated_until date,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_recurrence_rules TO authenticated;
GRANT ALL ON public.event_recurrence_rules TO service_role;

ALTER TABLE public.event_recurrence_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage all recurrence rules"
ON public.event_recurrence_rules FOR ALL TO authenticated
USING (public.is_super_admin_user(auth.uid()))
WITH CHECK (public.is_super_admin_user(auth.uid()));

CREATE POLICY "Regional users view their recurrence rules"
ON public.event_recurrence_rules FOR SELECT TO authenticated
USING (region_id IS NOT NULL AND public.user_belongs_to_region(auth.uid(), region_id));

CREATE POLICY "Regional admins insert recurrence rules"
ON public.event_recurrence_rules FOR INSERT TO authenticated
WITH CHECK (
  region_id IS NOT NULL
  AND public.has_regional_permission(auth.uid(), region_id, 'events_create')
);

CREATE POLICY "Regional admins update recurrence rules"
ON public.event_recurrence_rules FOR UPDATE TO authenticated
USING (region_id IS NOT NULL AND public.has_regional_permission(auth.uid(), region_id, 'events_edit'))
WITH CHECK (region_id IS NOT NULL AND public.has_regional_permission(auth.uid(), region_id, 'events_edit'));

CREATE POLICY "Regional admins delete recurrence rules"
ON public.event_recurrence_rules FOR DELETE TO authenticated
USING (region_id IS NOT NULL AND public.has_regional_permission(auth.uid(), region_id, 'events_delete'));

CREATE POLICY "DCG leaders manage their recurrence rules"
ON public.event_recurrence_rules FOR ALL TO authenticated
USING (dcg_id IS NOT NULL AND dcg_id = public.get_user_dcg(auth.uid()))
WITH CHECK (dcg_id IS NOT NULL AND dcg_id = public.get_user_dcg(auth.uid()));

CREATE TRIGGER trg_event_recurrence_rules_updated
BEFORE UPDATE ON public.event_recurrence_rules
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS recurrence_rule_id uuid REFERENCES public.event_recurrence_rules(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_recurring_instance boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS detached_from_series boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS events_recurrence_slot_unique
  ON public.events (recurrence_rule_id, start_datetime)
  WHERE recurrence_rule_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_event_recurrence_rules_active
  ON public.event_recurrence_rules (is_active, last_generated_until);