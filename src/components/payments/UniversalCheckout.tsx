import { useEffect, useMemo, useRef, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import {
  AlertTriangle,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Landmark,
  Loader2,
  LockKeyhole,
  ShieldAlert,
  Smartphone,
  Wallet,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CardEntry, emptyCard, toCardPayload, validateCard, type CardValue } from '@/components/member/CardEntry';
import {
  continueUniversalCard,
  startUniversalCheckout,
  validateUniversalOtp,
  verifyUniversalPayment,
} from '@/lib/giving.functions';
import {
  detectMomo,
  formatMajorCurrency,
  isMomoCurrency,
  isWalletCurrency,
  type PaymentMethodId,
} from '@/lib/payment-utils';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';

export type PublicTenantCapability = {
  id: string;
  code?: string;
  name: string;
  currency: string;
  onlineReady: boolean;
  usingCentralFallback?: boolean;
  mobileMoney: boolean;
  card: boolean;
  walletPay: boolean;
  bank: {
    accounts: {
      bank_name: string;
      account_name: string;
      account_number: string;
      swift?: string;
      branch?: string;
    }[];
    instructions: string;
  } | null;
};

type CardStep = {
  next: 'done' | 'pin' | 'avs' | 'otp' | 'redirect' | 'failed';
  flwRef?: string;
  link?: string;
  message?: string;
};

type Stage = 'form' | 'waiting' | 'bank' | 'success' | 'failed';

export interface UniversalCheckoutProps {
  context: 'public_giving' | 'campaign_donation' | 'event_fee';
  amount: number;
  currency: string;
  tenant: PublicTenantCapability | null;
  kind?: 'tithe' | 'offering' | 'special';
  regionId?: string;
  dcgId?: string;
  campaignId?: string;
  eventId?: string;
  preRegistrationIds?: string[];
  groupId?: string | null;
  payer?: {
    anonymous?: boolean;
    name?: string;
    familyName?: string;
    otherNames?: string;
    email?: string;
    phone?: string;
    purpose?: string;
  };
  redirectPath?: string;
  allowPayLater?: boolean;
  payLaterLabel?: string;
  onSkipOrPayAtDesk?: () => void;
  onBeforeStart?: () => string | null;
  onSuccess?: (result: { txRef: string; method: PaymentMethodId; isBankPending?: boolean }) => void;
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [done, setDone] = useState(false);
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate font-semibold text-foreground">{value}</p>
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
        {done ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}

export function UniversalCheckout({
  context,
  amount,
  currency,
  tenant,
  kind = 'offering',
  regionId,
  dcgId,
  campaignId,
  eventId,
  preRegistrationIds,
  groupId,
  payer,
  redirectPath,
  allowPayLater = false,
  payLaterLabel,
  onSkipOrPayAtDesk,
  onBeforeStart,
  onSuccess,
}: UniversalCheckoutProps) {
  const { language } = useLanguage();
  const isFr = language === 'fr';

  const startFn = useServerFn(startUniversalCheckout);
  const continueCardFn = useServerFn(continueUniversalCard);
  const validateOtpFn = useServerFn(validateUniversalOtp);
  const verifyFn = useServerFn(verifyUniversalPayment);

  const cur = (currency || tenant?.currency || 'XAF').toUpperCase();

  const methods = useMemo<PaymentMethodId[]>(() => {
    if (!tenant) return [];
    const list: PaymentMethodId[] = [];
    if (tenant.onlineReady) {
      if (tenant.mobileMoney && isMomoCurrency(cur)) list.push('mobile_money');
      if (tenant.card) list.push('card');
      if (tenant.walletPay && isWalletCurrency(cur)) list.push('wallet_pay');
    }
    if (tenant.bank && tenant.bank.accounts?.length > 0) {
      list.push('bank_transfer');
    }
    return list;
  }, [tenant, cur]);

  const [method, setMethod] = useState<PaymentMethodId>('card');
  const [phone, setPhone] = useState(payer?.phone || '');
  const [card, setCard] = useState<CardValue>(emptyCard);
  const [cardStep, setCardStep] = useState<CardStep | null>(null);
  const [cardRef, setCardRef] = useState<string | null>(null);
  const [authCode, setAuthCode] = useState('');
  const [avs, setAvs] = useState({ address: '', city: '', state: '', country: '', zipcode: '' });

  const [stage, setStage] = useState<Stage>('form');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [network, setNetwork] = useState<string | null>(null);
  const [activeRef, setActiveRef] = useState<string>('');
  const [bankState, setBankState] = useState<{
    ref: string;
    info: NonNullable<PublicTenantCapability['bank']>;
    regionName: string;
    amount: number;
  } | null>(null);

  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    if (payer?.phone && !phone) setPhone(payer.phone);
  }, [payer?.phone, phone]);

  useEffect(() => {
    if (methods.length > 0 && !methods.includes(method)) {
      setMethod(methods[0]);
      setCardStep(null);
      setCardRef(null);
      setError('');
    }
  }, [methods, method]);

  const pollVerification = async (txRef: string, chosenMethod: PaymentMethodId) => {
    setActiveRef(txRef);
    const until = Date.now() + 4 * 60_000;
    while (alive.current && Date.now() < until) {
      await new Promise((r) => setTimeout(r, 4000));
      try {
        const res = await verifyFn({ data: { txRef } });
        if (res.status === 'successful') {
          if (!alive.current) return;
          setStage('success');
          onSuccess?.({ txRef, method: chosenMethod });
          return;
        }
        if (res.status === 'failed') {
          if (!alive.current) return;
          setError(
            isFr
              ? 'Le paiement a été refusé ou annulé.'
              : 'The payment was declined or cancelled.',
          );
          setStage('failed');
          return;
        }
      } catch {
        // Keep polling until confirmation or timeout
      }
    }
    if (alive.current) {
      setError(
        isFr
          ? 'Confirmation en attente. Si vous avez validé le paiement, notre système le confirmera automatiquement.'
          : 'Confirmation timed out. If you approved the payment, our webhook will confirm it automatically shortly.',
      );
      setStage('failed');
    }
  };

  // Auto-verify if returning from 3D Secure / Apple Pay / Google Pay redirect (?tx_ref=...)
  const checkedRedirectRef = useRef(false);
  useEffect(() => {
    if (checkedRedirectRef.current || typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const txRefParam = params.get('tx_ref');
    const statusParam = params.get('status');
    if (txRefParam && txRefParam.length >= 6) {
      checkedRedirectRef.current = true;
      if (statusParam === 'cancelled') {
        setError(isFr ? 'Paiement annulé.' : 'Payment was cancelled.');
        setStage('failed');
        return;
      }
      setStage('waiting');
      pollVerification(txRefParam, 'card');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const momoCheck = detectMomo(phone, cur);

  const handleCardStep = (txRef: string, step: CardStep) => {
    if (step.next === 'failed') {
      setError(step.message || (isFr ? 'Votre carte a été refusée.' : 'Your card was declined.'));
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
    pollVerification(txRef, 'card');
  };

  const handleSubmit = async () => {
    setError('');
    if (onBeforeStart) {
      const validationMsg = onBeforeStart();
      if (validationMsg) {
        setError(validationMsg);
        return;
      }
    }
    if (context !== 'event_fee' && (!amount || amount <= 0)) {
      setError(isFr ? 'Veuillez saisir un montant valide.' : 'Please enter a valid amount.');
      return;
    }
    if (!tenant || methods.length === 0) {
      setError(
        isFr
          ? "Les paiements en ligne ne sont pas encore activés pour cette région."
          : 'Online payments are not yet activated for this region.',
      );
      return;
    }
    if (method === 'mobile_money' && !momoCheck.valid) {
      setError(
        isFr
          ? 'Veuillez saisir un numéro Mobile Money valide.'
          : 'Please enter a valid Mobile Money phone number.',
      );
      return;
    }
    if (method === 'card' && !cardStep) {
      const cardErr = validateCard(card);
      if (cardErr) {
        setError(cardErr);
        return;
      }
    }

    setBusy(true);
    try {
      const resolvedRedirectPath =
        redirectPath || (typeof window !== 'undefined' ? window.location.pathname : '/');
      const payerName =
        payer?.name ||
        [payer?.familyName, payer?.otherNames].filter(Boolean).join(' ') ||
        card.holder ||
        undefined;

      if (method === 'card' && cardRef && cardStep) {
        if (cardStep.next === 'otp') {
          if (authCode.length < 4) {
            setError(isFr ? 'Veuillez saisir le code reçu.' : 'Enter the verification code you received.');
            return;
          }
          await validateOtpFn({
            data: { txRef: cardRef, flwRef: cardStep.flwRef || '', otp: authCode },
          });
          handleCardStep(cardRef, { next: 'done' });
          return;
        }
        if (cardStep.next === 'pin' && authCode.length < 4) {
          setError(isFr ? 'Veuillez saisir le code PIN de votre carte.' : 'Enter your card PIN.');
          return;
        }
        const cardAuth =
          cardStep.next === 'pin'
            ? { mode: 'pin' as const, pin: authCode }
            : { mode: 'avs_noauth' as const, ...avs };
        const step = await continueCardFn({
          data: {
            txRef: cardRef,
            card: toCardPayload(card),
            cardAuth,
            email: payer?.email,
            name: payerName,
            origin: window.location.origin,
            redirectPath: resolvedRedirectPath,
          },
        });
        handleCardStep(cardRef, step as CardStep);
        return;
      }

      const res = await startFn({
        data: {
          context,
          method,
          amount,
          kind,
          regionId,
          dcgId,
          campaignId,
          eventId,
          preRegistrationIds,
          groupId,
          anonymous: payer?.anonymous,
          name: payerName,
          familyName: payer?.familyName,
          otherNames: payer?.otherNames,
          email: payer?.email,
          phone: method === 'mobile_money' ? phone : payer?.phone || phone,
          purpose: payer?.purpose,
          card: method === 'card' ? toCardPayload(card) : undefined,
          origin: window.location.origin,
          redirectPath: resolvedRedirectPath,
        },
      });

      if ((res as any).alreadyPaid) {
        setStage('success');
        onSuccess?.({ txRef: res.txRef || 'ALREADY-PAID', method });
        return;
      }

      if (method === 'bank_transfer' && res.bank) {
        setBankState({
          ref: res.txRef,
          info: res.bank as NonNullable<PublicTenantCapability['bank']>,
          regionName: res.regionName,
          amount: (res as any).amount ?? amount,
        });
        setStage('bank');
        return;
      }

      if (method === 'card' && (res as any).card) {
        handleCardStep(res.txRef, (res as any).card as CardStep);
        return;
      }

      if (method === 'wallet_pay' && res.link) {
        window.location.assign(res.link);
        return;
      }

      setNetwork(res.network ?? null);
      if (res.link) window.open(res.link, '_blank', 'noopener');
      setStage('waiting');
      pollVerification(res.txRef, method);
    } catch (e: any) {
      setError(e?.message || (isFr ? 'Une erreur est survenue.' : 'Something went wrong.'));
    } finally {
      setBusy(false);
    }
  };

  if (!tenant) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
        <span className="text-sm">{isFr ? 'Chargement des options de paiement…' : 'Loading payment options…'}</span>
      </div>
    );
  }

  // Strict Money Isolation: Unconfigured Region with NO bank accounts either
  if (!tenant.onlineReady && (!tenant.bank || !tenant.bank.accounts?.length)) {
    return (
      <div className="space-y-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-foreground">
              {isFr
                ? `Paiements en ligne non encore activés pour ${tenant.name}`
                : `Online payments are not yet activated for ${tenant.name}`}
            </p>
            <p className="text-muted-foreground">
              {isFr
                ? "Pour garantir l'isolation stricte des fonds régionaux, aucun paiement n'est redirigé vers un autre compte. Veuillez contacter l'équipe financière régionale."
                : 'To guarantee strict regional fund isolation, payments are never diverted to another account. Please contact the regional finance team.'}
            </p>
          </div>
        </div>
        {allowPayLater && onSkipOrPayAtDesk && (
          <Button type="button" variant="outline" onClick={onSkipOrPayAtDesk} className="w-full rounded-xl">
            {payLaterLabel ||
              (isFr
                ? "Régler sur place au bureau d'accueil de l'événement"
                : 'Pay at the event registration desk instead')}
          </Button>
        )}
      </div>
    );
  }

  if (stage === 'waiting') {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-border/60 bg-card/60 px-6 py-10 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 font-heading text-lg font-semibold">
          {method === 'mobile_money'
            ? isFr
              ? 'Validez sur votre téléphone'
              : 'Approve on your phone'
            : isFr
              ? 'Confirmation du paiement en cours…'
              : 'Confirming your payment…'}
        </p>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          {method === 'mobile_money'
            ? isFr
              ? `Une demande de ${formatMajorCurrency(amount, cur)} a été envoyée au numéro ${network === 'ORANGE' ? 'Orange Money' : 'MTN MoMo'} ${phone}. Entrez votre code PIN pour confirmer.`
              : `A payment prompt for ${formatMajorCurrency(amount, cur)} was sent to ${network === 'ORANGE' ? 'Orange Money' : 'MTN MoMo'} (${phone}). Enter your PIN to approve.`
            : isFr
              ? 'Vérification sécurisée auprès de la passerelle régionale. Cette page se met à jour automatiquement.'
              : 'Verifying securely with the regional gateway. This page updates automatically.'}
        </p>
        {activeRef && (
          <p className="mt-3 font-mono text-xs text-muted-foreground">Ref: {activeRef}</p>
        )}
      </div>
    );
  }

  if (stage === 'bank' && bankState) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-gradient-to-br from-primary to-secondary p-5 text-primary-foreground shadow-sm">
          <p className="text-xs uppercase tracking-wider opacity-85">
            {isFr ? `Virement / Dépôt vers ${bankState.regionName}` : `Bank Transfer to ${bankState.regionName}`}
          </p>
          <p className="mt-1 font-heading text-2xl font-bold">
            {formatMajorCurrency(bankState.amount, cur)}
          </p>
        </div>

        <div className="rounded-2xl border border-primary/30 bg-primary/5 px-4">
          <CopyRow
            label={isFr ? 'Référence de paiement (obligatoire)' : 'Payment Reference (include in narration)'}
            value={bankState.ref}
          />
        </div>

        {bankState.info.accounts.map((acc, idx) => (
          <div key={idx} className="divide-y divide-border rounded-2xl border border-border bg-background/80 px-4">
            <CopyRow label={isFr ? 'Banque' : 'Bank'} value={acc.bank_name} />
            <CopyRow label={isFr ? 'Intitulé du compte' : 'Account Name'} value={acc.account_name} />
            <CopyRow label={isFr ? 'Numéro de compte / IBAN / RIB' : 'Account Number / IBAN / RIB'} value={acc.account_number} />
            <CopyRow label="SWIFT / BIC" value={acc.swift || ''} />
            <CopyRow label={isFr ? 'Agence' : 'Branch'} value={acc.branch || ''} />
          </div>
        ))}

        {bankState.info.instructions && (
          <p className="whitespace-pre-line rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
            {bankState.info.instructions}
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          {isFr
            ? "Mentionnez la référence ci-dessus lors de votre dépôt ou virement. L'équipe financière régionale validera votre reçu dès réception."
            : 'Include the reference above in your bank transfer narration. The regional finance team will confirm your payment once received.'}
        </p>

        <Button
          type="button"
          onClick={() => {
            setStage('success');
            onSuccess?.({ txRef: bankState.ref, method: 'bank_transfer', isBankPending: true });
          }}
          className="h-12 w-full rounded-xl bg-primary font-semibold text-primary-foreground"
        >
          {isFr ? "J'ai noté les coordonnées / effectué le virement" : "I've saved the bank details / made the transfer"}
        </Button>
      </div>
    );
  }

  if (stage === 'success') {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-emerald-500/30 bg-emerald-500/5 px-6 py-8 text-center">
        <CheckCircle2 className="h-14 w-14 text-emerald-500" />
        <p className="mt-3 font-heading text-lg font-semibold">
          {bankState
            ? isFr
              ? 'Référence de dépôt enregistrée'
              : 'Bank deposit reference recorded'
            : isFr
              ? 'Paiement confirmé !'
              : 'Payment confirmed!'}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatMajorCurrency(amount, cur)} · {tenant.name}
        </p>
      </div>
    );
  }

  if (stage === 'failed') {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-8 text-center">
        <XCircle className="h-12 w-12 text-destructive" />
        <p className="mt-3 font-heading text-base font-semibold">
          {isFr ? 'Paiement non finalisé' : 'Payment not completed'}
        </p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{error}</p>
        <Button
          type="button"
          onClick={() => {
            setStage('form');
            setError('');
          }}
          className="mt-5 rounded-xl"
        >
          {isFr ? 'Réessayer' : 'Try again'}
        </Button>
      </div>
    );
  }

  const renderMethodButton = (m: PaymentMethodId) => {
    const meta = {
      mobile_money: {
        icon: Smartphone,
        title: 'Mobile Money',
        sub: cur === 'XOF' ? 'Wave · Orange · MTN' : 'MTN · Orange',
      },
      card: {
        icon: CreditCard,
        title: isFr ? 'Carte bancaire' : 'Card',
        sub: 'Visa · Mastercard · Amex',
      },
      wallet_pay: {
        icon: Wallet,
        title: 'Apple / Google Pay',
        sub: isFr ? 'Portefeuille rapide' : 'Express checkout',
      },
      bank_transfer: {
        icon: Landmark,
        title: isFr ? 'Dépôt bancaire' : 'Bank Deposit',
        sub: isFr ? 'Virement · Versement' : 'Transfer · Wire',
      },
    }[m];
    const selected = method === m;
    return (
      <button
        key={m}
        type="button"
        onClick={() => {
          setMethod(m);
          setError('');
          setCardStep(null);
          setCardRef(null);
        }}
        className={cn(
          'flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all',
          selected
            ? 'border-primary bg-primary text-primary-foreground shadow-sm'
            : 'border-border bg-background/80 text-foreground hover:border-primary/50',
        )}
      >
        <span className="flex w-full items-center justify-between">
          <meta.icon className="h-4 w-4" />
          {selected && <Check className="h-3.5 w-3.5" />}
        </span>
        <span className="text-sm font-semibold leading-tight">{meta.title}</span>
        <span
          className={cn(
            'text-[11px]',
            selected ? 'text-primary-foreground/85' : 'text-muted-foreground',
          )}
        >
          {meta.sub}
        </span>
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {!tenant.onlineReady && tenant.bank && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div className="text-foreground">
            <span className="font-semibold">
              {isFr
                ? `Les paiements par carte / Mobile Money ne sont pas encore activés pour ${tenant.name}. `
                : `Online Card & Mobile Money payments are not yet activated for ${tenant.name}. `}
            </span>
            <span className="text-muted-foreground">
              {isFr
                ? 'Veuillez régler par dépôt ou virement bancaire sur le compte régional ci-dessous.'
                : 'Please pay via Bank Deposit directly to the regional account below.'}
            </span>
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {isFr ? 'Mode de paiement' : 'Payment method'} · {tenant.name}
        </p>
        <div
          className={cn(
            'grid gap-2',
            methods.length >= 3 ? 'grid-cols-2 sm:grid-cols-3' : methods.length === 2 ? 'grid-cols-2' : 'grid-cols-1',
          )}
        >
          {methods.map(renderMethodButton)}
        </div>
      </div>

      {method === 'mobile_money' && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {isFr ? 'Numéro Mobile Money' : 'Mobile Money number'}
          </p>
          <div className="relative">
            <Input
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={cur === 'XOF' ? '+225 XX XX XX XX' : '6XX XXX XXX'}
              className="h-12 rounded-xl pr-24"
            />
            {momoCheck.network && (
              <span
                className={cn(
                  'absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-2.5 py-1 text-[11px] font-bold',
                  momoCheck.network === 'MTN'
                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                    : 'bg-orange-500/20 text-orange-700 dark:text-orange-300',
                )}
              >
                {momoCheck.network === 'ORANGE' ? 'Orange' : momoCheck.network}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            {isFr
              ? 'Vous recevrez une notification sur ce téléphone pour valider avec votre code PIN.'
              : 'You will receive a push prompt on this phone to approve with your PIN.'}
          </p>
        </div>
      )}

      {method === 'card' && !cardStep && <CardEntry value={card} onChange={setCard} />}

      {method === 'card' && cardStep && (
        <div className="space-y-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <LockKeyhole className="h-4 w-4 text-primary" />
            {cardStep.next === 'pin'
              ? isFr
                ? 'Saisissez le code PIN de votre carte'
                : 'Enter your card PIN'
              : cardStep.next === 'otp'
                ? isFr
                  ? 'Saisissez le code de vérification'
                  : 'Enter the verification code'
                : isFr
                  ? 'Confirmez votre adresse de facturation'
                  : 'Confirm your billing address'}
          </p>
          {cardStep.next === 'otp' && cardStep.message && (
            <p className="text-xs text-muted-foreground">{cardStep.message}</p>
          )}
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
              className="h-12 rounded-xl text-center font-mono text-xl tracking-[0.4em]"
            />
          )}
          {cardStep.next === 'avs' && (
            <div className="grid grid-cols-2 gap-2">
              <Input
                className="col-span-2 h-11 rounded-xl"
                placeholder={isFr ? 'Adresse postale' : 'Street address'}
                value={avs.address}
                onChange={(e) => setAvs({ ...avs, address: e.target.value })}
              />
              <Input
                className="h-11 rounded-xl"
                placeholder={isFr ? 'Ville' : 'City'}
                value={avs.city}
                onChange={(e) => setAvs({ ...avs, city: e.target.value })}
              />
              <Input
                className="h-11 rounded-xl"
                placeholder={isFr ? 'État / Province' : 'State / Province'}
                value={avs.state}
                onChange={(e) => setAvs({ ...avs, state: e.target.value })}
              />
              <Input
                className="h-11 rounded-xl"
                placeholder={isFr ? 'Pays (ex: US, CA, FR)' : 'Country (e.g. US, CA, GB)'}
                maxLength={2}
                value={avs.country}
                onChange={(e) => setAvs({ ...avs, country: e.target.value.toUpperCase() })}
              />
              <Input
                className="h-11 rounded-xl"
                placeholder={isFr ? 'Code postal' : 'Postal / ZIP code'}
                value={avs.zipcode}
                onChange={(e) => setAvs({ ...avs, zipcode: e.target.value })}
              />
            </div>
          )}
          <button
            type="button"
            className="text-xs font-semibold text-primary hover:underline"
            onClick={() => {
              setCardStep(null);
              setCardRef(null);
              setAuthCode('');
            }}
          >
            {isFr ? 'Utiliser une autre carte' : 'Use a different card'}
          </button>
        </div>
      )}

      {method === 'wallet_pay' && (
        <div className="rounded-xl border border-border bg-muted/40 p-3.5 text-xs text-muted-foreground">
          {isFr
            ? 'Vous serez redirigé vers la page sécurisée Apple Pay / Google Pay de cette région pour valider en un clic.'
            : 'You will be redirected to this region’s secure Apple Pay / Google Pay checkout page to authorize in one tap.'}
        </div>
      )}

      {method === 'bank_transfer' && tenant.bank && (
        <div className="space-y-2.5 rounded-2xl border border-border bg-muted/30 p-3.5">
          <p className="text-xs font-medium text-muted-foreground">
            {isFr
              ? 'Cliquez ci-dessous pour générer votre référence unique et afficher les coordonnées bancaires officielles de la région.'
              : 'Click below to generate your unique deposit reference and view the official regional bank account details.'}
          </p>
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="space-y-2.5 pt-1">
        <Button
          type="button"
          disabled={busy || methods.length === 0}
          onClick={handleSubmit}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary font-semibold text-primary-foreground shadow-sm hover:opacity-95"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : method === 'bank_transfer' ? (
            <Building2 className="h-4 w-4" />
          ) : (
            <LockKeyhole className="h-4 w-4" />
          )}
          {method === 'bank_transfer'
            ? isFr
              ? 'Obtenir la référence de dépôt bancaire'
              : 'Get bank deposit reference'
            : cardStep
              ? isFr
                ? 'Confirmer le paiement'
                : 'Confirm payment'
              : amount > 0
                ? `${isFr ? 'Payer' : 'Pay'} ${formatMajorCurrency(amount, cur)}`
                : isFr
                  ? 'Payer maintenant'
                  : 'Pay now'}
        </Button>

        {allowPayLater && onSkipOrPayAtDesk && (
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={onSkipOrPayAtDesk}
            className="w-full rounded-xl text-xs text-muted-foreground hover:text-foreground"
          >
            {payLaterLabel ||
              (isFr
                ? "Régler plus tard au bureau d'accueil de l'événement"
                : 'Pay later at the event registration desk')}
          </Button>
        )}
      </div>
    </div>
  );
}
