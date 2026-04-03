
DELETE FROM public.locations a
USING public.locations b
WHERE a.id::text > b.id::text
  AND a.name = b.name
  AND a.type = b.type
  AND a.region_id = b.region_id;
