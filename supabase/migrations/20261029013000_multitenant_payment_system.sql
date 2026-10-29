-- =============================================================================
-- Multi-Tenant Payment System Migration (WCA Hub & WCBN Connect)
-- Strict tenant isolation, auto-provisioning for future regions, WCBN bridge,
-- webhook idempotency ledger, event fee payment tracking, and safe public RPC.
-- =============================================================================

-- 1. Extend public.region_payment_settings non-destructively
ALTER TABLE public.region_payment_settings
  ADD COLUMN IF NOT EXISTS tenant_type text NOT NULL DEFAULT 'wca_region',
  ADD COLUMN IF NOT EXISTS tenant_code text,
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'flutterwave',
  ADD COLUMN IF NOT EXISTS allow_central_fallback boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS webhook_secret_hash text,
  ADD COLUMN IF NOT EXISTS primary_currency text,
  ADD COLUMN IF NOT EXISTS wallet_pay_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_verified_mode text;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'region_payment_settings_tenant_type_check'
  ) THEN
    ALTER TABLE public.region_payment_settings
      ADD CONSTRAINT region_payment_settings_tenant_type_check
      CHECK (tenant_type IN ('wca_region', 'head_office', 'wcbn_chapter'));
  END IF;
END $$;

-- Replace single-column unique index with composite multi-tenant unique index
DROP INDEX IF EXISTS public.region_payment_settings_region_uidx;
CREATE UNIQUE INDEX IF NOT EXISTS region_payment_settings_tenant_uidx
  ON public.region_payment_settings (
    tenant_type,
    COALESCE(region_id, '00000000-0000-0000-0000-000000000000'::uuid),
    COALESCE(tenant_code, '')
  );

-- Lock down secrets strictly to service_role
ALTER TABLE public.region_payment_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.region_payment_settings FROM anon, authenticated;
GRANT ALL ON public.region_payment_settings TO service_role;

-- 2. Backfill Head Office, Existing Regions, and WCBN Connect tenant rows
UPDATE public.region_payment_settings
SET
  tenant_type = 'head_office',
  tenant_code = COALESCE(tenant_code, 'HO'),
  primary_currency = COALESCE(primary_currency, 'XAF'),
  allow_central_fallback = false,
  webhook_secret_hash = COALESCE(webhook_secret_hash, md5(gen_random_uuid()::text || id::text))
WHERE region_id IS NULL AND tenant_type <> 'wcbn_chapter';

INSERT INTO public.region_payment_settings (
  region_id, tenant_type, tenant_code, primary_currency,
  flutterwave_enabled, allow_central_fallback, webhook_secret_hash
)
SELECT
  NULL, 'head_office', 'HO', 'XAF',
  false, false, md5(gen_random_uuid()::text || 'head_office')
WHERE NOT EXISTS (
  SELECT 1 FROM public.region_payment_settings WHERE tenant_type = 'head_office'
);

UPDATE public.region_payment_settings s
SET
  tenant_type = 'wca_region',
  tenant_code = UPPER(r.code),
  primary_currency = COALESCE(s.primary_currency, r.currency_code, 'XAF'),
  webhook_secret_hash = COALESCE(s.webhook_secret_hash, md5(gen_random_uuid()::text || r.id::text))
FROM public.regions r
WHERE s.region_id = r.id;

INSERT INTO public.region_payment_settings (
  region_id, tenant_type, tenant_code, primary_currency,
  flutterwave_enabled, allow_central_fallback,
  mobile_money_enabled, card_enabled, bank_transfer_enabled,
  webhook_secret_hash
)
SELECT
  r.id,
  'wca_region',
  UPPER(r.code),
  COALESCE(r.currency_code, 'XAF'),
  false,
  false,
  COALESCE(r.currency_code, 'XAF') IN ('XAF', 'XOF'),
  true,
  false,
  md5(gen_random_uuid()::text || r.id::text)
FROM public.regions r
WHERE NOT EXISTS (
  SELECT 1 FROM public.region_payment_settings s
  WHERE s.tenant_type = 'wca_region' AND s.region_id = r.id
);

