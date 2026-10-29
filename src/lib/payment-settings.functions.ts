import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

const GLOBAL = 'global';
const WCBN_PREFIX = 'wcbn:';

const bankSchema = z.object({
  bank_name: z.string().max(120),
  account_name: z.string().max(160),
  account_number: z.string().max(80),
  swift: z.string().max(40).optional().default(''),
  branch: z.string().max(120).optional().default(''),
});

/** Super Admins manage every scope; regional admins only their own assigned region. */
async function assertCanManage(
  supabase: any,
  admin: any,
  userId: string,
  scope: string,
  permission: 'settings_edit' | 'finances_edit' = 'settings_edit',
): Promise<{ isSuper: boolean }> {
  const { data: isSuper } = await supabase.rpc('is_super_admin_user', { _user_id: userId });
  if (isSuper) return { isSuper: true };

  if (scope === GLOBAL || scope.startsWith(WCBN_PREFIX)) {
    throw new Error('Only Super Admins can manage Head Office or WCBN payment gateways.');
  }

  const [{ data: hasPerm }, { data: hasRole }] = await Promise.all([
    supabase.rpc('has_regional_permission', {
      _user_id: userId,
      _region_id: scope,
      _permission: permission,
    }),
    admin
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .eq('region_id', scope)
      .eq('role', 'regional_admin')
      .eq('status', 'active')
      .eq('is_active', true)
      .maybeSingle(),
  ]);

  if (!hasPerm && !hasRole) {
    throw new Error('You do not have permission to manage payment settings for this region.');
  }
  return { isSuper: false };
}

const mask = (v?: string | null) => (v && v.length >= 4 ? `••••${v.slice(-4)}` : '');

function parseScope(scope: string): {
  tenantType: 'head_office' | 'wca_region' | 'wcbn_chapter';
  regionId: string | null;
  tenantCode: string | null;
} {
  if (scope === GLOBAL) {
    return { tenantType: 'head_office', regionId: null, tenantCode: 'HO' };
  }
  if (scope.startsWith(WCBN_PREFIX)) {
    const code = scope.slice(WCBN_PREFIX.length).toUpperCase() || 'WCBN-GEN';
    return { tenantType: 'wcbn_chapter', regionId: null, tenantCode: code };
  }
  return { tenantType: 'wca_region', regionId: scope, tenantCode: null };
}

async function fetchScopeRow(admin: any, scope: string) {
  const parsed = parseScope(scope);
  if (parsed.tenantType === 'wcbn_chapter') {
    const { data } = await admin
      .from('region_payment_settings')
      .select('*')
      .eq('tenant_type', 'wcbn_chapter')
      .eq('tenant_code', parsed.tenantCode)
      .maybeSingle();
    return data ?? null;
  }
  if (parsed.tenantType === 'head_office') {
    const { data: rows } = await admin
      .from('region_payment_settings')
      .select('*')
      .is('region_id', null);
    return (rows ?? []).find((r: any) => r.tenant_type !== 'wcbn_chapter') ?? null;
  }
  const { data } = await admin
    .from('region_payment_settings')
    .select('*')
    .eq('region_id', parsed.regionId)
    .maybeSingle();
  return data ?? null;
}

