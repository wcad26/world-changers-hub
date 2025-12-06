-- RLS Policies for Members to access discipleship data

-- Allow members to view discipleship relationships where they are mentor or disciple
CREATE POLICY "Members can view own discipleship relationships"
  ON discipleship_relationships FOR SELECT
  USING (
    mentor_id IN (SELECT id FROM members WHERE profile_id = auth.uid())
    OR disciple_id IN (SELECT id FROM members WHERE profile_id = auth.uid())
  );

-- Allow mentors to add progress for their disciples
CREATE POLICY "Mentors can add discipleship progress"
  ON discipleship_progress FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM discipleship_relationships dr
      WHERE dr.id = relationship_id
      AND dr.mentor_id IN (SELECT id FROM members WHERE profile_id = auth.uid())
    )
  );

-- Allow members to view progress for relationships they are part of
CREATE POLICY "Members can view discipleship progress"
  ON discipleship_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM discipleship_relationships dr
      WHERE dr.id = relationship_id
      AND (
        dr.mentor_id IN (SELECT id FROM members WHERE profile_id = auth.uid())
        OR dr.disciple_id IN (SELECT id FROM members WHERE profile_id = auth.uid())
      )
    )
  );

-- Allow members to view other members' basic info for discipleship (for seeing mentor/disciple names)
CREATE POLICY "Members can view members for discipleship"
  ON members FOR SELECT
  USING (
    -- Can view members who are their mentor or disciple
    id IN (
      SELECT mentor_id FROM discipleship_relationships 
      WHERE disciple_id IN (SELECT id FROM members WHERE profile_id = auth.uid())
    )
    OR id IN (
      SELECT disciple_id FROM discipleship_relationships 
      WHERE mentor_id IN (SELECT id FROM members WHERE profile_id = auth.uid())
    )
    -- Or their own record
    OR profile_id = auth.uid()
  );