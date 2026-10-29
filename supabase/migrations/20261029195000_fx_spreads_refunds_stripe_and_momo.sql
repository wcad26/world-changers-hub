-- =============================================================================
-- Multi-Tenant Payment System & Dynamic FX Spreads Upgrade
-- 1. Seed XOF, RWF, UGX in public.currencies
-- 2. Extend public.exchange_rates with spot_price, buy_spread_pct, sell_spread_pct
-- 3. Extend public.financial_transactions with refund/reversal & receipt audit columns
-- 4. Extend public.region_payment_settings with Stripe multi-gateway columns
-- 5. Expand Mobile Money currency support (XAF, XOF, GHS, KES, RWF, UGX)
-- =============================================================================

-- 1. Seed African Mobile Money currencies in public.currencies
INSERT INTO public.currencies (code, name, symbol, decimal_places, is_active)
VALUES
  ('XOF', 'West African CFA Franc', 'CFA', 0, true),
  ('RWF', 'Rwandan Franc', 'FRw', 0, true),
  ('UGX', 'Ugandan Shilling', 'USh', 0, true)
ON CONFLICT (code) DO UPDATE SET is_active = true;

-- 2. Extend public.exchange_rates for Spot Price + Dual Spreads (Buy & Sell)
ALTER TABLE public.exchange_rates
  ADD COLUMN IF NOT EXISTS spot_price numeric,
  ADD COLUMN IF NOT EXISTS buy_spread_pct numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sell_spread_pct numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS spread_mode text NOT NULL DEFAULT 'percentage',
  ADD COLUMN IF NOT EXISTS last_api_fetch_at timestamptz,
  ADD COLUMN IF NOT EXISTS auto_sync boolean NOT NULL DEFAULT true;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'exchange_rates_spread_mode_check'
  ) THEN
    ALTER TABLE public.exchange_rates
      ADD CONSTRAINT exchange_rates_spread_mode_check
      CHECK (spread_mode IN ('percentage', 'manual'));
  END IF;
END $$;

-- Backfill spot_price on existing rows
UPDATE public.exchange_rates
SET
  spot_price = COALESCE(spot_price, mid),
  last_api_fetch_at = COALESCE(last_api_fetch_at, updated_at, now())
WHERE spot_price IS NULL;

-- Seed core WCA currency pairs with realistic spot prices and default spreads (1.5% buy / 2.0% sell) if missing
INSERT INTO public.exchange_rates (
  base_code, quote_code, spot_price, buy_spread_pct, sell_spread_pct, spread_mode,
  bid, ask, is_active, auto_sync, last_api_fetch_at
)
VALUES
  ('USD', 'XAF', 605.00, 1.5, 2.0, 'percentage', ROUND(605.00 * (1 - 0.015), 4), ROUND(605.00 * (1 + 0.020), 4), true, true, now()),
  ('GBP', 'XAF', 785.00, 1.5, 2.0, 'percentage', ROUND(785.00 * (1 - 0.015), 4), ROUND(785.00 * (1 + 0.020), 4), true, true, now()),
  ('CAD', 'XAF', 435.00, 1.5, 2.0, 'percentage', ROUND(435.00 * (1 - 0.015), 4), ROUND(435.00 * (1 + 0.020), 4), true, true, now()),
  ('GHS', 'XAF',  39.50, 1.5, 2.0, 'percentage', ROUND( 39.50 * (1 - 0.015), 4), ROUND( 39.50 * (1 + 0.020), 4), true, true, now()),
  ('KES', 'XAF',   4.68, 1.5, 2.0, 'percentage', ROUND(  4.68 * (1 - 0.015), 4), ROUND(  4.68 * (1 + 0.020), 4), true, true, now()),
  ('EUR', 'USD', 1.0840, 1.0, 1.5, 'percentage', ROUND(1.0840 * (1 - 0.010), 4), ROUND(1.0840 * (1 + 0.015), 4), true, true, now())
ON CONFLICT (base_code, quote_code) DO NOTHING;

-- 3. Extend public.financial_transactions for Refunds, Reversals & Receipt Tracking
ALTER TABLE public.financial_transactions
  ADD COLUMN IF NOT EXISTS refunded_at timestamptz,
  ADD COLUMN IF NOT EXISTS refunded_by uuid,
  ADD COLUMN IF NOT EXISTS refund_reason text,
  ADD COLUMN IF NOT EXISTS refund_reference text,
  ADD COLUMN IF NOT EXISTS receipt_sent_at timestamptz;

