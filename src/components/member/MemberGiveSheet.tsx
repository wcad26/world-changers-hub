import { useEffect, useRef, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, CreditCard, Gift, Heart, Loader2, Smartphone, Sparkles, XCircle } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { startGiving, checkGiving, detectMomo } from '@/lib/giving.functions';
import { cn } from '@/lib/utils';

type Kind = 'tithe' | 'offering' | 'special';
type Method = 'mobile_money' | 'card';
type Stage = 'form' | 'waiting' | 'success' | 'failed';

const KINDS: { value: Kind; label: string; icon: typeof Heart }[] = [
  { value: 'tithe', label: 'Tithe', icon: Heart },
  { value: 'offering', label: 'Offering', icon: Gift },
  { value: 'special', label: 'Special', icon: Sparkles },
];

const PRESETS: Record<string, number[]> = {
  XAF: [2000, 5000, 10000, 25000, 50000],
  EUR: [10, 20, 50, 100, 200],
  USD: [10, 20, 50, 100, 200],
};

export function MemberGiveSheet({ open, onOpenChange, currency }: { open: boolean; onOpenChange: (o: boolean) => void; currency: string }) {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const start = useServerFn(startGiving);
  const check = useServerFn(checkGiving);
  const isXaf = currency === 'XAF';
  const presets = PRESETS[currency] ?? PRESETS.USD;

  const [kind, setKind] = useState<Kind>('tithe');
  const [amountText, setAmountText] = useState('');
  const [method, setMethod] = useState<Method>(isXaf ? 'mobile_money' : 'card');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [stage, setStage] = useState<Stage>('form');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [network, setNetwork] = useState<string | null>(null);
  const alive = useRef(true);

  useEffect(() => { if (open) { setPhone((p) => p || (profile as any)?.phone || ''); } }, [open, profile]);
  useEffect(() => { setMethod(isXaf ? 'mobile_money' : 'card'); }, [isXaf]);
  useEffect(() => () => { alive.current = false; }, []);

  const amount = Number(amountText.replace(/[^\d.]/g, '')) || 0;
  const detected = detectMomo(phone).network;
  const fmt = (n: number) => `${new Intl.NumberFormat('en-US').format(n)} ${currency}`;

  const reset = () => { setStage('form'); setError(''); setBusy(false); setAmountText(''); setNote(''); };
  const close = (o: boolean) => { if (!o) { alive.current = false; setTimeout(reset, 300); } else alive.current = true; onOpenChange(o); };

  const poll = async (txRef: string) => {
    const until = Date.now() + 4 * 60_000;
    while (alive.current && Date.now() < until) {
      await new Promise((r) => setTimeout(r, 5000));
      try {
        const r = await check({ data: { txRef } });
        if (r.status === 'successful') { setStage('success'); qc.invalidateQueries({ queryKey: ['member_giving'] }); return; }
        if (r.status === 'failed') { setError('The payment was declined or cancelled.'); setStage('failed'); return; }
      } catch (e) { /* keep waiting */ }
    }
    if (alive.current) { setError('We did not receive a confirmation in time. If you approved it, it will appear shortly.'); setStage('failed'); }
  };

  const submit = async () => {
    setError('');
    if (amount <= 0) return setError('Please enter an amount.');
    if (method === 'mobile_money' && !detected) return setError('Enter a valid MTN or Orange number.');
    setBusy(true);
    alive.current = true;
    try {
      const res = await start({ data: { kind, amount, method, phone, note: note || undefined, origin: window.location.origin } });
      setNetwork(res.network);
      if (res.link) window.open(res.link, '_blank', 'noopener');
      setStage('waiting');
      poll(res.txRef);
    } catch (e) {
      setError((e as Error).message || 'Something went wrong.');
    } finally { setBusy(false); }
  };

  return (
    <Sheet open={open} onOpenChange={close}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-3xl border-border bg-card px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3 sm:mx-auto sm:max-w-lg sm:px-6 data-[state=open]:duration-300 data-[state=closed]:duration-200 ease-out">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-muted" />
        <SheetHeader className="mb-4 text-left">
          <SheetTitle className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-sm"><Heart className="h-5 w-5" /></span>
            <span><span className="block text-base">Give</span><span className="block text-xs font-normal text-muted-foreground">Secure online giving</span></span>
          </SheetTitle>
          <SheetDescription className="sr-only">Choose what to give, how much and how to pay.</SheetDescription>
        </SheetHeader>

        {stage === 'form' && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-1 rounded-full bg-muted p-1">
              {KINDS.map((k) => (
                <button key={k.value} type="button" onClick={() => setKind(k.value)} className={cn('flex items-center justify-center gap-1.5 rounded-full py-2 text-sm font-semibold transition-colors', kind === k.value ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground')}>
                  <k.icon className="h-4 w-4" />{k.label}
                </button>
              ))}
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Amount</p>
              <div className="relative">
                <Input inputMode="numeric" value={amountText} onChange={(e) => setAmountText(e.target.value.replace(/[^\d.]/g, ''))} placeholder="0" className="h-14 rounded-2xl pr-16 font-heading text-2xl font-bold" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">{currency}</span>
              </div>
              <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
                {presets.map((p) => (
                  <button key={p} type="button" onClick={() => setAmountText(String(p))} className={cn('shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors', amount === p ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-foreground')}>
                    {new Intl.NumberFormat('en-US').format(p)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pay with</p>
              <div className="grid grid-cols-2 gap-2">
                {isXaf && (
                  <button type="button" onClick={() => setMethod('mobile_money')} className={cn('flex items-center gap-2 rounded-2xl border p-3 text-left transition-colors', method === 'mobile_money' ? 'border-primary bg-primary/5' : 'border-border')}>
                    <Smartphone className="h-5 w-5 text-primary" /><span><span className="block text-sm font-semibold">Mobile Money</span><span className="block text-[11px] text-muted-foreground">MTN · Orange</span></span>
                  </button>
                )}
                <button type="button" onClick={() => setMethod('card')} className={cn('flex items-center gap-2 rounded-2xl border p-3 text-left transition-colors', method === 'card' ? 'border-primary bg-primary/5' : 'border-border', !isXaf && 'col-span-2')}>
                  <CreditCard className="h-5 w-5 text-primary" /><span><span className="block text-sm font-semibold">Card</span><span className="block text-[11px] text-muted-foreground">Visa · Mastercard</span></span>
                </button>
              </div>
            </div>

            {method === 'mobile_money' && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mobile money number</p>
                <div className="relative">
                  <Input inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="6XX XXX XXX" className="h-12 rounded-2xl pr-24" />
                  {detected && <span className={cn('absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-2.5 py-1 text-[11px] font-bold', detected === 'MTN' ? 'bg-warning/20 text-foreground' : 'bg-accent text-accent-foreground')}>{detected === 'MTN' ? 'MTN' : 'Orange'}</span>}
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">You'll get a prompt on this phone to approve with your PIN.</p>
              </div>
            )}

            <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="Note (optional)" className="h-11 rounded-2xl" />

            {error && <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

            <button type="button" disabled={busy} onClick={submit} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-secondary font-semibold text-primary-foreground shadow-regal transition-transform active:scale-[0.98] disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
              {amount > 0 ? `Give ${fmt(amount)}` : 'Give'}
            </button>
          </div>
        )}

        {stage === 'waiting' && (
          <div className="flex flex-col items-center py-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 font-heading text-lg font-semibold">{method === 'mobile_money' ? 'Approve on your phone' : 'Complete payment'}</p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              {method === 'mobile_money' ? `A request for ${fmt(amount)} was sent to ${network === 'ORANGE' ? 'Orange' : 'MTN'} ${phone}. Enter your PIN to approve.` : 'Finish paying in the window that opened. This updates automatically.'}
            </p>
          </div>
        )}

        {stage === 'success' && (
          <div className="flex flex-col items-center py-8 text-center">
            <CheckCircle2 className="h-14 w-14 text-success" />
            <p className="mt-4 font-heading text-lg font-semibold">Thank you!</p>
            <p className="mt-1 text-sm text-muted-foreground">Your gift of {fmt(amount)} was received.</p>
            <button type="button" onClick={() => close(false)} className="mt-6 h-11 rounded-full bg-primary px-8 font-semibold text-primary-foreground">Done</button>
          </div>
        )}

        {stage === 'failed' && (
          <div className="flex flex-col items-center py-8 text-center">
            <XCircle className="h-14 w-14 text-destructive" />
            <p className="mt-4 font-heading text-lg font-semibold">Payment not completed</p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">{error}</p>
            <button type="button" onClick={() => { setStage('form'); setError(''); }} className="mt-6 h-11 rounded-full bg-primary px-8 font-semibold text-primary-foreground">Try again</button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
