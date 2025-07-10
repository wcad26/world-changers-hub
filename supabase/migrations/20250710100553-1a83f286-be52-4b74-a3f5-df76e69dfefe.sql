-- Create enum for discipleship relationship status
CREATE TYPE public.discipleship_status AS ENUM ('active', 'completed', 'transferred', 'inactive');

-- Create enum for discipleship milestones
CREATE TYPE public.discipleship_milestone AS ENUM ('first_visit', 'second_visit', 'committed', 'baptized', 'became_member', 'serving');

-- Create discipleship_relationships table
CREATE TABLE public.discipleship_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  disciple_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  region_id UUID REFERENCES public.regions(id) NOT NULL,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  status discipleship_status DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(mentor_id, disciple_id, region_id),
  CHECK (mentor_id != disciple_id)
);

-- Create discipleship_progress table
CREATE TABLE public.discipleship_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id UUID REFERENCES public.discipleship_relationships(id) ON DELETE CASCADE NOT NULL,
  milestone discipleship_milestone NOT NULL,
  achieved_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  recorded_by UUID REFERENCES public.members(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(relationship_id, milestone)
);

-- Enable RLS
ALTER TABLE public.discipleship_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discipleship_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for discipleship_relationships
CREATE POLICY "Regional admins can manage discipleship relationships in their region"
ON public.discipleship_relationships FOR ALL
USING (
  has_role(auth.uid(), 'regional_admin'::app_role) AND 
  region_id = get_user_region(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'regional_admin'::app_role) AND 
  region_id = get_user_region(auth.uid())
);

CREATE POLICY "Super admins can manage all discipleship relationships"
ON public.discipleship_relationships FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for discipleship_progress
CREATE POLICY "Regional admins can manage discipleship progress in their region"
ON public.discipleship_progress FOR ALL
USING (
  has_role(auth.uid(), 'regional_admin'::app_role) AND 
  EXISTS (
    SELECT 1 FROM public.discipleship_relationships dr 
    WHERE dr.id = discipleship_progress.relationship_id 
    AND dr.region_id = get_user_region(auth.uid())
  )
)
WITH CHECK (
  has_role(auth.uid(), 'regional_admin'::app_role) AND 
  EXISTS (
    SELECT 1 FROM public.discipleship_relationships dr 
    WHERE dr.id = discipleship_progress.relationship_id 
    AND dr.region_id = get_user_region(auth.uid())
  )
);

CREATE POLICY "Super admins can manage all discipleship progress"
ON public.discipleship_progress FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Create function to get member discipleship stats
CREATE OR REPLACE FUNCTION public.get_member_discipleship_stats(_member_id UUID)
RETURNS TABLE(
  total_disciples BIGINT,
  active_disciples BIGINT,
  completed_disciples BIGINT,
  success_rate NUMERIC
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  WITH disciple_stats AS (
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'active') as active,
      COUNT(*) FILTER (WHERE status = 'completed') as completed
    FROM public.discipleship_relationships
    WHERE mentor_id = _member_id
  ),
  success_stats AS (
    SELECT COUNT(*) as successful
    FROM public.discipleship_relationships dr
    JOIN public.discipleship_progress dp ON dr.id = dp.relationship_id
    WHERE dr.mentor_id = _member_id 
    AND dp.milestone = 'became_member'
  )
  SELECT 
    ds.total,
    ds.active,
    ds.completed,
    CASE 
      WHEN ds.total > 0 THEN (ss.successful::NUMERIC / ds.total::NUMERIC) * 100
      ELSE 0
    END as success_rate
  FROM disciple_stats ds, success_stats ss;
$$;

-- Create function to get discipleship impact trend
CREATE OR REPLACE FUNCTION public.get_discipleship_impact_trend(_member_id UUID, _region_id UUID)
RETURNS TABLE(
  event_date DATE,
  event_name TEXT,
  mentor_attended BOOLEAN,
  disciples_attended BIGINT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    ae.event_date,
    ae.name as event_name,
    EXISTS (
      SELECT 1 FROM public.attendance_records ar 
      WHERE ar.event_id = ae.id 
      AND ar.member_id = _member_id 
      AND ar.is_present = true
    ) as mentor_attended,
    COUNT(dr.disciple_id) FILTER (
      WHERE EXISTS (
        SELECT 1 FROM public.attendance_records ar2
        WHERE ar2.event_id = ae.id 
        AND ar2.member_id = dr.disciple_id 
        AND ar2.is_present = true
      )
    ) as disciples_attended
  FROM public.attendance_events ae
  LEFT JOIN public.discipleship_relationships dr ON dr.mentor_id = _member_id AND dr.status = 'active'
  WHERE ae.region_id = _region_id
  AND ae.event_date >= CURRENT_DATE - INTERVAL '6 months'
  GROUP BY ae.id, ae.event_date, ae.name
  ORDER BY ae.event_date DESC;
$$;

-- Create trigger for updating timestamps
CREATE TRIGGER update_discipleship_relationships_updated_at
BEFORE UPDATE ON public.discipleship_relationships
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();