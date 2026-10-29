// FX conversion utility for super admin financial reporting, store catalog pricing,
// and live spot-price + dual-spread (Buy Spread % & Sell Spread %) management.
//
// Conversion side semantics:
//   "mid" — average of bid/ask (default for reporting)
//   "bid" — rate at which the market buys quote / buys base
//   "ask" — rate at which the market sells quote / sells base

export interface ExchangeRate {
  id: string;
  base_code: string;
  quote_code: string;
  bid: number;
  ask: number;
  mid: number;
  is_active: boolean;
  spot_price?: number | null;
  buy_spread_pct?: number;
  sell_spread_pct?: number;
  spread_mode?: "percentage" | "manual";
  last_api_fetch_at?: string | null;
  auto_sync?: boolean;
  updated_at?: string | null;
}

export type FxSide = "mid" | "bid" | "ask";

/**
 * Fallback reference rates (XAF per 1 unit of currency) used when a pair is not yet
 * present in the database, preventing any catalog price from charging raw FCFA in USD/EUR.
 */
export const FALLBACK_XAF_PER_UNIT: Record<string, number> = {
  XAF: 1,
  XOF: 1,
  EUR: 655.957,
  USD: 605.0,
  GBP: 785.0,
  CAD: 435.0,
  CHF: 685.0,
  AUD: 395.0,
  GHS: 39.5,
  KES: 4.68,
  NGN: 0.38,
  ZAR: 33.5,
  RWF: 0.44,
  UGX: 0.165,
  INR: 7.2,
  CNY: 84.0,
  BRL: 105.0,
  MXN: 30.0,
  JPY: 4.0,
};

const pick = (r: ExchangeRate, side: FxSide): number => {
  if (side === "bid") return Number(r.bid);
  if (side === "ask") return Number(r.ask);
  return Number(r.mid ?? (Number(r.bid) + Number(r.ask)) / 2);
};

/**
 * Computes Bid (Buy), Ask (Sell), Mid, and margin metrics from a live market spot price
 * and Super Admin configured Buy Spread (%) and Sell Spread (%).
 *
 * Formulas:
 *   Bid (Buy)  = Spot * (1 - BuySpread% / 100)
 *   Ask (Sell) = Spot * (1 + SellSpread% / 100)
 *   Mid        = (Bid + Ask) / 2
 */
export function computeRatesFromSpotAndSpreads(
  spotPrice: number,
  buySpreadPct: number,
  sellSpreadPct: number
): {
  spot: number;
  bid: number;
  ask: number;
  mid: number;
  totalSpreadPct: number;
  effectiveSpreadAmount: number;
} {
  const s = Math.max(0, Number(spotPrice) || 0);
  const buyPct = Math.max(0, Math.min(99, Number(buySpreadPct) || 0));
  const sellPct = Math.max(0, Number(sellSpreadPct) || 0);

  const rawBid = s * (1 - buyPct / 100);
  const rawAsk = s * (1 + sellPct / 100);

  const decimals = s >= 100 ? 4 : s >= 1 ? 4 : 6;
  const factor = Math.pow(10, decimals);

  const bid = Math.max(0.000001, Math.round(rawBid * factor) / factor);
  const ask = Math.max(bid, Math.round(rawAsk * factor) / factor);
  const mid = Math.round(((bid + ask) / 2) * factor) / factor;

  return {
    spot: s,
    bid,
    ask,
    mid,
    totalSpreadPct: Math.round((buyPct + sellPct) * 100) / 100,
    effectiveSpreadAmount: Math.round((ask - bid) * factor) / factor,
  };
}

/**
 * Fetches the live market spot exchange rate for `baseCode -> quoteCode` from open financial APIs.
 * Tries:
 *   1. open.er-api.com (supports 160+ currencies including XAF, XOF, GHS, KES, RWF, UGX, USD, EUR, GBP, CAD)
 *   2. api.frankfurter.app (ECB reference rates)
 *   3. Cross-rate via EUR/XAF fixed parity or fallback reference table
 */
