import { useMemo } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useQuery } from '@tanstack/react-query';
import { listGivingDestinations } from '@/lib/giving.functions';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { useBaseCurrencyCode } from '@/hooks/useSystemSettings';
import { convertCatalogPriceFromXaf, formatCatalogPrice } from '@/utils/fx';

/**
 * Resolves the signed-in member's home region currency and provides FX helpers
 * that convert base XAF catalog prices to the member's regional currency using
 * Super Admin's exchange_rates (sell/ask spread) with safe fallback rates.
 */
export function useMemberStoreCurrency() {
  const listDest = useServerFn(listGivingDestinations);
  const { data: dest } = useQuery({
    queryKey: ['giving_destinations'],
    queryFn: () => listDest(),
    staleTime: 2 * 60_000,
  });
  const { data: rates = [] } = useExchangeRates();
  const { data: baseCode = 'EUR' } = useBaseCurrencyCode();

  const currency = useMemo(() => {
    if (!dest) return 'XAF';
    if (dest.homeRegionId) {
      const reg = dest.regions.find((r) => r.id === dest.homeRegionId);
      if (reg?.currency) return reg.currency.toUpperCase();
    }
    return (dest.headOffice?.currency || 'XAF').toUpperCase();
  }, [dest]);

  const fmt = (priceInXaf: number) =>
    formatCatalogPrice(priceInXaf, currency, rates, baseCode);

  const toRegionalMajor = (priceInXaf: number) =>
    convertCatalogPriceFromXaf(priceInXaf, currency, rates, baseCode);

  return { currency, fmt, toRegionalMajor, rates, baseCode };
}
