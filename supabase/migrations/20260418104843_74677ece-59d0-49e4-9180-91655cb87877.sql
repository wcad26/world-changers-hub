-- Backfill new permission keys onto existing full-access roles.
-- Any role that currently has 'settings_edit' is considered a full-access role.
UPDATE public.regional_roles
SET permissions = (
  SELECT to_jsonb(
    ARRAY(
      SELECT DISTINCT unnest(
        ARRAY(SELECT jsonb_array_elements_text(permissions))
        || ARRAY[
          'discipleship_view',
          'certificates_view',
          'website_info_view',
          'website_info_edit',
          'access_management'
        ]
      )
    )
  )
)
WHERE is_active = true
  AND permissions ? 'settings_edit';