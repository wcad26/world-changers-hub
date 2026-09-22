-- 1. Backfill dcg_admin role for all DCG leaders and assistants
INSERT INTO public.user_roles (user_id, role, is_active, status)
SELECT DISTINCT m.profile_id, 'dcg_admin'::app_role, true, 'active'::user_role_status
FROM public.dcg_members dm
JOIN public.members m ON m.id = dm.member_id
WHERE dm.role IN ('Leader','Assistant')
  AND m.profile_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = m.profile_id AND ur.role = 'dcg_admin'::app_role
  );

UPDATE public.user_roles ur
SET is_active = true, status = 'active'::user_role_status
WHERE ur.role = 'dcg_admin'::app_role
  AND (ur.is_active IS DISTINCT FROM true OR ur.status IS DISTINCT FROM 'active'::user_role_status)
  AND EXISTS (
    SELECT 1 FROM public.dcg_members dm
    JOIN public.members m ON m.id = dm.member_id
    WHERE m.profile_id = ur.user_id AND dm.role IN ('Leader','Assistant')
  );

-- 2. Backfill active DCG portal sessions
INSERT INTO public.dcg_user_sessions (user_id, dcg_id, is_active)
SELECT DISTINCT ON (m.profile_id) m.profile_id, dm.dcg_id, true
FROM public.dcg_members dm
JOIN public.members m ON m.id = dm.member_id
WHERE dm.role IN ('Leader','Assistant')
  AND m.profile_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.dcg_user_sessions s
    WHERE s.user_id = m.profile_id AND s.is_active = true
  )
ORDER BY m.profile_id, dm.role, dm.dcg_id;

-- 3. Resilient DCG resolution: session first, then leader/assistant listing
CREATE OR REPLACE FUNCTION public.get_user_dcg(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT s.dcg_id
       FROM public.dcg_user_sessions s
      WHERE s.user_id = _user_id AND s.is_active = true
      LIMIT 1),
    (SELECT dm.dcg_id
       FROM public.dcg_members dm
       JOIN public.members m ON m.id = dm.member_id
      WHERE m.profile_id = _user_id
        AND dm.role IN ('Leader','Assistant')
      ORDER BY dm.role
      LIMIT 1)
  );
$function$;

-- 4. Missing delete rule for DCG financial records
DROP POLICY IF EXISTS "DCG admins can delete their DCG financial transactions" ON public.financial_transactions;
CREATE POLICY "DCG admins can delete their DCG financial transactions"
ON public.financial_transactions
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'dcg_admin'::app_role) AND dcg_id = get_user_dcg(auth.uid()));