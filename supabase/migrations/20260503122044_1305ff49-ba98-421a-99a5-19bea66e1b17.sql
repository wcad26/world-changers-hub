CREATE OR REPLACE FUNCTION public.get_my_regional_context()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  prof public.profiles%ROWTYPE;
  reg public.regions%ROWTYPE;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('user_id', NULL, 'profile', NULL, 'region', NULL);
  END IF;

  SELECT * INTO prof FROM public.profiles WHERE id = uid;

  IF prof.region_id IS NOT NULL THEN
    SELECT * INTO reg FROM public.regions WHERE id = prof.region_id;
  END IF;

  RETURN jsonb_build_object(
    'user_id', uid,
    'profile', CASE WHEN prof.id IS NOT NULL THEN to_jsonb(prof) ELSE NULL END,
    'region', CASE WHEN reg.id IS NOT NULL THEN to_jsonb(reg) ELSE NULL END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_regional_context() TO authenticated, anon;