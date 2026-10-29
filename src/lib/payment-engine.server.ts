import { randomBytes, timingSafeEqual } from 'node:crypto';

export const FLW_API = 'https://api.flutterwave.com/v3';
export const STRIPE_API = 'https://api.stripe.com/v1';
export const SUPABASE_WEBHOOK_URL =
  'https://dtqyyvjosdgoqloxybnx.supabase.co/functions/v1/flutterwave-webhook';

export type TenantType = 'wca_region' | 'head_office' | 'wcbn_chapter';
export type GatewayProvider = 'flutterwave' | 'stripe';
export type PaymentMethod = 'mobile_money' | 'card' | 'wallet_pay' | 'bank_transfer';
export type TxContextCode = 'EVT' | 'GIV' | 'CMP' | 'SHP' | 'DCG' | 'INV' | 'MEM';

export interface BankAccountInfo {
  bank_name: string;
  account_name: string;
  account_number: string;
  swift?: string;
  branch?: string;
}

export interface ResolvedTenantGateway {
  settingId: string | null;
  tenantType: TenantType;
  regionId: string | null;
  dcgId: string | null;
  tenantCode: string;
  tenantName: string;
  currency: string;
  primaryProvider: GatewayProvider;
  mode: 'test' | 'live';
  onlineReady: boolean;
  usingCentralFallback: boolean;
  publicKey: string | null;
  secretKey: string | null;
  encryptionKey: string | null;
  stripeEnabled: boolean;
  stripeMode: 'test' | 'live';
  stripePublishableKey: string | null;
  stripeSecretKey: string | null;
  stripeWebhookSecret: string | null;
  webhookSecretHash: string | null;
  mobileMoneyEnabled: boolean;
  cardEnabled: boolean;
  walletPayEnabled: boolean;
  bankTransferEnabled: boolean;
  bank: { accounts: BankAccountInfo[]; instructions: string } | null;
}

export interface CardPayload {
  number: string;
  cvv: string;
  expiry_month: string;
  expiry_year: string;
}

export type CardAuthPayload =
  | { mode: 'pin'; pin: string }
  | {
      mode: 'avs_noauth';
      city: string;
      address: string;
      state: string;
      country: string;
      zipcode: string;
    };

export type CardStep = {
  next: 'done' | 'pin' | 'avs' | 'otp' | 'redirect' | 'failed';
  flwRef?: string;
  link?: string;
  message?: string;
};

export function supportsMobileMoneyCurrency(currency: string): boolean {
  const c = (currency || '').toUpperCase();
  return ['XAF', 'XOF', 'GHS', 'KES', 'RWF', 'UGX'].includes(c);
}

export function isZeroDecimalCurrency(currency: string): boolean {
  const c = (currency || '').toUpperCase();
  return c === 'XAF' || c === 'XOF' || c === 'RWF' || c === 'UGX' || c === 'JPY';
}

export function normalizeMajorAmount(amount: number, currency: string): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return isZeroDecimalCurrency(currency)
    ? Math.round(amount)
    : Math.round(amount * 100) / 100;
}

export function majorToMinorUnits(majorAmount: number): number {
  return Math.round(Number(majorAmount) * 100);
}

export function minorToMajorUnits(minorAmount: number, currency: string): number {
  return normalizeMajorAmount(Number(minorAmount) / 100, currency);
}

export function keyMatchesEnvironment(key: string | null | undefined, mode: 'test' | 'live'): boolean {
  if (!key || !key.trim()) return false;
  const k = key.trim();
  const hasTestTag = /_TEST[-_]/i.test(k) || k.startsWith('FLWSECK_TEST') || k.startsWith('FLWPUBK_TEST');
  if (mode === 'live' && hasTestTag) return false;
  if (mode === 'test' && (k.startsWith('FLWSECK-') || k.startsWith('FLWPUBK-')) && !hasTestTag) return false;
  return true;
}

export function stripeKeyMatchesEnvironment(key: string | null | undefined, mode: 'test' | 'live'): boolean {
  if (!key || !key.trim()) return false;
  const k = key.trim();
  const isTest = k.startsWith('sk_test_') || k.startsWith('pk_test_') || k.startsWith('rk_test_');
  const isLive = k.startsWith('sk_live_') || k.startsWith('pk_live_') || k.startsWith('rk_live_');
  if (mode === 'live' && isTest) return false;
  if (mode === 'test' && isLive) return false;
  return true;
}

export function generateWebhookSecretHash(): string {
  return `wca_wh_${randomBytes(18).toString('hex')}`;
}

export function constantTimeEquals(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const ba = Buffer.from(a.trim(), 'utf8');
  const bb = Buffer.from(b.trim(), 'utf8');
  if (ba.length !== bb.length || ba.length === 0) return false;
  return timingSafeEqual(ba, bb);
}

export function generateTxRef(opts: {
  app?: 'WCA' | 'WCBN';
  tenantCode: string;
  context: TxContextCode;
}): string {
  const app = opts.app || 'WCA';
  const cleanCode =
    (opts.tenantCode || 'HO')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 10) || 'HO';
  const ts = Date.now().toString(36).toUpperCase();
  const rand = randomBytes(2).toString('hex').toUpperCase();
  return `${app}-${cleanCode}-${opts.context}-${ts}-${rand}`;
}

