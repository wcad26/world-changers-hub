-- Add RLS policies for DCG admins to manage events for their DCG

-- Allow DCG admins to create events for their DCG
CREATE POLICY "DCG admins can create events for their DCG"
ON public.events FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'dcg_admin'::app_role) 
  AND dcg_id = get_user_dcg(auth.uid())
  AND region_id = get_region_from_dcg(dcg_id)
);

-- Allow DCG admins to manage events for their DCG  
CREATE POLICY "DCG admins can manage events for their DCG"
ON public.events FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'dcg_admin'::app_role) 
  AND dcg_id = get_user_dcg(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'dcg_admin'::app_role) 
  AND dcg_id = get_user_dcg(auth.uid())
  AND region_id = get_region_from_dcg(dcg_id)
);