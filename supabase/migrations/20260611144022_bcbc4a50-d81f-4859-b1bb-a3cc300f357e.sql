
-- exchange_rates
CREATE TABLE public.exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base_code text NOT NULL REFERENCES public.currencies(code) ON UPDATE CASCADE,
  quote_code text NOT NULL REFERENCES public.currencies(code) ON UPDATE CASCADE,
  bid numeric(18,8) NOT NULL CHECK (bid > 0),
  ask numeric(18,8) NOT NULL CHECK (ask > 0),
  mid numeric(18,8) GENERATED ALWAYS AS ((bid + ask) / 2) STORED,
  is_active boolean NOT NULL DEFAULT true,
  effective_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT exchange_rates_pair_unique UNIQUE (base_code, quote_code),
  CONSTRAINT exchange_rates_ask_ge_bid CHECK (ask >= bid),
  CONSTRAINT exchange_rates_different_codes CHECK (base_code <> quote_code)
);

GRANT SELECT ON public.exchange_rates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exchange_rates TO authenticated;
GRANT ALL ON public.exchange_rates TO service_role;

ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read exchange rates"
  ON public.exchange_rates FOR SELECT
  USING (true);

CREATE POLICY "Super admins manage exchange rates insert"
  ON public.exchange_rates FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins manage exchange rates update"
  ON public.exchange_rates FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins manage exchange rates delete"
  ON public.exchange_rates FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER exchange_rates_set_updated_at
  BEFORE UPDATE ON public.exchange_rates
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- system_settings
CREATE TABLE public.system_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.system_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_settings TO authenticated;
GRANT ALL ON public.system_settings TO service_role;

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read system settings"
  ON public.system_settings FOR SELECT
  USING (true);

CREATE POLICY "Super admins insert system settings"
  ON public.system_settings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins update system settings"
  ON public.system_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins delete system settings"
  ON public.system_settings FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER system_settings_set_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

INSERT INTO public.system_settings (key, value)
VALUES ('base_currency', '"USD"'::jsonb)
ON CONFLICT (key) DO NOTHING;
