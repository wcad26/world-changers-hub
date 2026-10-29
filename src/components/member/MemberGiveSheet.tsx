import { useEffect, useMemo, useRef, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  FileText,
  Gift,
  Globe2,
  Heart,
  Landmark,
  Loader2,
  LockKeyhole,
  MapPin,
  ShieldAlert,
  Smartphone,
  Sparkles,
  Wallet,
  XCircle,
} from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { PaymentReceiptDialog } from '@/components/payments/PaymentReceiptDialog';
import {
  startGiving,
  checkGiving,
  listGivingDestinations,
  continueCardGift,
  validateCardOtp,
} from '@/lib/giving.functions';
import {
  CURRENCY_PRESETS,
  detectMomo,
  formatMajorCurrency,
  getMomoPlaceholder,
  isMomoCurrency,
  isWalletCurrency,
  type PaymentMethodId,
} from '@/lib/payment-utils';
import { CardEntry, emptyCard, toCardPayload, validateCard, type CardValue } from './CardEntry';
import { cn } from '@/lib/utils';

type CardStep = {
  next: 'done' | 'pin' | 'avs' | 'otp' | 'redirect' | 'failed';
  flwRef?: string;
  link?: string;
  message?: string;
};

type Kind = 'tithe' | 'offering' | 'special';
type Method = PaymentMethodId;
type Stage = 'form' | 'waiting' | 'bank' | 'success' | 'failed';
type BankInfo = {
  accounts: {
    bank_name: string;
    account_name: string;
    account_number: string;
    swift?: string;
    branch?: string;
  }[];
  instructions: string;
};

const KINDS: { value: Kind; label: string; icon: typeof Heart }[] = [
  { value: 'tithe', label: 'Tithe', icon: Heart },
  { value: 'offering', label: 'Offering', icon: Gift },
  { value: 'special', label: 'Special', icon: Sparkles },
];

function CopyRow({ label, value }: { label: string; value: string }) {
  const [done, setDone] = useState(false);
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate font-semibold">{value}</p>
      </div>
      <Button
        variant="ghost"
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        }}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted text-foreground"
        aria-label={`Copy ${label}`}
      >
        {done ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}