-- Seed WCBN-GEN tenant from existing wcbn_payment_settings + wcbn_payment_credentials (if present)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'wcbn_payment_settings'
  ) THEN
    INSERT INTO public.region_payment_settings (
      region_id, tenant_type, tenant_code, primary_currency,
      flutterwave_enabled, flutterwave_mode,
      flutterwave_public_key, flutterwave_secret_key, flutterwave_encryption_key,
      mobile_money_enabled, card_enabled, bank_transfer_enabled,
      bank_accounts, bank_instructions, allow_central_fallback,
      webhook_secret_hash
    )
    SELECT
      NULL,
      'wcbn_chapter',
      'WCBN-GEN',
      'XAF',
      COALESCE(s.flutterwave_enabled, false),
      COALESCE(s.flutterwave_mode, 'live'),
      COALESCE(c.public_key, s.flutterwave_public_key),
      c.secret_key,
      c.encryption_key,
      COALESCE(s.mobile_money_enabled, true),
      COALESCE(s.card_enabled, true),
      COALESCE(s.bank_transfer_enabled, false),
      COALESCE(s.bank_accounts, '[]'::jsonb),
      s.invoice_note,
      false,
      md5(gen_random_uuid()::text || 'WCBN-GEN')
    FROM public.wcbn_payment_settings s
    LEFT JOIN public.wcbn_payment_credentials c ON c.mode = s.flutterwave_mode
    WHERE s.id = 1
      AND NOT EXISTS (
        SELECT 1 FROM public.region_payment_settings
        WHERE tenant_type = 'wcbn_chapter' AND tenant_code = 'WCBN-GEN'
      );
  END IF;
END $$;

-- Sync WCBN-GEN updates back to legacy wcbn_payment_settings / wcbn_payment_credentials so WCBN Connect never breaks
CREATE OR REPLACE FUNCTION public.sync_wcbn_legacy_payment_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.tenant_type = 'wcbn_chapter' AND NEW.tenant_code = 'WCBN-GEN' THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'wcbn_payment_settings'
    ) THEN
      UPDATE public.wcbn_payment_settings
      SET
        flutterwave_enabled = NEW.flutterwave_enabled,
        flutterwave_mode = NEW.flutterwave_mode,
        flutterwave_public_key = NEW.flutterwave_public_key,
        mobile_money_enabled = NEW.mobile_money_enabled,
        card_enabled = NEW.card_enabled,
        bank_transfer_enabled = NEW.bank_transfer_enabled,
        bank_accounts = NEW.bank_accounts,
        invoice_note = COALESCE(NEW.bank_instructions, invoice_note),
        updated_at = now()
      WHERE id = 1;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'wcbn_payment_credentials'
    ) AND NEW.flutterwave_secret_key IS NOT NULL THEN
      INSERT INTO public.wcbn_payment_credentials (mode, public_key, secret_key, encryption_key, updated_at)
      VALUES (
        NEW.flutterwave_mode,
        NEW.flutterwave_public_key,
        NEW.flutterwave_secret_key,
        NEW.flutterwave_encryption_key,
        now()
      )
      ON CONFLICT (mode) DO UPDATE SET
        public_key = EXCLUDED.public_key,
        secret_key = EXCLUDED.secret_key,
        encryption_key = COALESCE(EXCLUDED.encryption_key, public.wcbn_payment_credentials.encryption_key),
        updated_at = now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_wcbn_legacy_payment_settings ON public.region_payment_settings;
CREATE TRIGGER trg_sync_wcbn_legacy_payment_settings
  AFTER INSERT OR UPDATE ON public.region_payment_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_wcbn_legacy_payment_settings();

