-- Fix transferred member status
UPDATE public.members SET status = 'active' WHERE id = '107b7430-7222-4011-bb72-df7ef0bfa21c';

-- Fix profile region_id to match member region
UPDATE public.profiles SET region_id = '3aa567b3-c57f-45a6-b6dc-22fcebde7616' WHERE id = '1d86bcc9-0538-43ab-a1fe-1af9f4f73506';

-- DCG admins can view their DCG financial transactions
CREATE POLICY "DCG admins can view their DCG financial transactions"
ON public.financial_transactions FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'dcg_admin'::app_role) 
  AND dcg_id = get_user_dcg(auth.uid())
);

-- DCG admins can insert their DCG financial transactions
CREATE POLICY "DCG admins can insert their DCG financial transactions"
ON public.financial_transactions FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'dcg_admin'::app_role) 
  AND dcg_id = get_user_dcg(auth.uid())
);

-- DCG admins can update their DCG financial transactions
CREATE POLICY "DCG admins can update their DCG financial transactions"
ON public.financial_transactions FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'dcg_admin'::app_role) 
  AND dcg_id = get_user_dcg(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'dcg_admin'::app_role) 
  AND dcg_id = get_user_dcg(auth.uid())
);

-- Super admins can manage all financial transactions
CREATE POLICY "Super admins can manage all financial transactions"
ON public.financial_transactions FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));