
-- Pledge aggregate on campaigns
ALTER TABLE public.fundraising_campaigns
  ADD COLUMN IF NOT EXISTS pledged_total bigint NOT NULL DEFAULT 0;

-- Donation status (default to completed for backward compat)
ALTER TABLE public.fundraising_donations
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'completed';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fundraising_donations_status_check') THEN
    ALTER TABLE public.fundraising_donations
      ADD CONSTRAINT fundraising_donations_status_check
      CHECK (status IN ('pending','completed','failed','refunded'));
  END IF;
END $$;

-- Public pledges table
CREATE TABLE IF NOT EXISTS public.fundraising_pledges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.fundraising_campaigns(id) ON DELETE CASCADE,
  donor_id uuid REFERENCES public.donors(id) ON DELETE SET NULL,
  member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
  pledger_name text NOT NULL,
  pledger_phone text NOT NULL,
  pledger_email text,
  amount bigint NOT NULL CHECK (amount > 0),
  currency_code text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','fulfilled','cancelled')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fundraising_pledges TO authenticated;
GRANT SELECT, INSERT ON public.fundraising_pledges TO anon;
GRANT ALL ON public.fundraising_pledges TO service_role;

ALTER TABLE public.fundraising_pledges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view pledges for public campaigns" ON public.fundraising_pledges;
CREATE POLICY "Public can view pledges for public campaigns"
  ON public.fundraising_pledges FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.fundraising_campaigns c
    WHERE c.id = campaign_id AND c.is_public = true));

DROP POLICY IF EXISTS "Public can insert pledges for public campaigns" ON public.fundraising_pledges;
CREATE POLICY "Public can insert pledges for public campaigns"
  ON public.fundraising_pledges FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.fundraising_campaigns c
    WHERE c.id = campaign_id AND c.is_public = true));

DROP POLICY IF EXISTS "Super admins manage all pledges" ON public.fundraising_pledges;
CREATE POLICY "Super admins manage all pledges"
  ON public.fundraising_pledges FOR ALL TO authenticated
  USING (public.is_super_admin_user(auth.uid()))
  WITH CHECK (public.is_super_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Regional admins manage their pledges" ON public.fundraising_pledges;
CREATE POLICY "Regional admins manage their pledges"
  ON public.fundraising_pledges FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.fundraising_campaigns c
    WHERE c.id = campaign_id AND c.region_id = public.get_user_region(auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.fundraising_campaigns c
    WHERE c.id = campaign_id AND c.region_id = public.get_user_region(auth.uid())));

-- Updated_at trigger
DROP TRIGGER IF EXISTS trg_fundraising_pledges_updated_at ON public.fundraising_pledges;
CREATE TRIGGER trg_fundraising_pledges_updated_at
  BEFORE UPDATE ON public.fundraising_pledges
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- Keep pledged_total in sync
CREATE OR REPLACE FUNCTION public.fr_sync_pledged_total()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _cid uuid := COALESCE(NEW.campaign_id, OLD.campaign_id);
BEGIN
  UPDATE public.fundraising_campaigns
     SET pledged_total = COALESCE((
       SELECT SUM(amount) FROM public.fundraising_pledges
        WHERE campaign_id = _cid AND status = 'active'
     ), 0)
   WHERE id = _cid;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_fr_sync_pledged ON public.fundraising_pledges;
CREATE TRIGGER trg_fr_sync_pledged
  AFTER INSERT OR UPDATE OR DELETE ON public.fundraising_pledges
  FOR EACH ROW EXECUTE FUNCTION public.fr_sync_pledged_total();
