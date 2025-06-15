
-- Create table for attendance events
CREATE TABLE public.attendance_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id UUID REFERENCES public.regions(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create table for attendance records
CREATE TABLE public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.attendance_events(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  is_present BOOLEAN DEFAULT true,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  recorded_by UUID REFERENCES auth.users(id),
  UNIQUE(event_id, member_id)
);

-- Enable RLS for the new tables
ALTER TABLE public.attendance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for attendance_events
CREATE POLICY "Admins can manage attendance events in their region"
ON public.attendance_events FOR ALL
USING (
  (public.has_role(auth.uid(), 'regional_admin') AND region_id = public.get_user_region(auth.uid()))
  OR public.has_role(auth.uid(), 'super_admin')
);

-- RLS Policies for attendance_records
CREATE POLICY "Admins can manage attendance records in their region"
ON public.attendance_records FOR ALL
USING (
  (public.has_role(auth.uid(), 'regional_admin') AND EXISTS (
    SELECT 1 FROM public.attendance_events
    WHERE id = event_id AND region_id = public.get_user_region(auth.uid())
  ))
  OR public.has_role(auth.uid(), 'super_admin')
);
