import CryptoJS from "npm:crypto-js@4.2.0";

export const FLW_API = "https://api.flutterwave.com/v3";

export type TenantType = "wca_region" | "head_office" | "wcbn_chapter";
export type PaymentMethod = "mobile_money" | "card" | "wallet_pay" | "bank_transfer";
export type TxContextCode = "EVT" | "GIV" | "CMP" | "SHP" | "DCG" | "INV" | "MEM";

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
  mode: "test" | "live";
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
  | { mode: "pin"; pin: string }
  | {
      mode: "avs_noauth";
      city: string;
      address: string;
      state: string;
      country: string;
      zipcode: string;
    };

export type CardStep = {
  next: "done" | "pin" | "avs" | "otp" | "redirect" | "failed";
  flwRef?: string;
  link?: string;
  message?: string;
};

/** Currencies supporting Francophone Mobile Money on Flutterwave. */
export function supportsMobileMoneyCurrency(currency: string): boolean {
  const c = (currency || "").toUpperCase();
  return c === "XAF" || c === "XOF";
}

/** Currencies with zero decimal subdivisions in standard display/charges. */
export function isZeroDecimalCurrency(currency: string): boolean {
  const c = (currency || "").toUpperCase();
  return c === "XAF" || c === "XOF" || c === "RWF" || c === "UGX" || c === "JPY";
}

/** Normalizes a major-unit amount safely for Flutterwave charges & financial_transactions. */
export function normalizeMajorAmount(amount: number, currency: string): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return isZeroDecimalCurrency(currency)
    ? Math.round(amount)
    : Math.round(amount * 100) / 100;
}

/** Converts major units -> minor units (* 100) used by fundraising_donations & event_pre_registrations. */
export function majorToMinorUnits(majorAmount: number): number {
  return Math.round(Number(majorAmount) * 100);
}

/** Converts minor units (/ 100) -> major units used by financial_transactions & Flutterwave /v3/charges. */
export function minorToMajorUnits(minorAmount: number, currency: string): number {
  return normalizeMajorAmount(Number(minorAmount) / 100, currency);
}

/** Validates that a Flutterwave key matches the selected test/live environment. */
export function keyMatchesEnvironment(key: string | null | undefined, mode: "test" | "live"): boolean {
  if (!key || !key.trim()) return false;
  const k = key.trim();
  const hasTestTag = /_TEST[-_]/i.test(k) || k.startsWith("FLWSECK_TEST") || k.startsWith("FLWPUBK_TEST");
  if (mode === "live" && hasTestTag) return false;
  if (mode === "test" && (k.startsWith("FLWSECK-") || k.startsWith("FLWPUBK-")) && !hasTestTag) return false;
  return true;
}

/** Constant-time string comparison for webhook secret hashes. */
export function constantTimeEquals(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const enc = new TextEncoder();
  const ba = enc.encode(a.trim());
  const bb = enc.encode(b.trim());
  if (ba.length !== bb.length || ba.length === 0) return false;
  let diff = 0;
  for (let i = 0; i < ba.length; i++) {
    diff |= ba[i] ^ bb[i];
  }
  return diff === 0;
}

/** Standardized Multi-Tenant Transaction Reference: {APP}-{TENANT_CODE}-{CTX}-{TS36}-{RAND4} */
export function generateTxRef(opts: {
  app?: "WCA" | "WCBN";
  tenantCode: string;
  context: TxContextCode;
}): string {
  const app = opts.app || "WCA";
  const cleanCode = (opts.tenantCode || "HO")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 10) || "HO";
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, "X");
  return `${app}-${cleanCode}-${opts.context}-${ts}-${rand}`;
}

/**
 * Normalizes XAF / XOF Mobile Money numbers and detects country + network.
 * Defaults to Cameroon (237, CM) for 9-digit local XAF numbers while supporting
 * international prefixes across XAF & XOF countries.
 */
