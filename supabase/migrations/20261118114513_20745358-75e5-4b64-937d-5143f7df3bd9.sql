CREATE OR REPLACE FUNCTION public.get_user_dcg(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT dm.dcg_id
  FROM public.dcg_members dm
  JOIN public.members m ON m.id = dm.member_id
  JOIN public.dcgs d ON d.id = dm.dcg_id
  WHERE m.profile_id = _user_id
    AND dm.is_active = true
    AND dm.role IN ('Leader', 'Assistant')
    AND d.is_active = true
  ORDER BY
    CASE dm.role WHEN 'Leader' THEN 0 ELSE 1 END,
    dm.joined_date ASC NULLS LAST,
    dm.dcg_id
  LIMIT 1;
$$;