import { CreditCard, LockKeyhole, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type CardValue = { number: string; expiry: string; cvv: string; holder: string };
export const emptyCard: CardValue = { number: '', expiry: '', cvv: '', holder: '' };

type Brand = 'visa' | 'mastercard' | 'verve' | 'amex' | null;
const BRANDS: { id: Exclude<Brand, null>; label: string }[] = [
  { id: 'visa', label: 'VISA' }, { id: 'mastercard', label: 'Mastercard' }, { id: 'verve', label: 'Verve' }, { id: 'amex', label: 'AmEx' },
];

export function detectBrand(n: string): Brand {
  if (/^3[47]/.test(n)) return 'amex';
  if (/^(506[01]|507[89]|6500)/.test(n)) return 'verve';
  if (/^(5[1-5]|2[2-7])/.test(n)) return 'mastercard';
  if (/^4/.test(n)) return 'visa';
  return null;
}

export function luhn(n: string) {
  let sum = 0, alt = false;
  for (let i = n.length - 1; i >= 0; i--) {
    let d = Number(n[i]);
    if (alt) { d *= 2; if (d > 9) d -= 9; }
    sum += d; alt = !alt;
  }
  return n.length >= 12 && sum % 10 === 0;
}

/** Returns an error message, or null when the card is ready to charge. */
export function validateCard(c: CardValue): string | null {
  const n = c.number.replace(/\D/g, '');
  if (!luhn(n)) return 'Please check your card number.';
  const [mm, yy] = c.expiry.split('/');
  const m = Number(mm), y = Number(yy);
  if (!m || m > 12 || !yy || yy.length !== 2) return 'Enter the expiry date as MM/YY.';
  const now = new Date(); const cy = now.getFullYear() % 100;
  if (y < cy || (y === cy && m < now.getMonth() + 1)) return 'This card has expired.';
  const need = detectBrand(n) === 'amex' ? 4 : 3;
  if (c.cvv.length !== need) return `Enter the ${need}-digit security code.`;
  return null;
}

export function toCardPayload(c: CardValue) {
  const [mm, yy] = c.expiry.split('/');
  return { number: c.number.replace(/\D/g, ''), cvv: c.cvv, expiry_month: mm.padStart(2, '0'), expiry_year: yy };
}

export function CardEntry({ value, onChange }: { value: CardValue; onChange: (v: CardValue) => void }) {
  const digits = value.number.replace(/\D/g, '');
  const brand = detectBrand(digits);
  const max = brand === 'amex' ? 15 : 19;
  const pretty = brand === 'amex'
    ? digits.replace(/^(\d{0,4})(\d{0,6})(\d{0,5}).*/, (_, a, b, c) => [a, b, c].filter(Boolean).join(' '))
    : digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  const shown = (digits + '•'.repeat(Math.max(0, (brand === 'amex' ? 15 : 16) - digits.length))).replace(brand === 'amex' ? /^(.{4})(.{6})(.*)$/ : /(.{4})(?=.)/g, brand === 'amex' ? '$1 $2 $3' : '$1 ');
  const numberOk = digits.length >= 12 && luhn(digits);
  const set = (k: keyof CardValue, v: string) => onChange({ ...value, [k]: v });

  const onExpiry = (raw: string) => {
    let d = raw.replace(/\D/g, '').slice(0, 4);
    if (d.length === 1 && Number(d) > 1) d = `0${d}`;
    set('expiry', d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
  };

  return (
    <div className="space-y-3">
      <div className="relative mx-auto aspect-[1.7/1] w-full max-w-[300px] overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-secondary p-4 text-primary-foreground shadow-regal">
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary-foreground/10" />
        <div className="pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-primary-foreground/10" />
        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="h-7 w-10 rounded-md bg-gradient-to-br from-warning/80 to-warning/40" />
            <span className="text-sm font-black italic tracking-wide">{brand ? BRANDS.find((b) => b.id === brand)!.label : <CreditCard className="h-5 w-5 opacity-80" />}</span>
          </div>
          <p className="font-mono text-[17px] tracking-[0.14em]">{shown}</p>
          <div className="flex items-end justify-between gap-3 text-[11px] uppercase">
            <span className="truncate opacity-90">{value.holder || 'Card holder'}</span>
            <span className="shrink-0 font-mono opacity-90">{value.expiry || 'MM/YY'}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5" aria-label="Supported cards">
        {BRANDS.map((b) => (
          <span key={b.id} className={cn('rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wide transition-all', brand === b.id ? 'border-primary bg-primary text-primary-foreground' : brand ? 'border-border text-muted-foreground opacity-50' : 'border-border bg-background text-foreground')}>{b.label}</span>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-background focus-within:border-primary">
        <div className="relative border-b border-border">
          <Input inputMode="numeric" autoComplete="cc-number" aria-label="Card number" placeholder="1234 1234 1234 1234" value={pretty}
            onChange={(e) => set('number', e.target.value.replace(/\D/g, '').slice(0, max))}
            className="h-12 rounded-none border-0 pr-10 font-mono text-base shadow-none focus-visible:ring-0" />
          {numberOk && <ShieldCheck className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-success" />}
        </div>
        <div className="grid grid-cols-2">
          <Input inputMode="numeric" autoComplete="cc-exp" aria-label="Expiry date" placeholder="MM/YY" value={value.expiry} onChange={(e) => onExpiry(e.target.value)}
            className="h-12 rounded-none border-0 border-r border-border font-mono shadow-none focus-visible:ring-0" />
          <Input inputMode="numeric" autoComplete="cc-csc" aria-label="Security code" type="password" placeholder={brand === 'amex' ? 'CVV (4)' : 'CVV'} value={value.cvv}
            onChange={(e) => set('cvv', e.target.value.replace(/\D/g, '').slice(0, brand === 'amex' ? 4 : 3))}
            className="h-12 rounded-none border-0 font-mono shadow-none focus-visible:ring-0" />
        </div>
        <Input autoComplete="cc-name" aria-label="Name on card" placeholder="Name on card" value={value.holder} onChange={(e) => set('holder', e.target.value.slice(0, 60))}
          className="h-12 rounded-none border-0 border-t border-border shadow-none focus-visible:ring-0" />
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 p-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-success text-success-foreground"><LockKeyhole className="h-4 w-4" /></span>
        <div className="text-xs text-muted-foreground">
          <p className="text-sm font-semibold text-foreground">Secure encrypted payment</p>
          Card details are encrypted and sent straight to our payment processor. They are never stored.
        </div>
      </div>
    </div>
  );
}
