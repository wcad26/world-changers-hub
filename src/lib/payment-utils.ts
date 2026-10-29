export type PaymentMethodId = 'mobile_money' | 'card' | 'wallet_pay' | 'bank_transfer';

export const CURRENCY_PRESETS: Record<string, number[]> = {
  XAF: [2000, 5000, 10000, 25000, 50000],
  XOF: [2000, 5000, 10000, 25000, 50000],
  GHS: [50, 100, 250, 500, 1000],
  KES: [500, 1000, 2500, 5000, 10000],
  RWF: [5000, 10000, 25000, 50000, 100000],
  UGX: [20000, 50000, 100000, 250000, 500000],
  USD: [10, 25, 50, 100, 250],
  CAD: [15, 25, 50, 100, 250],
  EUR: [10, 20, 50, 100, 200],
  GBP: [10, 20, 50, 100, 200],
};

export function isMomoCurrency(currency: string): boolean {
  const c = (currency || '').toUpperCase();
  return ['XAF', 'XOF', 'GHS', 'KES', 'RWF', 'UGX'].includes(c);
}

export function isWalletCurrency(currency: string): boolean {
  const c = (currency || '').toUpperCase();
  return ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'CHF'].includes(c);
}

export type MomoNetwork =
  | 'MTN'
  | 'ORANGE'
  | 'VODAFONE'
  | 'AIRTELTIGO'
  | 'MPESA'
  | 'AIRTEL'
  | 'WAVE'
  | 'MOOV';

/**
 * Pure client-safe Mobile Money detector supporting:
 * - XAF (Cameroon MTN/Orange + CEMAC)
 * - XOF (Francophone West Africa UEMOA)
 * - GHS (Ghana MTN, Telecel/Vodafone, AirtelTigo)
 * - KES (Kenya Safaricom M-Pesa, Airtel Money)
 * - RWF (Rwanda MTN, Airtel)
 * - UGX (Uganda MTN, Airtel)
 */
