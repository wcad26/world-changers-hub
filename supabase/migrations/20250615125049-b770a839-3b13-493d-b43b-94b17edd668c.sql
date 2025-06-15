
BEGIN;

-- Step 1: Drop the foreign key constraint that links profiles.id to auth.users.id.
-- This allows profiles to exist without a corresponding system user.
-- The constraint name is inferred from standard Supabase naming conventions.
ALTER TABLE public.profiles DROP CONSTRAINT "profiles_id_fkey";

-- Step 2: Set a default value for the profile ID.
-- This ensures that when a profile is created without a user account (like in our seeding script),
-- it automatically gets a unique ID.
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

COMMIT;