/** Lists gateway health across Head Office, all WCA Regions, and WCBN Connect (Super Admin overview). */
export const listPaymentGatewayStatus = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { keyMatchesEnvironment } = await import('@/lib/payment-engine.server');
    await assertCanManage(context.supabase, supabaseAdmin, context.userId, GLOBAL);

    const [{ data: regions }, { data: rows }] = await Promise.all([
      supabaseAdmin.from('regions').select('id, name, code, currency_code, is_active').order('name'),
      (supabaseAdmin as any).from('region_payment_settings').select('*'),
    ]);

    const allRows = (rows ?? []) as any[];
    const hoRow = allRows.find((r) => r.region_id === null && r.tenant_type !== 'wcbn_chapter');
    const byRegion = new Map<string, any>(
      allRows.filter((r) => r.region_id).map((r) => [r.region_id, r]),
    );
    const wcbnRows = allRows.filter((r) => r.tenant_type === 'wcbn_chapter');
    const defaultWcbn = wcbnRows.find((r) => r.tenant_code === 'WCBN-GEN') ?? null;

    const status = (r: any) => {
      const primaryProvider = r?.primary_provider === 'stripe' ? 'stripe' : 'flutterwave';
      const flwMode: 'test' | 'live' = r?.flutterwave_mode === 'test' ? 'test' : 'live';
      const stripeMode: 'test' | 'live' = r?.stripe_mode === 'test' ? 'test' : 'live';
      const flwOk = !!(
        r?.flutterwave_enabled &&
        r?.flutterwave_secret_key &&
        keyMatchesEnvironment(r.flutterwave_secret_key, flwMode)
      );
      const stripeOk = !!(r?.stripe_enabled && r?.stripe_secret_key);
      const ownGateway = primaryProvider === 'stripe' ? stripeOk : flwOk;
      const mode = primaryProvider === 'stripe' ? stripeMode : flwMode;
      const bankAccounts = Array.isArray(r?.bank_accounts) ? r.bank_accounts : [];
      const bank = !!(r?.bank_transfer_enabled && bankAccounts.length > 0);
      return {
        ownGateway,
        primaryProvider,
        mode: ownGateway ? mode : null,
        bank,
        allowCentralFallback: !!r?.allow_central_fallback,
        lastVerifiedAt: r?.last_verified_at ?? null,
      };
    };

    return {
      global: {
        currency: hoRow?.primary_currency || 'XAF',
        code: 'HO',
        ...status(hoRow),
      },
      wcbn: {
        scope: 'wcbn:WCBN-GEN',
        name: 'WCBN Connect',
        code: 'WCBN-GEN',
        currency: defaultWcbn?.primary_currency || 'XAF',
        ...status(defaultWcbn),
      },
      regions: (regions ?? []).map((g: any) => ({
        id: g.id,
        name: g.name,
        code: g.code,
        isActive: g.is_active !== false,
        currency: g.currency_code || byRegion.get(g.id)?.primary_currency || 'XAF',
        ...status(byRegion.get(g.id)),
      })),
    };
  });

export const getPaymentSettings = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ scope: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { SUPABASE_WEBHOOK_URL, generateWebhookSecretHash } = await import('@/lib/payment-engine.server');
    const { isSuper } = await assertCanManage(context.supabase, supabaseAdmin, context.userId, data.scope);

    const parsed = parseScope(data.scope);
    const [row, regionRes] = await Promise.all([
      fetchScopeRow(supabaseAdmin, data.scope),
      parsed.regionId
        ? supabaseAdmin.from('regions').select('id, name, code, currency_code').eq('id', parsed.regionId).maybeSingle()
        : Promise.resolve({ data: null as any }),
    ]);

    const region = regionRes.data;
    const primaryCurrency = (
      region?.currency_code ||
      row?.primary_currency ||
      'XAF'
    ).toUpperCase();
    const tenantCode = (
      row?.tenant_code ||
      region?.code ||
      parsed.tenantCode ||
      'HO'
    ).toUpperCase();

    // Auto-seed webhook_secret_hash if not yet generated so admins can copy it immediately
    let webhookSecretHash = row?.webhook_secret_hash as string | null;
    if (row?.id && !webhookSecretHash) {
      webhookSecretHash = generateWebhookSecretHash();
      await (supabaseAdmin as any)
        .from('region_payment_settings')
        .update({ webhook_secret_hash: webhookSecretHash })
        .eq('id', row.id);
    }

    return {
      is_super_admin: isSuper,
      tenant_type: parsed.tenantType,
      tenant_code: tenantCode,
      primary_currency: primaryCurrency,
      primary_provider: (row?.primary_provider === 'stripe' ? 'stripe' : 'flutterwave') as 'flutterwave' | 'stripe',
      allow_central_fallback: !!row?.allow_central_fallback,
      flutterwave_enabled: !!row?.flutterwave_enabled,
      flutterwave_mode: (row?.flutterwave_mode === 'test' ? 'test' : 'live') as 'test' | 'live',
      flutterwave_public_key: row?.flutterwave_public_key ?? '',
      secret_key_hint: mask(row?.flutterwave_secret_key),
      encryption_key_hint: mask(row?.flutterwave_encryption_key),
      stripe_enabled: !!row?.stripe_enabled,
      stripe_mode: (row?.stripe_mode === 'test' ? 'test' : 'live') as 'test' | 'live',
      stripe_publishable_key: row?.stripe_publishable_key ?? '',
      stripe_secret_key_hint: mask(row?.stripe_secret_key),
      stripe_webhook_secret_hint: mask(row?.stripe_webhook_secret),
      webhook_secret_hash: webhookSecretHash ?? generateWebhookSecretHash(),
      webhook_url: SUPABASE_WEBHOOK_URL,
      mobile_money_enabled: row ? !!row.mobile_money_enabled : ['XAF', 'XOF', 'GHS', 'KES', 'RWF', 'UGX'].includes(primaryCurrency),
      card_enabled: row ? !!row.card_enabled : true,
      wallet_pay_enabled: row ? !!row.wallet_pay_enabled : ['USD', 'EUR', 'GBP', 'CAD'].includes(primaryCurrency),
      bank_transfer_enabled: !!row?.bank_transfer_enabled,
      bank_accounts: (Array.isArray(row?.bank_accounts) ? row.bank_accounts : []) as z.infer<typeof bankSchema>[],
      bank_instructions: row?.bank_instructions ?? '',
      last_verified_at: row?.last_verified_at ?? null,
      last_verified_mode: row?.last_verified_mode ?? null,
      updated_at: row?.updated_at ?? null,
    };
  });

