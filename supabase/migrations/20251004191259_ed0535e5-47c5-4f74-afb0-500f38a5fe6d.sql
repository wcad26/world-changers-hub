-- Create currencies table
CREATE TABLE public.currencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  decimal_places SMALLINT DEFAULT 2,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view active currencies"
  ON public.currencies FOR SELECT
  USING (is_active = true);

CREATE POLICY "Super admins can manage all currencies"
  ON public.currencies FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_currencies_updated_at
  BEFORE UPDATE ON public.currencies
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

-- Seed initial currency data
INSERT INTO public.currencies (code, name, symbol, decimal_places) VALUES
  ('USD', 'US Dollar', '$', 2),
  ('EUR', 'Euro', '€', 2),
  ('GBP', 'British Pound', '£', 2),
  ('NGN', 'Nigerian Naira', '₦', 2),
  ('GHS', 'Ghanaian Cedi', '₵', 2),
  ('ZAR', 'South African Rand', 'R', 2),
  ('KES', 'Kenyan Shilling', 'KSh', 2),
  ('CAD', 'Canadian Dollar', 'CA$', 2),
  ('AUD', 'Australian Dollar', 'A$', 2),
  ('INR', 'Indian Rupee', '₹', 2),
  ('JPY', 'Japanese Yen', '¥', 0),
  ('CNY', 'Chinese Yuan', '¥', 2),
  ('BRL', 'Brazilian Real', 'R$', 2),
  ('MXN', 'Mexican Peso', 'MX$', 2),
  ('CHF', 'Swiss Franc', 'CHF', 2)
ON CONFLICT (code) DO NOTHING;

-- Update regions table
ALTER TABLE public.regions 
ADD COLUMN IF NOT EXISTS currency_code TEXT DEFAULT 'USD' REFERENCES public.currencies(code);

CREATE INDEX IF NOT EXISTS idx_regions_currency ON public.regions(currency_code);

-- Update financial_transactions table
ALTER TABLE public.financial_transactions
ADD COLUMN IF NOT EXISTS currency_code TEXT REFERENCES public.currencies(code);

-- Backfill with region's currency
UPDATE public.financial_transactions ft
SET currency_code = COALESCE(
  (SELECT r.currency_code FROM public.regions r WHERE ft.region_id = r.id),
  'USD'
)
WHERE ft.currency_code IS NULL;

-- Make it NOT NULL after backfill
ALTER TABLE public.financial_transactions
ALTER COLUMN currency_code SET NOT NULL,
ALTER COLUMN currency_code SET DEFAULT 'USD';

-- Update fundraising_campaigns
ALTER TABLE public.fundraising_campaigns
RENAME COLUMN currency TO currency_code;

ALTER TABLE public.fundraising_campaigns
ADD CONSTRAINT fk_fundraising_campaigns_currency 
  FOREIGN KEY (currency_code) REFERENCES public.currencies(code);

-- Update fundraising_donations
ALTER TABLE public.fundraising_donations
RENAME COLUMN currency TO currency_code;

ALTER TABLE public.fundraising_donations
ADD CONSTRAINT fk_fundraising_donations_currency 
  FOREIGN KEY (currency_code) REFERENCES public.currencies(code);