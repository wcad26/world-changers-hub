-- Regional portal role-management bypass: allow region members to access their own region's data.
-- This preserves regional isolation while removing user_roles/regional_user_roles as frontend blockers.

-- Profiles: region members can view profiles in their region.
DROP POLICY IF EXISTS "Region members can view profiles in their region" ON public.profiles;
CREATE POLICY "Region members can view profiles in their region"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.user_belongs_to_region(auth.uid(), region_id));

-- Regions: region members can view their region even without a regional_admin role.
DROP POLICY IF EXISTS "Region members can view their region" ON public.regions;
CREATE POLICY "Region members can view their region"
ON public.regions
FOR SELECT
TO authenticated
USING (id = public.get_user_region(auth.uid()));

-- Events: region members can manage events in their region.
DROP POLICY IF EXISTS "Region members can manage events in their region" ON public.events;
CREATE POLICY "Region members can manage events in their region"
ON public.events
FOR ALL
TO authenticated
USING (public.user_belongs_to_region(auth.uid(), region_id))
WITH CHECK (public.user_belongs_to_region(auth.uid(), region_id));

-- Attendance events: region members can manage attendance events in their region.
DROP POLICY IF EXISTS "Region members can manage attendance events in their region" ON public.attendance_events;
CREATE POLICY "Region members can manage attendance events in their region"
ON public.attendance_events
FOR ALL
TO authenticated
USING (
  public.user_belongs_to_region(auth.uid(), region_id)
  OR EXISTS (
    SELECT 1
    FROM public.dcgs d
    WHERE d.id = attendance_events.dcg_id
      AND public.user_belongs_to_region(auth.uid(), d.region_id)
  )
)
WITH CHECK (
  public.user_belongs_to_region(auth.uid(), region_id)
  OR EXISTS (
    SELECT 1
    FROM public.dcgs d
    WHERE d.id = attendance_events.dcg_id
      AND public.user_belongs_to_region(auth.uid(), d.region_id)
  )
);

-- Attendance records: region members can manage records for attendance events in their region.
DROP POLICY IF EXISTS "Region members can manage attendance records in their region" ON public.attendance_records;
CREATE POLICY "Region members can manage attendance records in their region"
ON public.attendance_records
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.attendance_events ae
    LEFT JOIN public.dcgs d ON d.id = ae.dcg_id
    WHERE ae.id = attendance_records.event_id
      AND (
        public.user_belongs_to_region(auth.uid(), ae.region_id)
        OR public.user_belongs_to_region(auth.uid(), d.region_id)
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.attendance_events ae
    LEFT JOIN public.dcgs d ON d.id = ae.dcg_id
    WHERE ae.id = attendance_records.event_id
      AND (
        public.user_belongs_to_region(auth.uid(), ae.region_id)
        OR public.user_belongs_to_region(auth.uid(), d.region_id)
      )
  )
);

-- Financial transactions: region members can manage transactions in their region.
DROP POLICY IF EXISTS "Region members can manage financial transactions in their region" ON public.financial_transactions;
CREATE POLICY "Region members can manage financial transactions in their region"
ON public.financial_transactions
FOR ALL
TO authenticated
USING (public.user_belongs_to_region(auth.uid(), region_id))
WITH CHECK (public.user_belongs_to_region(auth.uid(), region_id));

-- Discipleship relationships: region members can manage relationships in their region.
DROP POLICY IF EXISTS "Region members can manage discipleship relationships in their region" ON public.discipleship_relationships;
CREATE POLICY "Region members can manage discipleship relationships in their region"
ON public.discipleship_relationships
FOR ALL
TO authenticated
USING (public.user_belongs_to_region(auth.uid(), region_id))
WITH CHECK (public.user_belongs_to_region(auth.uid(), region_id));

-- DCGs: region members can manage DCGs in their region.
DROP POLICY IF EXISTS "Region members can manage DCGs in their region" ON public.dcgs;
CREATE POLICY "Region members can manage DCGs in their region"
ON public.dcgs
FOR ALL
TO authenticated
USING (public.user_belongs_to_region(auth.uid(), region_id))
WITH CHECK (public.user_belongs_to_region(auth.uid(), region_id));

-- Member targets: region members can manage targets in their region.
DROP POLICY IF EXISTS "Region members can manage member targets in their region" ON public.member_targets;
CREATE POLICY "Region members can manage member targets in their region"
ON public.member_targets
FOR ALL
TO authenticated
USING (public.user_belongs_to_region(auth.uid(), region_id))
WITH CHECK (public.user_belongs_to_region(auth.uid(), region_id));

-- Fundraising campaigns: region members can manage campaigns in their region.
DROP POLICY IF EXISTS "Region members can manage fundraising campaigns in their region" ON public.fundraising_campaigns;
CREATE POLICY "Region members can manage fundraising campaigns in their region"
ON public.fundraising_campaigns
FOR ALL
TO authenticated
USING (public.user_belongs_to_region(auth.uid(), region_id))
WITH CHECK (public.user_belongs_to_region(auth.uid(), region_id));

-- Permission function: keep old callers harmless after access-management removal.
CREATE OR REPLACE FUNCTION public.has_regional_permission(_user_id uuid, _region_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.user_belongs_to_region(_user_id, _region_id)
    OR public.has_role(_user_id, 'super_admin'::app_role);
$$;