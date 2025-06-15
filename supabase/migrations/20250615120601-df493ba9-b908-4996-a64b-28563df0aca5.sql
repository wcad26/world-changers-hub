
CREATE OR REPLACE FUNCTION public.get_global_attendance_summary()
 RETURNS TABLE(region_id uuid, total_present bigint, total_events bigint, avg_attendance numeric)
 LANGUAGE sql
 STABLE
AS $function$
  WITH region_events AS (
    SELECT
      ae.region_id,
      ae.id AS event_id,
      COUNT(ar.id) FILTER (WHERE ar.is_present = TRUE) AS present_count
    FROM public.attendance_events ae
    LEFT JOIN public.attendance_records ar ON ar.event_id = ae.id
    WHERE ae.region_id IS NOT NULL
    GROUP BY ae.region_id, ae.id
  )
  SELECT
    re.region_id,
    SUM(re.present_count) AS total_present,
    COUNT(re.event_id) AS total_events,
    CASE
      WHEN COUNT(re.event_id) > 0 THEN SUM(re.present_count)::numeric / COUNT(re.event_id)
      ELSE 0
    END AS avg_attendance
  FROM region_events re
  GROUP BY re.region_id;
$function$
