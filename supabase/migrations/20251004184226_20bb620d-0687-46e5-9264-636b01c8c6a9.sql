-- Add comprehensive expense categories for DCG financial tracking
INSERT INTO financial_transaction_categories (name, type, description, is_active)
VALUES 
  ('Maintenance & Repairs', 'Expense', 'Building and equipment maintenance costs', true),
  ('Office Supplies', 'Expense', 'Stationery, printing, and office materials', true),
  ('Ministry Supplies', 'Expense', 'Bibles, teaching materials, and ministry resources', true),
  ('Travel & Transportation', 'Expense', 'Transportation costs for ministry activities', true),
  ('Event Expenses', 'Expense', 'Costs for organizing DCG events and programs', true),
  ('Communication', 'Expense', 'Phone, internet, and communication costs', true),
  ('Refreshments', 'Expense', 'Food and beverages for DCG meetings', true),
  ('Miscellaneous', 'Expense', 'Other expenses not covered by specific categories', true)
ON CONFLICT (name) DO NOTHING;