-- 4. Extend public.region_payment_settings for Multi-Gateway Provider Support (Flutterwave + Stripe)
ALTER TABLE public.region_payment_settings
  ADD COLUMN IF NOT EXISTS primary_provider text NOT NULL DEFAULT 'flutterwave',
  ADD COLUMN IF NOT EXISTS stripe_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_mode text NOT NULL DEFAULT 'live',
  ADD COLUMN IF NOT EXISTS stripe_publishable_key text,
  ADD COLUMN IF NOT EXISTS stripe_secret_key text,
  ADD COLUMN IF NOT EXISTS stripe_webhook_secret text;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'region_payment_settings_primary_provider_check'
  ) THEN
    ALTER TABLE public.region_payment_settings
      ADD CONSTRAINT region_payment_settings_primary_provider_check
      CHECK (primary_provider IN ('flutterwave', 'stripe'));
  END IF;
END $$;

-- 5. Update Region Auto-Provisioning Trigger & Public Capability Discovery for GHS, KES, RWF, UGX + Stripe
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
      primary_provider, flutterwave_enabled, stripe_enabled, allow_central_fallback,
      mobile_money_enabled, card_enabled, wallet_pay_enabled, bank_transfer_enabled,
      webhook_secret_hash
    )
    VALUES (
      NEW.id,
      'wca_region',
      UPPER(NEW.code),
      v_cur,
      CASE WHEN v_cur IN ('USD', 'EUR', 'GBP', 'CAD') THEN 'stripe' ELSE 'flutterwave' END,
      false,
      false,
      false,
      v_cur IN ('XAF', 'XOF', 'GHS', 'KES', 'RWF', 'UGX'),
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
  v_own_flw_ready boolean := false;
  v_own_stp_ready boolean := false;
  v_own_ready boolean := false;
  v_gw public.region_payment_settings%ROWTYPE;
  v_online_ready boolean := false;
  v_momo_supported boolean := false;
  v_active_provider text := 'flutterwave';
BEGIN
  IF _tenant_type = 'head_office' OR (_tenant_type = 'wca_region' AND _region_id IS NULL) THEN
    SELECT * INTO v_row FROM public.region_payment_settings WHERE tenant_type = 'head_office' LIMIT 1;
    v_currency := COALESCE(v_row.primary_currency, 'XAF');
    v_name := 'WCA Head Office';
    v_own_flw_ready := COALESCE(v_row.flutterwave_enabled AND v_row.flutterwave_secret_key IS NOT NULL AND length(trim(v_row.flutterwave_secret_key)) > 0, false);
    v_own_stp_ready := COALESCE(v_row.stripe_enabled AND v_row.stripe_secret_key IS NOT NULL AND length(trim(v_row.stripe_secret_key)) > 0, false);
    v_online_ready := v_own_flw_ready OR v_own_stp_ready;
    v_gw := v_row;
  ELSIF _tenant_type = 'wcbn_chapter' THEN
    SELECT * INTO v_row
    FROM public.region_payment_settings
    WHERE tenant_type = 'wcbn_chapter'
      AND tenant_code = COALESCE(UPPER(_tenant_code), 'WCBN-GEN')
    LIMIT 1;
    v_currency := COALESCE(v_row.primary_currency, 'XAF');
    v_name := COALESCE(v_row.tenant_code, 'WCBN Connect');
    v_own_flw_ready := COALESCE(v_row.flutterwave_enabled AND v_row.flutterwave_secret_key IS NOT NULL AND length(trim(v_row.flutterwave_secret_key)) > 0, false);
    v_own_stp_ready := COALESCE(v_row.stripe_enabled AND v_row.stripe_secret_key IS NOT NULL AND length(trim(v_row.stripe_secret_key)) > 0, false);
    v_online_ready := v_own_flw_ready OR v_own_stp_ready;
    v_gw := v_row;
  ELSE
    SELECT id, name, code, currency_code INTO v_reg FROM public.regions WHERE id = _region_id;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('found', false);
    END IF;
    SELECT * INTO v_row FROM public.region_payment_settings WHERE tenant_type = 'wca_region' AND region_id = _region_id LIMIT 1;
    v_currency := COALESCE(v_reg.currency_code, v_row.primary_currency, 'XAF');
    v_name := v_reg.name;
    v_own_flw_ready := COALESCE(v_row.flutterwave_enabled AND v_row.flutterwave_secret_key IS NOT NULL AND length(trim(v_row.flutterwave_secret_key)) > 0, false);
    v_own_stp_ready := COALESCE(v_row.stripe_enabled AND v_row.stripe_secret_key IS NOT NULL AND length(trim(v_row.stripe_secret_key)) > 0, false);
    v_own_ready := v_own_flw_ready OR v_own_stp_ready;
    IF v_own_ready THEN
      v_online_ready := true;
      v_gw := v_row;
    ELSIF COALESCE(v_row.allow_central_fallback, false) THEN
      SELECT * INTO v_ho FROM public.region_payment_settings WHERE tenant_type = 'head_office' LIMIT 1;
      v_online_ready := COALESCE(
        (v_ho.flutterwave_enabled AND v_ho.flutterwave_secret_key IS NOT NULL AND length(trim(v_ho.flutterwave_secret_key)) > 0) OR
        (v_ho.stripe_enabled AND v_ho.stripe_secret_key IS NOT NULL AND length(trim(v_ho.stripe_secret_key)) > 0),
        false
      );
      v_gw := v_ho;
    ELSE
      v_online_ready := false;
      v_gw := v_row;
    END IF;
  END IF;

  v_momo_supported := v_currency IN ('XAF', 'XOF', 'GHS', 'KES', 'RWF', 'UGX');
  v_active_provider := CASE
    WHEN v_gw.primary_provider = 'stripe' AND COALESCE(v_gw.stripe_enabled AND v_gw.stripe_secret_key IS NOT NULL, false) THEN 'stripe'
    WHEN COALESCE(v_gw.flutterwave_enabled AND v_gw.flutterwave_secret_key IS NOT NULL, false) THEN 'flutterwave'
    WHEN COALESCE(v_gw.stripe_enabled AND v_gw.stripe_secret_key IS NOT NULL, false) THEN 'stripe'
    ELSE COALESCE(v_gw.primary_provider, 'flutterwave')
  END;

  RETURN jsonb_build_object(
    'found', true,
    'tenant_type', CASE WHEN _tenant_type = 'wca_region' AND _region_id IS NULL THEN 'head_office' ELSE _tenant_type END,
    'region_id', _region_id,
    'tenant_code', COALESCE(v_row.tenant_code, v_reg.code, 'HO'),
    'tenant_name', v_name,
    'primary_currency', v_currency,
    'primary_provider', v_active_provider,
    'environment', CASE WHEN v_active_provider = 'stripe' THEN COALESCE(v_gw.stripe_mode, 'live') ELSE COALESCE(v_gw.flutterwave_mode, 'live') END,
    'public_key', CASE WHEN v_online_ready THEN v_gw.flutterwave_public_key ELSE NULL END,
    'stripe_publishable_key', CASE WHEN v_online_ready AND COALESCE(v_gw.stripe_enabled, false) THEN v_gw.stripe_publishable_key ELSE NULL END,
    'online_ready', v_online_ready,
    'using_central_fallback', (NOT v_own_ready AND COALESCE(v_row.allow_central_fallback, false) AND v_online_ready),
    'mobile_money_enabled', (v_online_ready AND v_momo_supported AND COALESCE(v_gw.mobile_money_enabled, false)),
    'card_enabled', (
      v_online_ready AND COALESCE(v_gw.card_enabled, false) AND (
        (v_active_provider = 'stripe' AND v_gw.stripe_secret_key IS NOT NULL) OR
        (v_gw.flutterwave_encryption_key IS NOT NULL AND length(trim(v_gw.flutterwave_encryption_key)) > 0)
      )
    ),
    'wallet_pay_enabled', (v_online_ready AND NOT v_momo_supported AND COALESCE(v_gw.wallet_pay_enabled, false)),
    'bank_transfer_enabled', (COALESCE(v_row.bank_transfer_enabled, false) AND jsonb_typeof(v_row.bank_accounts) = 'array' AND jsonb_array_length(v_row.bank_accounts) > 0),
    'bank_accounts', CASE WHEN COALESCE(v_row.bank_transfer_enabled, false) THEN COALESCE(v_row.bank_accounts, '[]'::jsonb) ELSE '[]'::jsonb END,
    'bank_instructions', COALESCE(v_row.bank_instructions, '')
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_payment_capabilities(text, uuid, text) TO anon, authenticated, service_role;