export function detectFrancophoneMomo(raw: string, currency = 'XAF'): {
  valid: boolean;
  local: string;
  international: string;
  country: string;
  flwChargeType:
    | 'mobile_money_franco'
    | 'mobile_money_ghana'
    | 'mpesa'
    | 'mobile_money_rwanda'
    | 'mobile_money_uganda';
  network?: 'MTN' | 'ORANGE' | 'VODAFONE' | 'AIRTELTIGO' | 'MPESA' | 'AIRTEL' | 'WAVE' | 'MOOV';
} {
  let d = (raw || '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  const cur = currency.toUpperCase();

  if (cur === 'XAF') {
    if (d.startsWith('237') && d.length === 12) d = d.slice(3);
    if (d.length === 9 && d.startsWith('6')) {
      const p2 = d.slice(0, 2);
      const p3 = d.slice(0, 3);
      let network: 'MTN' | 'ORANGE' | undefined;
      if (p2 === '67' || p2 === '68' || ['650', '651', '652', '653', '654'].includes(p3)) {
        network = 'MTN';
      } else if (p2 === '69' || ['655', '656', '657', '658', '659'].includes(p3)) {
        network = 'ORANGE';
      }
      return {
        valid: !!network,
        local: d,
        international: `237${d}`,
        country: 'CM',
        flwChargeType: 'mobile_money_franco',
        network,
      };
    }
    const xafCountries: Record<string, string> = { '241': 'GA', '235': 'TD', '242': 'CG' };
    for (const [dial, iso] of Object.entries(xafCountries)) {
      if (d.startsWith(dial) && d.length >= 11) {
        return {
          valid: true,
          local: d.slice(dial.length),
          international: d,
          country: iso,
          flwChargeType: 'mobile_money_franco',
          network: 'MTN',
        };
      }
    }
    return {
      valid: false,
      local: d,
      international: d,
      country: 'CM',
      flwChargeType: 'mobile_money_franco',
    };
  }

  if (cur === 'XOF') {
    const xofCountries: Record<string, string> = {
      '225': 'CI',
      '221': 'SN',
      '226': 'BF',
      '229': 'BJ',
      '228': 'TG',
      '223': 'ML',
    };
    for (const [dial, iso] of Object.entries(xofCountries)) {
      if (d.startsWith(dial) && d.length >= 11) {
        return {
          valid: true,
          local: d.slice(dial.length),
          international: d,
          country: iso,
          flwChargeType: 'mobile_money_franco',
          network: 'MTN',
        };
      }
    }
    if (d.length >= 8 && d.length <= 10) {
      return {
        valid: true,
        local: d,
        international: `225${d}`,
        country: 'CI',
        flwChargeType: 'mobile_money_franco',
        network: 'MTN',
      };
    }
    return {
      valid: false,
      local: d,
      international: d,
      country: 'CI',
      flwChargeType: 'mobile_money_franco',
    };
  }

  if (cur === 'GHS') {
    if (d.startsWith('233') && d.length >= 12) d = d.slice(3);
    if (d.startsWith('0') && d.length === 10) d = d.slice(1);
    const p2 = d.slice(0, 2);
    let network: 'MTN' | 'VODAFONE' | 'AIRTELTIGO' = 'MTN';
    if (['24', '54', '55', '59', '25', '53'].includes(p2)) {
      network = 'MTN';
    } else if (['20', '50'].includes(p2)) {
      network = 'VODAFONE';
    } else if (['26', '27', '56', '57'].includes(p2)) {
      network = 'AIRTELTIGO';
    }
    return {
      valid: d.length === 9,
      local: `0${d}`,
      international: `233${d}`,
      country: 'GH',
      flwChargeType: 'mobile_money_ghana',
      network,
    };
  }

  if (cur === 'KES') {
    if (d.startsWith('254') && d.length >= 12) d = d.slice(3);
    if (d.startsWith('0') && d.length === 10) d = d.slice(1);
    return {
      valid: d.length === 9 && (d.startsWith('7') || d.startsWith('1')),
      local: `0${d}`,
      international: `254${d}`,
      country: 'KE',
      flwChargeType: 'mpesa',
      network: 'MPESA',
    };
  }

  if (cur === 'RWF') {
    if (d.startsWith('250') && d.length >= 12) d = d.slice(3);
    if (d.startsWith('0') && d.length === 10) d = d.slice(1);
    const p2 = d.slice(0, 2);
    const network: 'MTN' | 'AIRTEL' = ['72', '73'].includes(p2) ? 'AIRTEL' : 'MTN';
    return {
      valid: d.length === 9 && d.startsWith('7'),
      local: `0${d}`,
      international: `250${d}`,
      country: 'RW',
      flwChargeType: 'mobile_money_rwanda',
      network,
    };
  }

  if (cur === 'UGX') {
    if (d.startsWith('256') && d.length >= 12) d = d.slice(3);
    if (d.startsWith('0') && d.length === 10) d = d.slice(1);
    const p2 = d.slice(0, 2);
    const network: 'MTN' | 'AIRTEL' = ['70', '74', '75'].includes(p2) ? 'AIRTEL' : 'MTN';
    return {
      valid: d.length === 9 && d.startsWith('7'),
      local: `0${d}`,
      international: `256${d}`,
      country: 'UG',
      flwChargeType: 'mobile_money_uganda',
      network,
    };
  }

  return {
    valid: false,
    local: d,
    international: d,
    country: 'CM',
    flwChargeType: 'mobile_money_franco',
  };
}

function buildTenantResolution(
  row: any,
  opts: {
    tenantType: TenantType;
    regionId: string | null;
    dcgId: string | null;
    tenantCode: string;
    tenantName: string;
    currency: string;
    usingCentralFallback: boolean;
    bankSourceRow?: any;
  },
): ResolvedTenantGateway {
  const flwMode: 'test' | 'live' = row?.flutterwave_mode === 'test' ? 'test' : 'live';
  const flwReady = !!(
    row?.flutterwave_enabled &&
    row?.flutterwave_secret_key &&
    keyMatchesEnvironment(row.flutterwave_secret_key, flwMode)
  );

  const stpMode: 'test' | 'live' = row?.stripe_mode === 'test' ? 'test' : 'live';
  const stpReady = !!(
    row?.stripe_enabled &&
    row?.stripe_secret_key &&
    stripeKeyMatchesEnvironment(row.stripe_secret_key, stpMode)
  );

  const onlineReady = flwReady || stpReady;
  const preferred: GatewayProvider = row?.primary_provider === 'stripe' ? 'stripe' : 'flutterwave';
  const primaryProvider: GatewayProvider =
    preferred === 'stripe' && stpReady
      ? 'stripe'
      : flwReady
        ? 'flutterwave'
        : stpReady
          ? 'stripe'
          : preferred;

  const bankRow = opts.bankSourceRow ?? row;
  const accounts: BankAccountInfo[] = Array.isArray(bankRow?.bank_accounts)
    ? bankRow.bank_accounts
    : [];
  const bankReady = !!(bankRow?.bank_transfer_enabled && accounts.length > 0);

  return {
    settingId: row?.id ?? bankRow?.id ?? null,
    tenantType: opts.tenantType,
    regionId: opts.regionId,
    dcgId: opts.dcgId,
    tenantCode: opts.tenantCode,
    tenantName: opts.tenantName,
    currency: opts.currency,
    primaryProvider,
    mode: primaryProvider === 'stripe' ? stpMode : flwMode,
    onlineReady,
    usingCentralFallback: opts.usingCentralFallback,
    publicKey: flwReady ? row?.flutterwave_public_key ?? null : null,
    secretKey: flwReady ? row?.flutterwave_secret_key ?? null : null,
    encryptionKey: flwReady ? row?.flutterwave_encryption_key ?? null : null,
    stripeEnabled: stpReady,
    stripeMode: stpMode,
    stripePublishableKey: stpReady ? row?.stripe_publishable_key ?? null : null,
    stripeSecretKey: stpReady ? row?.stripe_secret_key ?? null : null,
    stripeWebhookSecret: row?.stripe_webhook_secret ?? null,
    webhookSecretHash: row?.webhook_secret_hash ?? bankRow?.webhook_secret_hash ?? null,
    mobileMoneyEnabled:
      flwReady && supportsMobileMoneyCurrency(opts.currency) && !!row?.mobile_money_enabled,
    cardEnabled:
      onlineReady &&
      !!row?.card_enabled &&
      ((flwReady && !!row?.flutterwave_encryption_key) || stpReady),
    walletPayEnabled:
      onlineReady && !supportsMobileMoneyCurrency(opts.currency) && !!row?.wallet_pay_enabled,
    bankTransferEnabled: bankReady,
    bank: bankReady ? { accounts, instructions: bankRow?.bank_instructions ?? '' } : null,
  };
}

export async function resolveTenantGateway(
  admin: any,
  input: {
    tenantType?: TenantType;
    regionId?: string | null;
    dcgId?: string | null;
    tenantCode?: string | null;
  },
): Promise<ResolvedTenantGateway> {
  let regionId = input.regionId ?? null;
  const dcgId = input.dcgId ?? null;

  if (dcgId && !regionId) {
    const { data: dcg } = await admin
      .from('dcgs')
      .select('id, region_id')
      .eq('id', dcgId)
      .maybeSingle();
    if (dcg?.region_id) {
      regionId = dcg.region_id;
    }
  }

  const effectiveType: TenantType =
    input.tenantType === 'wcbn_chapter'
      ? 'wcbn_chapter'
      : !regionId
        ? 'head_office'
        : 'wca_region';

  if (effectiveType === 'wcbn_chapter') {
    const code = (input.tenantCode || 'WCBN-GEN').toUpperCase();
    const { data: row } = await admin
      .from('region_payment_settings')
      .select('*')
      .eq('tenant_type', 'wcbn_chapter')
      .eq('tenant_code', code)
      .maybeSingle();

    const currency = (row?.primary_currency || 'XAF').toUpperCase();
    return buildTenantResolution(row, {
      tenantType: 'wcbn_chapter',
      regionId: null,
      dcgId: null,
      tenantCode: code,
      tenantName: code === 'WCBN-GEN' ? 'WCBN Connect' : `WCBN (${code})`,
      currency,
      usingCentralFallback: false,
    });
  }

  if (effectiveType === 'head_office') {
    const { data: ho } = await admin
      .from('region_payment_settings')
      .select('*')
      .is('region_id', null)
      .neq('tenant_type', 'wcbn_chapter')
      .maybeSingle();

    const currency = (ho?.primary_currency || 'XAF').toUpperCase();
    return buildTenantResolution(ho, {
      tenantType: 'head_office',
      regionId: null,
      dcgId: null,
      tenantCode: ho?.tenant_code || 'HO',
      tenantName: 'WCA Head Office',
      currency,
      usingCentralFallback: false,
    });
  }

  const [{ data: region }, { data: own }] = await Promise.all([
    admin.from('regions').select('id, name, code, currency_code').eq('id', regionId).maybeSingle(),
    admin.from('region_payment_settings').select('*').eq('region_id', regionId).maybeSingle(),
  ]);

  if (!region) {
    throw new Error('Destination region was not found.');
  }

  const currency = (region.currency_code || own?.primary_currency || 'XAF').toUpperCase();
  const ownFlwMode: 'test' | 'live' = own?.flutterwave_mode === 'test' ? 'test' : 'live';
  const ownFlwReady = !!(
    own?.flutterwave_enabled &&
    own?.flutterwave_secret_key &&
    keyMatchesEnvironment(own.flutterwave_secret_key, ownFlwMode)
  );
  const ownStpMode: 'test' | 'live' = own?.stripe_mode === 'test' ? 'test' : 'live';
  const ownStpReady = !!(
    own?.stripe_enabled &&
    own?.stripe_secret_key &&
    stripeKeyMatchesEnvironment(own.stripe_secret_key, ownStpMode)
  );
  const ownReady = ownFlwReady || ownStpReady;

  let activeGw = ownReady ? own : null;
  let usingCentralFallback = false;

  if (!ownReady && own?.allow_central_fallback === true) {
    const { data: ho } = await admin
      .from('region_payment_settings')
      .select('*')
      .is('region_id', null)
      .neq('tenant_type', 'wcbn_chapter')
      .maybeSingle();
    const hoFlwMode: 'test' | 'live' = ho?.flutterwave_mode === 'test' ? 'test' : 'live';
    const hoStpMode: 'test' | 'live' = ho?.stripe_mode === 'test' ? 'test' : 'live';
    const hoReady =
      (ho?.flutterwave_enabled &&
        ho?.flutterwave_secret_key &&
        keyMatchesEnvironment(ho.flutterwave_secret_key, hoFlwMode)) ||
      (ho?.stripe_enabled &&
        ho?.stripe_secret_key &&
        stripeKeyMatchesEnvironment(ho.stripe_secret_key, hoStpMode));
    if (hoReady) {
      activeGw = ho;
      usingCentralFallback = true;
    }
  }

  return buildTenantResolution(activeGw ?? own, {
    tenantType: 'wca_region',
    regionId: region.id,
    dcgId,
    tenantCode: (own?.tenant_code || region.code || 'REG').toUpperCase(),
    tenantName: region.name,
    currency,
    usingCentralFallback,
    bankSourceRow: own,
  });
}

export async function executeFlwCardCharge(opts: {
  secret: string;
  encryptionKey: string;
  card: CardPayload;
  txRef: string;
  amount: number;
  currency: string;
  email: string;
  name: string;
  redirectUrl: string;
  auth?: CardAuthPayload;
}): Promise<CardStep> {
  const CryptoJS = (await import('crypto-js')).default;
  const payload = {
    card_number: opts.card.number,
    cvv: opts.card.cvv,
    expiry_month: opts.card.expiry_month,
    expiry_year: opts.card.expiry_year,
    currency: opts.currency,
    amount: String(opts.amount),
    email: opts.email,
    fullname: opts.name,
    tx_ref: opts.txRef,
    redirect_url: opts.redirectUrl,
    ...(opts.auth ? { authorization: opts.auth } : {}),
  };
  const key = CryptoJS.enc.Utf8.parse(opts.encryptionKey);
  const client = CryptoJS.TripleDES.encrypt(JSON.stringify(payload), key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  }).toString();

  const res = await fetch(`${FLW_API}/charges?type=card`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ client }),
  });
  const body = (await res.json().catch(() => ({}))) as any;
  if (body.status !== 'success') {
    return { next: 'failed', message: body.message || 'Your card was declined.' };
  }
  const auth = body.meta?.authorization;
  if (auth?.mode === 'pin') return { next: 'pin' };
  if (auth?.mode === 'avs_noauth') return { next: 'avs' };
  if (auth?.mode === 'redirect') return { next: 'redirect', link: auth.redirect };
  if (auth?.mode === 'otp') {
    return {
      next: 'otp',
      flwRef: body.data?.flw_ref,
      message: body.data?.processor_response || 'Enter the one-time code sent by your bank.',
    };
  }
  if (body.data?.status === 'successful') return { next: 'done' };
  if (body.data?.status === 'failed') {
    return { next: 'failed', message: body.data?.processor_response || 'Your card was declined.' };
  }
  return { next: 'done' };
}

