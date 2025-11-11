-- Create event_slug_history table to track slug changes and enable redirects
CREATE TABLE IF NOT EXISTS public.event_slug_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  old_slug text NOT NULL,
  changed_at timestamp with time zone DEFAULT now(),
  changed_by uuid REFERENCES auth.users(id),
  UNIQUE(old_slug)
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS event_slug_history_old_slug_idx ON public.event_slug_history(old_slug);
CREATE INDEX IF NOT EXISTS event_slug_history_event_id_idx ON public.event_slug_history(event_id);

-- Enable RLS
ALTER TABLE public.event_slug_history ENABLE ROW LEVEL SECURITY;

-- Public can read slug history (needed for redirects to work)
CREATE POLICY "Public can view slug history"
  ON public.event_slug_history 
  FOR SELECT
  USING (true);

-- Regional admins can manage slug history in their region
CREATE POLICY "Regional admins can manage slug history in their region"
  ON public.event_slug_history 
  FOR ALL
  USING (
    has_role(auth.uid(), 'regional_admin'::app_role) 
    AND EXISTS (
      SELECT 1 FROM public.events 
      WHERE events.id = event_slug_history.event_id 
      AND events.region_id = get_user_region(auth.uid())
    )
  );

-- Super admins can manage all slug history
CREATE POLICY "Super admins can manage all slug history"
  ON public.event_slug_history 
  FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));