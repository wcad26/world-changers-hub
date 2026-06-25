
-- Backfill report table
CREATE TABLE IF NOT EXISTS public.backfill_auth_users_report (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at timestamptz NOT NULL DEFAULT now(),
  profile_id uuid,
  email text,
  action text NOT NULL,
  note text
);

GRANT SELECT, INSERT ON public.backfill_auth_users_report TO authenticated;
GRANT ALL ON public.backfill_auth_users_report TO service_role;

ALTER TABLE public.backfill_auth_users_report ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can read backfill report"
  ON public.backfill_auth_users_report FOR SELECT
  TO authenticated
  USING (public.is_super_admin_user(auth.uid()));

-- Trigger to require auth user for every new profile.
-- Skipped when current role is service_role (admin/edge function flows
-- typically create auth user first, then profile via handle_new_user).
CREATE OR REPLACE FUNCTION public.profiles_require_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.id) THEN
    RAISE EXCEPTION 'Profile % cannot be created without a matching auth.users row. Create the auth account first.', NEW.id
      USING ERRCODE = 'foreign_key_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_require_auth_user ON public.profiles;
CREATE TRIGGER profiles_require_auth_user
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_require_auth_user();