export async function executeFlwWalletCheckout(opts: {
  secret: string;
  txRef: string;
  amount: number;
  currency: string;
  email: string;
  name: string;
  title: string;
  redirectUrl: string;
}): Promise<{ link: string }> {
  const res = await fetch(`${FLW_API}/payments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tx_ref: opts.txRef,
      amount: opts.amount,
      currency: opts.currency,
      redirect_url: opts.redirectUrl,
      payment_options: 'applepay,googlepay,card',
      customer: { email: opts.email, name: opts.name },
      customizations: { title: opts.title },
    }),
  });
  const body = (await res.json().catch(() => ({}))) as any;
  if (!res.ok || body.status !== 'success' || !body.data?.link) {
    throw new Error(body.message || 'Could not start wallet checkout.');
  }
  return { link: body.data.link as string };
}

export async function executeStripeCheckoutSession(opts: {
  stripeSecretKey: string;
  txRef: string;
  amount: number;
  currency: string;
  email: string;
  name: string;
  title: string;
  redirectUrl: string;
}): Promise<{ link: string; sessionId: string }> {
  const cur = opts.currency.toLowerCase();
  const unitAmount = isZeroDecimalCurrency(opts.currency)
    ? Math.round(opts.amount)
    : Math.round(opts.amount * 100);

  const sep = opts.redirectUrl.includes('?') ? '&' : '?';
  const successUrl = `${opts.redirectUrl}${sep}tx_ref=${encodeURIComponent(opts.txRef)}&status=successful`;
  const cancelUrl = `${opts.redirectUrl}${sep}tx_ref=${encodeURIComponent(opts.txRef)}&status=cancelled`;

  const params = new URLSearchParams();
  params.set('mode', 'payment');
  params.set('client_reference_id', opts.txRef);
  params.set('customer_email', opts.email);
  params.set('success_url', successUrl);
  params.set('cancel_url', cancelUrl);
  params.set('line_items[0][quantity]', '1');
  params.set('line_items[0][price_data][currency]', cur);
  params.set('line_items[0][price_data][unit_amount]', String(unitAmount));
  params.set(
    'line_items[0][price_data][product_data][name]',
    opts.title || 'World Changers Association',
  );
  params.set('metadata[tx_ref]', opts.txRef);
  params.set('metadata[payer_name]', opts.name);

  const res = await fetch(`${STRIPE_API}/checkout/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.stripeSecretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });
  const body = (await res.json().catch(() => ({}))) as any;
  if (!res.ok || !body?.url) {
    throw new Error(body?.error?.message || 'Could not start Stripe checkout session.');
  }
  return { link: body.url as string, sessionId: body.id as string };
}

