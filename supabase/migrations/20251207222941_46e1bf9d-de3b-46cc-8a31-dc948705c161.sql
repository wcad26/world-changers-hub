-- Add RLS policy to allow members to view profiles of people in discipleship relationships
CREATE POLICY "Members can view profiles for discipleship relationships"
ON public.profiles FOR SELECT
USING (
  id = auth.uid()
  OR id IN (
    SELECT m.profile_id FROM members m
    INNER JOIN discipleship_relationships dr ON (m.id = dr.mentor_id OR m.id = dr.disciple_id)
    WHERE dr.mentor_id = ANY(get_member_ids_for_user(auth.uid()))
       OR dr.disciple_id = ANY(get_member_ids_for_user(auth.uid()))
  )
);