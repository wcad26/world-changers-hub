-- Enums
CREATE TYPE public.regional_plan_status AS ENUM ('draft', 'active', 'closed');
CREATE TYPE public.regional_plan_period_type AS ENUM ('quarter', 'year', 'custom');
CREATE TYPE public.regional_plan_target_category AS ENUM ('growth', 'discipleship', 'events', 'dcg', 'finance');
CREATE TYPE public.regional_plan_target_unit AS ENUM ('count', 'currency', 'percent');
CREATE TYPE public.regional_plan_initiative_status AS ENUM ('not_started', 'in_progress', 'done', 'blocked');
CREATE TYPE public.regional_plan_initiative_priority AS ENUM ('low', 'medium', 'high');

-- regional_plans
CREATE TABLE public.regional_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id uuid NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE,
  title text NOT NULL,
  period_type public.regional_plan_period_type NOT NULL DEFAULT 'quarter',
  start_date date NOT NULL,
  end_date date NOT NULL,
  mission_statement text,
  review_notes text,
  status public.regional_plan_status NOT NULL DEFAULT 'draft',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_regional_plans_region ON public.regional_plans(region_id);
CREATE INDEX idx_regional_plans_dates ON public.regional_plans(start_date, end_date);

-- regional_plan_targets
CREATE TABLE public.regional_plan_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.regional_plans(id) ON DELETE CASCADE,
  category public.regional_plan_target_category NOT NULL,
  metric_key text NOT NULL,
  target_value numeric NOT NULL DEFAULT 0,
  unit public.regional_plan_target_unit NOT NULL DEFAULT 'count',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_id, metric_key)
);
CREATE INDEX idx_regional_plan_targets_plan ON public.regional_plan_targets(plan_id);

-- regional_plan_initiatives
CREATE TABLE public.regional_plan_initiatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.regional_plans(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  owner_user_id uuid,
  due_date date,
  status public.regional_plan_initiative_status NOT NULL DEFAULT 'not_started',
  priority public.regional_plan_initiative_priority NOT NULL DEFAULT 'medium',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_regional_plan_initiatives_plan ON public.regional_plan_initiatives(plan_id);

-- updated_at triggers (reuse trigger_set_timestamp)
CREATE TRIGGER trg_regional_plans_updated
BEFORE UPDATE ON public.regional_plans
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER trg_regional_plan_targets_updated
BEFORE UPDATE ON public.regional_plan_targets
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER trg_regional_plan_initiatives_updated
BEFORE UPDATE ON public.regional_plan_initiatives
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- Enable RLS
ALTER TABLE public.regional_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regional_plan_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regional_plan_initiatives ENABLE ROW LEVEL SECURITY;

-- Policies: regional_plans
CREATE POLICY "Regional or super can view plans"
ON public.regional_plans FOR SELECT
USING (
  public.has_role(auth.uid(), 'super_admin'::app_role)
  OR public.user_belongs_to_region(auth.uid(), region_id)
);

CREATE POLICY "Regional or super can insert plans"
ON public.regional_plans FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin'::app_role)
  OR public.user_belongs_to_region(auth.uid(), region_id)
);

CREATE POLICY "Regional or super can update plans"
ON public.regional_plans FOR UPDATE
USING (
  public.has_role(auth.uid(), 'super_admin'::app_role)
  OR public.user_belongs_to_region(auth.uid(), region_id)
);

CREATE POLICY "Regional or super can delete plans"
ON public.regional_plans FOR DELETE
USING (
  public.has_role(auth.uid(), 'super_admin'::app_role)
  OR public.user_belongs_to_region(auth.uid(), region_id)
);

-- Helper: derive region from plan_id via subquery in policies
-- Policies: regional_plan_targets
CREATE POLICY "Regional or super can view plan targets"
ON public.regional_plan_targets FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.regional_plans p
    WHERE p.id = plan_id
      AND (
        public.has_role(auth.uid(), 'super_admin'::app_role)
        OR public.user_belongs_to_region(auth.uid(), p.region_id)
      )
  )
);

CREATE POLICY "Regional or super can insert plan targets"
ON public.regional_plan_targets FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.regional_plans p
    WHERE p.id = plan_id
      AND (
        public.has_role(auth.uid(), 'super_admin'::app_role)
        OR public.user_belongs_to_region(auth.uid(), p.region_id)
      )
  )
);

CREATE POLICY "Regional or super can update plan targets"
ON public.regional_plan_targets FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.regional_plans p
    WHERE p.id = plan_id
      AND (
        public.has_role(auth.uid(), 'super_admin'::app_role)
        OR public.user_belongs_to_region(auth.uid(), p.region_id)
      )
  )
);

CREATE POLICY "Regional or super can delete plan targets"
ON public.regional_plan_targets FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.regional_plans p
    WHERE p.id = plan_id
      AND (
        public.has_role(auth.uid(), 'super_admin'::app_role)
        OR public.user_belongs_to_region(auth.uid(), p.region_id)
      )
  )
);

-- Policies: regional_plan_initiatives
CREATE POLICY "Regional or super can view plan initiatives"
ON public.regional_plan_initiatives FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.regional_plans p
    WHERE p.id = plan_id
      AND (
        public.has_role(auth.uid(), 'super_admin'::app_role)
        OR public.user_belongs_to_region(auth.uid(), p.region_id)
      )
  )
);

CREATE POLICY "Regional or super can insert plan initiatives"
ON public.regional_plan_initiatives FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.regional_plans p
    WHERE p.id = plan_id
      AND (
        public.has_role(auth.uid(), 'super_admin'::app_role)
        OR public.user_belongs_to_region(auth.uid(), p.region_id)
      )
  )
);

CREATE POLICY "Regional or super can update plan initiatives"
ON public.regional_plan_initiatives FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.regional_plans p
    WHERE p.id = plan_id
      AND (
        public.has_role(auth.uid(), 'super_admin'::app_role)
        OR public.user_belongs_to_region(auth.uid(), p.region_id)
      )
  )
);

CREATE POLICY "Regional or super can delete plan initiatives"
ON public.regional_plan_initiatives FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.regional_plans p
    WHERE p.id = plan_id
      AND (
        public.has_role(auth.uid(), 'super_admin'::app_role)
        OR public.user_belongs_to_region(auth.uid(), p.region_id)
      )
  )
);