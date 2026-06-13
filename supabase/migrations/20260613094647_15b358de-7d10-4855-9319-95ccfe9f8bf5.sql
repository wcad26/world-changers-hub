
-- 1. Approval audit columns on user_roles
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS decided_by uuid,
  ADD COLUMN IF NOT EXISTS decided_at timestamptz;

-- 2. super_admin_roles
CREATE TABLE IF NOT EXISTS public.super_admin_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_reserved boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.super_admin_roles TO authenticated;
GRANT ALL ON public.super_admin_roles TO service_role;
ALTER TABLE public.super_admin_roles ENABLE ROW LEVEL SECURITY;

-- 3. super_admin_user_roles
CREATE TABLE IF NOT EXISTS public.super_admin_user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  super_admin_role_id uuid NOT NULL REFERENCES public.super_admin_roles(id) ON DELETE RESTRICT,
  assigned_by uuid,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE (user_id, super_admin_role_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.super_admin_user_roles TO authenticated;
GRANT ALL ON public.super_admin_user_roles TO service_role;
ALTER TABLE public.super_admin_user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Helper: is the user a super admin (uses existing user_roles)
CREATE OR REPLACE FUNCTION public.is_super_admin_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'super_admin'::app_role
      AND COALESCE(is_active, true) = true
  );
$$;

-- 5. Helper: does the user have a given super-admin permission key
CREATE OR REPLACE FUNCTION public.has_super_permission(_user_id uuid, _perm text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.super_admin_user_roles sur
    JOIN public.super_admin_roles sr ON sr.id = sur.super_admin_role_id
    WHERE sur.user_id = _user_id
      AND sur.is_active = true
      AND sr.is_active = true
      AND (
        sr.is_reserved = true
        OR sr.permissions ? _perm
      )
  );
$$;

-- 6. Helper: is the user a Principal super admin
CREATE OR REPLACE FUNCTION public.is_principal_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.super_admin_user_roles sur
    JOIN public.super_admin_roles sr ON sr.id = sur.super_admin_role_id
    WHERE sur.user_id = _user_id
      AND sur.is_active = true
      AND sr.is_reserved = true
  );
$$;

-- 7. RLS policies on super_admin_roles
DROP POLICY IF EXISTS "Super admins can read roles" ON public.super_admin_roles;
CREATE POLICY "Super admins can read roles"
  ON public.super_admin_roles FOR SELECT
  TO authenticated
  USING (public.is_super_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Manage super admin roles - insert" ON public.super_admin_roles;
CREATE POLICY "Manage super admin roles - insert"
  ON public.super_admin_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_super_permission(auth.uid(), 'manage_super_admin_roles')
    AND is_reserved = false
  );

DROP POLICY IF EXISTS "Manage super admin roles - update" ON public.super_admin_roles;
CREATE POLICY "Manage super admin roles - update"
  ON public.super_admin_roles FOR UPDATE
  TO authenticated
  USING (
    public.has_super_permission(auth.uid(), 'manage_super_admin_roles')
    AND is_reserved = false
  )
  WITH CHECK (is_reserved = false);

DROP POLICY IF EXISTS "Manage super admin roles - delete" ON public.super_admin_roles;
CREATE POLICY "Manage super admin roles - delete"
  ON public.super_admin_roles FOR DELETE
  TO authenticated
  USING (
    public.has_super_permission(auth.uid(), 'manage_super_admin_roles')
    AND is_reserved = false
  );

-- 8. RLS policies on super_admin_user_roles
DROP POLICY IF EXISTS "Super admins can read user roles" ON public.super_admin_user_roles;
CREATE POLICY "Super admins can read user roles"
  ON public.super_admin_user_roles FOR SELECT
  TO authenticated
  USING (public.is_super_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Manage super admin users - insert" ON public.super_admin_user_roles;
CREATE POLICY "Manage super admin users - insert"
  ON public.super_admin_user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_super_permission(auth.uid(), 'manage_super_admin_users'));

DROP POLICY IF EXISTS "Manage super admin users - update" ON public.super_admin_user_roles;
CREATE POLICY "Manage super admin users - update"
  ON public.super_admin_user_roles FOR UPDATE
  TO authenticated
  USING (public.has_super_permission(auth.uid(), 'manage_super_admin_users'))
  WITH CHECK (public.has_super_permission(auth.uid(), 'manage_super_admin_users'));

