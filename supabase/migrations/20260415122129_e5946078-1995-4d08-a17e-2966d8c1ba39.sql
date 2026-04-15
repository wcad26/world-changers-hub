
CREATE OR REPLACE FUNCTION public.search_all_members(_search text DEFAULT ''::text)
RETURNS TABLE(id uuid, member_id text, first_name text, last_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT m.id, m.member_id, p.first_name, p.last_name
  FROM public.members m
  JOIN public.profiles p ON p.id = m.profile_id
  WHERE m.status != 'inactive'
    AND (
      _search = '' 
      OR p.first_name ILIKE '%' || _search || '%'
      OR p.last_name ILIKE '%' || _search || '%'
    )
  ORDER BY p.last_name, p.first_name
  LIMIT 50;
$$;
