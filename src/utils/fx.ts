// FX conversion utility for super admin financial reporting.
// Rates are admin-defined pairs (base -> quote) with bid/ask spreads.
// Conversion side semantics:
//   "mid" — average of bid/ask (default for reporting)
//   "bid" — rate at which the market buys quote (selling base)
//   "ask" — rate at which the market sells quote (buying base)

export interface ExchangeRate {
  id: string;
  base_code: string;
  quote_code: string;
  bid: number;
  ask: number;
  mid: number;
  is_active: boolean;
}

export type FxSide = "mid" | "bid" | "ask";

const pick = (r: ExchangeRate, side: FxSide): number => {
  if (side === "bid") return Number(r.bid);
  if (side === "ask") return Number(r.ask);
  return Number(r.mid ?? (Number(r.bid) + Number(r.ask)) / 2);
};

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
  const base = baseCode.toUpperCase();
  if (from === to) return amount;

  const active = rates.filter((r) => r.is_active);

  // Direct
  const direct = active.find((r) => r.base_code === from && r.quote_code === to);
  if (direct) return amount * pick(direct, side);

  // Reverse
  const reverse = active.find((r) => r.base_code === to && r.quote_code === from);
  if (reverse) {
    const rate = pick(reverse, side);
    if (rate > 0) return amount / rate;
  }

  // Via base
  if (from !== base && to !== base) {
    const toBase = convert(amount, from, base, base, active, side);
    if (toBase == null) return null;
    return convert(toBase, base, to, base, active, side);
  }

  return null;
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
  const base = baseCode.toUpperCase();
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
