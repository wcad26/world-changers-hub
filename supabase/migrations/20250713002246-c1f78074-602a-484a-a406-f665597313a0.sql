-- Fix DCG creation issue by assigning regional_admin role to the current user
-- and setting their region properly

-- First check if the role already exists, if not insert it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = '56c2824b-357f-40e5-9b64-4ea698805875' 
    AND role = 'regional_admin'
  ) THEN
    INSERT INTO user_roles (user_id, role, region_id, is_active)
    VALUES ('56c2824b-357f-40e5-9b64-4ea698805875', 'regional_admin', 'dbf432ef-5844-4558-b385-698e17be919e', true);
  ELSE
    UPDATE user_roles 
    SET region_id = 'dbf432ef-5844-4558-b385-698e17be919e', is_active = true
    WHERE user_id = '56c2824b-357f-40e5-9b64-4ea698805875' AND role = 'regional_admin';
  END IF;
END $$;

-- Update their profile with the correct region
UPDATE profiles 
SET region_id = 'dbf432ef-5844-4558-b385-698e17be919e'
WHERE id = '56c2824b-357f-40e5-9b64-4ea698805875';