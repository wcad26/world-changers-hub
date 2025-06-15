
CREATE OR REPLACE FUNCTION public.get_attendance_summary(p_region_id uuid)
 RETURNS TABLE(event_id uuid, event_name text, event_date date, present_count bigint, absent_count bigint)
 LANGUAGE sql
 STABLE
AS $function$
  SELECT
    ae.id as event_id,
    ae.name as event_name,
    ae.event_date,
    COUNT(ar.id) FILTER (WHERE ar.is_present = true) as present_count,
    COUNT(ar.id) FILTER (WHERE ar.is_present = false) as absent_count
  FROM public.attendance_events ae
  LEFT JOIN public.attendance_records ar ON ae.id = ar.event_id
  WHERE ae.region_id = p_region_id
  GROUP BY ae.id, ae.name, ae.event_date
  ORDER BY ae.event_date DESC;
$function$
