-- Fix RLS policies for DCG creation

-- Update locations RLS policy to be more permissive for regional admins
DROP POLICY IF EXISTS "Regional admins can manage locations in their region" ON public.locations;

CREATE POLICY "Regional admins can manage locations in their region"
ON public.locations FOR ALL
USING (
  has_role(auth.uid(), 'regional_admin') AND 
  (region_id = get_user_region(auth.uid()) OR region_id IS NULL)
)
WITH CHECK (
  has_role(auth.uid(), 'regional_admin') AND 
  (region_id = get_user_region(auth.uid()) OR region_id IS NULL)
);

-- Ensure DCG leaders can access their DCG data
CREATE POLICY IF NOT EXISTS "DCG leaders can view DCGs they lead"
ON public.dcgs FOR SELECT
USING (
  has_role(auth.uid(), 'dcg_leader') AND 
  id = get_user_dcg(auth.uid())
);

-- Allow DCG leaders to view locations in their region
CREATE POLICY IF NOT EXISTS "DCG leaders can view locations in their region"
ON public.locations FOR SELECT
USING (
  has_role(auth.uid(), 'dcg_leader') AND 
  region_id = get_region_from_dcg(get_user_dcg(auth.uid()))
);

-- Ensure super admins have full access
CREATE POLICY IF NOT EXISTS "Super admins can manage all locations"
ON public.locations FOR ALL
USING (has_role(auth.uid(), 'super_admin'));