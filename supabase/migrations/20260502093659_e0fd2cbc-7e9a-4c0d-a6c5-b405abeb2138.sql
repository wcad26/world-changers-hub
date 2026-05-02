-- Relationship type enum
DO $$ BEGIN
  CREATE TYPE public.family_relationship_type AS ENUM
    ('spouse', 'parent', 'child', 'sibling', 'guardian', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE public.member_relationships (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id           uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  related_member_id   uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  relationship_type   public.family_relationship_type NOT NULL,
  notes               text,
  created_by          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT member_relationships_no_self CHECK (member_id <> related_member_id),
  CONSTRAINT member_relationships_unique UNIQUE (member_id, related_member_id, relationship_type)
);

CREATE INDEX idx_member_relationships_member ON public.member_relationships(member_id);
CREATE INDEX idx_member_relationships_related ON public.member_relationships(related_member_id);

ALTER TABLE public.member_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage all member relationships"
  ON public.member_relationships FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Regional admins manage relationships in their region"
  ON public.member_relationships FOR ALL
  USING (
    public.has_role(auth.uid(), 'regional_admin'::app_role)
    AND EXISTS (SELECT 1 FROM public.members m
                WHERE m.id = member_relationships.member_id
                  AND m.region_id = public.get_user_region(auth.uid()))
    AND EXISTS (SELECT 1 FROM public.members m
                WHERE m.id = member_relationships.related_member_id
                  AND m.region_id = public.get_user_region(auth.uid()))
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'regional_admin'::app_role)
    AND EXISTS (SELECT 1 FROM public.members m
                WHERE m.id = member_relationships.member_id
                  AND m.region_id = public.get_user_region(auth.uid()))
    AND EXISTS (SELECT 1 FROM public.members m
                WHERE m.id = member_relationships.related_member_id
                  AND m.region_id = public.get_user_region(auth.uid()))
  );

CREATE POLICY "Members view own relationships"
  ON public.member_relationships FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.members m
            WHERE m.id IN (member_relationships.member_id,
                           member_relationships.related_member_id)
              AND m.profile_id = auth.uid())
  );