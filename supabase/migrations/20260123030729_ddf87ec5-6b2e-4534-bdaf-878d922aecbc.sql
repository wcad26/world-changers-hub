-- Add RLS policies for DCG admins to manage their own DCG members
CREATE POLICY "DCG admins can select their own DCG members"
ON public.dcg_members
FOR SELECT
USING (
  has_role(auth.uid(), 'dcg_admin'::app_role) 
  AND dcg_id = get_user_dcg(auth.uid())
);

CREATE POLICY "DCG admins can insert their own DCG members"
ON public.dcg_members
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'dcg_admin'::app_role) 
  AND dcg_id = get_user_dcg(auth.uid())
);

CREATE POLICY "DCG admins can update their own DCG members"
ON public.dcg_members
FOR UPDATE
USING (
  has_role(auth.uid(), 'dcg_admin'::app_role) 
  AND dcg_id = get_user_dcg(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'dcg_admin'::app_role) 
  AND dcg_id = get_user_dcg(auth.uid())
);

CREATE POLICY "DCG admins can delete their own DCG members"
ON public.dcg_members
FOR DELETE
USING (
  has_role(auth.uid(), 'dcg_admin'::app_role) 
  AND dcg_id = get_user_dcg(auth.uid())
);

-- Add RLS policies for DCG admins to manage attendance events for their DCG
CREATE POLICY "DCG admins can select their DCG attendance events"
ON public.attendance_events
FOR SELECT
USING (
  has_role(auth.uid(), 'dcg_admin'::app_role) 
  AND dcg_id = get_user_dcg(auth.uid())
);

CREATE POLICY "DCG admins can insert their DCG attendance events"
ON public.attendance_events
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'dcg_admin'::app_role) 
  AND dcg_id = get_user_dcg(auth.uid())
);

CREATE POLICY "DCG admins can update their DCG attendance events"
ON public.attendance_events
FOR UPDATE
USING (
  has_role(auth.uid(), 'dcg_admin'::app_role) 
  AND dcg_id = get_user_dcg(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'dcg_admin'::app_role) 
  AND dcg_id = get_user_dcg(auth.uid())
);

-- Add RLS policies for DCG admins to manage attendance records for their DCG events
CREATE POLICY "DCG admins can select their DCG attendance records"
ON public.attendance_records
FOR SELECT
USING (
  has_role(auth.uid(), 'dcg_admin'::app_role) 
  AND EXISTS (
    SELECT 1 FROM public.attendance_events ae 
    WHERE ae.id = attendance_records.event_id 
    AND ae.dcg_id = get_user_dcg(auth.uid())
  )
);

CREATE POLICY "DCG admins can insert their DCG attendance records"
ON public.attendance_records
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'dcg_admin'::app_role) 
  AND EXISTS (
    SELECT 1 FROM public.attendance_events ae 
    WHERE ae.id = attendance_records.event_id 
    AND ae.dcg_id = get_user_dcg(auth.uid())
  )
);

CREATE POLICY "DCG admins can update their DCG attendance records"
ON public.attendance_records
FOR UPDATE
USING (
  has_role(auth.uid(), 'dcg_admin'::app_role) 
  AND EXISTS (
    SELECT 1 FROM public.attendance_events ae 
    WHERE ae.id = attendance_records.event_id 
    AND ae.dcg_id = get_user_dcg(auth.uid())
  )
)
WITH CHECK (
  has_role(auth.uid(), 'dcg_admin'::app_role) 
  AND EXISTS (
    SELECT 1 FROM public.attendance_events ae 
    WHERE ae.id = attendance_records.event_id 
    AND ae.dcg_id = get_user_dcg(auth.uid())
  )
);

CREATE POLICY "DCG admins can delete their DCG attendance records"
ON public.attendance_records
FOR DELETE
USING (
  has_role(auth.uid(), 'dcg_admin'::app_role) 
  AND EXISTS (
    SELECT 1 FROM public.attendance_events ae 
    WHERE ae.id = attendance_records.event_id 
    AND ae.dcg_id = get_user_dcg(auth.uid())
  )
);