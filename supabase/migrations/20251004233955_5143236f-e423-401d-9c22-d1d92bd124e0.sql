-- Add a new "Tithes" category (separate from "Tithes & Offerings")
INSERT INTO financial_transaction_categories (id, name, type, description, is_active)
VALUES (
  gen_random_uuid(),
  'Tithes',
  'Income',
  'Individual tithe payments from members',
  true
)
ON CONFLICT (name) DO NOTHING;