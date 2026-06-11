-- Backfill financial_transactions.currency_code to match the region's currency
-- where the row was saved with the bogus default 'USD'. Then drop the default
-- so future inserts must specify currency explicitly.

UPDATE public.financial_transactions ft
SET currency_code = r.currency_code
FROM public.regions r
WHERE ft.region_id = r.id
  AND r.currency_code IS NOT NULL
  AND ft.currency_code = 'USD'
  AND r.currency_code <> 'USD';

ALTER TABLE public.financial_transactions ALTER COLUMN currency_code DROP DEFAULT;