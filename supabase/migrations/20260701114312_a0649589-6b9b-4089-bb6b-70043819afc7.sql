CREATE OR REPLACE FUNCTION public.admin_create_auth_user_for_profile(
  p_profile_id uuid,
  p_email text,
  p_password text DEFAULT '123456'
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_id uuid;
  v_email text := lower(trim(p_email));
BEGIN
  SELECT id INTO v_id FROM auth.users WHERE id = p_profile_id;
  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  IF v_email IS NULL OR v_email = '' THEN
    v_email := 'user+' || p_profile_id::text || '@placeholder.wcaglobal.org';
  END IF;

  -- If email already taken by another auth user, append a suffix.
  IF EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = v_email) THEN
    v_email := split_part(v_email, '@', 1) || '+dup-' || substr(p_profile_id::text, 1, 8) || '@' || split_part(v_email, '@', 2);
  END IF;

  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token,
    email_change_token_new, email_change
  ) VALUES (
    p_profile_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    v_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(), now(), '', '', '', ''
  );

  INSERT INTO auth.identities (
    id, user_id, provider_id, identity_data, provider,
    created_at, updated_at, last_sign_in_at
  ) VALUES (
    gen_random_uuid(), p_profile_id, p_profile_id::text,
    jsonb_build_object('sub', p_profile_id::text, 'email', v_email),
    'email', now(), now(), now()
  );

  RETURN p_profile_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_create_auth_user_for_profile(uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_auth_user_for_profile(uuid, text, text) TO service_role;