-- 3. Zero-Touch Auto-Provisioning Trigger for Future Regions Created by Super Admin
CREATE OR REPLACE FUNCTION public.sync_region_payment_tenant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cur text := COALESCE(NEW.currency_code, 'XAF');
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.region_payment_settings (
      region_id, tenant_type, tenant_code, primary_currency,
      flutterwave_enabled, allow_central_fallback,
      mobile_money_enabled, card_enabled, wallet_pay_enabled, bank_transfer_enabled,
      webhook_secret_hash
    )
    VALUES (
      NEW.id,
      'wca_region',
      UPPER(NEW.code),
      v_cur,
      false,
      false,
      v_cur IN ('XAF', 'XOF'),
      true,
      v_cur IN ('USD', 'EUR', 'GBP', 'CAD'),
      false,
      md5(gen_random_uuid()::text || NEW.id::text)
    )
    ON CONFLICT DO NOTHING;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.region_payment_settings
    SET
      tenant_code = UPPER(NEW.code),
      primary_currency = COALESCE(NEW.currency_code, primary_currency),
      updated_at = now()
    WHERE tenant_type = 'wca_region' AND region_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_region_payment_tenant ON public.regions;
CREATE TRIGGER trg_sync_region_payment_tenant
  AFTER INSERT OR UPDATE OF code, currency_code ON public.regions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_region_payment_tenant();

-- 4. Webhook Idempotency & Audit Ledger (service_role only)
CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'flutterwave',
  flw_tx_id text,
  tx_ref text NOT NULL,
  tenant_setting_id uuid REFERENCES public.region_payment_settings(id) ON DELETE SET NULL,
  event_type text,
  signature_valid boolean NOT NULL DEFAULT false,
  verified_status text,
  raw_payload jsonb,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS payment_webhook_events_provider_tx_uidx
  ON public.payment_webhook_events (provider, flw_tx_id)
  WHERE flw_tx_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS payment_webhook_events_tx_ref_idx
  ON public.payment_webhook_events (tx_ref);

ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.payment_webhook_events FROM anon, authenticated;
GRANT ALL ON public.payment_webhook_events TO service_role;

-- 5. Payment & Reconciliation Columns on financial_transactions, events, and event_pre_registrations
ALTER TABLE public.financial_transactions
  ADD COLUMN IF NOT EXISTS gateway_transaction_id text,
  ADD COLUMN IF NOT EXISTS donor_name text,
  ADD COLUMN IF NOT EXISTS donor_email text,
  ADD COLUMN IF NOT EXISTS donor_phone text,
  ADD COLUMN IF NOT EXISTS payment_confirmed_by uuid,
  ADD COLUMN IF NOT EXISTS payment_confirmed_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_financial_transactions_payment_status
  ON public.financial_transactions (payment_status);

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS fees_compulsory boolean NOT NULL DEFAULT false;

ALTER TABLE public.event_pre_registrations
  ADD COLUMN IF NOT EXISTS fee_payment_reference text,
  ADD COLUMN IF NOT EXISTS fee_payment_method text,
  ADD COLUMN IF NOT EXISTS financial_transaction_id uuid REFERENCES public.financial_transactions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_event_pre_reg_fee_payment_ref
  ON public.event_pre_registrations (fee_payment_reference)
  WHERE fee_payment_reference IS NOT NULL;