export const savePaymentSettings = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        scope: z.string().min(1),
        primary_currency: z.string().min(3).max(6).optional(),
        primary_provider: z.enum(['flutterwave', 'stripe']).optional(),
        allow_central_fallback: z.boolean().optional(),
        flutterwave_enabled: z.boolean(),
        flutterwave_mode: z.enum(['test', 'live']),
        flutterwave_public_key: z.string().max(200),
        secret_key: z.string().max(200).optional(),
        encryption_key: z.string().max(200).optional(),
        stripe_enabled: z.boolean().optional(),
        stripe_mode: z.enum(['test', 'live']).optional(),
        stripe_publishable_key: z.string().max(200).optional(),
        stripe_secret_key: z.string().max(200).optional(),
        stripe_webhook_secret: z.string().max(200).optional(),
        webhook_secret_hash: z.string().min(8).max(160).optional(),
        mobile_money_enabled: z.boolean(),
        card_enabled: z.boolean(),
        wallet_pay_enabled: z.boolean().optional(),
        bank_transfer_enabled: z.boolean(),
        bank_accounts: z.array(bankSchema).max(5),
        bank_instructions: z.string().max(1000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { keyMatchesEnvironment, generateWebhookSecretHash } = await import('@/lib/payment-engine.server');
    const { isSuper } = await assertCanManage(context.supabase, supabaseAdmin, context.userId, data.scope);

    const parsed = parseScope(data.scope);
    const existing = await fetchScopeRow(supabaseAdmin, data.scope);

    const nextSecret = data.secret_key?.trim() || existing?.flutterwave_secret_key || null;
    const nextPublic = data.flutterwave_public_key.trim() || null;
    const nextEnc = data.encryption_key?.trim() || existing?.flutterwave_encryption_key || null;
    const nextStripeSecret = data.stripe_secret_key?.trim() || existing?.stripe_secret_key || null;
    const nextStripePublic = data.stripe_publishable_key?.trim() || existing?.stripe_publishable_key || null;
    const primaryProvider = data.primary_provider || existing?.primary_provider || 'flutterwave';

    if (primaryProvider === 'flutterwave' && data.flutterwave_enabled && !nextSecret) {
      throw new Error('Add the Flutterwave Secret Key before activating online payments.');
    }
    if (primaryProvider === 'stripe' && data.stripe_enabled && !nextStripeSecret) {
      throw new Error('Add the Stripe Secret Key (sk_live_... or sk_test_...) before activating Stripe online payments.');
    }
    if (nextSecret && !keyMatchesEnvironment(nextSecret, data.flutterwave_mode)) {
      throw new Error(
        data.flutterwave_mode === 'live'
          ? 'You selected Live mode, but entered a TEST secret key (FLWSECK_TEST-...). Switch to Test mode or paste your Live secret key.'
          : 'You selected Test mode, but entered a LIVE secret key. Switch to Live mode or paste your Test secret key.',
      );
    }
    if (nextPublic && !keyMatchesEnvironment(nextPublic, data.flutterwave_mode)) {
      throw new Error(
        data.flutterwave_mode === 'live'
          ? 'You selected Live mode, but entered a TEST public key (FLWPUBK_TEST-...).'
          : 'You selected Test mode, but entered a LIVE public key.',
      );
    }
    if (primaryProvider === 'flutterwave' && data.flutterwave_enabled && data.card_enabled && !nextEnc) {
      throw new Error('Add the Flutterwave Encryption Key to enable direct Card payments (or turn Card off).');
    }

    let regionCode: string | null = parsed.tenantCode;
    let regionCurrency: string | null = data.primary_currency?.toUpperCase() || null;
    if (parsed.regionId) {
      const { data: reg } = await supabaseAdmin
        .from('regions')
        .select('code, currency_code')
        .eq('id', parsed.regionId)
        .maybeSingle();
      regionCode = reg?.code?.toUpperCase() || 'REG';
      regionCurrency = reg?.currency_code?.toUpperCase() || regionCurrency || 'XAF';
    }

    const patch: Record<string, unknown> = {
      tenant_type: parsed.tenantType,
      tenant_code: existing?.tenant_code || regionCode || 'HO',
      primary_currency: regionCurrency || existing?.primary_currency || 'XAF',
      primary_provider: primaryProvider,
      flutterwave_enabled: data.flutterwave_enabled,
      flutterwave_mode: data.flutterwave_mode,
      flutterwave_public_key: nextPublic,
      stripe_enabled: !!data.stripe_enabled,
      stripe_mode: data.stripe_mode || 'live',
      stripe_publishable_key: nextStripePublic,
      mobile_money_enabled: data.mobile_money_enabled,
      card_enabled: data.card_enabled,
      wallet_pay_enabled: !!data.wallet_pay_enabled,
      bank_transfer_enabled: data.bank_transfer_enabled,
      bank_accounts: data.bank_accounts.filter((b) => b.bank_name.trim() || b.account_number.trim()),
      bank_instructions: data.bank_instructions.trim() || null,
      webhook_secret_hash:
        data.webhook_secret_hash?.trim() || existing?.webhook_secret_hash || generateWebhookSecretHash(),
      updated_by: context.userId,
    };

    // Strict isolation: ONLY Super Admins can modify allow_central_fallback
    if (isSuper && typeof data.allow_central_fallback === 'boolean') {
      patch.allow_central_fallback = parsed.tenantType === 'wca_region' ? data.allow_central_fallback : false;
    }

    if (data.secret_key?.trim()) patch.flutterwave_secret_key = data.secret_key.trim();
    if (data.encryption_key?.trim()) patch.flutterwave_encryption_key = data.encryption_key.trim();
    if (data.stripe_secret_key?.trim()) patch.stripe_secret_key = data.stripe_secret_key.trim();
    if (data.stripe_webhook_secret?.trim()) patch.stripe_webhook_secret = data.stripe_webhook_secret.trim();

    const res = existing
      ? await (supabaseAdmin as any).from('region_payment_settings').update(patch).eq('id', existing.id)
      : await (supabaseAdmin as any)
          .from('region_payment_settings')
          .insert({ ...patch, region_id: parsed.regionId });

    if (res.error) throw new Error(res.error.message || 'Could not save payment settings.');
    return { ok: true };
  });

