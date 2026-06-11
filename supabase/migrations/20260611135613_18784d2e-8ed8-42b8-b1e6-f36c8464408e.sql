
ALTER TABLE public.financial_transactions ALTER COLUMN region_id DROP NOT NULL;
ALTER TABLE public.fundraising_campaigns ALTER COLUMN region_id DROP NOT NULL;

ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'regional';
ALTER TABLE public.fundraising_campaigns ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'regional';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'financial_transactions_scope_check') THEN
    ALTER TABLE public.financial_transactions ADD CONSTRAINT financial_transactions_scope_check CHECK (scope IN ('regional','global'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fundraising_campaigns_scope_check') THEN
    ALTER TABLE public.fundraising_campaigns ADD CONSTRAINT fundraising_campaigns_scope_check CHECK (scope IN ('regional','global'));
  END IF;
END $$;

UPDATE public.financial_transactions SET scope = 'regional' WHERE scope IS NULL OR (scope = 'regional' AND region_id IS NOT NULL);
UPDATE public.fundraising_campaigns SET scope = 'regional' WHERE scope IS NULL OR (scope = 'regional' AND region_id IS NOT NULL);
