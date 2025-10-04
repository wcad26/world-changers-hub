import type { Currency } from '@/hooks/useCurrencies';

/**
 * Format amount as currency string
 */
export const formatCurrency = (
  amount: number,
  currencyCode: string = 'USD',
  locale: string = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
  }).format(amount);
};

/**
 * Get currency symbol for a currency code
 */
export const getCurrencySymbol = (
  currencyCode: string,
  locale: string = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(0)
    .replace(/\d/g, '')
    .trim();
};

/**
 * Format currency with provided Currency object
 */
export const formatWithCurrency = (
  amount: number,
  currency?: Currency | null,
  locale: string = 'en-US'
): string => {
  if (!currency) {
    return formatCurrency(amount, 'USD', locale);
  }
  
  return formatCurrency(amount, currency.code, locale);
};
