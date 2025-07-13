-- Fix RLS policies for complete DCG creation

-- Update handle_new_user function to set region_id from metadata if provided
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, region_id)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'first_name', 
    new.raw_user_meta_data ->> 'last_name',
    CASE 
      WHEN new.raw_user_meta_data ->> 'region_id' IS NOT NULL 
      THEN (new.raw_user_meta_data ->> 'region_id')::uuid
      ELSE NULL
    END
  );
  RETURN new;
END;
$function$;

-- Ensure the trigger exists for auto-profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Allow regional admins to update profiles that don't have region_id set yet (newly created users)
CREATE POLICY "Regional admins can update profiles without region during creation"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'regional_admin') AND 
  region_id IS NULL
)
WITH CHECK (
  has_role(auth.uid(), 'regional_admin') AND 
  region_id = get_user_region(auth.uid())
);

-- Allow service role to create profiles during DCG creation process
CREATE POLICY "Service role can create profiles during DCG creation"
ON public.profiles
FOR INSERT
TO service_role
WITH CHECK (true);

-- Allow service role to assign roles during DCG creation
CREATE POLICY "Service role can assign roles during DCG creation"
ON public.user_roles
FOR INSERT
TO service_role
WITH CHECK (true);

-- Allow service role to create DCG sessions during creation
CREATE POLICY "Service role can create DCG sessions during creation"
ON public.dcg_user_sessions
FOR INSERT
TO service_role
WITH CHECK (true);