CREATE OR REPLACE FUNCTION public.admin_sync_auth_email_for_profile(p_profile_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, auth
AS $$
DECLARE
  v_email text;
BEGIN
  SELECT lower(trim(email)) INTO v_email
  FROM public.profiles
  WHERE id = p_profile_id;

  IF v_email IS NULL OR v_email = '' THEN
    RAISE EXCEPTION 'Profile % has no email to sync', p_profile_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM auth.users
    WHERE lower(email) = v_email
      AND id <> p_profile_id
  ) THEN
    RAISE EXCEPTION 'Email % is already used by another auth user', v_email;
  END IF;

  UPDATE auth.users
  SET
    email = v_email,
    updated_at = now(),
    email_confirmed_at = COALESCE(email_confirmed_at, now())
  WHERE id = p_profile_id;

  UPDATE auth.identities
  SET
    identity_data = jsonb_set(
      jsonb_set(COALESCE(identity_data, '{}'::jsonb), '{email}', to_jsonb(v_email)),
      '{sub}',
      to_jsonb(p_profile_id::text)
    ),
    updated_at = now()
  WHERE user_id = p_profile_id
    AND provider = 'email';

  RETURN p_profile_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_sync_auth_email_for_profile(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_sync_auth_email_for_profile(uuid) TO service_role;