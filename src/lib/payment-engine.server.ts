import { randomBytes, timingSafeEqual } from 'node:crypto';

export const FLW_API = 'https://api.flutterwave.com/v3';
export const SUPABASE_WEBHOOK_URL =
  'https://dtqyyvjosdgoqloxybnx.supabase.co/functions/v1/flutterwave-webhook';

export type TenantType = 'wca_region' | 'head_office' | 'wcbn_chapter';
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
  mode: 'test' | 'live';
  onlineReady: boolean;
  usingCentralFallback: boolean;
  publicKey: string | null;
  secretKey: string | null;
  encryptionKey: string | null;
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
  return c === 'XAF' || c === 'XOF';
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
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, 'X');
  return `${app}-${cleanCode}-${opts.context}-${ts}-${rand}`;
}

export function detectFrancophoneMomo(raw: string, currency = 'XAF'): {
  valid: boolean;
  local: string;
  international: string;
  country: string;
  network?: 'MTN' | 'ORANGE' | 'WAVE' | 'MOOV';
} {
  let d = (raw || '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  const cur = currency.toUpperCase();

  if (cur === 'XAF') {
    if (d.startsWith('237') && d.length >= 12) d = d.slice(3);
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
          network: 'MTN',
        };
      }
    }
    return { valid: false, local: d, international: d, country: 'CM' };
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
        network: 'MTN',
      };
    }
  }

  return { valid: false, local: d, international: d, country: 'CM' };
}

