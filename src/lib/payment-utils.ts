export type PaymentMethodId = 'mobile_money' | 'card' | 'wallet_pay' | 'bank_transfer';

export const CURRENCY_PRESETS: Record<string, number[]> = {
  XAF: [2000, 5000, 10000, 25000, 50000],
  XOF: [2000, 5000, 10000, 25000, 50000],
  USD: [10, 25, 50, 100, 250],
  CAD: [15, 25, 50, 100, 250],
  EUR: [10, 20, 50, 100, 200],
  GBP: [10, 20, 50, 100, 200],
};

export function isMomoCurrency(currency: string): boolean {
  const c = (currency || '').toUpperCase();
  return c === 'XAF' || c === 'XOF';
}

export function isWalletCurrency(currency: string): boolean {
  const c = (currency || '').toUpperCase();
  return ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'CHF'].includes(c);
}

/**
 * Pure client-safe Mobile Money detector supporting XAF (Cameroon MTN/Orange + Central Africa)
 * and XOF (Francophone West Africa).
 */
export function detectMomo(raw: string, currency = 'XAF'): {
  valid: boolean;
  local: string;
  international: string;
  network?: 'MTN' | 'ORANGE' | 'WAVE' | 'MOOV';
} {
  let d = (raw || '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  const cur = (currency || 'XAF').toUpperCase();

  if (cur === 'XAF') {
    if (d.startsWith('237') && d.length >= 12) d = d.slice(3);
    const p2 = d.slice(0, 2);
    const p3 = d.slice(0, 3);
    let network: 'MTN' | 'ORANGE' | undefined;
    if (p2 === '67' || p2 === '68' || ['650', '651', '652', '653', '654'].includes(p3)) {
      network = 'MTN';
    } else if (p2 === '69' || ['655', '656', '657', '658', '659'].includes(p3)) {
      network = 'ORANGE';
    }
    if (d.length === 9 && network) {
      return { valid: true, local: d, international: `237${d}`, network };
    }
    if ((d.startsWith('241') || d.startsWith('235') || d.startsWith('242')) && d.length >= 11) {
      return { valid: true, local: d.slice(3), international: d, network: 'MTN' };
    }
    return { valid: false, local: d, international: d.length === 9 ? `237${d}` : d, network };
  }

  if (cur === 'XOF') {
    const dials = ['225', '221', '226', '229', '228', '223'];
    for (const dial of dials) {
      if (d.startsWith(dial) && d.length >= 11) {
        return { valid: true, local: d.slice(3), international: d, network: 'MTN' };
      }
    }
    if (d.length >= 8 && d.length <= 10) {
      return { valid: true, local: d, international: `225${d}`, network: 'MTN' };
    }
  }

  return { valid: false, local: d, international: d };
}

export function formatMajorCurrency(amount: number, currency: string): string {
  const c = (currency || 'XAF').toUpperCase();
  const zeroDec = c === 'XAF' || c === 'XOF';
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: zeroDec ? 0 : 2,
  }).format(Number(amount) || 0);
  return `${formatted} ${c}`;
}