DROP POLICY IF EXISTS "Manage super admin users - delete" ON public.super_admin_user_roles;
CREATE POLICY "Manage super admin users - delete"
  ON public.super_admin_user_roles FOR DELETE
  TO authenticated
  USING (public.has_super_permission(auth.uid(), 'manage_super_admin_users'));

-- 9. updated_at trigger on super_admin_roles
DROP TRIGGER IF EXISTS trg_super_admin_roles_updated ON public.super_admin_roles;
CREATE TRIGGER trg_super_admin_roles_updated
  BEFORE UPDATE ON public.super_admin_roles
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- 10. Protect the reserved Principal role from deletion / un-reserving
CREATE OR REPLACE FUNCTION public.protect_reserved_super_admin_role()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' AND OLD.is_reserved = true THEN
    RAISE EXCEPTION 'The reserved super admin role cannot be deleted.';
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.is_reserved = true AND NEW.is_reserved = false THEN
    RAISE EXCEPTION 'The reserved super admin role cannot be un-reserved.';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_reserved_super_admin_role ON public.super_admin_roles;
CREATE TRIGGER trg_protect_reserved_super_admin_role
  BEFORE UPDATE OR DELETE ON public.super_admin_roles
  FOR EACH ROW EXECUTE FUNCTION public.protect_reserved_super_admin_role();

-- 11. Seed built-in roles (idempotent by unique name)
INSERT INTO public.super_admin_roles (name, description, permissions, is_reserved)
VALUES
  (
    'Principal Super Admin',
    'Top-level super admin with unrestricted access. Cannot be edited or deleted.',
    '[]'::jsonb,
    true
  ),
  (
    'Operations Admin',
    'Day-to-day operations across all regions, without managing super admin users or roles.',
    '["super_dashboard_view","super_members_view","super_members_edit","manage_regional_users","approve_role_requests","super_events_view","super_events_manage","super_certificates_view","super_certificates_manage","super_finances_view","super_reports_view","super_communication_view","super_communication_send","super_regions_view","super_locations_manage","super_settings_view"]'::jsonb,
    false
  ),
  (
    'Finance Admin',
    'Full access to finances and reports. Read-only elsewhere.',
    '["super_dashboard_view","super_members_view","super_events_view","super_finances_view","super_finances_manage","super_reports_view","super_regions_view","super_communication_view","super_settings_view"]'::jsonb,
    false
  ),
  (
    'Content Admin',
    'Manages homepage, about page, certificates, and communications.',
    '["super_dashboard_view","super_homepage_manage","super_certificates_view","super_certificates_manage","super_communication_view","super_communication_send","super_events_view","super_settings_view"]'::jsonb,
    false
  ),
  (
    'Read-Only Auditor',
    'Read-only access across the super admin portal. No editing capabilities.',
    '["super_dashboard_view","super_members_view","super_events_view","super_certificates_view","super_finances_view","super_reports_view","super_communication_view","super_regions_view","super_settings_view"]'::jsonb,
    false
  )
ON CONFLICT (name) DO NOTHING;

-- 12. Promote the earliest active super admin as Principal if none yet
DO $$
DECLARE
  reserved_role_id uuid;
  first_super_admin uuid;
BEGIN
  SELECT id INTO reserved_role_id
  FROM public.super_admin_roles
  WHERE is_reserved = true
  LIMIT 1;

  IF reserved_role_id IS NULL THEN
    RETURN;
  END IF;

  -- Skip if a Principal already exists
  IF EXISTS (
    SELECT 1 FROM public.super_admin_user_roles sur
    WHERE sur.super_admin_role_id = reserved_role_id
      AND sur.is_active = true
  ) THEN
    RETURN;
  END IF;

  SELECT user_id INTO first_super_admin
  FROM public.user_roles
  WHERE role = 'super_admin'::app_role
    AND COALESCE(is_active, true) = true
  ORDER BY assigned_at ASC NULLS LAST
  LIMIT 1;

  IF first_super_admin IS NOT NULL THEN
    INSERT INTO public.super_admin_user_roles (user_id, super_admin_role_id, assigned_by, is_active)
    VALUES (first_super_admin, reserved_role_id, first_super_admin, true)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
