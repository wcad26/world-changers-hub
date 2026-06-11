
-- Events: linked campaign + collection toggles
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS linked_fundraising_campaign_id uuid REFERENCES public.fundraising_campaigns(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS collect_lodging boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS collect_meal_preferences boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS collect_pledges boolean NOT NULL DEFAULT false;

-- Pre-registrations: special event fields
ALTER TABLE public.event_pre_registrations
  ADD COLUMN IF NOT EXISTS attending_with_family boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_children boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS needs_lodging boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS lodging_party_size integer,
  ADD COLUMN IF NOT EXISTS meal_preferences text[],
  ADD COLUMN IF NOT EXISTS dietary_notes text,
  ADD COLUMN IF NOT EXISTS pledge_amount numeric,
  ADD COLUMN IF NOT EXISTS pledge_currency_code text,
  ADD COLUMN IF NOT EXISTS pledge_status text DEFAULT 'pledged',
  ADD COLUMN IF NOT EXISTS arrival_date date,
  ADD COLUMN IF NOT EXISTS departure_date date,
  ADD COLUMN IF NOT EXISTS phone text;

-- Multi-day parent linkage on attendance_events
ALTER TABLE public.attendance_events
  ADD COLUMN IF NOT EXISTS parent_event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS day_index integer;

-- Traceability from donation back to pre-registration
ALTER TABLE public.fundraising_donations
  ADD COLUMN IF NOT EXISTS event_pre_registration_id uuid REFERENCES public.event_pre_registrations(id) ON DELETE SET NULL;

-- Grants (keep public can SELECT events; preregistrations stays scoped to existing policies)
GRANT SELECT ON public.events TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_pre_registrations TO authenticated;
GRANT SELECT, INSERT ON public.event_pre_registrations TO anon;
GRANT ALL ON public.event_pre_registrations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fundraising_donations TO authenticated;
GRANT SELECT ON public.fundraising_donations TO anon;

-- Allow anonymous inserts on event_pre_registrations for public registration page (already gated by edge function in practice)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'event_pre_registrations' AND policyname = 'Anyone can insert pre-registrations'
  ) THEN
    EXECUTE 'CREATE POLICY "Anyone can insert pre-registrations" ON public.event_pre_registrations FOR INSERT TO anon, authenticated WITH CHECK (true)';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'event_pre_registrations' AND policyname = 'Anyone can read pre-registrations'
  ) THEN
    EXECUTE 'CREATE POLICY "Anyone can read pre-registrations" ON public.event_pre_registrations FOR SELECT TO anon, authenticated USING (true)';
  END IF;
END$$;
