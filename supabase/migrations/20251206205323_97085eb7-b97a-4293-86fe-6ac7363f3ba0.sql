-- Drop the problematic policy on discipleship_relationships that causes indirect recursion
DROP POLICY IF EXISTS "Members can view own discipleship relationships" ON public.discipleship_relationships;

-- Recreate the policy using the SECURITY DEFINER helper function
CREATE POLICY "Members can view own discipleship relationships" 
ON public.discipleship_relationships
FOR SELECT USING (
  -- User is the mentor
  mentor_id = ANY(get_member_ids_for_user(auth.uid()))
  -- Or user is the disciple
  OR disciple_id = ANY(get_member_ids_for_user(auth.uid()))
);