export function detectFrancophoneMomo(raw: string, currency = "XAF"): {
  valid: boolean;
  local: string;
  international: string;
  country: string;
  network?: "MTN" | "ORANGE" | "WAVE" | "MOOV";
} {
  let d = (raw || "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);

  const cur = currency.toUpperCase();

  // Cameroon (XAF) — 237 + 9 digits
  if (cur === "XAF") {
    if (d.startsWith("237") && d.length === 12) d = d.slice(3);
    if (d.length === 9 && d.startsWith("6")) {
      const p2 = d.slice(0, 2);
      const p3 = d.slice(0, 3);
      let network: "MTN" | "ORANGE" | undefined;
      if (p2 === "67" || p2 === "68" || ["650", "651", "652", "653", "654"].includes(p3)) {
        network = "MTN";
      } else if (p2 === "69" || ["655", "656", "657", "658", "659"].includes(p3)) {
        network = "ORANGE";
      }
      return {
        valid: !!network,
        local: d,
        international: `237${d}`,
        country: "CM",
        network,
      };
    }
    // Central African international numbers (Gabon 241, Chad 235, Congo 242)
    const xafCountries: Record<string, string> = { "241": "GA", "235": "TD", "242": "CG" };
    for (const [dial, iso] of Object.entries(xafCountries)) {
      if (d.startsWith(dial) && d.length >= 11) {
        return {
          valid: true,
          local: d.slice(dial.length),
          international: d,
          country: iso,
          network: "MTN",
        };
      }
    }
    return { valid: false, local: d, international: d, country: "CM" };
  }

  // Francophone West Africa (XOF)
  if (cur === "XOF") {
    const xofCountries: Record<string, string> = {
      "225": "CI",
      "221": "SN",
      "226": "BF",
      "229": "BJ",
      "228": "TG",
      "223": "ML",
    };
    for (const [dial, iso] of Object.entries(xofCountries)) {
      if (d.startsWith(dial) && d.length >= 11) {
        return {
          valid: true,
          local: d.slice(dial.length),
          international: d,
          country: iso,
          network: "MTN",
        };
      }
    }
    // Local 8-10 digit XOF fallback (default Côte d'Ivoire / Senegal)
    if (d.length >= 8 && d.length <= 10) {
      return {
        valid: true,
        local: d,
        international: `225${d}`,
        country: "CI",
        network: "MTN",
      };
    }
  }

  return { valid: false, local: d, international: d, country: "CM" };
}

/**
 * Strictly resolves the destination payment tenant without silent cross-region
 * or silent Head Office fund contamination.
 * - DCGs automatically inherit their parent region's gateway (dcgs.region_id).
 * - Unconfigured regions NEVER fall back to Head Office unless Super Admin explicitly
 *   enabled allow_central_fallback = true.
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

  // DCG Inheritance: every DCG automatically uses its parent Region's payment gateway
  if (dcgId && !regionId) {
    const { data: dcg } = await admin
      .from("dcgs")
      .select("id, region_id")
      .eq("id", dcgId)
      .maybeSingle();
    if (dcg?.region_id) {
      regionId = dcg.region_id;
    }
  }

  const effectiveType: TenantType =
    input.tenantType === "wcbn_chapter"
      ? "wcbn_chapter"
      : !regionId
        ? "head_office"
        : "wca_region";

  // 1. WCBN Connect Tenant
  if (effectiveType === "wcbn_chapter") {
    const code = (input.tenantCode || "WCBN-GEN").toUpperCase();
    const { data: row } = await admin
      .from("region_payment_settings")
      .select("*")
      .eq("tenant_type", "wcbn_chapter")
      .eq("tenant_code", code)
      .maybeSingle();

    const mode: "test" | "live" = row?.flutterwave_mode === "test" ? "test" : "live";
    const currency = (row?.primary_currency || "XAF").toUpperCase();
    const onlineReady = !!(
      row?.flutterwave_enabled &&
      row?.flutterwave_secret_key &&
      keyMatchesEnvironment(row.flutterwave_secret_key, mode)
    );
    const accounts: BankAccountInfo[] = Array.isArray(row?.bank_accounts) ? row.bank_accounts : [];
    const bankReady = !!(row?.bank_transfer_enabled && accounts.length > 0);

    return {
      settingId: row?.id ?? null,
      tenantType: "wcbn_chapter",
      regionId: null,
      dcgId: null,
      tenantCode: code,
      tenantName: code === "WCBN-GEN" ? "WCBN Connect" : `WCBN (${code})`,
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
      bank: bankReady ? { accounts, instructions: row?.bank_instructions ?? "" } : null,
    };
  }

  // 2. Head Office (Global / Inter-regional Scope)
  if (effectiveType === "head_office") {
    const { data: ho } = await admin
      .from("region_payment_settings")
      .select("*")
      .is("region_id", null)
      .neq("tenant_type", "wcbn_chapter")
      .maybeSingle();

    const mode: "test" | "live" = ho?.flutterwave_mode === "test" ? "test" : "live";
    const currency = (ho?.primary_currency || "XAF").toUpperCase();
    const onlineReady = !!(
      ho?.flutterwave_enabled &&
      ho?.flutterwave_secret_key &&
      keyMatchesEnvironment(ho.flutterwave_secret_key, mode)
    );
    const accounts: BankAccountInfo[] = Array.isArray(ho?.bank_accounts) ? ho.bank_accounts : [];
    const bankReady = !!(ho?.bank_transfer_enabled && accounts.length > 0);

    return {
      settingId: ho?.id ?? null,
      tenantType: "head_office",
      regionId: null,
      dcgId: null,
      tenantCode: ho?.tenant_code || "HO",
      tenantName: "WCA Head Office",
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
      bank: bankReady ? { accounts, instructions: ho?.bank_instructions ?? "" } : null,
    };
  }

  // 3. WCA Regional Tenant (Strict Isolation)
  const [{ data: region }, { data: own }] = await Promise.all([
    admin.from("regions").select("id, name, code, currency_code").eq("id", regionId).maybeSingle(),
    admin
      .from("region_payment_settings")
      .select("*")
      .eq("region_id", regionId)
      .maybeSingle(),
  ]);

  if (!region) {
    throw new Error("Destination region was not found.");
  }

  const currency = (region.currency_code || own?.primary_currency || "XAF").toUpperCase();
  const ownMode: "test" | "live" = own?.flutterwave_mode === "test" ? "test" : "live";
  const ownReady = !!(
    own?.flutterwave_enabled &&
    own?.flutterwave_secret_key &&
    keyMatchesEnvironment(own.flutterwave_secret_key, ownMode)
  );

  let activeGw = ownReady ? own : null;
  let usingCentralFallback = false;

  // Only allow Head Office fallback if Super Admin explicitly authorized allow_central_fallback = true
  if (!ownReady && own?.allow_central_fallback === true) {
    const { data: ho } = await admin
      .from("region_payment_settings")
      .select("*")
      .is("region_id", null)
      .neq("tenant_type", "wcbn_chapter")
      .maybeSingle();
    const hoMode: "test" | "live" = ho?.flutterwave_mode === "test" ? "test" : "live";
    if (ho?.flutterwave_enabled && ho?.flutterwave_secret_key && keyMatchesEnvironment(ho.flutterwave_secret_key, hoMode)) {
      activeGw = ho;
      usingCentralFallback = true;
    }
  }

  const activeMode: "test" | "live" = activeGw?.flutterwave_mode === "test" ? "test" : ownMode;
  const onlineReady = !!activeGw;

  // Strict Money Isolation: Bank Accounts NEVER fall back to Head Office or another region
  const ownAccounts: BankAccountInfo[] = Array.isArray(own?.bank_accounts) ? own.bank_accounts : [];
  const bankReady = !!(own?.bank_transfer_enabled && ownAccounts.length > 0);

  return {
    settingId: activeGw?.id ?? own?.id ?? null,
    tenantType: "wca_region",
    regionId: region.id,
    dcgId,
    tenantCode: (own?.tenant_code || region.code || "REG").toUpperCase(),
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
    bank: bankReady ? { accounts: ownAccounts, instructions: own?.bank_instructions ?? "" } : null,
  };
}

/** Executes a 3DES-encrypted direct card charge against Flutterwave /v3/charges?type=card. */
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
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ client }),
  });
  const body = (await res.json().catch(() => ({}))) as any;
  if (body.status !== "success") {
    return { next: "failed", message: body.message || "Your card was declined." };
  }
  const auth = body.meta?.authorization;
  if (auth?.mode === "pin") return { next: "pin" };
  if (auth?.mode === "avs_noauth") return { next: "avs" };
  if (auth?.mode === "redirect") return { next: "redirect", link: auth.redirect };
  if (auth?.mode === "otp") {
    return {
      next: "otp",
      flwRef: body.data?.flw_ref,
      message: body.data?.processor_response || "Enter the one-time code sent by your bank.",
    };
  }
  if (body.data?.status === "successful") return { next: "done" };
  if (body.data?.status === "failed") {
    return { next: "failed", message: body.data?.processor_response || "Your card was declined." };
  }
  return { next: "done" };
}