export async function executeFlwMomoCharge(opts: {
  secret: string;
  txRef: string;
  amount: number;
  currency: string;
  phoneRaw: string;
  email: string;
  name: string;
}): Promise<{ link: string | null; network: string }> {
  if (!supportsMobileMoneyCurrency(opts.currency)) {
    throw new Error(
      `Mobile Money is not available for ${opts.currency}. Please pay by card or bank transfer.`,
    );
  }
  const momo = detectFrancophoneMomo(opts.phoneRaw, opts.currency);
  if (!momo.valid) {
    const hints: Record<string, string> = {
      XAF: 'Please enter a valid 9-digit MTN or Orange Mobile Money number.',
      XOF: "Please enter a valid XOF Mobile Money number (with country code if outside Côte d'Ivoire).",
      GHS: 'Please enter a valid 10-digit Ghana Mobile Money number (MTN, Telecel/Vodafone, or AirtelTigo).',
      KES: 'Please enter a valid Safaricom M-Pesa number (e.g. 0712 345 678).',
      RWF: 'Please enter a valid Rwanda MTN or Airtel Mobile Money number.',
      UGX: 'Please enter a valid Uganda MTN or Airtel Mobile Money number.',
    };
    throw new Error(hints[opts.currency.toUpperCase()] || 'Please enter a valid Mobile Money number.');
  }
  const res = await fetch(`${FLW_API}/charges?type=${momo.flwChargeType}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tx_ref: opts.txRef,
      amount: opts.amount,
      currency: opts.currency,
      phone_number: momo.international,
      email: opts.email,
      fullname: opts.name,
      country: momo.country,
      ...(momo.network ? { network: momo.network } : {}),
    }),
  });
  const body = (await res.json().catch(() => ({}))) as any;
  if (!res.ok || body.status !== 'success') {
    throw new Error(body.message || 'Could not send the payment request to your phone.');
  }
  const auth = body.meta?.authorization;
  return {
    link: auth?.mode === 'redirect' ? (auth.redirect as string) : null,
    network: momo.network || 'MTN',
  };
}

export interface PendingTxLookup {
  kind: 'wca_ledger' | 'wcbn_payment';
  id: string;
  txRef: string;
  expectedMajorAmount: number;
  expectedCurrency: string;
  currentStatus: string;
  paymentMethod: string | null;
  regionId: string | null;
  dcgId: string | null;
  memberId: string | null;
  description: string | null;
  tenantType: TenantType;
  tenantCode: string | null;
  wcbnInvoiceId?: string | null;
}

export async function lookupPendingTransaction(
  admin: any,
  txRef: string,
): Promise<PendingTxLookup | null> {
  const ref = (txRef || '').trim();
  if (!ref) return null;

  if (ref.toUpperCase().startsWith('WCBN-')) {
    const parts = ref.toUpperCase().split('-');
    const parsedChapter = parts.length >= 3 ? `WCBN-${parts[1]}` : 'WCBN-GEN';
    const { data: wRow } = await admin
      .from('wcbn_payments')
      .select('id, invoice_id, amount, currency_code, method, status, reference')
      .eq('reference', ref)
      .maybeSingle();
    if (wRow) {
      return {
        kind: 'wcbn_payment',
        id: wRow.id,
        txRef: ref,
        expectedMajorAmount: Number(wRow.amount),
        expectedCurrency: (wRow.currency_code || 'XAF').toUpperCase(),
        currentStatus: wRow.status,
        paymentMethod: wRow.method,
        regionId: null,
        dcgId: null,
        memberId: null,
        description: null,
        tenantType: 'wcbn_chapter',
        tenantCode: parsedChapter,
        wcbnInvoiceId: wRow.invoice_id,
      };
    }
  }

  const { data: fRow } = await admin
    .from('financial_transactions')
    .select('id, amount, currency_code, member_id, region_id, dcg_id, payment_status, payment_method, description')
    .eq('payment_reference', ref)
    .maybeSingle();

  if (fRow) {
    return {
      kind: 'wca_ledger',
      id: fRow.id,
      txRef: ref,
      expectedMajorAmount: Number(fRow.amount),
      expectedCurrency: (fRow.currency_code || 'XAF').toUpperCase(),
      currentStatus: fRow.payment_status,
      paymentMethod: fRow.payment_method,
      regionId: fRow.region_id,
      dcgId: fRow.dcg_id,
      memberId: fRow.member_id,
      description: fRow.description,
      tenantType: fRow.region_id ? 'wca_region' : 'head_office',
      tenantCode: null,
    };
  }

  const { data: wFallback } = await admin
    .from('wcbn_payments')
    .select('id, invoice_id, amount, currency_code, method, status, reference')
    .eq('reference', ref)
    .maybeSingle();
  if (wFallback) {
    return {
      kind: 'wcbn_payment',
      id: wFallback.id,
      txRef: ref,
      expectedMajorAmount: Number(wFallback.amount),
      expectedCurrency: (wFallback.currency_code || 'XAF').toUpperCase(),
      currentStatus: wFallback.status,
      paymentMethod: wFallback.method,
      regionId: null,
      dcgId: null,
      memberId: null,
      description: null,
      tenantType: 'wcbn_chapter',
      tenantCode: 'WCBN-GEN',
      wcbnInvoiceId: wFallback.invoice_id,
    };
  }

  return null;
}

export async function sendPaymentReceiptEmail(admin: any, transactionId: string): Promise<void> {
  try {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) return;

    const { data: tx } = await admin
      .from('financial_transactions')
      .select(
        'id, amount, currency_code, description, payment_reference, payment_method, transaction_date, donor_name, donor_email, receipt_sent_at, member_id, region:regions(name), category:financial_transaction_categories(name)',
      )
      .eq('id', transactionId)
      .maybeSingle();

    if (!tx || tx.receipt_sent_at) return;

    let recipientEmail = (tx.donor_email || '').trim();
    let recipientName = (tx.donor_name || '').trim();

    if ((!recipientEmail || recipientEmail.endsWith('@worldchangers.org')) && tx.member_id) {
      const { data: mem } = await admin
        .from('members')
        .select('email, family_name, other_names')
        .eq('id', tx.member_id)
        .maybeSingle();
      if (mem?.email) recipientEmail = mem.email.trim();
      if (!recipientName && mem) {
        recipientName = [mem.other_names, mem.family_name].filter(Boolean).join(' ').trim();
      }
    }

    if (!recipientEmail || recipientEmail.endsWith('@worldchangers.org')) return;

    const regionName = tx.region?.name || 'WCA Head Office';
    const purpose = tx.description || tx.category?.name || 'Contribution';
    const formattedAmt = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: isZeroDecimalCurrency(tx.currency_code) ? 0 : 2,
      maximumFractionDigits: isZeroDecimalCurrency(tx.currency_code) ? 0 : 2,
    }).format(Number(tx.amount) || 0);
    const methodLabel = String(tx.payment_method || 'Online Payment')
      .replace(/_/g, ' ')
      .toUpperCase();

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #4c1d95 0%, #6d28d9 100%); padding: 28px 24px; color: #ffffff; text-align: center;">
          <p style="margin: 0; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; opacity: 0.85;">Official Payment Receipt</p>
          <h1 style="margin: 6px 0 4px; font-size: 22px; font-weight: 700;">World Changers Association</h1>
          <p style="margin: 0; font-size: 13px; opacity: 0.9;">${regionName}</p>
        </div>
        <div style="padding: 24px;">
          <p style="margin: 0 0 16px; color: #374151; font-size: 14px;">Dear <strong>${recipientName || 'Supporter'}</strong>,</p>
          <p style="margin: 0 0 20px; color: #4b5563; font-size: 14px; line-height: 1.5;">Thank you for your payment. Your transaction has been verified and recorded in the <strong>${regionName}</strong> ledger.</p>
          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
              <span style="color: #6b7280; font-size: 12px; text-transform: uppercase;">Amount Paid</span>
              <strong style="color: #111827; font-size: 16px;">${formattedAmt} ${tx.currency_code}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
              <span style="color: #6b7280; font-size: 12px; text-transform: uppercase;">Purpose</span>
              <span style="color: #111827; font-size: 13px; font-weight: 600;">${purpose}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
              <span style="color: #6b7280; font-size: 12px; text-transform: uppercase;">Reference</span>
              <span style="color: #111827; font-size: 12px; font-family: monospace;">${tx.payment_reference || tx.id}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
              <span style="color: #6b7280; font-size: 12px; text-transform: uppercase;">Channel</span>
              <span style="color: #111827; font-size: 12px;">${methodLabel}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0;">
              <span style="color: #6b7280; font-size: 12px; text-transform: uppercase;">Date</span>
              <span style="color: #111827; font-size: 12px;">${tx.transaction_date}</span>
            </div>
          </div>
          <p style="margin: 0; color: #9ca3af; font-size: 11px; text-align: center;">Keep this receipt for your records · World Changers Association (${regionName})</p>
        </div>
      </div>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'World Changers Association <noreply@wcaglobal.org>',
        to: [recipientEmail],
        subject: `Payment Receipt · ${formattedAmt} ${tx.currency_code} (${tx.payment_reference || 'WCA'})`,
        html,
      }),
    });

    if (res.ok) {
      await admin
        .from('financial_transactions')
        .update({ receipt_sent_at: new Date().toISOString() })
        .eq('id', transactionId);
    }
  } catch (err) {
    console.warn('Receipt email dispatch skipped:', err);
  }
}

export async function finalizeSuccessfulPayment(
  admin: any,
  lookup: PendingTxLookup,
  opts: {
    gatewayTxId?: string | number | null;
    resolvedMethod?: string | null;
    confirmedByUserId?: string | null;
  } = {},
): Promise<void> {
  const nowIso = new Date().toISOString();

  if (lookup.kind === 'wcbn_payment') {
    if (lookup.currentStatus === 'completed' || lookup.currentStatus === 'paid') return;
    if (lookup.wcbnInvoiceId) {
      await admin.rpc('wcbn_confirm_payment', {
        _invoice_id: lookup.wcbnInvoiceId,
        _method: opts.resolvedMethod || lookup.paymentMethod || 'card',
        _provider: 'flutterwave',
        _reference: lookup.txRef,
        _amount: lookup.expectedMajorAmount,
      });
    }
    await admin.from('wcbn_payments').update({ status: 'completed', paid_at: nowIso }).eq('id', lookup.id);
    return;
  }

  const patch: Record<string, unknown> = { payment_status: 'completed' };
  if (opts.gatewayTxId != null) patch.gateway_transaction_id = String(opts.gatewayTxId);
  if (opts.resolvedMethod) patch.payment_method = opts.resolvedMethod;
  if (opts.confirmedByUserId) {
    patch.payment_confirmed_by = opts.confirmedByUserId;
    patch.payment_confirmed_at = nowIso;
  }

  await admin
    .from('financial_transactions')
    .update(patch)
    .eq('id', lookup.id)
    .neq('payment_status', 'completed');

  await admin
    .from('fundraising_donations')
    .update({ status: 'completed' })
    .eq('message', lookup.txRef)
    .eq('status', 'pending');

  await admin
    .from('event_pre_registrations')
    .update({
      fee_status: 'paid',
      fee_paid_at: nowIso,
      fee_payment_method: opts.resolvedMethod || lookup.paymentMethod || 'online',
      financial_transaction_id: lookup.id,
    })
    .eq('fee_payment_reference', lookup.txRef)
    .neq('fee_status', 'paid');

  await sendPaymentReceiptEmail(admin, lookup.id);
}

export async function finalizeFailedPayment(admin: any, lookup: PendingTxLookup): Promise<void> {
  if (lookup.kind === 'wcbn_payment') {
    await admin.from('wcbn_payments').update({ status: 'failed' }).eq('id', lookup.id).eq('status', 'pending');
    return;
  }

  await admin
    .from('financial_transactions')
    .update({ payment_status: 'failed' })
    .eq('id', lookup.id)
    .eq('payment_status', 'pending');

  await admin
    .from('fundraising_donations')
    .update({ status: 'failed' })
    .eq('message', lookup.txRef)
    .eq('status', 'pending');

  await admin
    .from('event_pre_registrations')
    .update({ fee_status: 'unpaid' })
    .eq('fee_payment_reference', lookup.txRef)
    .eq('fee_status', 'pending');
}

/**
 * Initiates an online refund on Flutterwave or Stripe if a gateway_transaction_id is present,
 * and returns the refund reference & status message.
 */
export async function executeGatewayRefund(
  admin: any,
  tx: {
    id: string;
    amount: number;
    currency_code: string;
    region_id: string | null;
    dcg_id: string | null;
    gateway_transaction_id: string | null;
    payment_method: string | null;
    payment_reference: string | null;
  },
  reason: string,
): Promise<{ gatewayRefunded: boolean; refundReference: string | null; gatewayMessage: string }> {
  const gwId = (tx.gateway_transaction_id || '').trim();
  if (!gwId || tx.payment_method === 'bank_transfer' || tx.payment_method === 'cash') {
    return {
      gatewayRefunded: false,
      refundReference: `REV-${Date.now().toString(36).toUpperCase()}`,
      gatewayMessage: 'Ledger entry reversed (manual / offline payment).',
    };
  }

  const gw = await resolveTenantGateway(admin, {
    tenantType: tx.region_id ? 'wca_region' : 'head_office',
    regionId: tx.region_id,
    dcgId: tx.dcg_id,
  });

  // Stripe refund if gateway_transaction_id is a PaymentIntent (pi_...) or Charge (ch_...)
  if ((gwId.startsWith('pi_') || gwId.startsWith('ch_')) && gw.stripeSecretKey) {
    const params = new URLSearchParams();
    if (gwId.startsWith('pi_')) params.set('payment_intent', gwId);
    else params.set('charge', gwId);
    params.set('metadata[reason]', reason.slice(0, 200));

    const res = await fetch(`${STRIPE_API}/refunds`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${gw.stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    const body = (await res.json().catch(() => ({}))) as any;
    if (res.ok && body?.id) {
      return {
        gatewayRefunded: true,
        refundReference: String(body.id),
        gatewayMessage: 'Refund processed via Stripe API.',
      };
    }
  }

  // Flutterwave refund via POST /v3/transactions/{id}/refund
  if (gw.secretKey) {
    const res = await fetch(`${FLW_API}/transactions/${encodeURIComponent(gwId)}/refund`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${gw.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Number(tx.amount),
        comments: reason,
      }),
    });
    const body = (await res.json().catch(() => ({}))) as any;
    if (res.ok && body?.status === 'success') {
      const refId = body?.data?.id ?? body?.data?.flw_ref ?? `FLW-REF-${gwId}`;
      return {
        gatewayRefunded: true,
        refundReference: String(refId),
        gatewayMessage: 'Money refund initiated via Flutterwave API.',
      };
    }
    return {
      gatewayRefunded: false,
      refundReference: `REV-${gwId}`,
      gatewayMessage:
        body?.message ||
        'Marked as refunded in ledger (Flutterwave gateway refund requires manual dashboard confirmation).',
    };
  }

  return {
    gatewayRefunded: false,
    refundReference: `REV-${Date.now().toString(36).toUpperCase()}`,
    gatewayMessage: 'Marked as refunded in ledger.',
  };
}

/** Handles incoming POST /api/public/flutterwave-webhook requests directly on WCA Hub. */
export async function handleFlutterwaveWebhookRequest(request: Request): Promise<Response> {
  const json = (payload: unknown, status = 200) =>
    new Response(JSON.stringify(payload), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  if (request.method === 'OPTIONS') return json({ ok: true }, 200);
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const admin = supabaseAdmin as any;
    const rawPayload = (await request.json().catch(() => null)) as any;
    if (!rawPayload) return json({ error: 'Invalid JSON payload' }, 400);

    const eventType = String(rawPayload?.event || rawPayload?.['event.type'] || 'charge.completed');
    const txData = rawPayload?.data || rawPayload;
    const txRef = String(txData?.tx_ref || txData?.txRef || '').trim();
    const flwTxId = txData?.id != null ? String(txData.id) : null;

    if (!txRef) return json({ ok: true, ignored: 'missing_tx_ref' }, 200);

    if (flwTxId) {
      const { data: existingEvent } = await admin
        .from('payment_webhook_events')
        .select('id, processed_at')
        .eq('provider', 'flutterwave')
        .eq('flw_tx_id', flwTxId)
        .maybeSingle();
      if (existingEvent?.processed_at) {
        return json({ ok: true, duplicate: true }, 200);
      }
    }

    const lookup = await lookupPendingTransaction(admin, txRef);
    if (!lookup) {
      await admin.from('payment_webhook_events').insert({
        provider: 'flutterwave',
        flw_tx_id: flwTxId,
        tx_ref: txRef,
        event_type: eventType,
        signature_valid: false,
        verified_status: 'unknown_tx_ref',
        raw_payload: rawPayload,
      });
      return json({ ok: true, ignored: 'unknown_tx_ref' }, 200);
    }

    const gw = await resolveTenantGateway(admin, {
      tenantType: lookup.tenantType,
      regionId: lookup.regionId,
      dcgId: lookup.dcgId,
      tenantCode: lookup.tenantCode,
    });

    const incomingHash = request.headers.get('verif-hash');
    if (!constantTimeEquals(incomingHash, gw.webhookSecretHash)) {
      await admin.from('payment_webhook_events').insert({
        provider: 'flutterwave',
        flw_tx_id: flwTxId,
        tx_ref: txRef,
        tenant_setting_id: gw.settingId,
        event_type: eventType,
        signature_valid: false,
        verified_status: 'invalid_verif_hash',
        raw_payload: rawPayload,
      });
      return json({ error: 'Invalid webhook signature' }, 401);
    }

    if (!gw.secretKey) return json({ error: 'Tenant gateway inactive' }, 400);

    const verifyUrl = flwTxId
      ? `${FLW_API}/transactions/${encodeURIComponent(flwTxId)}/verify`
      : `${FLW_API}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef)}`;

    const verifyRes = await fetch(verifyUrl, {
      headers: { Authorization: `Bearer ${gw.secretKey}` },
    });
    const verifyBody = (await verifyRes.json().catch(() => ({}))) as any;
    const verifiedTx = verifyBody?.data;

    if (!verifiedTx || String(verifiedTx.tx_ref || '') !== txRef) {
      return json({ error: 'Could not verify transaction with gateway' }, 400);
    }

    const flwStatus = String(verifiedTx.status || '').toLowerCase();
    const verifiedAmount = Number(verifiedTx.amount || 0);
    const verifiedCurrency = String(verifiedTx.currency || '').toUpperCase();

    if (
      flwStatus === 'successful' &&
      verifiedAmount >= lookup.expectedMajorAmount &&
      verifiedCurrency === lookup.expectedCurrency
    ) {
      const resolvedMethod =
        verifiedTx.payment_type === 'card'
          ? 'card'
          : String(verifiedTx.payment_type || '').includes('mobile')
            ? 'mobile_money'
            : lookup.paymentMethod || 'card';
      await finalizeSuccessfulPayment(admin, lookup, {
        gatewayTxId: verifiedTx.id ?? flwTxId,
        resolvedMethod,
      });
    } else if (flwStatus === 'failed' || flwStatus === 'cancelled') {
      await finalizeFailedPayment(admin, lookup);
    }

    await admin.from('payment_webhook_events').upsert(
      {
        provider: 'flutterwave',
        flw_tx_id: flwTxId ?? (verifiedTx.id != null ? String(verifiedTx.id) : null),
        tx_ref: txRef,
        tenant_setting_id: gw.settingId,
        event_type: eventType,
        signature_valid: true,
        verified_status: flwStatus,
        raw_payload: rawPayload,
        processed_at: new Date().toISOString(),
      },
      { onConflict: 'provider,flw_tx_id' },
    );

    return json({ ok: true, status: flwStatus }, 200);
  } catch (err) {
    console.error('WCA webhook error:', err);
    return json({ error: 'Webhook processing error' }, 500);
  }
}
