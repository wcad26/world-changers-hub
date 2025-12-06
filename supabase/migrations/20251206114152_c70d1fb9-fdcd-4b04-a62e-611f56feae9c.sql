-- Update handle_new_user trigger to capture phone and address from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, region_id, phone, address)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'first_name', 
    new.raw_user_meta_data ->> 'last_name',
    CASE 
      WHEN new.raw_user_meta_data ->> 'region_id' IS NOT NULL 
      THEN (new.raw_user_meta_data ->> 'region_id')::uuid
      ELSE NULL
    END,
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'address'
  );
  RETURN new;
END;
$function$;