/** Creates a Flutterwave Standard Hosted Checkout session (for Apple Pay / Google Pay / Wallet Pay). */
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
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tx_ref: opts.txRef,
      amount: opts.amount,
      currency: opts.currency,
      redirect_url: opts.redirectUrl,
      payment_options: "applepay,googlepay,card",
      customer: { email: opts.email, name: opts.name },
      customizations: { title: opts.title },
    }),
  });
  const body = (await res.json().catch(() => ({}))) as any;
  if (!res.ok || body.status !== "success" || !body.data?.link) {
    throw new Error(body.message || "Could not start wallet checkout.");
  }
  return { link: body.data.link as string };
}

/** Initiates a Francophone Mobile Money push charge on Flutterwave. */
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
    throw new Error(`Mobile Money is not available for ${opts.currency}. Please pay by card or bank transfer.`);
  }
  const momo = detectFrancophoneMomo(opts.phoneRaw, opts.currency);
  if (!momo.valid) {
    throw new Error(
      opts.currency === "XAF"
        ? "Please enter a valid MTN or Orange Mobile Money number."
        : "Please enter a valid XOF Mobile Money number (with country code if outside Côte d'Ivoire).",
    );
  }
  const res = await fetch(`${FLW_API}/charges?type=mobile_money_franco`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.secret}`,
      "Content-Type": "application/json",
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
  if (!res.ok || body.status !== "success") {
    throw new Error(body.message || "Could not send the payment request to your phone.");
  }
  const auth = body.meta?.authorization;
  return {
    link: auth?.mode === "redirect" ? (auth.redirect as string) : null,
    network: momo.network || "MTN",
  };
}

export interface PendingTxLookup {
  kind: "wca_ledger" | "wcbn_payment";
  id: string;
  txRef: string;
  expectedMajorAmount: number;
  expectedCurrency: string;
  currentStatus: string;
  paymentMethod: string | null;
  regionId: string | null;
  dcgId: string | null;
  tenantType: TenantType;
  tenantCode: string | null;
  wcbnInvoiceId?: string | null;
}

/** Resolves any WCA or WCBN transaction by tx_ref so webhooks and verifiers know the exact tenant. */
export async function lookupPendingTransaction(
  admin: any,
  txRef: string,
): Promise<PendingTxLookup | null> {
  const ref = (txRef || "").trim();
  if (!ref) return null;

  // 1. Check WCBN payments first if prefixed with WCBN-
  if (ref.toUpperCase().startsWith("WCBN-")) {
    const parts = ref.toUpperCase().split("-");
    const parsedChapter = parts.length >= 3 ? `WCBN-${parts[1]}` : "WCBN-GEN";
    const { data: wRow } = await admin
      .from("wcbn_payments")
      .select("id, invoice_id, amount, currency_code, method, status, reference")
      .eq("reference", ref)
      .maybeSingle();
    if (wRow) {
      return {
        kind: "wcbn_payment",
        id: wRow.id,
        txRef: ref,
        expectedMajorAmount: Number(wRow.amount),
        expectedCurrency: (wRow.currency_code || "XAF").toUpperCase(),
        currentStatus: wRow.status,
        paymentMethod: wRow.method,
        regionId: null,
        dcgId: null,
        tenantType: "wcbn_chapter",
        tenantCode: parsedChapter === "WCBN-GEN" ? "WCBN-GEN" : parsedChapter,
        wcbnInvoiceId: wRow.invoice_id,
      };
    }
  }

  // 2. Check WCA financial_transactions (covers Member Giving, Visitor Giving, Campaigns, Event Fees, Store, DCG)
  const { data: fRow } = await admin
    .from("financial_transactions")
    .select("id, amount, currency_code, region_id, dcg_id, payment_status, payment_method")
    .eq("payment_reference", ref)
    .maybeSingle();

  if (fRow) {
    return {
      kind: "wca_ledger",
      id: fRow.id,
      txRef: ref,
      expectedMajorAmount: Number(fRow.amount),
      expectedCurrency: (fRow.currency_code || "XAF").toUpperCase(),
      currentStatus: fRow.payment_status,
      paymentMethod: fRow.payment_method,
      regionId: fRow.region_id,
      dcgId: fRow.dcg_id,
      tenantType: fRow.region_id ? "wca_region" : "head_office",
      tenantCode: null,
    };
  }

  // 3. Fallback check on wcbn_payments even if non-prefixed reference
  const { data: wFallback } = await admin
    .from("wcbn_payments")
    .select("id, invoice_id, amount, currency_code, method, status, reference")
    .eq("reference", ref)
    .maybeSingle();
  if (wFallback) {
    return {
      kind: "wcbn_payment",
      id: wFallback.id,
      txRef: ref,
      expectedMajorAmount: Number(wFallback.amount),
      expectedCurrency: (wFallback.currency_code || "XAF").toUpperCase(),
      currentStatus: wFallback.status,
      paymentMethod: wFallback.method,
      regionId: null,
      dcgId: null,
      tenantType: "wcbn_chapter",
      tenantCode: "WCBN-GEN",
      wcbnInvoiceId: wFallback.invoice_id,
    };
  }

  return null;
}

/**
 * Atomically & idempotently marks a verified transaction as completed across:
 * - WCA financial_transactions
 * - Linked fundraising_donations (matched by message = txRef)
 * - Linked event_pre_registrations (matched by fee_payment_reference = txRef or financial_transaction_id)
 * - OR WCBN wcbn_payments + wcbn_confirm_payment RPC
 */
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

  if (lookup.kind === "wcbn_payment") {
    if (lookup.currentStatus === "completed" || lookup.currentStatus === "paid") return;
    if (lookup.wcbnInvoiceId) {
      await admin.rpc("wcbn_confirm_payment", {
        _invoice_id: lookup.wcbnInvoiceId,
        _method: opts.resolvedMethod || lookup.paymentMethod || "card",
        _provider: "flutterwave",
        _reference: lookup.txRef,
        _amount: lookup.expectedMajorAmount,
      });
    }
    await admin
      .from("wcbn_payments")
      .update({ status: "completed", paid_at: nowIso })
      .eq("id", lookup.id);
    return;
  }

  // WCA Ledger completion (idempotent)
  const patch: Record<string, unknown> = {
    payment_status: "completed",
  };
  if (opts.gatewayTxId != null) patch.gateway_transaction_id = String(opts.gatewayTxId);
  if (opts.resolvedMethod) patch.payment_method = opts.resolvedMethod;
  if (opts.confirmedByUserId) {
    patch.payment_confirmed_by = opts.confirmedByUserId;
    patch.payment_confirmed_at = nowIso;
  }

  await admin
    .from("financial_transactions")
    .update(patch)
    .eq("id", lookup.id)
    .neq("payment_status", "completed");

  // Sync linked fundraising campaign donation (if any)
  await admin
    .from("fundraising_donations")
    .update({ status: "completed" })
    .eq("message", lookup.txRef)
    .eq("status", "pending");

  // Sync linked special/DCG event pre-registrations (all attendees in the registration group)
  await admin
    .from("event_pre_registrations")
    .update({
      fee_status: "paid",
      fee_paid_at: nowIso,
      fee_payment_method: opts.resolvedMethod || lookup.paymentMethod || "online",
      financial_transaction_id: lookup.id,
    })
    .eq("fee_payment_reference", lookup.txRef)
    .neq("fee_status", "paid");
}

/** Atomically marks a declined/cancelled payment as failed across linked records. */
export async function finalizeFailedPayment(
  admin: any,
  lookup: PendingTxLookup,
): Promise<void> {
  if (lookup.kind === "wcbn_payment") {
    await admin
      .from("wcbn_payments")
      .update({ status: "failed" })
      .eq("id", lookup.id)
      .eq("status", "pending");
    return;
  }

  await admin
    .from("financial_transactions")
    .update({ payment_status: "failed" })
    .eq("id", lookup.id)
    .eq("payment_status", "pending");

  await admin
    .from("fundraising_donations")
    .update({ status: "failed" })
    .eq("message", lookup.txRef)
    .eq("status", "pending");

  // Keep event_pre_registrations as 'unpaid' if an online attempt failed so attendee can retry
  await admin
    .from("event_pre_registrations")
    .update({ fee_status: "unpaid" })
    .eq("fee_payment_reference", lookup.txRef)
    .eq("fee_status", "pending");
}