export async function fetchLiveSpotPrice(
  baseCode: string,
  quoteCode: string
): Promise<{ spot: number; source: string; fetchedAt: string }> {
  const base = (baseCode || "").trim().toUpperCase();
  const quote = (quoteCode || "").trim().toUpperCase();
  const fetchedAt = new Date().toISOString();

  if (!base || !quote) {
    throw new Error("Please select both Base and Quote currencies first.");
  }
  if (base === quote) {
    return { spot: 1, source: "Identity", fetchedAt };
  }

  // Fixed CFA Franc parity (1 EUR = 655.957 XAF/XOF; 1 XAF = 1 XOF)
  if ((base === "XAF" && quote === "XOF") || (base === "XOF" && quote === "XAF")) {
    return { spot: 1, source: "BEAC/BCEAO Parity", fetchedAt };
  }

  // Primary API: ExchangeRate-API Open Endpoint
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`);
    if (res.ok) {
      const json = (await res.json()) as { result?: string; rates?: Record<string, number> };
      const rate = json?.rates?.[quote];
      if (typeof rate === "number" && rate > 0) {
        return {
          spot: Number(rate.toFixed(rate >= 10 ? 4 : 6)),
          source: "ExchangeRate-API (Live Spot)",
          fetchedAt,
        };
      }
    }
  } catch {
    // Continue to fallback source
  }

  // Secondary API: Frankfurter (ECB)
  try {
    const res = await fetch(
      `https://api.frankfurter.app/latest?from=${encodeURIComponent(base)}&to=${encodeURIComponent(quote)}`
    );
    if (res.ok) {
      const json = (await res.json()) as { rates?: Record<string, number> };
      const rate = json?.rates?.[quote];
      if (typeof rate === "number" && rate > 0) {
        return {
          spot: Number(rate.toFixed(rate >= 10 ? 4 : 6)),
          source: "ECB Frankfurter (Live Spot)",
          fetchedAt,
        };
      }
    }
  } catch {
    // Continue to fallback
  }

  // Fallback: Compute from built-in reference table
  const baseXaf = FALLBACK_XAF_PER_UNIT[base];
  const quoteXaf = FALLBACK_XAF_PER_UNIT[quote];
  if (baseXaf && quoteXaf) {
    const spot = baseXaf / quoteXaf;
    return {
      spot: Number(spot.toFixed(spot >= 10 ? 4 : 6)),
      source: "WCA Reference Benchmark",
      fetchedAt,
    };
  }

  throw new Error(`Could not fetch live spot rate for ${base} → ${quote}. Please enter a spot price manually.`);
}

/**
 * Convert `amount` from `fromCode` to `toCode` using the provided rate table.
 * Tries direct pair, reverse pair, then via `baseCode`. Returns null when no path.
 */
export function convert(
  amount: number,
  fromCode: string | null | undefined,
  toCode: string,
  baseCode: string,
  rates: ExchangeRate[],
  side: FxSide = "mid"
): number | null {
  if (!fromCode) return null;
  const from = fromCode.toUpperCase();
  const to = toCode.toUpperCase();
  const base = (baseCode || "EUR").toUpperCase();
  if (from === to) return amount;

  const active = rates.filter((r) => r.is_active);

  // Direct
  const direct = active.find((r) => r.base_code === from && r.quote_code === to);
  if (direct) return amount * pick(direct, side);

  // Reverse (when reversing, selling quote uses bid and buying quote uses ask)
  const reverse = active.find((r) => r.base_code === to && r.quote_code === from);
  if (reverse) {
    const revSide: FxSide = side === "ask" ? "bid" : side === "bid" ? "ask" : "mid";
    const rate = pick(reverse, revSide);
    if (rate > 0) return amount / rate;
  }

  // Via baseCode
  if (from !== base && to !== base) {
    const toBase = convert(amount, from, base, base, active, side);
    if (toBase != null) {
      const fromBase = convert(toBase, base, to, base, active, side);
      if (fromBase != null) return fromBase;
    }
  }

  // Via XAF hub (since many WCA pairs are quoted against XAF)
  if (from !== "XAF" && to !== "XAF") {
    const toXaf = convert(amount, from, "XAF", "XAF", active, side);
    if (toXaf != null) {
      const fromXaf = convert(toXaf, "XAF", to, "XAF", active, side);
      if (fromXaf != null) return fromXaf;
    }
  }

  return null;
}

/**
 * Converts `amount` from `fromCode` to `toCode`, using Super Admin's `exchange_rates` table first
 * and gracefully falling back to `FALLBACK_XAF_PER_UNIT` so catalog prices never fail to convert.
 */
