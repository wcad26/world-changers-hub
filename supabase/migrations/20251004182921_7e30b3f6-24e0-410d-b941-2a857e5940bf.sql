-- Add DCG-specific income categories if they don't exist
INSERT INTO financial_transaction_categories (name, type, description)
VALUES 
  ('Offerings', 'Income', 'Regular offerings collected during DCG meetings'),
  ('Special Giving', 'Income', 'Special contributions and fundraising for specific purposes')
ON CONFLICT DO NOTHING;