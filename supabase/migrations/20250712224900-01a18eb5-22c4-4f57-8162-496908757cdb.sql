-- Add DCG leader role to app_role enum
ALTER TYPE public.app_role ADD VALUE 'dcg_leader';

-- Create DCG user sessions table for managing DCG leader access
CREATE TABLE public.dcg_user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dcg_id UUID NOT NULL REFERENCES public.dcgs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(dcg_id, user_id)
);

-- Enable RLS on DCG user sessions
ALTER TABLE public.dcg_user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for DCG user sessions
CREATE POLICY "DCG leaders can view their own sessions"
ON public.dcg_user_sessions FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Regional admins can manage DCG sessions in their region"
ON public.dcg_user_sessions FOR ALL
USING (
  has_role(auth.uid(), 'regional_admin') AND
  EXISTS (
    SELECT 1 FROM public.dcgs d 
    WHERE d.id = dcg_id AND d.region_id = get_user_region(auth.uid())
  )
)
WITH CHECK (
  has_role(auth.uid(), 'regional_admin') AND
  EXISTS (
    SELECT 1 FROM public.dcgs d 
    WHERE d.id = dcg_id AND d.region_id = get_user_region(auth.uid())
  )
);

CREATE POLICY "Super admins can manage all DCG sessions"
ON public.dcg_user_sessions FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_dcg_user_sessions_updated_at
BEFORE UPDATE ON public.dcg_user_sessions
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- Function to get DCG from user
CREATE OR REPLACE FUNCTION public.get_user_dcg(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT dcg_id
  FROM public.dcg_user_sessions
  WHERE user_id = _user_id AND is_active = true
  LIMIT 1;
$$;