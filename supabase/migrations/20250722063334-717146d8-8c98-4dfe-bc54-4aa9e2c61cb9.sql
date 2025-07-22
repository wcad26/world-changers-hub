
-- Add member_id to financial_transactions for better member association
ALTER TABLE public.financial_transactions 
ADD COLUMN member_id uuid REFERENCES public.members(id);

-- Add reference_number for transaction tracking
ALTER TABLE public.financial_transactions 
ADD COLUMN reference_number text;

-- Insert comprehensive financial transaction categories
INSERT INTO public.financial_transaction_categories (name, description, type) VALUES
-- Income categories
('Tithes', 'Regular tithes from members', 'income'),
('Sunday Morning Offering', 'Sunday morning service offerings', 'income'),
('Sunday Evening Offering', 'Sunday evening service offerings', 'income'),
('Midweek Offering', 'Midweek service offerings', 'income'),
('Building Fund', 'Special giving for building projects', 'income'),
('Mission Fund', 'Special giving for missions', 'income'),
('Youth Fund', 'Special giving for youth programs', 'income'),
('Benevolence Fund', 'Special giving for helping others', 'income'),
('Other Donations', 'Other miscellaneous donations', 'income'),

-- Expense categories
('Utilities', 'Electricity, water, gas, internet bills', 'expense'),
('Maintenance', 'Building and equipment maintenance', 'expense'),
('Office Supplies', 'Paper, printing, stationery', 'expense'),
('Programs', 'Youth, children, and other ministry programs', 'expense'),
('Travel', 'Transportation and accommodation for ministry', 'expense'),
('Equipment', 'Audio/visual and other church equipment', 'expense'),
('Insurance', 'Church insurance premiums', 'expense'),
('Salaries', 'Staff salaries and benefits', 'expense'),
('Missions Support', 'Support for missionaries and mission work', 'expense'),
('Other Expenses', 'Other miscellaneous expenses', 'expense')

ON CONFLICT (name) DO NOTHING;

-- Create function to generate reference numbers
CREATE OR REPLACE FUNCTION public.generate_reference_number(_region_id uuid, _transaction_type text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  region_code TEXT;
  next_number INTEGER;
  type_prefix TEXT;
  reference_num TEXT;
BEGIN
  -- Get region code
  SELECT code INTO region_code FROM public.regions WHERE id = _region_id;
  
  -- Set type prefix
  type_prefix := CASE 
    WHEN _transaction_type = 'income' THEN 'INC'
    WHEN _transaction_type = 'expense' THEN 'EXP'
    ELSE 'TXN'
  END;
  
  -- Get next number for this region and type
  SELECT COALESCE(MAX(CAST(SUBSTRING(reference_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.financial_transactions ft
  JOIN public.financial_transaction_categories ftc ON ft.category_id = ftc.id
  WHERE ft.region_id = _region_id 
    AND ftc.type::text = _transaction_type
    AND reference_number IS NOT NULL;
  
  -- Format: REGIONCODE-TYPE-YYYY-NNNN
  reference_num := region_code || '-' || type_prefix || '-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN reference_num;
END;
$$;

-- Create trigger to auto-generate reference numbers
CREATE OR REPLACE FUNCTION public.set_reference_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  transaction_type TEXT;
BEGIN
  -- Get transaction type
  SELECT ftc.type::text INTO transaction_type
  FROM public.financial_transaction_categories ftc
  WHERE ftc.id = NEW.category_id;
  
  -- Generate reference number if not provided
  IF NEW.reference_number IS NULL THEN
    NEW.reference_number := public.generate_reference_number(NEW.region_id, transaction_type);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_set_reference_number ON public.financial_transactions;
CREATE TRIGGER trigger_set_reference_number
  BEFORE INSERT ON public.financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_reference_number();

-- Create function for financial summaries
CREATE OR REPLACE FUNCTION public.get_financial_summary(_region_id uuid, _start_date date DEFAULT NULL, _end_date date DEFAULT NULL)
RETURNS TABLE(
  total_income numeric,
  total_expenses numeric,
  net_balance numeric,
  total_tithes numeric,
  total_offerings numeric,
  total_special_giving numeric
)
LANGUAGE sql
STABLE
AS $$
  WITH filtered_transactions AS (
    SELECT ft.amount, ftc.type, ftc.name
    FROM public.financial_transactions ft
    JOIN public.financial_transaction_categories ftc ON ft.category_id = ftc.id
    WHERE ft.region_id = _region_id
      AND (_start_date IS NULL OR ft.transaction_date >= _start_date)
      AND (_end_date IS NULL OR ft.transaction_date <= _end_date)
  )
  SELECT
    COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0) as total_income,
    COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0) as total_expenses,
    COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0) - COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0) as net_balance,
    COALESCE(SUM(amount) FILTER (WHERE name = 'Tithes'), 0) as total_tithes,
    COALESCE(SUM(amount) FILTER (WHERE name LIKE '%Offering%'), 0) as total_offerings,
    COALESCE(SUM(amount) FILTER (WHERE name IN ('Building Fund', 'Mission Fund', 'Youth Fund', 'Benevolence Fund')), 0) as total_special_giving
  FROM filtered_transactions;
$$;