export function detectMomo(raw: string, currency = 'XAF'): {
  valid: boolean;
  local: string;
  international: string;
  country?: string;
  flwChargeType?:
    | 'mobile_money_franco'
    | 'mobile_money_ghana'
    | 'mpesa'
    | 'mobile_money_rwanda'
    | 'mobile_money_uganda';
  network?: MomoNetwork;
} {
  let d = (raw || '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  const cur = (currency || 'XAF').toUpperCase();

  // 1. Central Africa (XAF - Cameroon + CEMAC)
  if (cur === 'XAF') {
    if (d.startsWith('237') && d.length >= 12) d = d.slice(3);
    const p2 = d.slice(0, 2);
    const p3 = d.slice(0, 3);
    let network: MomoNetwork | undefined;
    if (p2 === '67' || p2 === '68' || ['650', '651', '652', '653', '654'].includes(p3)) {
      network = 'MTN';
    } else if (p2 === '69' || ['655', '656', '657', '658', '659'].includes(p3)) {
      network = 'ORANGE';
    }
    if (d.length === 9 && network) {
      return {
        valid: true,
        local: d,
        international: `237${d}`,
        country: 'CM',
        flwChargeType: 'mobile_money_franco',
        network,
      };
    }
    if ((d.startsWith('241') || d.startsWith('235') || d.startsWith('242')) && d.length >= 11) {
      return {
        valid: true,
        local: d.slice(3),
        international: d,
        country: 'CM',
        flwChargeType: 'mobile_money_franco',
        network: 'MTN',
      };
    }
    return {
      valid: false,
      local: d,
      international: d.length === 9 ? `237${d}` : d,
      country: 'CM',
      flwChargeType: 'mobile_money_franco',
      network,
    };
  }

  // 2. Francophone West Africa (XOF - Côte d'Ivoire, Senegal, Burkina Faso, Benin, Togo, Mali)
  if (cur === 'XOF') {
    const dialMap: Record<string, string> = {
      '225': 'CI',
      '221': 'SN',
      '226': 'BF',
      '229': 'BJ',
      '228': 'TG',
      '223': 'ML',
    };
    for (const [dial, country] of Object.entries(dialMap)) {
      if (d.startsWith(dial) && d.length >= 11) {
        return {
          valid: true,
          local: d.slice(3),
          international: d,
          country,
          flwChargeType: 'mobile_money_franco',
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
        flwChargeType: 'mobile_money_franco',
        network: 'MTN',
      };
    }
    return { valid: false, local: d, international: d, country: 'CI', flwChargeType: 'mobile_money_franco' };
  }

  // 3. Ghana (GHS - +233: MTN, Vodafone/Telecel, AirtelTigo)
  if (cur === 'GHS') {
    if (d.startsWith('233') && d.length >= 12) d = d.slice(3);
    if (d.startsWith('0') && d.length === 10) d = d.slice(1);
    const p2 = d.slice(0, 2);
    let network: MomoNetwork = 'MTN';
    if (['24', '54', '55', '59', '25', '53'].includes(p2)) {
      network = 'MTN';
    } else if (['20', '50'].includes(p2)) {
      network = 'VODAFONE';
    } else if (['26', '27', '56', '57'].includes(p2)) {
      network = 'AIRTELTIGO';
    }
    if (d.length === 9) {
      return {
        valid: true,
        local: `0${d}`,
        international: `233${d}`,
        country: 'GH',
        flwChargeType: 'mobile_money_ghana',
        network,
      };
    }
    return {
      valid: false,
      local: d,
      international: d,
      country: 'GH',
      flwChargeType: 'mobile_money_ghana',
      network,
    };
  }

  // 4. Kenya (KES - +254: Safaricom M-Pesa, Airtel Money)
  if (cur === 'KES') {
    if (d.startsWith('254') && d.length >= 12) d = d.slice(3);
    if (d.startsWith('0') && d.length === 10) d = d.slice(1);
    const p2 = d.slice(0, 2);
    const network: MomoNetwork = ['73', '75', '78', '10'].includes(p2) ? 'AIRTEL' : 'MPESA';
    if (d.length === 9 && (d.startsWith('7') || d.startsWith('1'))) {
      return {
        valid: true,
        local: `0${d}`,
        international: `254${d}`,
        country: 'KE',
        flwChargeType: 'mpesa',
        network,
      };
    }
    return {
      valid: false,
      local: d,
      international: d,
      country: 'KE',
      flwChargeType: 'mpesa',
      network: 'MPESA',
    };
  }

  // 5. Rwanda (RWF - +250: MTN, Airtel)
  if (cur === 'RWF') {
    if (d.startsWith('250') && d.length >= 12) d = d.slice(3);
    if (d.startsWith('0') && d.length === 10) d = d.slice(1);
    const p2 = d.slice(0, 2);
    const network: MomoNetwork = ['72', '73'].includes(p2) ? 'AIRTEL' : 'MTN';
    if (d.length === 9 && d.startsWith('7')) {
      return {
        valid: true,
        local: `0${d}`,
        international: `250${d}`,
        country: 'RW',
        flwChargeType: 'mobile_money_rwanda',
        network,
      };
    }
    return {
      valid: false,
      local: d,
      international: d,
      country: 'RW',
      flwChargeType: 'mobile_money_rwanda',
      network: 'MTN',
    };
  }

  // 6. Uganda (UGX - +256: MTN, Airtel)
  if (cur === 'UGX') {
    if (d.startsWith('256') && d.length >= 12) d = d.slice(3);
    if (d.startsWith('0') && d.length === 10) d = d.slice(1);
    const p2 = d.slice(0, 2);
    const network: MomoNetwork = ['70', '74', '75'].includes(p2) ? 'AIRTEL' : 'MTN';
    if (d.length === 9 && d.startsWith('7')) {
      return {
        valid: true,
        local: `0${d}`,
        international: `256${d}`,
        country: 'UG',
        flwChargeType: 'mobile_money_uganda',
        network,
      };
    }
    return {
      valid: false,
      local: d,
      international: d,
      country: 'UG',
      flwChargeType: 'mobile_money_uganda',
      network: 'MTN',
    };
  }

  return { valid: false, local: d, international: d };
}

export function getMomoPlaceholder(currency: string): string {
  const c = (currency || 'XAF').toUpperCase();
  switch (c) {
    case 'GHS':
      return 'e.g. 024 123 4567 (MTN / Telecel / AirtelTigo)';
    case 'KES':
      return 'e.g. 0712 345 678 (M-Pesa)';
    case 'RWF':
      return 'e.g. 078 123 4567 (MTN / Airtel)';
    case 'UGX':
      return 'e.g. 077 123 4567 (MTN / Airtel)';
    case 'XOF':
      return 'e.g. +225 07 12 34 56 78';
    default:
      return 'e.g. 677 12 34 56 (MTN / Orange)';
  }
}

export function formatMajorCurrency(amount: number, currency: string): string {
  const c = (currency || 'XAF').toUpperCase();
  const zeroDec = ['XAF', 'XOF', 'RWF', 'UGX', 'JPY'].includes(c);
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: zeroDec ? 0 : 2,
  }).format(Number(amount) || 0);
  return `${formatted} ${c}`;
}
