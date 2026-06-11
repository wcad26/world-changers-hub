import { useMemo } from "react";
import { useExchangeRates } from "./useExchangeRates";
import { useBaseCurrencyCode } from "./useSystemSettings";
import { useCurrencies } from "./useCurrencies";
import { convert as fxConvert, type FxSide } from "@/utils/fx";

/**
 * useFxConverter — hook returning a converter bound to the super admin base currency.
 * `convert(amount, fromCode)` returns the amount in base currency, or null if no FX path.
 */
export const useFxConverter = (side: FxSide = "mid") => {
  const { data: baseCode } = useBaseCurrencyCode();
  const { data: rates = [] } = useExchangeRates();
  const { data: currencies = [] } = useCurrencies();

  return useMemo(() => {
    const baseCurrency = currencies.find((c) => c.code === baseCode) || null;
    const convert = (amount: number, fromCode?: string | null): number | null => {
      if (!fromCode) return amount; // unknown source — treat as already in base
      return fxConvert(Number(amount) || 0, fromCode, baseCode, baseCode, rates, side);
    };
    // Convert and coalesce nulls to 0 + count of unconverted rows
    const convertList = <T extends { amount: number | string; currency_code?: string | null }>(
      rows: T[]
    ): { rows: (T & { _converted: number; _unconverted: boolean })[]; unconverted: number } => {
      let unconverted = 0;
      const out = rows.map((r) => {
        const v = convert(Number(r.amount) || 0, r.currency_code);
        const ok = v != null;
        if (!ok) unconverted += 1;
        return { ...r, _converted: ok ? (v as number) : 0, _unconverted: !ok };
      });
      return { rows: out, unconverted };
    };
    return { baseCode, baseCurrency, rates, convert, convertList };
  }, [baseCode, rates, currencies, side]);
};