export function convertWithFallback(
  amount: number,
  fromCode: string,
  toCode: string,
  rates: ExchangeRate[] = [],
  baseCode = "EUR",
  side: FxSide = "mid"
): number {
  const from = (fromCode || "XAF").toUpperCase();
  const to = (toCode || "XAF").toUpperCase();
  if (from === to) return amount;

  const dbConverted = convert(amount, from, to, baseCode, rates, side);
  if (dbConverted != null && Number.isFinite(dbConverted) && dbConverted > 0) {
    return dbConverted;
  }

  const fromXaf = FALLBACK_XAF_PER_UNIT[from] ?? 1;
  const toXaf = FALLBACK_XAF_PER_UNIT[to] ?? 1;
  const inXaf = amount * fromXaf;
  return inXaf / toXaf;
}

/**
 * Converts a catalog item's base XAF price into the target regional currency and rounds
 * cleanly for retail checkout (integers for XAF/XOF/RWF/UGX; 2 decimals for USD/EUR/GBP/CAD/GHS/KES).
 */
export function convertCatalogPriceFromXaf(
  baseXafPrice: number,
  targetCurrency: string,
  rates: ExchangeRate[] = [],
  baseCode = "EUR"
): number {
  const cur = (targetCurrency || "XAF").toUpperCase();
  if (cur === "XAF" || cur === "XOF") return Math.round(baseXafPrice);

  // Use "ask" (sell rate) so WCA does not lose margin on currency conversion
  const raw = convertWithFallback(baseXafPrice, "XAF", cur, rates, baseCode, "ask");
  const zeroDec = ["XAF", "XOF", "RWF", "UGX", "JPY"].includes(cur);
  if (zeroDec) return Math.max(1, Math.round(raw));

  // Round to neat 2 decimal places (e.g. $12.50)
  return Math.max(0.5, Math.round(raw * 100) / 100);
}

/**
 * Formats a catalog price (stored in base XAF) into the target currency display string.
 */
export function formatCatalogPrice(
  baseXafPrice: number,
  targetCurrency: string,
  rates: ExchangeRate[] = [],
  baseCode = "EUR"
): string {
  const cur = (targetCurrency || "XAF").toUpperCase();
  const converted = convertCatalogPriceFromXaf(baseXafPrice, cur, rates, baseCode);
  if (cur === "XAF") {
    return `${converted.toLocaleString("fr-FR")} FCFA`;
  }
  if (cur === "XOF") {
    return `${converted.toLocaleString("fr-FR")} CFA`;
  }
  const zeroDec = ["RWF", "UGX", "JPY"].includes(cur);
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: cur,
      minimumFractionDigits: zeroDec ? 0 : 2,
      maximumFractionDigits: zeroDec ? 0 : 2,
    }).format(converted);
  } catch {
    return `${converted.toFixed(zeroDec ? 0 : 2)} ${cur}`;
  }
}

/**
 * Derive cross-pair rates from directly-defined pairs to/from the base currency.
 * Used by the Currency tab to display computed rates between non-base currencies.
 */
export interface DerivedRate {
  base_code: string;
  quote_code: string;
  bid: number;
  ask: number;
  mid: number;
  derived: true;
}

export function deriveCrossRates(
  baseCode: string,
  rates: ExchangeRate[]
): DerivedRate[] {
  const base = (baseCode || "EUR").toUpperCase();
  const active = rates.filter((r) => r.is_active);
  // Map: currency -> rate from base to that currency
  const fromBase = new Map<string, ExchangeRate>();
  for (const r of active) {
    if (r.base_code === base) fromBase.set(r.quote_code, r);
    else if (r.quote_code === base) {
      // synthesize base -> r.base_code
      fromBase.set(r.base_code, {
        ...r,
        base_code: base,
        quote_code: r.base_code,
        bid: r.ask > 0 ? 1 / r.ask : 0,
        ask: r.bid > 0 ? 1 / r.bid : 0,
        mid: r.mid > 0 ? 1 / r.mid : 0,
      });
    }
  }

  const codes = Array.from(fromBase.keys());
  const direct = new Set(active.map((r) => `${r.base_code}>${r.quote_code}`));
  const out: DerivedRate[] = [];
  for (const a of codes) {
    for (const b of codes) {
      if (a === b) continue;
      if (direct.has(`${a}>${b}`) || direct.has(`${b}>${a}`)) continue;
      const ra = fromBase.get(a)!;
      const rb = fromBase.get(b)!;
      if (!ra.bid || !rb.bid) continue;
      out.push({
        base_code: a,
        quote_code: b,
        bid: rb.bid / ra.ask,
        ask: rb.ask / ra.bid,
        mid: rb.mid / ra.mid,
        derived: true,
      });
    }
  }
  return out;
}
