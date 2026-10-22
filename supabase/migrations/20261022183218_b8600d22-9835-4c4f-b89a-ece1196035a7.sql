ALTER TABLE public.financial_transactions
  ADD COLUMN IF NOT EXISTS member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS payment_reference text,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'completed';

CREATE INDEX IF NOT EXISTS idx_financial_transactions_member_id ON public.financial_transactions(member_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_financial_transactions_payment_reference ON public.financial_transactions(payment_reference) WHERE payment_reference IS NOT NULL;

DROP POLICY IF EXISTS "Members view own giving" ON public.financial_transactions;
CREATE POLICY "Members view own giving" ON public.financial_transactions
  FOR SELECT TO authenticated
  USING (member_id = ANY (public.get_member_ids_for_user(auth.uid())));