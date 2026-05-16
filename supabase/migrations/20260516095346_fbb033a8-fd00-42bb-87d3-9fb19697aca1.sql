-- 1. Donors table for external (non-member) donors
CREATE TABLE public.donors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id uuid NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  address text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_donors_region ON public.donors(region_id);
CREATE INDEX idx_donors_name ON public.donors(last_name, first_name);
CREATE UNIQUE INDEX idx_donors_region_email_unique
  ON public.donors(region_id, lower(email))
  WHERE email IS NOT NULL;

ALTER TABLE public.donors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Regional admins manage donors in their region"
  ON public.donors FOR ALL
  USING (has_role(auth.uid(), 'regional_admin'::app_role) AND region_id = get_user_region(auth.uid()))
  WITH CHECK (has_role(auth.uid(), 'regional_admin'::app_role) AND region_id = get_user_region(auth.uid()));

CREATE POLICY "Super admins manage all donors"
  ON public.donors FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER donors_set_timestamp
  BEFORE UPDATE ON public.donors
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- 2. Link donations to member or external donor
ALTER TABLE public.fundraising_donations
  ADD COLUMN donor_id uuid REFERENCES public.donors(id) ON DELETE SET NULL,
  ADD COLUMN member_id uuid;

CREATE INDEX idx_fundraising_donations_donor ON public.fundraising_donations(donor_id);
CREATE INDEX idx_fundraising_donations_member ON public.fundraising_donations(member_id);

-- 3. Search RPC for donors (mirrors search_all_members)
CREATE OR REPLACE FUNCTION public.search_all_donors(_search text DEFAULT ''::text)
RETURNS TABLE(id uuid, first_name text, last_name text, email text, phone text, region_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT d.id, d.first_name, d.last_name, d.email, d.phone, d.region_id
  FROM public.donors d
  WHERE (
    _search = ''
    OR d.first_name ILIKE '%' || _search || '%'
    OR d.last_name ILIKE '%' || _search || '%'
    OR d.email ILIKE '%' || _search || '%'
  )
  ORDER BY d.last_name, d.first_name
  LIMIT 50;
$$;