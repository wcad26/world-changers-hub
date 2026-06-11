import { useMemo } from "react";
import { useExchangeRates } from "./useExchangeRates";
import { useBaseCurrencyCode } from "./useSystemSettings";
import { useCurrencies } from "./useCurrencies";
import { convert as fxConvert, type FxSide } from "@/utils/fx";

/**
 * useFxConverter — converter bound to the super admin base currency.
 * `convert(amount, fromCode)` returns the amount in base currency, or null if no FX path.
 */
export const useFxConverter = (side: FxSide = "mid") => {
  const { data: baseCode } = useBaseCurrencyCode();
  const { data: rates = [] } = useExchangeRates();
  const { data: currencies = [] } = useCurrencies();

  return useMemo(() => {
    const baseCurrency = currencies.find((c) => c.code === baseCode) || null;
    const convert = (amount: number, fromCode?: string | null): number | null => {
      if (!fromCode) return amount;
      return fxConvert(Number(amount) || 0, fromCode, baseCode, baseCode, rates, side);
    };
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

/**
 * useFxConverterFor — converter bound to an arbitrary target currency.
 * Falls back to base currency when `targetCode` is null/undefined/empty.
 */
export const useFxConverterFor = (targetCode?: string | null, side: FxSide = "mid") => {
  const { data: baseCode } = useBaseCurrencyCode();
  const { data: rates = [] } = useExchangeRates();
  const { data: currencies = [] } = useCurrencies();

  return useMemo(() => {
    const target = (targetCode && targetCode.length === 3 ? targetCode : baseCode) as string;
    const targetCurrency = currencies.find((c) => c.code === target) || null;
    const baseCurrency = currencies.find((c) => c.code === baseCode) || null;
    const convert = (amount: number, fromCode?: string | null): number | null => {
      if (!fromCode) return amount;
      if (!target) return null;
      return fxConvert(Number(amount) || 0, fromCode, target, baseCode, rates, side);
    };
    return { targetCode: target, targetCurrency, baseCode, baseCurrency, rates, convert };
  }, [targetCode, baseCode, rates, currencies, side]);
};