export function MemberGiveSheet({
  open,
  onOpenChange,
  currency: homeCurrency,
  campaign,
  purchase,
  dcg,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  currency: string;
  campaign?: { id: string; name: string; regionId: string | null } | null;
  purchase?: { title: string; amount: number } | null;
  dcg?: { id: string; name: string; regionId: string } | null;
}) {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const start = useServerFn(startGiving);
  const check = useServerFn(checkGiving);
  const continueCard = useServerFn(continueCardGift);
  const validateOtp = useServerFn(validateCardOtp);
  const listDest = useServerFn(listGivingDestinations);
  const { data: dest } = useQuery({
    queryKey: ['giving_destinations'],
    queryFn: () => listDest(),
    enabled: open,
    staleTime: 2 * 60_000,
  });

  const [regionId, setRegionId] = useState<string>('');

  // Initialize default destination:
  // - Campaign with regionId === null -> strictly Head Office ('global')
  // - Campaign with regionId -> strictly that region
  // - DCG context -> parent region
  // - Otherwise -> member's home region
  useEffect(() => {
    if (!open || !dest) return;
    if (campaign) {
      setRegionId(campaign.regionId || 'global');
      return;
    }
    if (dcg?.regionId) {
      setRegionId(dcg.regionId);
      return;
    }
    if (!regionId) {
      setRegionId(dest.homeRegionId || dest.regions[0]?.id || 'global');
    }
  }, [open, dest, campaign, dcg?.regionId, regionId]);

  const activeTenant = useMemo(() => {
    if (!dest) return null;
    if (regionId === 'global') return dest.headOffice;
    return dest.regions.find((r) => r.id === regionId) ?? null;
  }, [dest, regionId]);

  const currency = (activeTenant?.currency || homeCurrency || 'XAF').toUpperCase();
  const presets = CURRENCY_PRESETS[currency] ?? CURRENCY_PRESETS.USD;

  // Strict Money Isolation: only surface methods genuinely active for this tenant
  const methods = useMemo<Method[]>(() => {
    if (!activeTenant) return [];
    const m: Method[] = [];
    if (activeTenant.onlineReady) {
      if (activeTenant.mobileMoney && isMomoCurrency(currency)) m.push('mobile_money');
      if (activeTenant.card) m.push('card');
      if (activeTenant.walletPay && isWalletCurrency(currency)) m.push('wallet_pay');
    }
    if (activeTenant.bank && activeTenant.bank.accounts?.length > 0) {
      m.push('bank_transfer');
    }
    return m;
  }, [activeTenant, currency]);

  const [kind, setKind] = useState<Kind>('tithe');
  const [amountText, setAmountText] = useState('');
  useEffect(() => {
    if (open && purchase) {
      setAmountText(String(purchase.amount));
      setKind('special');
    }
  }, [open, purchase?.amount]);

  const [method, setMethod] = useState<Method>('mobile_money');
  const [phone, setPhone] = useState('');

  const [stage, setStage] = useState<Stage>('form');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [network, setNetwork] = useState<string | null>(null);
  const [lastTxRef, setLastTxRef] = useState<string>('');
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [bank, setBank] = useState<{ ref: string; info: BankInfo; regionName: string } | null>(null);
  const [card, setCard] = useState<CardValue>(emptyCard);
  const [cardStep, setCardStep] = useState<CardStep | null>(null);
  const [cardRef, setCardRef] = useState<string | null>(null);
  const [authCode, setAuthCode] = useState('');
  const [avs, setAvs] = useState({ address: '', city: '', state: '', country: '', zipcode: '' });
  const alive = useRef(true);

  useEffect(() => {
    if (open) {
      setPhone((p) => p || (profile as any)?.phone || '');
    }
  }, [open, profile]);

  useEffect(() => {
    if (methods.length && !methods.includes(method)) {
      setMethod(methods[0]);
      setCardStep(null);
      setCardRef(null);
      setError('');
    }
  }, [methods, method]);

  useEffect(() => () => {
    alive.current = false;
  }, []);

  const amount = Number(amountText.replace(/[^\d.]/g, '')) || 0;
  const momoInfo = detectMomo(phone, currency);
  const detected = momoInfo.network;
  const fmt = (n: number) => formatMajorCurrency(n, currency);
  const isHome = !dest || regionId === dest.homeRegionId;

  const reset = () => {
    setStage('form');
    setError('');
    setBusy(false);
    setAmountText('');
    setBank(null);
    setCard(emptyCard);
    setCardStep(null);
    setCardRef(null);
    setAuthCode('');
  };

  const close = (o: boolean) => {
    if (!o) {
      alive.current = false;
      setTimeout(reset, 300);
    } else {
      alive.current = true;
    }
    onOpenChange(o);
  };

  const poll = async (txRef: string) => {
    setLastTxRef(txRef);
    const until = Date.now() + 4 * 60_000;
    while (alive.current && Date.now() < until) {
      await new Promise((r) => setTimeout(r, 5000));
      try {
        const r = await check({ data: { txRef } });
        if (r.status === 'successful') {
          setStage('success');
          qc.invalidateQueries({ queryKey: ['member_giving'] });
          qc.invalidateQueries({ queryKey: ['member-giving'] });
          qc.invalidateQueries({ queryKey: ['member-campaigns'] });
          return;
        }
        if (r.status === 'failed') {
          setError('The payment was declined or cancelled.');
          setStage('failed');
          return;
        }
      } catch {
        /* keep waiting */
      }
    }
    if (alive.current) {
      setError('We did not receive a confirmation in time. If you approved it, it will appear shortly.');
      setStage('failed');
    }
  };

  const handleCardStep = (txRef: string, step: CardStep) => {
    if (step.next === 'failed') {
      setError(step.message || 'Your card was declined.');
      setCardStep(null);
      setCardRef(null);
      return;
    }
    if (step.next === 'pin' || step.next === 'otp' || step.next === 'avs') {
      setCardRef(txRef);
      setCardStep(step);
      setAuthCode('');
      return;
    }
    setCard(emptyCard);
    setCardStep(null);
    setCardRef(null);
    if (step.next === 'redirect' && step.link) {
      window.location.assign(step.link);
      return;
    }
    setStage('waiting');
    poll(txRef);
  };

  const submitCard = async () => {
    if (cardRef && cardStep) {
      if (cardStep.next === 'otp') {
        if (authCode.length < 4) return setError('Enter the code you received.');
        await validateOtp({ data: { txRef: cardRef, flwRef: cardStep.flwRef || '', otp: authCode } });
        handleCardStep(cardRef, { next: 'done' });
        return;
      }
      const cardAuth =
        cardStep.next === 'pin'
          ? { mode: 'pin' as const, pin: authCode }
          : { mode: 'avs_noauth' as const, ...avs };
      if (cardStep.next === 'pin' && authCode.length < 4) return setError('Enter your card PIN.');
      const step = await continueCard({
        data: { txRef: cardRef, card: toCardPayload(card), cardAuth, origin: window.location.origin },
      });
      handleCardStep(cardRef, step as CardStep);
      return;
    }
    const res = await start({
      data: {
        kind,
        amount,
        method,
        regionId: regionId || undefined,
        dcgId: dcg?.id,
        campaignId: campaign?.id,
        purpose: purchase?.title,
        card: toCardPayload(card),
        origin: window.location.origin,
      },
    });
    handleCardStep(res.txRef, (res as any).card as CardStep);
  };

  const submit = async () => {
    setError('');
    if (amount <= 0) return setError('Please enter an amount.');
    if (!methods.length) {
      return setError(
        `Online payments are not yet activated for ${activeTenant?.name || 'this region'}. Please contact the regional finance team.`,
      );
    }
    if (method === 'mobile_money' && !momoInfo.valid) {
      return setError('Enter a valid Mobile Money phone number.');
    }
    if (method === 'bank_transfer' && (!activeTenant?.bank || !activeTenant.bank.accounts.length)) {
      return setError(`Bank deposits are not configured for ${activeTenant?.name || 'this region'} yet.`);
    }
    if (method === 'card' && !cardStep) {
      const msg = validateCard(card);
      if (msg) return setError(msg);
    }
    setBusy(true);
    alive.current = true;
    try {
      if (method === 'card') {
        await submitCard();
        return;
      }
      const res = await start({
        data: {
          kind,
          amount,
          method,
          regionId: regionId || undefined,
          dcgId: dcg?.id,
          campaignId: campaign?.id,
          purpose: purchase?.title,
          phone,
          origin: window.location.origin,
        },
      });
      if (method === 'bank_transfer' && res.bank) {
        setBank({ ref: res.txRef, info: res.bank as BankInfo, regionName: res.regionName });
        setStage('bank');
        return;
      }
      if (method === 'wallet_pay' && res.link) {
        window.location.assign(res.link);
        return;
      }
      setNetwork(res.network);
      if (res.link) window.open(res.link, '_blank', 'noopener');
      setStage('waiting');
      poll(res.txRef);
    } catch (e) {
      setError((e as Error).message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const methodCard = (m: Method) => {
    const meta = {
      mobile_money: {
        icon: Smartphone,
        title: 'Mobile Money',
        sub: currency === 'XOF' ? 'Wave · Orange · MTN' : 'MTN · Orange',
      },
      card: { icon: CreditCard, title: 'Card', sub: 'Visa · Mastercard' },
      wallet_pay: { icon: Wallet, title: 'Apple / Google Pay', sub: 'Express wallet' },
      bank_transfer: { icon: Landmark, title: 'Bank deposit', sub: 'Transfer · Deposit' },
    }[m];
    return (
      <Button
        key={m}
        type="button"
        variant="outline"
        aria-pressed={method === m}
        onClick={() => {
          setMethod(m);
          setError('');
        }}
        className={cn(
          'h-20 basis-[42%] shrink-0 snap-start flex-col items-start gap-1 whitespace-normal rounded-xl p-3 text-left transition-colors',
          method === m
            ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
            : 'border-border bg-background text-foreground',
        )}
      >
        <span className="flex w-full items-center justify-between">
          <meta.icon className="h-4 w-4" />
          {method === m && <Check className="h-3.5 w-3.5" />}
        </span>
        <span className="block text-sm font-semibold leading-tight">{meta.title}</span>
        <span
          className={cn(
            'block text-[11px] font-normal',
            method === m ? 'text-primary-foreground' : 'text-muted-foreground',
          )}
        >
          {meta.sub}
        </span>
      </Button>
    );
  };

  const destinationLocked = !!campaign || !!dcg;

  return (
    <Sheet open={open} onOpenChange={close}>
      <SheetContent
        side="bottom"
        className="max-h-[90vh] overflow-y-auto rounded-t-3xl border-border bg-card px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3 sm:mx-auto sm:max-w-lg sm:px-6 data-[state=open]:duration-300 data-[state=closed]:duration-200 ease-out"
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-muted" />
        <SheetHeader className="mb-4 text-left">
          <SheetTitle className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-sm">
              <Heart className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-base">
                {purchase ? 'Checkout' : campaign ? 'Support campaign' : dcg ? `Give · ${dcg.name}` : 'Give'}
              </span>
              <span className="block text-xs font-normal text-muted-foreground">
                Secure regional payment{activeTenant ? ` · ${activeTenant.name}` : ''}
              </span>
            </span>
          </SheetTitle>
          <SheetDescription className="sr-only">
            Choose what to give, how much and how to pay.
          </SheetDescription>
        </SheetHeader>

        {stage === 'form' && (
          <div className="space-y-5">
            {dest && !destinationLocked && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Giving to
                </p>
                <Select
                  value={regionId}
                  onValueChange={(v) => {
                    setRegionId(v);
                    setAmountText('');
                  }}
                >
                  <SelectTrigger className="h-12 rounded-2xl">
                    <span className="flex items-center gap-2">
                      {regionId === 'global' ? (
                        <Globe2 className="h-4 w-4 text-primary" />
                      ) : (
                        <MapPin className="h-4 w-4 text-primary" />
                      )}
                      <SelectValue />
                    </span>
                  </SelectTrigger>
                  <SelectContent className="z-[100]">
                    {dest.regions.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name} ({r.currency})
                        {r.id === dest.homeRegionId ? ' · my region' : ''}
                      </SelectItem>
                    ))}
                    <SelectItem value="global">
                      {dest.headOffice.name} ({dest.headOffice.currency}) · Global
                    </SelectItem>
                  </SelectContent>
                </Select>
                {!isHome && activeTenant && (
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    Routed directly to {activeTenant.name} ({currency}) with strict regional fund isolation.
                  </p>
                )}
              </div>
            )}

            {purchase ? (
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">Your order</p>
                  <p className="truncate font-heading font-semibold">{purchase.title}</p>
                </div>
                <p className="shrink-0 font-heading text-lg font-bold">{fmt(purchase.amount)}</p>
              </div>
            ) : campaign ? (
              <div className="rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                  Supporting {campaign.regionId ? activeTenant?.name : 'Global Campaign · Head Office'}
                </p>
                <p className="font-heading font-semibold leading-tight">{campaign.name}</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 rounded-full bg-muted p-1">
                {KINDS.map((k) => (
                  <Button
                    variant="ghost"
                    key={k.value}
                    type="button"
                    onClick={() => setKind(k.value)}
                    className={cn(
                      'flex items-center justify-center gap-1.5 rounded-full py-2 text-sm font-semibold transition-colors',
                      kind === k.value
                        ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:text-primary-foreground'
                        : 'text-muted-foreground',
                    )}
                  >
                    <k.icon className="h-4 w-4" />
                    {k.label}
                  </Button>
                ))}
              </div>
            )}

            {!purchase && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Amount</p>
                <div className="relative">
                  <Input
                    inputMode="decimal"
                    value={amountText}
                    onChange={(e) => setAmountText(e.target.value.replace(/[^\d.]/g, ''))}
                    placeholder="0"
                    className="h-14 rounded-2xl pr-16 font-heading text-2xl font-bold"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                    {currency}
                  </span>
                </div>
                <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
                  {presets.map((p) => (
                    <Button
                      variant="ghost"
                      key={p}
                      type="button"
                      onClick={() => setAmountText(String(p))}
                      className={cn(
                        'shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                        amount === p
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-foreground',
                      )}
                    >
                      {new Intl.NumberFormat('en-US').format(p)}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {activeTenant && !activeTenant.onlineReady && (
              <div className="flex items-start gap-2.5 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs">
                {activeTenant.bank ? (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                ) : (
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                )}
                <div>
                  <p className="font-semibold text-foreground">
                    Online payments are not yet activated for {activeTenant.name}.
                  </p>
                  <p className="mt-0.5 text-muted-foreground">
                    {activeTenant.bank
                      ? 'Please pay via Bank Deposit to the regional bank account below.'
                      : 'Please contact the regional finance team to complete your contribution.'}
                  </p>
                </div>
              </div>
            )}

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pay with</p>
              {methods.length ? (
                <div
                  role="group"
                  aria-label="Payment method"
                  className="no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1"
                >
                  {methods.map(methodCard)}
                </div>
              ) : (
                <p className="rounded-xl bg-muted px-3 py-2.5 text-sm text-muted-foreground">
                  No online gateway or bank account has been activated for {activeTenant?.name || 'this region'} yet.
                </p>
              )}
            </div>

            {method === 'mobile_money' && methods.includes('mobile_money') && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Mobile money number
                </p>
                <div className="relative">
                  <Input
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={getMomoPlaceholder(currency)}
                    className="h-12 rounded-2xl pr-24"
                  />
                  {detected && (
                    <span
                      className={cn(
                        'absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-2.5 py-1 text-[11px] font-bold',
                        detected === 'MTN'
                          ? 'bg-warning/20 text-foreground'
                          : 'bg-accent text-accent-foreground',
                      )}
                    >
                      {detected === 'ORANGE' ? 'Orange' : detected}
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  You'll get a prompt on this phone to approve with your PIN.
                </p>
              </div>
            )}

            {method === 'card' && methods.includes('card') && !cardStep && (
              <CardEntry value={card} onChange={setCard} />
            )}

            {method === 'card' && methods.includes('card') && cardStep && (
              <div className="space-y-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <LockKeyhole className="h-4 w-4 text-primary" />
                  {cardStep.next === 'pin'
                    ? 'Enter your card PIN'
                    : cardStep.next === 'otp'
                      ? 'Enter the verification code'
                      : 'Confirm your billing address'}
                </p>
                {cardStep.next === 'otp' && <p className="text-xs text-muted-foreground">{cardStep.message}</p>}
                {(cardStep.next === 'pin' || cardStep.next === 'otp') && (
                  <Input
                    inputMode="numeric"
                    type={cardStep.next === 'pin' ? 'password' : 'text'}
                    autoComplete="one-time-code"
                    value={authCode}
                    onChange={(e) =>
                      setAuthCode(e.target.value.replace(/\D/g, '').slice(0, cardStep.next === 'pin' ? 6 : 8))
                    }
                    placeholder={cardStep.next === 'pin' ? '••••' : '123456'}
                    className="h-12 rounded-2xl text-center font-mono text-xl tracking-[0.4em]"
                  />
                )}
                {cardStep.next === 'avs' && (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      className="col-span-2 h-11 rounded-xl"
                      placeholder="Street address"
                      value={avs.address}
                      onChange={(e) => setAvs({ ...avs, address: e.target.value })}
                    />
                    <Input
                      className="h-11 rounded-xl"
                      placeholder="City"
                      value={avs.city}
                      onChange={(e) => setAvs({ ...avs, city: e.target.value })}
                    />
                    <Input
                      className="h-11 rounded-xl"
                      placeholder="State / Province"
                      value={avs.state}
                      onChange={(e) => setAvs({ ...avs, state: e.target.value })}
                    />
                    <Input
                      className="h-11 rounded-xl"
                      placeholder="Country (e.g. US)"
                      maxLength={2}
                      value={avs.country}
                      onChange={(e) => setAvs({ ...avs, country: e.target.value.toUpperCase() })}
                    />
                    <Input
                      className="h-11 rounded-xl"
                      placeholder="Postal code"
                      value={avs.zipcode}
                      onChange={(e) => setAvs({ ...avs, zipcode: e.target.value })}
                    />
                  </div>
                )}
                <button
                  type="button"
                  className="text-xs font-semibold text-primary"
                  onClick={() => {
                    setCardStep(null);
                    setCardRef(null);
                    setAuthCode('');
                  }}
                >
                  Use a different card
                </button>
              </div>
            )}

            {method === 'wallet_pay' && methods.includes('wallet_pay') && (
              <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                You'll be redirected to {activeTenant?.name}'s secure Apple Pay / Google Pay checkout page.
              </div>
            )}

            {method === 'bank_transfer' && methods.includes('bank_transfer') && (
              <div className="space-y-3">
                {activeTenant?.bank?.accounts.length ? (
                  activeTenant.bank.accounts.map((a, i) => (
                    <div key={i} className="divide-y divide-border rounded-xl border border-border px-4">
                      <CopyRow label="Bank" value={a.bank_name} />
                      <CopyRow label="Account name" value={a.account_name} />
                      <CopyRow label="Account number / RIB" value={a.account_number} />
                      <CopyRow label="SWIFT / BIC" value={a.swift || ''} />
                      <CopyRow label="Branch" value={a.branch || ''} />
                    </div>
                  ))
                ) : (
                  <p className="rounded-xl bg-muted px-3 py-3 text-sm text-muted-foreground">
                    Bank details have not been added for this region yet.
                  </p>
                )}
                {activeTenant?.bank?.instructions && (
                  <p className="whitespace-pre-line text-sm text-muted-foreground">
                    {activeTenant.bank.instructions}
                  </p>
                )}
              </div>
            )}

            {error && (
              <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
            )}

            <Button
              variant="ghost"
              type="button"
              disabled={
                busy ||
                !methods.length ||
                (method === 'bank_transfer' && (!activeTenant?.bank || !activeTenant.bank.accounts.length))
              }
              onClick={submit}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-secondary font-semibold text-primary-foreground shadow-regal transition-transform active:scale-[0.98] disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : method === 'bank_transfer' ? (
                <Building2 className="h-4 w-4" />
              ) : (
                <Heart className="h-4 w-4" />
              )}
              {method === 'bank_transfer'
                ? 'Get deposit reference'
                : method === 'card'
                  ? cardStep
                    ? 'Confirm payment'
                    : amount > 0
                      ? `Pay ${fmt(amount)}`
                      : 'Pay'
                  : amount > 0
                    ? `Give ${fmt(amount)}`
                    : 'Give'}
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
            {bank.info.accounts.length ? (
              bank.info.accounts.map((a, i) => (
                <div key={i} className="divide-y divide-border rounded-2xl border border-border px-4">
                  <CopyRow label="Bank" value={a.bank_name} />
                  <CopyRow label="Account name" value={a.account_name} />
                  <CopyRow label="Account number / RIB" value={a.account_number} />
                  <CopyRow label="SWIFT / BIC" value={a.swift || ''} />
                  <CopyRow label="Branch" value={a.branch || ''} />
                </div>
              ))
            ) : (
              <p className="rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                Bank details will be shared by your region shortly. Keep your reference.
              </p>
            )}
            {bank.info.instructions && (
              <p className="whitespace-pre-line text-sm text-muted-foreground">{bank.info.instructions}</p>
            )}
            <p className="text-[12px] text-muted-foreground">
              Add the reference to your transfer. Your gift appears in your history once the regional finance team confirms it.
            </p>
            <Button
              variant="ghost"
              type="button"
              onClick={() => close(false)}
              className="h-12 w-full rounded-full bg-primary font-semibold text-primary-foreground"
            >
              I've made the transfer
            </Button>
          </div>
        )}

        {stage === 'waiting' && (
          <div className="flex flex-col items-center py-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 font-heading text-lg font-semibold">
              {method === 'mobile_money' ? 'Approve on your phone' : 'Complete payment'}
            </p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              {method === 'mobile_money'
                ? `A request for ${fmt(amount)} was sent to ${network === 'ORANGE' ? 'Orange' : 'MTN'} ${phone}. Enter your PIN to approve.`
                : 'Confirming your payment with the regional gateway. This updates automatically.'}
            </p>
          </div>
        )}

        {stage === 'success' && (
          <div className="flex flex-col items-center py-8 text-center">
            <CheckCircle2 className="h-14 w-14 text-success" />
            <p className="mt-4 font-heading text-lg font-semibold">Thank you!</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your {purchase ? 'order payment' : 'gift'} of {fmt(amount)} to {activeTenant?.name || 'WCA'} was received.
            </p>
            {lastTxRef && (
              <p className="mt-1 font-mono text-xs text-muted-foreground">Ref: {lastTxRef}</p>
            )}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
              <Button
                variant="outline"
                type="button"
                onClick={() => setReceiptOpen(true)}
                className="h-11 rounded-full gap-1.5 px-5 font-semibold"
              >
                <FileText className="h-4 w-4 text-primary" />
                View & Print Receipt
              </Button>
              <Button
                variant="ghost"
                type="button"
                onClick={() => close(false)}
                className="h-11 rounded-full bg-primary px-8 font-semibold text-primary-foreground"
              >
                Done
              </Button>
            </div>
            <PaymentReceiptDialog
              open={receiptOpen}
              onOpenChange={setReceiptOpen}
              txRef={lastTxRef}
              amount={amount}
              currency={currency}
              tenantName={activeTenant?.name || 'World Changers Army'}
              payerName={[(profile as any)?.last_name, (profile as any)?.first_name].filter(Boolean).join(' ') || undefined}
              payerEmail={(profile as any)?.email || undefined}
              paymentMethod={method}
              purpose={purchase?.title || campaign?.name || kind}
            />
          </div>
        )}

        {stage === 'failed' && (
          <div className="flex flex-col items-center py-8 text-center">
            <XCircle className="h-14 w-14 text-destructive" />
            <p className="mt-4 font-heading text-lg font-semibold">Payment not completed</p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">{error}</p>
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setStage('form');
                setError('');
              }}
              className="mt-6 h-11 rounded-full bg-primary px-8 font-semibold text-primary-foreground"
            >
              Try again
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
