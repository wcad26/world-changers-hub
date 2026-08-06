CREATE TABLE public.event_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  first_time_attending boolean,
  fellowship text,
  overall_rating smallint,
  communication_rating smallint,
  lodging_rating smallint,
  food_rating smallint,
  children_management_rating smallint,
  teaching_impact text,
  schedule_feedback text,
  impactful_sessions text,
  enjoyed_most text[] NOT NULL DEFAULT '{}',
  enjoyed_most_other text,
  challenges text,
  future_topics text,
  suggestions text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_feedback_unique_member UNIQUE (event_id, member_id),
  CONSTRAINT event_feedback_overall_range CHECK (overall_rating IS NULL OR (overall_rating BETWEEN 1 AND 5)),
  CONSTRAINT event_feedback_comm_range CHECK (communication_rating IS NULL OR (communication_rating BETWEEN 1 AND 5)),
  CONSTRAINT event_feedback_lodging_range CHECK (lodging_rating IS NULL OR (lodging_rating BETWEEN 1 AND 5)),
  CONSTRAINT event_feedback_food_range CHECK (food_rating IS NULL OR (food_rating BETWEEN 1 AND 5)),
  CONSTRAINT event_feedback_children_range CHECK (children_management_rating IS NULL OR (children_management_rating BETWEEN 1 AND 5))
);

GRANT SELECT ON public.event_feedback TO authenticated;
GRANT ALL ON public.event_feedback TO service_role;

ALTER TABLE public.event_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view all event feedback"
ON public.event_feedback FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Region members can view feedback for their region events"
ON public.event_feedback FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.events e
  WHERE e.id = event_feedback.event_id
    AND public.user_belongs_to_region(auth.uid(), e.region_id)
));

CREATE TRIGGER set_event_feedback_updated_at
BEFORE UPDATE ON public.event_feedback
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE INDEX idx_event_feedback_event ON public.event_feedback(event_id);

ALTER TABLE public.event_testimonials
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz;

UPDATE public.event_testimonials SET status = 'approved' WHERE status = 'pending' AND submitted_at IS NULL;

ALTER TABLE public.event_testimonials
  ADD CONSTRAINT event_testimonials_status_check CHECK (status IN ('pending','approved','hidden'));

DROP POLICY IF EXISTS "Public can view testimonials for public events" ON public.event_testimonials;
CREATE POLICY "Public can view approved testimonials for public events"
ON public.event_testimonials FOR SELECT
USING (
  status = 'approved' AND EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_testimonials.event_id AND e.is_public = true
  )
);