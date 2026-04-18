-- Strip removed permission keys (locations_*, fundraising_*) from existing regional_roles
UPDATE public.regional_roles
SET permissions = (
  SELECT COALESCE(jsonb_agg(perm), '[]'::jsonb)
  FROM jsonb_array_elements_text(permissions) AS perm
  WHERE perm NOT LIKE 'locations_%'
    AND perm NOT LIKE 'fundraising_%'
)
WHERE permissions ?| array['locations_view','locations_create','locations_edit','fundraising_view','fundraising_create','fundraising_edit'];