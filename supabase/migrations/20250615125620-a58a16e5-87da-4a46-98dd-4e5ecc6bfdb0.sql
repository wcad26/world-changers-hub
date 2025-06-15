
-- Fix for ambiguous column reference in generate_member_id function.
-- The original function had a local variable `member_id` that conflicted
-- with the `member_id` column in the `public.members` table.
-- This update explicitly qualifies the column name and renames the local
-- variable to resolve the ambiguity.

CREATE OR REPLACE FUNCTION public.generate_member_id(_region_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  region_code TEXT;
  next_number INTEGER;
  generated_member_id TEXT; -- Renamed variable to avoid conflict
BEGIN
  -- Get region code
  SELECT code INTO region_code FROM public.regions WHERE id = _region_id;

  -- Get next number for this region, explicitly referencing the table column
  SELECT COALESCE(MAX(CAST(SUBSTRING(m.member_id FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.members m
  WHERE m.region_id = _region_id;

  -- Format: REGIONCODE-YYYY-NNNN
  generated_member_id := region_code || '-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD(next_number::TEXT, 4, '0');

  RETURN generated_member_id;
END;
$$;
