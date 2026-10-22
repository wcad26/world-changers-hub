import { useEffect, useMemo, useRef, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Check, CheckCircle2, Copy, CreditCard, Gift, Heart, Landmark, Loader2, LockKeyhole, MapPin, Smartphone, Sparkles, XCircle } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { startGiving, checkGiving, detectMomo, listGivingDestinations } from '@/lib/giving.functions';
import { cn } from '@/lib/utils';

type Kind = 'tithe' | 'offering' | 'special';
type Method = 'mobile_money' | 'card' | 'bank_transfer';
type Stage = 'form' | 'waiting' | 'bank' | 'success' | 'failed';
type BankInfo = { accounts: { bank_name: string; account_name: string; account_number: string; swift?: string; branch?: string }[]; instructions: string };

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

function CopyRow({ label, value }: { label: string; value: string }) {
  const [done, setDone] = useState(false);
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate font-semibold">{value}</p>
      </div>
      <Button variant="ghost" type="button" onClick={() => { navigator.clipboard?.writeText(value); setDone(true); setTimeout(() => setDone(false), 1500); }} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted text-foreground" aria-label={`Copy ${label}`}>
        {done ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}

export function MemberGiveSheet({ open, onOpenChange, currency: homeCurrency }: { open: boolean; onOpenChange: (o: boolean) => void; currency: string }) {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const start = useServerFn(startGiving);
  const check = useServerFn(checkGiving);
  const listDest = useServerFn(listGivingDestinations);
  const { data: dest } = useQuery({ queryKey: ['giving_destinations'], queryFn: () => listDest(), enabled: open, staleTime: 5 * 60_000 });

  const [regionId, setRegionId] = useState<string>('');
  useEffect(() => { if (dest && !regionId) setRegionId(dest.homeRegionId || dest.regions[0]?.id || ''); }, [dest, regionId]);
  const region = useMemo(() => dest?.regions.find((r) => r.id === regionId), [dest, regionId]);
  const currency = region?.currency || homeCurrency;
  const presets = PRESETS[currency] ?? PRESETS.USD;
  const methods = useMemo(() => {
    const m: Method[] = [];
    if (!region || region.mobileMoney) { if (currency === 'XAF') m.push('mobile_money'); }
    if (!region || region.card) m.push('card');
    m.push('bank_transfer');
    return m;
  }, [region, currency]);

  const [kind, setKind] = useState<Kind>('tithe');
  const [amountText, setAmountText] = useState('');
  const [method, setMethod] = useState<Method>('mobile_money');
  const [phone, setPhone] = useState('');

  const [stage, setStage] = useState<Stage>('form');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [network, setNetwork] = useState<string | null>(null);
  const [bank, setBank] = useState<{ ref: string; info: BankInfo; regionName: string } | null>(null);
  const alive = useRef(true);

  useEffect(() => { if (open) { setPhone((p) => p || (profile as any)?.phone || ''); } }, [open, profile]);
  useEffect(() => { if (methods.length && !methods.includes(method)) setMethod(methods[0]); }, [methods, method]);
  useEffect(() => () => { alive.current = false; }, []);

  const amount = Number(amountText.replace(/[^\d.]/g, '')) || 0;
  const detected = detectMomo(phone).network;
  const fmt = (n: number) => `${new Intl.NumberFormat('en-US').format(n)} ${currency}`;
  const isHome = !dest || regionId === dest.homeRegionId;

  const reset = () => { setStage('form'); setError(''); setBusy(false); setAmountText(''); setBank(null); };
  const close = (o: boolean) => { if (!o) { alive.current = false; setTimeout(reset, 300); } else alive.current = true; onOpenChange(o); };

  const poll = async (txRef: string) => {
    const until = Date.now() + 4 * 60_000;
    while (alive.current && Date.now() < until) {
      await new Promise((r) => setTimeout(r, 5000));
      try {
        const r = await check({ data: { txRef } });
        if (r.status === 'successful') { setStage('success'); qc.invalidateQueries({ queryKey: ['member_giving'] }); return; }
        if (r.status === 'failed') { setError('The payment was declined or cancelled.'); setStage('failed'); return; }
      } catch { /* keep waiting */ }
    }
    if (alive.current) { setError('We did not receive a confirmation in time. If you approved it, it will appear shortly.'); setStage('failed'); }
  };

  const submit = async () => {
    setError('');
    if (amount <= 0) return setError('Please enter an amount.');
    if (!methods.length) return setError('This region is not accepting online gifts yet.');
    if (method === 'mobile_money' && !detected) return setError('Enter a valid MTN or Orange number.');
    if (method === 'bank_transfer' && !region?.bank) return setError('Bank deposits are not configured for this region yet.');
    const checkoutWindow = method === 'card' ? window.open('about:blank', '_blank') : null;
    if (checkoutWindow) checkoutWindow.opener = null;
    setBusy(true);
    alive.current = true;
    try {
      const res = await start({ data: { kind, amount, method, regionId: regionId || undefined, phone, origin: window.location.origin } });
      if (method === 'bank_transfer' && res.bank) {
        setBank({ ref: res.txRef, info: res.bank as BankInfo, regionName: res.regionName });
        setStage('bank');
        return;
      }
      setNetwork(res.network);
      if (res.link) {
        if (checkoutWindow) checkoutWindow.location.href = res.link;
        else if (method === 'card') window.location.assign(res.link);
        else window.open(res.link, '_blank', 'noopener');
      }
      setStage('waiting');
      poll(res.txRef);
    } catch (e) {
      checkoutWindow?.close();
      setError((e as Error).message || 'Something went wrong.');
    } finally { setBusy(false); }
  };

  const methodCard = (m: Method) => {
    const meta = {
      mobile_money: { icon: Smartphone, title: 'Mobile Money', sub: 'MTN · Orange' },
      card: { icon: CreditCard, title: 'Card', sub: 'Visa · Mastercard' },
      bank_transfer: { icon: Landmark, title: 'Bank deposit', sub: 'Transfer · Deposit' },
    }[m];
    return (
      <Button key={m} type="button" variant="outline" aria-pressed={method === m} onClick={() => { setMethod(m); setError(''); }} className={cn('h-20 basis-[42%] shrink-0 snap-start flex-col items-start gap-1 whitespace-normal rounded-xl p-3 text-left transition-colors', method === m ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : 'border-border bg-background text-foreground')}>
        <span className="flex w-full items-center justify-between"><meta.icon className="h-4 w-4" />{method === m && <Check className="h-3.5 w-3.5" />}</span>
        <span className="block text-sm font-semibold leading-tight">{meta.title}</span>
        <span className={cn('block text-[11px] font-normal', method === m ? 'text-primary-foreground' : 'text-muted-foreground')}>{meta.sub}</span>
      </Button>
    );
  };

  return (
    <Sheet open={open} onOpenChange={close}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-3xl border-border bg-card px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3 sm:mx-auto sm:max-w-lg sm:px-6 data-[state=open]:duration-300 data-[state=closed]:duration-200 ease-out">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-muted" />
        <SheetHeader className="mb-4 text-left">
          <SheetTitle className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-sm"><Heart className="h-5 w-5" /></span>
            <span><span className="block text-base">Give</span><span className="block text-xs font-normal text-muted-foreground">Secure giving</span></span>
          </SheetTitle>
          <SheetDescription className="sr-only">Choose what to give, how much and how to pay.</SheetDescription>
        </SheetHeader>

        {stage === 'form' && (
          <div className="space-y-5">
            {dest && dest.regions.length > 1 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Giving to</p>
                <Select value={regionId} onValueChange={(v) => { setRegionId(v); setAmountText(''); }}>
                  <SelectTrigger className="h-12 rounded-2xl"><span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /><SelectValue /></span></SelectTrigger>
                  <SelectContent className="z-[100]">
                    {dest.regions.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}{r.id === dest.homeRegionId ? ' (my region)' : ''}</SelectItem>)}
                  </SelectContent>
                </Select>
                {!isHome && <p className="mt-1.5 text-[11px] text-muted-foreground">Your gift goes straight to {region?.name}, in {currency}.</p>}
              </div>
            )}

            <div className="grid grid-cols-3 gap-1 rounded-full bg-muted p-1">
              {KINDS.map((k) => (
                <Button variant="ghost" key={k.value} type="button" onClick={() => setKind(k.value)} className={cn('flex items-center justify-center gap-1.5 rounded-full py-2 text-sm font-semibold transition-colors', kind === k.value ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground shadow-sm' : 'text-muted-foreground')}>
                  <k.icon className="h-4 w-4" />{k.label}
                </Button>
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
                  <Button variant="ghost" key={p} type="button" onClick={() => setAmountText(String(p))} className={cn('shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors', amount === p ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-foreground')}>
                    {new Intl.NumberFormat('en-US').format(p)}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pay with</p>
              {methods.length ? (
                <div role="group" aria-label="Payment method" className="no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1">{methods.map(methodCard)}</div>
              ) : (
                <p className="rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">This region is not accepting online gifts yet.</p>
              )}
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
            {method === 'card' && (
              <div className="space-y-3">
                <div className="relative aspect-[1.7/1] w-full max-w-xs overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-accent p-4 text-primary-foreground shadow-lg">
                  <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary-foreground/10" />
                  <div className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-primary-foreground/10" />
                  <div className="relative flex h-full flex-col justify-between">
                    <div className="flex items-center justify-between"><div className="h-7 w-10 rounded-md bg-primary-foreground/30" /><CreditCard className="h-5 w-5 opacity-80" /></div>
                    <p className="font-mono text-base tracking-[0.2em]">•••• •••• •••• ••••</p>
                    <div className="flex items-end justify-between text-[10px] uppercase opacity-80"><span>Card holder</span><span>MM/YY</span></div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2" aria-label="Supported cards">
                  {['VISA', 'Mastercard', 'Verve', 'AmEx'].map((b) => (
                    <span key={b} className="rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-bold tracking-wide text-foreground">{b}</span>
                  ))}
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><LockKeyhole className="h-4 w-4" /></span>
                  <div className="text-xs text-muted-foreground">
                    <p className="text-sm font-semibold text-foreground">256-bit encrypted · 3D Secure</p>
                    You'll enter your card on Flutterwave's PCI-certified secure page. Your card details are never stored by WCA.
                  </div>
                </div>
              </div>
            )}
            {method === 'bank_transfer' && (
              <div className="space-y-3">
                {region?.bankInfo?.accounts.length ? region.bankInfo.accounts.map((a, i) => (
                  <div key={i} className="divide-y divide-border rounded-xl border border-border px-4">
                    <CopyRow label="Bank" value={a.bank_name} />
                    <CopyRow label="Account name" value={a.account_name} />
                    <CopyRow label="Account number / RIB" value={a.account_number} />
                    <CopyRow label="SWIFT / BIC" value={a.swift || ''} />
                    <CopyRow label="Branch" value={a.branch || ''} />
                  </div>
                )) : <p className="rounded-xl bg-muted px-3 py-3 text-sm text-muted-foreground">Bank details have not been added for this region yet.</p>}
                {region?.bankInfo?.instructions && <p className="whitespace-pre-line text-sm text-muted-foreground">{region.bankInfo.instructions}</p>}
              </div>
            )}

            {error && <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

            <Button variant="ghost" type="button" disabled={busy || !methods.length || (method === 'bank_transfer' && (!region?.bank || !region.bankInfo?.accounts.length))} onClick={submit} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-secondary font-semibold text-primary-foreground shadow-regal transition-transform active:scale-[0.98] disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : method === 'bank_transfer' ? <Building2 className="h-4 w-4" /> : <Heart className="h-4 w-4" />}
              {method === 'bank_transfer' ? 'Get deposit reference' : method === 'card' ? 'Continue to secure card entry' : amount > 0 ? `Give ${fmt(amount)}` : 'Give'}
            </Button>
          </div>
        )}

        {stage === 'bank' && bank && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-gradient-to-br from-primary to-secondary p-4 text-primary-foreground">
              <p className="text-xs opacity-80">Transfer to {bank.regionName}</p>
              <p className="font-heading text-2xl font-bold">{fmt(amount)}</p>
            </div>
            <div className="rounded-2xl border border-border px-4">
              <CopyRow label="Payment reference" value={bank.ref} />
            </div>
            {bank.info.accounts.length ? bank.info.accounts.map((a, i) => (
              <div key={i} className="divide-y divide-border rounded-2xl border border-border px-4">
                <CopyRow label="Bank" value={a.bank_name} />
                <CopyRow label="Account name" value={a.account_name} />
                <CopyRow label="Account number / RIB" value={a.account_number} />
                <CopyRow label="SWIFT / BIC" value={a.swift || ''} />
                <CopyRow label="Branch" value={a.branch || ''} />
              </div>
            )) : <p className="rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">Bank details will be shared by your region shortly. Keep your reference.</p>}
            {bank.info.instructions && <p className="whitespace-pre-line text-sm text-muted-foreground">{bank.info.instructions}</p>}
            <p className="text-[12px] text-muted-foreground">Add the reference to your transfer. Your gift appears in your history once the region confirms it.</p>
            <Button variant="ghost" type="button" onClick={() => close(false)} className="h-12 w-full rounded-full bg-primary font-semibold text-primary-foreground">I've made the transfer</Button>
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
            <Button variant="ghost" type="button" onClick={() => close(false)} className="mt-6 h-11 rounded-full bg-primary px-8 font-semibold text-primary-foreground">Done</Button>
          </div>
        )}

        {stage === 'failed' && (
          <div className="flex flex-col items-center py-8 text-center">
            <XCircle className="h-14 w-14 text-destructive" />
            <p className="mt-4 font-heading text-lg font-semibold">Payment not completed</p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">{error}</p>
            <Button variant="ghost" type="button" onClick={() => { setStage('form'); setError(''); }} className="mt-6 h-11 rounded-full bg-primary px-8 font-semibold text-primary-foreground">Try again</Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
