-- Create a SECURITY DEFINER function to get member IDs for a user
-- This bypasses RLS to prevent infinite recursion
CREATE OR REPLACE FUNCTION public.get_member_ids_for_user(_user_id uuid)
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY_AGG(id) FROM public.members WHERE profile_id = _user_id;
$$;

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Members can view members for discipleship" ON public.members;

-- Recreate the policy using the new helper function
CREATE POLICY "Members can view members for discipleship" ON public.members
FOR SELECT USING (
  -- User can see their own member record
  profile_id = auth.uid()
  -- Or members they are discipling (their disciples)
  OR id IN (
    SELECT disciple_id FROM public.discipleship_relationships 
    WHERE mentor_id = ANY(get_member_ids_for_user(auth.uid()))
  )
  -- Or their mentors
  OR id IN (
    SELECT mentor_id FROM public.discipleship_relationships 
    WHERE disciple_id = ANY(get_member_ids_for_user(auth.uid()))
  )
);