ALTER TABLE public.event_feedback
  ADD COLUMN IF NOT EXISTS kids_attended boolean,
  ADD COLUMN IF NOT EXISTS kids_daily_attendance text,
  ADD COLUMN IF NOT EXISTS kids_comprehension_rating smallint,
  ADD COLUMN IF NOT EXISTS kids_care_rating smallint,
  ADD COLUMN IF NOT EXISTS kids_meals_rating smallint,
  ADD COLUMN IF NOT EXISTS kids_remarks text;