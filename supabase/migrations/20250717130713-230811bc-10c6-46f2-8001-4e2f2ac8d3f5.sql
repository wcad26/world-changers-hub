-- Fix ambiguous column reference in get_discipleship_impact_trend function
CREATE OR REPLACE FUNCTION public.get_discipleship_impact_trend(_member_id uuid, _region_id uuid)
 RETURNS TABLE(event_date date, event_name text, mentor_attended boolean, disciples_attended bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
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
$function$