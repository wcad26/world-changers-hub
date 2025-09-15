-- Migration to create member records for regional administrators who don't have them yet
INSERT INTO members (
  id,
  profile_id,
  region_id,
  member_id,
  status,
  member_type,
  join_date,
  is_volunteer,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  p.id,
  p.region_id,
  generate_member_id(p.region_id),
  'active'::member_status,
  'member',
  COALESCE(ur.assigned_at::date, CURRENT_DATE),
  true,
  COALESCE(ur.assigned_at, now()),
  now()
FROM profiles p
JOIN user_roles ur ON p.id = ur.user_id 
WHERE ur.role = 'regional_admin' 
  AND ur.is_active = true 
  AND ur.status = 'active'
  AND p.region_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM members m 
    WHERE m.profile_id = p.id AND m.region_id = p.region_id
  );

-- Create a function to automatically create member records when assigning regional admin roles
CREATE OR REPLACE FUNCTION public.ensure_member_record_for_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create member record if assigning regional_admin role and user doesn't have member record yet
  IF NEW.role = 'regional_admin' AND NEW.is_active = true AND NEW.status = 'active' THEN
    -- Check if user already has a member record in this region
    IF NOT EXISTS (
      SELECT 1 FROM members m 
      JOIN profiles p ON m.profile_id = p.id
      WHERE p.id = NEW.user_id AND m.region_id = NEW.region_id
    ) THEN
      -- Get user's profile and region info
      INSERT INTO members (
        id,
        profile_id,
        region_id,
        member_id,
        status,
        member_type,
        join_date,
        is_volunteer,
        created_at,
        updated_at
      )
      SELECT 
        gen_random_uuid(),
        p.id,
        COALESCE(NEW.region_id, p.region_id),
        generate_member_id(COALESCE(NEW.region_id, p.region_id)),
        'active'::member_status,
        'member',
        CURRENT_DATE,
        true,
        now(),
        now()
      FROM profiles p
      WHERE p.id = NEW.user_id
        AND (NEW.region_id IS NOT NULL OR p.region_id IS NOT NULL);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create member records for new regional admins
CREATE TRIGGER ensure_member_record_for_admin_trigger
  AFTER INSERT OR UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION ensure_member_record_for_admin();