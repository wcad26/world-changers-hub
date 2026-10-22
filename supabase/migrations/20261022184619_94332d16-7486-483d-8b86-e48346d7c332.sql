CREATE TABLE public.region_payment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id uuid REFERENCES public.regions(id) ON DELETE CASCADE,
  flutterwave_enabled boolean NOT NULL DEFAULT false,
  flutterwave_mode text NOT NULL DEFAULT 'live',
  flutterwave_public_key text,
  flutterwave_secret_key text,
  flutterwave_encryption_key text,
  mobile_money_enabled boolean NOT NULL DEFAULT true,
  card_enabled boolean NOT NULL DEFAULT true,
  bank_transfer_enabled boolean NOT NULL DEFAULT false,
  bank_accounts jsonb NOT NULL DEFAULT '[]'::jsonb,
  bank_instructions text,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX region_payment_settings_region_uidx ON public.region_payment_settings (COALESCE(region_id, '00000000-0000-0000-0000-000000000000'::uuid));
GRANT ALL ON public.region_payment_settings TO service_role;
ALTER TABLE public.region_payment_settings ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER region_payment_settings_ts BEFORE UPDATE ON public.region_payment_settings FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

INSERT INTO public.region_payment_settings (region_id, flutterwave_enabled, flutterwave_mode, flutterwave_public_key, flutterwave_secret_key, flutterwave_encryption_key, mobile_money_enabled, card_enabled, bank_transfer_enabled, bank_accounts)
SELECT NULL, s.flutterwave_enabled, s.flutterwave_mode, c.public_key, c.secret_key, c.encryption_key, s.mobile_money_enabled, s.card_enabled, false, '[]'::jsonb
FROM public.wcbn_payment_settings s
LEFT JOIN public.wcbn_payment_credentials c ON c.mode = s.flutterwave_mode
WHERE s.id = 1;

INSERT INTO public.region_payment_settings (region_id)
SELECT NULL WHERE NOT EXISTS (SELECT 1 FROM public.region_payment_settings WHERE region_id IS NULL);