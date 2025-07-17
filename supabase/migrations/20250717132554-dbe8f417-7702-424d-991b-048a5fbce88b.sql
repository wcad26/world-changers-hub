-- Remove the generate_dcg_recurring_events function since we'll use manual event creation
DROP FUNCTION IF EXISTS public.generate_dcg_recurring_events(_dcg_id uuid, _weeks_ahead integer);