/**
 * Lightweight, zero-charge API health check against Flutterwave (/v3/balances)
 * to verify that the tenant's secret key is valid and matches the selected environment.
 */
export const testPaymentGatewayConnection = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        scope: z.string().min(1),
        provider: z.enum(['flutterwave', 'stripe']).optional(),
        mode: z.enum(['test', 'live']),
        secret_key: z.string().max(200).optional(),
        stripe_secret_key: z.string().max(200).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { FLW_API, keyMatchesEnvironment } = await import('@/lib/payment-engine.server');
    await assertCanManage(context.supabase, supabaseAdmin, context.userId, data.scope);

    const existing = await fetchScopeRow(supabaseAdmin, data.scope);
    const provider = data.provider || existing?.primary_provider || 'flutterwave';

    if (provider === 'stripe') {
      const stripeKey = data.stripe_secret_key?.trim() || existing?.stripe_secret_key;
      if (!stripeKey) {
        throw new Error('Enter or save your Stripe Secret Key first before testing the connection.');
      }
      const res = await fetch('https://api.stripe.com/v1/balance', {
        method: 'GET',
        headers: { Authorization: `Bearer ${stripeKey}` },
      });
      const body = (await res.json().catch(() => ({}))) as any;
      if (!res.ok || body.error) {
        throw new Error(body.error?.message || 'Stripe rejected this Secret Key. Please check the key and try again.');
      }
      const avail = Array.isArray(body.available)
        ? body.available.map((w: any) => String(w.currency || '').toUpperCase()).filter(Boolean)
        : [];
      const verifiedAt = new Date().toISOString();
      if (existing?.id) {
        await (supabaseAdmin as any)
          .from('region_payment_settings')
          .update({ last_verified_at: verifiedAt, last_verified_mode: data.mode })
          .eq('id', existing.id);
      }
      return {
        ok: true,
        mode: data.mode,
        verified_at: verifiedAt,
        currencies: avail.slice(0, 8),
        message: `Stripe Connected (${data.mode.toUpperCase()}) · ${avail.length ? `Currencies: ${avail.join(', ')}` : 'Account verified'}`,
      };
    }

    const keyToTest = data.secret_key?.trim() || existing?.flutterwave_secret_key;
    if (!keyToTest) {
      throw new Error('Enter or save your Flutterwave Secret Key first before testing the connection.');
    }

    if (!keyMatchesEnvironment(keyToTest, data.mode)) {
      throw new Error(
        data.mode === 'live'
          ? 'Environment mismatch: This is a TEST key (FLWSECK_TEST-...), while Environment is set to Live.'
          : 'Environment mismatch: This is a LIVE key, while Environment is set to Test.',
      );
    }

    const res = await fetch(`${FLW_API}/balances`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${keyToTest}` },
    });
    const body = (await res.json().catch(() => ({}))) as any;

    if (!res.ok || body.status !== 'success') {
      throw new Error(body.message || 'Flutterwave rejected this Secret Key. Please check the key and try again.');
    }

    const wallets = Array.isArray(body.data)
      ? body.data.map((w: any) => String(w.currency || '').toUpperCase()).filter(Boolean)
      : [];

    const verifiedAt = new Date().toISOString();
    if (existing?.id) {
      await (supabaseAdmin as any)
        .from('region_payment_settings')
        .update({ last_verified_at: verifiedAt, last_verified_mode: data.mode })
        .eq('id', existing.id);
    }

    return {
      ok: true,
      mode: data.mode,
      verified_at: verifiedAt,
      currencies: wallets.slice(0, 8),
      message: `Connected (${data.mode.toUpperCase()}) · ${wallets.length ? `Active wallets: ${wallets.slice(0, 5).join(', ')}` : 'Merchant account verified'}`,
    };
  });

/**
 * Pings the live Supabase Edge Function `flutterwave-webhook` with `action: 'webhook_ping'`
 * and the tenant's `verif-hash` header to verify public reachability & hash matching.
 */
export const testWebhookEndpoint = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        scope: z.string().min(1),
        webhook_secret_hash: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { SUPABASE_WEBHOOK_URL } = await import('@/lib/payment-engine.server');
    await assertCanManage(context.supabase, supabaseAdmin, context.userId, data.scope);

    const parsed = parseScope(data.scope);
    const existing = await fetchScopeRow(supabaseAdmin, data.scope);
    const hashToTest = (data.webhook_secret_hash?.trim() || existing?.webhook_secret_hash || '').trim();

    if (!hashToTest) {
      throw new Error('Save your payment settings first so a Webhook Secret Hash is stored for this tenant.');
    }

    const res = await fetch(SUPABASE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'verif-hash': hashToTest,
      },
      body: JSON.stringify({
        action: 'webhook_ping',
        tenant_type: parsed.tenantType,
        region_id: parsed.regionId,
        tenant_code: existing?.tenant_code || parsed.tenantCode || 'HO',
      }),
    });

    const body = (await res.json().catch(() => ({}))) as any;
    if (!res.ok || !body?.ok) {
      throw new Error(body?.error || `Webhook endpoint returned HTTP ${res.status}. Save settings and try again.`);
    }

    return {
      ok: true,
      tenant_name: body.tenant_name || 'Tenant',
      message: body.message || 'Webhook endpoint is live and verified.',
    };
  });

/**
 * Executes a full gateway refund (for online Flutterwave/Stripe payments) or ledger reversal
 * (for manual/bank transfer entries) and atomically updates linked campaign/event records.
 */
export const refundPaymentTransaction = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        transactionId: z.string().uuid(),
        reason: z.string().min(3, 'Please provide a brief reason for this refund/reversal.').max(400),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { executeGatewayRefund } = await import('@/lib/payment-engine.server');

    const { data: tx, error: txErr } = await (supabaseAdmin as any)
      .from('financial_transactions')
      .select('*')
      .eq('id', data.transactionId)
      .maybeSingle();

    if (txErr || !tx) {
      throw new Error('Financial transaction was not found.');
    }
    if (tx.payment_status === 'refunded') {
      throw new Error('This transaction has already been refunded.');
    }

    const scopeToCheck = tx.region_id ?? GLOBAL;
    await assertCanManage(context.supabase, supabaseAdmin, context.userId, scopeToCheck, 'finances_edit');

    let refundReference = `REV-${Date.now().toString(36).toUpperCase()}`;
    const isOnlineGatewayMethod = ['mobile_money', 'card', 'wallet_pay'].includes(String(tx.payment_method || ''));

    if (isOnlineGatewayMethod && (tx.gateway_transaction_id || tx.payment_reference)) {
      const gwRefund = await executeGatewayRefund(supabaseAdmin, tx, data.reason);
      if (gwRefund.refundReference) {
        refundReference = gwRefund.refundReference;
      }
    }

    const refundedAt = new Date().toISOString();
    const { error: updErr } = await (supabaseAdmin as any)
      .from('financial_transactions')
      .update({
        payment_status: 'refunded',
        refunded_at: refundedAt,
        refunded_by: context.userId,
        refund_reason: data.reason.trim(),
        refund_reference: refundReference,
      })
      .eq('id', tx.id);

    if (updErr) {
      throw new Error(updErr.message || 'Failed to mark transaction as refunded.');
    }

    // Sync linked campaign donations or event pre-registrations
    if (tx.payment_reference) {
      await supabaseAdmin
        .from('fundraising_donations')
        .update({ status: 'refunded' } as any)
        .eq('message', tx.payment_reference);

      await supabaseAdmin
        .from('event_pre_registrations')
        .update({ fee_status: 'unpaid' } as any)
        .eq('fee_payment_reference', tx.payment_reference);
    }

    return {
      ok: true,
      refundReference,
      refundedAt,
    };
  });

/** Lists pending Bank Deposit / Transfer transactions for Regional or Super Admin reconciliation. */
export const listPendingBankTransfers = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ scope: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    if (data.scope === 'all') {
      await assertCanManage(context.supabase, supabaseAdmin, context.userId, GLOBAL, 'finances_edit');
    } else {
      await assertCanManage(context.supabase, supabaseAdmin, context.userId, data.scope, 'finances_edit');
    }

    let q = (supabaseAdmin as any)
      .from('financial_transactions')
      .select(
        'id, amount, currency_code, region_id, dcg_id, member_id, transaction_date, description, payment_reference, payment_status, donor_name, donor_email, donor_phone, created_at, category:financial_transaction_categories(name), region:regions(name, code)',
      )
      .eq('payment_method', 'bank_transfer')
      .eq('payment_status', 'pending')
      .order('created_at', { ascending: false })
      .limit(100);

    if (data.scope === GLOBAL) {
      q = q.is('region_id', null);
    } else if (data.scope !== 'all') {
      q = q.eq('region_id', data.scope);
    }

    const { data: rows, error } = await q;
    if (error) throw new Error('Could not load pending bank deposits.');
    return (rows ?? []) as Array<{
      id: string;
      amount: number;
      currency_code: string;
      region_id: string | null;
      transaction_date: string;
      description: string | null;
      payment_reference: string | null;
      donor_name: string | null;
      donor_email: string | null;
      donor_phone: string | null;
      created_at: string;
      category?: { name: string | null } | null;
      region?: { name: string | null; code: string | null } | null;
    }>;
  });

/** Confirms receipt (or rejects) a pending Bank Deposit, atomically syncing campaigns & event fees. */
export const reconcileBankTransfer = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        txRef: z.string().min(4).max(100),
        decision: z.enum(['confirm', 'reject']),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { lookupPendingTransaction, finalizeSuccessfulPayment, finalizeFailedPayment } =
      await import('@/lib/payment-engine.server');

    const lookup = await lookupPendingTransaction(supabaseAdmin, data.txRef);
    if (!lookup || lookup.kind !== 'wca_ledger') {
      throw new Error('Pending bank deposit was not found.');
    }

    const scopeToCheck = lookup.regionId ?? GLOBAL;
    await assertCanManage(context.supabase, supabaseAdmin, context.userId, scopeToCheck, 'finances_edit');

    if (data.decision === 'confirm') {
      await finalizeSuccessfulPayment(supabaseAdmin, lookup, {
        resolvedMethod: 'bank_transfer',
        confirmedByUserId: context.userId,
      });
    } else {
      await finalizeFailedPayment(supabaseAdmin, lookup);
    }

    return { ok: true, decision: data.decision };
  });
