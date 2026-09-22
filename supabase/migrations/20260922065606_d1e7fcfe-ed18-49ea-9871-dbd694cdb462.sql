ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS expectations text,
  ADD COLUMN IF NOT EXISTS expectations_fr text;