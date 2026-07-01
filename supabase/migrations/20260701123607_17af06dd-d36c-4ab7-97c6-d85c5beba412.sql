CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    region_id,
    phone,
    address,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    CASE
      WHEN NEW.raw_user_meta_data ->> 'region_id' IS NOT NULL
      THEN (NEW.raw_user_meta_data ->> 'region_id')::uuid
      ELSE NULL
    END,
    NEW.raw_user_meta_data ->> 'phone',
    NEW.raw_user_meta_data ->> 'address',
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = COALESCE(public.profiles.email, EXCLUDED.email),
    first_name = COALESCE(public.profiles.first_name, EXCLUDED.first_name),
    last_name = COALESCE(public.profiles.last_name, EXCLUDED.last_name),
    region_id = COALESCE(public.profiles.region_id, EXCLUDED.region_id),
    phone = COALESCE(public.profiles.phone, EXCLUDED.phone),
    address = COALESCE(public.profiles.address, EXCLUDED.address),
    updated_at = now();

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_create_auth_user_for_profile(
  p_profile_id uuid,
  p_email text,
  p_password text DEFAULT '123456'::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, auth, extensions
AS $$
DECLARE
  v_id uuid;
  v_email text := lower(trim(coalesce(p_email, '')));
  v_local text;
  v_domain text;
BEGIN
  SELECT id INTO v_id FROM auth.users WHERE id = p_profile_id;
  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  IF v_email = '' THEN
    v_email := 'user+' || p_profile_id::text || '@placeholder.wcaglobal.org';
  END IF;

  -- If email is already taken by another auth user, append a stable suffix.
  IF EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = v_email AND id <> p_profile_id) THEN
    v_local := split_part(v_email, '@', 1);
    v_domain := nullif(split_part(v_email, '@', 2), '');
    IF v_domain IS NULL THEN
      v_domain := 'placeholder.wcaglobal.org';
    END IF;
    v_email := v_local || '+dup-' || substr(p_profile_id::text, 1, 8) || '@' || v_domain;
  END IF;

  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  )
  VALUES (
    p_profile_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    v_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    created_at,
    updated_at,
    last_sign_in_at
  )
  VALUES (
    gen_random_uuid(),
    p_profile_id,
    p_profile_id::text,
    jsonb_build_object('sub', p_profile_id::text, 'email', v_email),
    'email',
    now(),
    now(),
    now()
  )
  ON CONFLICT (provider, provider_id) DO NOTHING;

  RETURN p_profile_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_create_auth_user_for_profile(uuid, text, text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_auth_user_for_profile(uuid, text, text) TO service_role;