-- Add pre-registration toggle to events
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS requires_pre_registration boolean NOT NULL DEFAULT false;

-- Create event_pre_registrations table
CREATE TABLE IF NOT EXISTS public.event_pre_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  registration_type text NOT NULL CHECK (registration_type IN ('individual','family')),
  group_id uuid,
  is_primary boolean NOT NULL DEFAULT false,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_event_pre_registrations_event ON public.event_pre_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_pre_registrations_member ON public.event_pre_registrations(member_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_pre_registrations TO authenticated;
GRANT ALL ON public.event_pre_registrations TO service_role;

ALTER TABLE public.event_pre_registrations ENABLE ROW LEVEL SECURITY;

-- Super admins: full access
CREATE POLICY "Super admins manage all pre-registrations"
ON public.event_pre_registrations
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Regional admins / region members: access for events in their region
CREATE POLICY "Region members manage pre-registrations in their region"
ON public.event_pre_registrations
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.events e
  WHERE e.id = event_pre_registrations.event_id
    AND user_belongs_to_region(auth.uid(), e.region_id)
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.events e
  WHERE e.id = event_pre_registrations.event_id
    AND user_belongs_to_region(auth.uid(), e.region_id)
));