/**
 * Strictly resolves the destination payment tenant without silent cross-region
 * or silent Head Office fund contamination.
 * - DCGs automatically inherit their parent region's gateway (dcgs.region_id).
 * - Unconfigured regions NEVER fall back to Head Office unless allow_central_fallback = true.
 * - Bank accounts NEVER fall back across regions or to Head Office.
 */
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

    const mode: 'test' | 'live' = row?.flutterwave_mode === 'test' ? 'test' : 'live';
    const currency = (row?.primary_currency || 'XAF').toUpperCase();
    const onlineReady = !!(
      row?.flutterwave_enabled &&
      row?.flutterwave_secret_key &&
      keyMatchesEnvironment(row.flutterwave_secret_key, mode)
    );
    const accounts: BankAccountInfo[] = Array.isArray(row?.bank_accounts) ? row.bank_accounts : [];
    const bankReady = !!(row?.bank_transfer_enabled && accounts.length > 0);

    return {
      settingId: row?.id ?? null,
      tenantType: 'wcbn_chapter',
      regionId: null,
      dcgId: null,
      tenantCode: code,
      tenantName: code === 'WCBN-GEN' ? 'WCBN Connect' : `WCBN (${code})`,
      currency,
      mode,
      onlineReady,
      usingCentralFallback: false,
      publicKey: onlineReady ? row?.flutterwave_public_key ?? null : null,
      secretKey: onlineReady ? row?.flutterwave_secret_key ?? null : null,
      encryptionKey: onlineReady ? row?.flutterwave_encryption_key ?? null : null,
      webhookSecretHash: row?.webhook_secret_hash ?? null,
      mobileMoneyEnabled: onlineReady && supportsMobileMoneyCurrency(currency) && !!row?.mobile_money_enabled,
      cardEnabled: onlineReady && !!row?.card_enabled && !!row?.flutterwave_encryption_key,
      walletPayEnabled: onlineReady && !supportsMobileMoneyCurrency(currency) && !!row?.wallet_pay_enabled,
      bankTransferEnabled: bankReady,
      bank: bankReady ? { accounts, instructions: row?.bank_instructions ?? '' } : null,
    };
  }

  if (effectiveType === 'head_office') {
    const { data: rows } = await admin
      .from('region_payment_settings')
      .select('*')
      .is('region_id', null);
    const ho = (rows ?? []).find((r: any) => r.tenant_type !== 'wcbn_chapter') ?? null;

    const mode: 'test' | 'live' = ho?.flutterwave_mode === 'test' ? 'test' : 'live';
    const currency = (ho?.primary_currency || 'XAF').toUpperCase();
    const onlineReady = !!(
      ho?.flutterwave_enabled &&
      ho?.flutterwave_secret_key &&
      keyMatchesEnvironment(ho.flutterwave_secret_key, mode)
    );
    const accounts: BankAccountInfo[] = Array.isArray(ho?.bank_accounts) ? ho.bank_accounts : [];
    const bankReady = !!(ho?.bank_transfer_enabled && accounts.length > 0);

    return {
      settingId: ho?.id ?? null,
      tenantType: 'head_office',
      regionId: null,
      dcgId: null,
      tenantCode: ho?.tenant_code || 'HO',
      tenantName: 'WCA Head Office',
      currency,
      mode,
      onlineReady,
      usingCentralFallback: false,
      publicKey: onlineReady ? ho?.flutterwave_public_key ?? null : null,
      secretKey: onlineReady ? ho?.flutterwave_secret_key ?? null : null,
      encryptionKey: onlineReady ? ho?.flutterwave_encryption_key ?? null : null,
      webhookSecretHash: ho?.webhook_secret_hash ?? null,
      mobileMoneyEnabled: onlineReady && supportsMobileMoneyCurrency(currency) && !!ho?.mobile_money_enabled,
      cardEnabled: onlineReady && !!ho?.card_enabled && !!ho?.flutterwave_encryption_key,
      walletPayEnabled: onlineReady && !supportsMobileMoneyCurrency(currency) && !!ho?.wallet_pay_enabled,
      bankTransferEnabled: bankReady,
      bank: bankReady ? { accounts, instructions: ho?.bank_instructions ?? '' } : null,
    };
  }

  const [{ data: region }, { data: own }] = await Promise.all([
    admin.from('regions').select('id, name, code, currency_code').eq('id', regionId).maybeSingle(),
    admin.from('region_payment_settings').select('*').eq('region_id', regionId).maybeSingle(),
  ]);

  if (!region) throw new Error('That region was not found.');

  const currency = (region.currency_code || own?.primary_currency || 'XAF').toUpperCase();
  const ownMode: 'test' | 'live' = own?.flutterwave_mode === 'test' ? 'test' : 'live';
  const ownReady = !!(
    own?.flutterwave_enabled &&
    own?.flutterwave_secret_key &&
    keyMatchesEnvironment(own.flutterwave_secret_key, ownMode)
  );

  let activeGw = ownReady ? own : null;
  let usingCentralFallback = false;

  if (!ownReady && own?.allow_central_fallback === true) {
    const { data: hoRows } = await admin
      .from('region_payment_settings')
      .select('*')
      .is('region_id', null);
    const ho = (hoRows ?? []).find((r: any) => r.tenant_type !== 'wcbn_chapter') ?? null;
    const hoMode: 'test' | 'live' = ho?.flutterwave_mode === 'test' ? 'test' : 'live';
    if (ho?.flutterwave_enabled && ho?.flutterwave_secret_key && keyMatchesEnvironment(ho.flutterwave_secret_key, hoMode)) {
      activeGw = ho;
      usingCentralFallback = true;
    }
  }

  const activeMode: 'test' | 'live' = activeGw?.flutterwave_mode === 'test' ? 'test' : ownMode;
  const onlineReady = !!activeGw;

  const ownAccounts: BankAccountInfo[] = Array.isArray(own?.bank_accounts) ? own.bank_accounts : [];
  const bankReady = !!(own?.bank_transfer_enabled && ownAccounts.length > 0);

  return {
    settingId: activeGw?.id ?? own?.id ?? null,
    tenantType: 'wca_region',
    regionId: region.id,
    dcgId,
    tenantCode: (own?.tenant_code || region.code || 'REG').toUpperCase(),
    tenantName: region.name,
    currency,
    mode: activeMode,
    onlineReady,
    usingCentralFallback,
    publicKey: onlineReady ? activeGw.flutterwave_public_key ?? null : null,
    secretKey: onlineReady ? activeGw.flutterwave_secret_key ?? null : null,
    encryptionKey: onlineReady ? activeGw.flutterwave_encryption_key ?? null : null,
    webhookSecretHash: activeGw?.webhook_secret_hash ?? own?.webhook_secret_hash ?? null,
    mobileMoneyEnabled: onlineReady && supportsMobileMoneyCurrency(currency) && !!activeGw.mobile_money_enabled,
    cardEnabled: onlineReady && !!activeGw.card_enabled && !!activeGw.flutterwave_encryption_key,
    walletPayEnabled: onlineReady && !supportsMobileMoneyCurrency(currency) && !!activeGw.wallet_pay_enabled,
    bankTransferEnabled: bankReady,
    bank: bankReady ? { accounts: ownAccounts, instructions: own?.bank_instructions ?? '' } : null,
  };
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
      message: body.data?.processor_response || 'Enter the code sent to your phone.',
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
    throw new Error(body.message || 'Could not start Apple Pay / Google Pay checkout.');
  }
  return { link: body.data.link as string };
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
    throw new Error(`Mobile Money is not available for ${opts.currency}. Please use Card or Bank Deposit.`);
  }
  const momo = detectFrancophoneMomo(opts.phoneRaw, opts.currency);
  if (!momo.valid) {
    throw new Error(
      opts.currency === 'XAF'
        ? 'Please enter a valid MTN or Orange Mobile Money number.'
        : 'Please enter a valid XOF Mobile Money number.',
    );
  }
  const res = await fetch(`${FLW_API}/charges?type=mobile_money_franco`, {
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
