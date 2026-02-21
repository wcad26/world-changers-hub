
-- Create member_transfers table for tracking region transfers
CREATE TABLE public.member_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  from_region_id uuid NOT NULL REFERENCES public.regions(id),
  to_region_id uuid NOT NULL REFERENCES public.regions(id),
  old_member_code text NOT NULL,
  new_member_code text NOT NULL,
  reason text,
  notes text,
  transferred_by uuid REFERENCES auth.users(id),
  transferred_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.member_transfers ENABLE ROW LEVEL SECURITY;

-- Super admins can manage all transfers
CREATE POLICY "Super admins can manage all transfers"
ON public.member_transfers
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Regional admins can view transfers involving their region
CREATE POLICY "Regional admins can view transfers in their region"
ON public.member_transfers
FOR SELECT
USING (
  has_role(auth.uid(), 'regional_admin'::app_role) AND (
    from_region_id = get_user_region(auth.uid()) OR
    to_region_id = get_user_region(auth.uid())
  )
);

-- Create index for fast lookups
CREATE INDEX idx_member_transfers_member_id ON public.member_transfers(member_id);
CREATE INDEX idx_member_transfers_transferred_at ON public.member_transfers(transferred_at DESC);
