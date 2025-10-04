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
 * Get currency symbol directly from database Currency object
 */
export const getCurrencySymbol = (currency?: Currency | null): string => {
  if (!currency || !currency.symbol) {
    console.error('Currency or currency symbol not provided to getCurrencySymbol');
    return '';
  }
  return currency.symbol;
};

/**
 * Format currency with provided Currency object (uses database symbol)
 */
export const formatWithCurrency = (
  amount: number,
  currency?: Currency | null,
  locale: string = 'en-US'
): string => {
  if (!currency || !currency.symbol) {
    console.error('Currency not provided to formatWithCurrency');
    return amount.toLocaleString(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }
  
  const formattedNumber = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: currency.decimal_places || 2,
  }).format(amount);
  
  return `${currency.symbol} ${formattedNumber}`;
};

/**
 * Format currency with symbol only (uses database symbol directly)
 */
export const formatCurrencyWithSymbol = (
  amount: number,
  currency?: Currency | null,
  locale: string = 'en-US'
): string => {
  if (!currency || !currency.symbol) {
    console.error('Currency not provided to formatCurrencyWithSymbol');
    return amount.toLocaleString(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }
  
  const formattedNumber = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: currency.decimal_places || 2,
  }).format(amount);
  
  return `${currency.symbol} ${formattedNumber}`;
};