-- 6. Safe Public Capability Discovery Function (zero secret exposure)
CREATE OR REPLACE FUNCTION public.get_public_payment_capabilities(
  _tenant_type text DEFAULT 'wca_region',
  _region_id uuid DEFAULT NULL,
  _tenant_code text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.region_payment_settings%ROWTYPE;
  v_ho  public.region_payment_settings%ROWTYPE;
  v_reg record;
  v_currency text := 'XAF';
  v_name text := 'Head Office';
  v_own_ready boolean := false;
  v_gw public.region_payment_settings%ROWTYPE;
  v_online_ready boolean := false;
  v_momo_supported boolean := false;
BEGIN
  IF _tenant_type = 'head_office' OR (_tenant_type = 'wca_region' AND _region_id IS NULL) THEN
    SELECT * INTO v_row FROM public.region_payment_settings WHERE tenant_type = 'head_office' LIMIT 1;
    v_currency := COALESCE(v_row.primary_currency, 'XAF');
    v_name := 'WCA Head Office';
    v_online_ready := COALESCE(v_row.flutterwave_enabled AND v_row.flutterwave_secret_key IS NOT NULL AND length(trim(v_row.flutterwave_secret_key)) > 0, false);
    v_gw := v_row;
  ELSIF _tenant_type = 'wcbn_chapter' THEN
    SELECT * INTO v_row
    FROM public.region_payment_settings
    WHERE tenant_type = 'wcbn_chapter'
      AND tenant_code = COALESCE(UPPER(_tenant_code), 'WCBN-GEN')
    LIMIT 1;
    v_currency := COALESCE(v_row.primary_currency, 'XAF');
    v_name := COALESCE(v_row.tenant_code, 'WCBN Connect');
    v_online_ready := COALESCE(v_row.flutterwave_enabled AND v_row.flutterwave_secret_key IS NOT NULL AND length(trim(v_row.flutterwave_secret_key)) > 0, false);
    v_gw := v_row;
  ELSE
    SELECT id, name, code, currency_code INTO v_reg FROM public.regions WHERE id = _region_id;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('found', false);
    END IF;
    SELECT * INTO v_row FROM public.region_payment_settings WHERE tenant_type = 'wca_region' AND region_id = _region_id LIMIT 1;
    v_currency := COALESCE(v_reg.currency_code, v_row.primary_currency, 'XAF');
    v_name := v_reg.name;
    v_own_ready := COALESCE(v_row.flutterwave_enabled AND v_row.flutterwave_secret_key IS NOT NULL AND length(trim(v_row.flutterwave_secret_key)) > 0, false);
    IF v_own_ready THEN
      v_online_ready := true;
      v_gw := v_row;
    ELSIF COALESCE(v_row.allow_central_fallback, false) THEN
      SELECT * INTO v_ho FROM public.region_payment_settings WHERE tenant_type = 'head_office' LIMIT 1;
      v_online_ready := COALESCE(v_ho.flutterwave_enabled AND v_ho.flutterwave_secret_key IS NOT NULL AND length(trim(v_ho.flutterwave_secret_key)) > 0, false);
      v_gw := v_ho;
    ELSE
      v_online_ready := false;
      v_gw := v_row;
    END IF;
  END IF;

  v_momo_supported := v_currency IN ('XAF', 'XOF');

  -- Strict rule: Bank accounts NEVER fall back to another region or Head Office.
  RETURN jsonb_build_object(
    'found', true,
    'tenant_type', CASE WHEN _tenant_type = 'wca_region' AND _region_id IS NULL THEN 'head_office' ELSE _tenant_type END,
    'region_id', _region_id,
    'tenant_code', COALESCE(v_row.tenant_code, v_reg.code, 'HO'),
    'tenant_name', v_name,
    'primary_currency', v_currency,
    'environment', COALESCE(v_gw.flutterwave_mode, 'live'),
    'public_key', CASE WHEN v_online_ready THEN v_gw.flutterwave_public_key ELSE NULL END,
    'online_ready', v_online_ready,
    'using_central_fallback', (NOT v_own_ready AND COALESCE(v_row.allow_central_fallback, false) AND v_online_ready),
    'mobile_money_enabled', (v_online_ready AND v_momo_supported AND COALESCE(v_gw.mobile_money_enabled, false)),
    'card_enabled', (v_online_ready AND COALESCE(v_gw.card_enabled, false) AND v_gw.flutterwave_encryption_key IS NOT NULL AND length(trim(v_gw.flutterwave_encryption_key)) > 0),
    'wallet_pay_enabled', (v_online_ready AND NOT v_momo_supported AND COALESCE(v_gw.wallet_pay_enabled, false)),
    'bank_transfer_enabled', (COALESCE(v_row.bank_transfer_enabled, false) AND jsonb_typeof(v_row.bank_accounts) = 'array' AND jsonb_array_length(v_row.bank_accounts) > 0),
    'bank_accounts', CASE WHEN COALESCE(v_row.bank_transfer_enabled, false) THEN COALESCE(v_row.bank_accounts, '[]'::jsonb) ELSE '[]'::jsonb END,
    'bank_instructions', COALESCE(v_row.bank_instructions, '')
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_payment_capabilities(text, uuid, text) TO anon, authenticated, service_role;
