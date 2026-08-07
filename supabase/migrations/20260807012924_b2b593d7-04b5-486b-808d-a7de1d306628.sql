ALTER TABLE public.event_feedback ALTER COLUMN member_id DROP NOT NULL;

DO $$
DECLARE c record;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.event_feedback'::regclass AND contype = 'u'
  LOOP
    EXECUTE format('ALTER TABLE public.event_feedback DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

DROP INDEX IF EXISTS public.event_feedback_event_member_unique;

CREATE INDEX IF NOT EXISTS event_feedback_event_id_idx ON public.event_feedback (event_id);