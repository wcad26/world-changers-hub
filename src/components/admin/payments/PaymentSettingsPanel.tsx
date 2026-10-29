import { useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  KeyRound,
  Landmark,
  Loader2,
  Plus,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
  Wallet,
  Webhook,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { GlassSection, GlassSectionHeader } from '@/components/ui/GlassSection';
import {
  getPaymentSettings,
  savePaymentSettings,
  testPaymentGatewayConnection,
} from '@/lib/payment-settings.functions';
import { isMomoCurrency, isWalletCurrency } from '@/lib/payment-utils';
import { cn } from '@/lib/utils';

type Bank = {
  bank_name: string;
  account_name: string;
  account_number: string;
  swift: string;
  branch: string;
};
const emptyBank: Bank = {
  bank_name: '',
  account_name: '',
  account_number: '',
  swift: '',
  branch: '',
};

function makeClientWebhookSecret() {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return `wca_wh_${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
}

/** Edits one isolated payment tenant: a WCA region UUID, 'global' (Head Office), or 'wcbn:WCBN-GEN'. */
export default function PaymentSettingsPanel({ scope, label }: { scope: string; label: string }) {
  const qc = useQueryClient();
  const load = useServerFn(getPaymentSettings);
  const save = useServerFn(savePaymentSettings);
  const testConn = useServerFn(testPaymentGatewayConnection);

  const { data, isLoading, error } = useQuery({
    queryKey: ['payment_settings', scope],
    queryFn: () => load({ data: { scope } }),
  });

  const [form, setForm] = useState({
    flutterwave_enabled: false,
    flutterwave_mode: 'live' as 'test' | 'live',
    flutterwave_public_key: '',
    secret_key: '',
    encryption_key: '',
    webhook_secret_hash: '',
    allow_central_fallback: false,
    mobile_money_enabled: true,
    card_enabled: true,
    wallet_pay_enabled: false,
    bank_transfer_enabled: false,
    bank_instructions: '',
  });
  const [banks, setBanks] = useState<Bank[]>([]);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [showHash, setShowHash] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    setForm({
      flutterwave_enabled: data.flutterwave_enabled,
      flutterwave_mode: data.flutterwave_mode,
      flutterwave_public_key: data.flutterwave_public_key,
      secret_key: '',
      encryption_key: '',
      webhook_secret_hash: data.webhook_secret_hash || '',
      allow_central_fallback: data.allow_central_fallback,
      mobile_money_enabled: data.mobile_money_enabled,
      card_enabled: data.card_enabled,
      wallet_pay_enabled: data.wallet_pay_enabled,
      bank_transfer_enabled: data.bank_transfer_enabled,
      bank_instructions: data.bank_instructions,
    });
    setBanks(data.bank_accounts.map((b) => ({ ...emptyBank, ...b })));
    setTestResult(null);
  }, [data]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const copyText = async (key: string, value: string, labelText: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedField(key);
    toast.success(`${labelText} copied to clipboard`);
    setTimeout(() => setCopiedField((prev) => (prev === key ? null : prev)), 2000);
  };

  const onTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testConn({
        data: {
          scope,
          mode: form.flutterwave_mode,
          secret_key: form.secret_key.trim() || undefined,
        },
      });
      setTestResult({ ok: true, message: res.message });
      toast.success(res.message);
      qc.invalidateQueries({ queryKey: ['payment_settings', scope] });
      qc.invalidateQueries({ queryKey: ['payment_gateway_status'] });
    } catch (e) {
      const msg = (e as Error).message || 'Connection test failed';
      setTestResult({ ok: false, message: msg });
      toast.error(msg);
    } finally {
      setTesting(false);
    }
  };

  const onSave = async () => {
    setSaving(true);
    try {
      await save({
        data: {
          scope,
          primary_currency: data?.primary_currency,
          allow_central_fallback: form.allow_central_fallback,
          flutterwave_enabled: form.flutterwave_enabled,
          flutterwave_mode: form.flutterwave_mode,
          flutterwave_public_key: form.flutterwave_public_key,
          secret_key: form.secret_key || undefined,
          encryption_key: form.encryption_key || undefined,
          webhook_secret_hash: form.webhook_secret_hash || undefined,
          mobile_money_enabled: form.mobile_money_enabled,
          card_enabled: form.card_enabled,
          wallet_pay_enabled: form.wallet_pay_enabled,
          bank_transfer_enabled: form.bank_transfer_enabled,
          bank_accounts: banks,
          bank_instructions: form.bank_instructions,
        },
      });
      setForm((f) => ({ ...f, secret_key: '', encryption_key: '' }));
      toast.success(`Payment gateway settings saved for ${label}`);
      qc.invalidateQueries({ queryKey: ['payment_settings'] });
      qc.invalidateQueries({ queryKey: ['payment_gateway_status'] });
      qc.invalidateQueries({ queryKey: ['giving_destinations'] });
      qc.invalidateQueries({ queryKey: ['public_giving_destinations'] });
    } catch (e) {
      toast.error((e as Error).message || 'Could not save payment settings');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (error) {
    return (
      <p className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
        {(error as Error).message}
      </p>
    );
  }

  const currency = data?.primary_currency || 'XAF';
  const tenantCode = data?.tenant_code || 'REG';
  const isWcbn = data?.tenant_type === 'wcbn_chapter';
  const refPrefix = isWcbn ? `WCBN-${tenantCode.replace(/^WCBN-?/i, '')}` : `WCA-${tenantCode}`;
  const hasSecret = !!(form.secret_key.trim() || data?.secret_key_hint);
  const ready = form.flutterwave_enabled && hasSecret;
  const momoCapable = isMomoCurrency(currency);
  const walletCapable = isWalletCurrency(currency);

  return (
    <div className="space-y-6">
      {/* 1. Gateway Status & Health Hero Card */}
      <GlassSection>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-heading text-lg font-bold text-foreground">
                {label} · Payment Tenant
              </h3>
              <Badge variant="outline" className="font-mono text-xs">
                {currency}
              </Badge>
              <Badge variant="outline" className="font-mono text-xs text-muted-foreground">
                {refPrefix}-*
              </Badge>
              {ready ? (
                <Badge
                  className={cn(
                    'gap-1 border-0',
                    form.flutterwave_mode === 'live'
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      : 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
                  )}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Connected ({form.flutterwave_mode === 'live' ? 'Live' : 'Test'})
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  Inactive · {form.allow_central_fallback ? 'Central Fallback Active' : 'Online Payments Blocked'}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Strict multi-tenant isolation: funds settle directly into {label}&apos;s dedicated merchant and bank accounts and never mix with other regions.
            </p>
            {data?.last_verified_at && (
              <p className="text-xs text-muted-foreground">
                Last API health check: {new Date(data.last_verified_at).toLocaleString()} ({(data.last_verified_mode || 'live').toUpperCase()})
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onTestConnection}
              disabled={testing || (!form.secret_key.trim() && !data?.secret_key_hint)}
              className="rounded-full"
            >
              {testing ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Activity className="mr-1.5 h-4 w-4 text-primary" />
              )}
              Test Connection
            </Button>
          </div>
        </div>

        {testResult && (
          <div
            className={cn(
              'mt-4 flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm',
              testResult.ok
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                : 'border-destructive/30 bg-destructive/10 text-destructive',
            )}
          >
            {testResult.ok ? <ShieldCheck className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
            <span>{testResult.message}</span>
          </div>
        )}
      </GlassSection>

      {/* 2. Flutterwave API Credentials & Multi-Account Webhook Configuration */}
      <GlassSection>
        <GlassSectionHeader
          icon={<Wallet className="h-5 w-5" />}
          title={`Flutterwave Gateway Credentials · ${label}`}
          description="Configure this tenant's independent Flutterwave merchant keys and webhook verification hash."
        />
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-background/50 p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Activate online gateway for {label}</Label>
              <p className="text-xs text-muted-foreground">
                {scope === 'global'
                  ? 'Processes global / inter-regional events, Head Office campaigns, and Head Office giving.'
                  : form.allow_central_fallback
                    ? 'When off, Super Admin has authorized fallback to the Head Office gateway.'
                    : 'When off, online Card & Mobile Money are strictly blocked and donors are prompted to use Bank Deposit.'}
              </p>
            </div>
            <Switch
              checked={form.flutterwave_enabled}
              onCheckedChange={(v) => set('flutterwave_enabled', v)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Environment</Label>
              <div className="grid grid-cols-2 gap-1 rounded-full bg-muted p-1 w-56">
                {(['test', 'live'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => set('flutterwave_mode', m)}
                    className={cn(
                      'rounded-full py-1.5 text-sm font-semibold capitalize transition-all',
                      form.flutterwave_mode === m
                        ? 'bg-background text-primary shadow-sm'
                        : 'text-muted-foreground',
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Public Key</Label>
              <Input
                value={form.flutterwave_public_key}
                onChange={(e) => set('flutterwave_public_key', e.target.value)}
                placeholder={form.flutterwave_mode === 'test' ? 'FLWPUBK_TEST-...' : 'FLWPUBK-...'}
                className="bg-background/60 font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <KeyRound className="h-3.5 w-3.5" />
                Secret Key
              </Label>
              <Input
                type="password"
                autoComplete="new-password"
                value={form.secret_key}
                onChange={(e) => set('secret_key', e.target.value)}
                placeholder={
                  data?.secret_key_hint
                    ? `Saved ${data.secret_key_hint} — leave blank to keep`
                    : form.flutterwave_mode === 'test'
                      ? 'FLWSECK_TEST-...'
                      : 'FLWSECK-...'
                }
                className="bg-background/60 font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label>Encryption Key (3DES Card)</Label>
              <Input
                type="password"
                autoComplete="new-password"
                value={form.encryption_key}
                onChange={(e) => set('encryption_key', e.target.value)}
                placeholder={
                  data?.encryption_key_hint
                    ? `Saved ${data.encryption_key_hint} — leave blank to keep`
                    : 'FLWSECK_TEST...enc / 24-char key'
                }
                className="bg-background/60 font-mono text-xs"
              />
            </div>
          </div>

          {/* Webhook URL + Secret Hash Block */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-4">
            <div className="flex items-start gap-2.5">
              <Webhook className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-foreground">
                  Flutterwave Webhook Configuration
                </p>
                <p className="text-xs text-muted-foreground">
                  In this merchant&apos;s Flutterwave Dashboard → <strong>Settings → Webhooks</strong>, paste both the Webhook URL and Secret Hash below so asynchronous Mobile Money and 3D Secure card payments confirm automatically.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Webhook URL (shared multi-tenant receiver)</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={data?.webhook_url || ''}
                    className="bg-background font-mono text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => copyText('url', data?.webhook_url || '', 'Webhook URL')}
                    title="Copy Webhook URL"
                  >
                    {copiedField === 'url' ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Webhook Secret Hash (`verif-hash`)</Label>
                <div className="flex gap-1.5">
                  <Input
                    type={showHash ? 'text' : 'password'}
                    value={form.webhook_secret_hash}
                    onChange={(e) => set('webhook_secret_hash', e.target.value)}
                    placeholder="Custom or generated secret hash"
                    className="bg-background font-mono text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowHash((s) => !s)}
                    title={showHash ? 'Hide hash' : 'Show hash'}
                  >
                    {showHash ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => copyText('hash', form.webhook_secret_hash, 'Webhook Secret Hash')}
                    title="Copy Secret Hash"
                  >
                    {copiedField === 'hash' ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      set('webhook_secret_hash', makeClientWebhookSecret());
                      setShowHash(true);
                    }}
                    title="Generate new random Secret Hash"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Currency-Aligned Accepted Methods */}
          <div className="space-y-2.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Accepted Online Channels ({currency})
            </Label>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {momoCapable && (
                <label className="flex items-center justify-between rounded-2xl border border-border bg-background/50 p-3.5 cursor-pointer">
                  <span className="flex items-center gap-2.5 text-sm font-medium">
                    <Smartphone className="h-4 w-4 text-primary" />
                    <span>
                      Mobile Money
                      <span className="block text-[11px] font-normal text-muted-foreground">
                        {currency === 'XAF' ? 'MTN MoMo & Orange Money' : 'MTN, Orange, Wave & Moov (XOF)'}
                      </span>
                    </span>
                  </span>
                  <Switch
                    checked={form.mobile_money_enabled}
                    onCheckedChange={(v) => set('mobile_money_enabled', v)}
                  />
                </label>
              )}

              <label className="flex items-center justify-between rounded-2xl border border-border bg-background/50 p-3.5 cursor-pointer">
                <span className="flex items-center gap-2.5 text-sm font-medium">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <span>
                    Credit / Debit Card
                    <span className="block text-[11px] font-normal text-muted-foreground">
                      Visa, Mastercard, Verve & Amex
                    </span>
                  </span>
                </span>
                <Switch
                  checked={form.card_enabled}
                  onCheckedChange={(v) => set('card_enabled', v)}
                />
              </label>

              {walletCapable && (
                <label className="flex items-center justify-between rounded-2xl border border-border bg-background/50 p-3.5 cursor-pointer">
                  <span className="flex items-center gap-2.5 text-sm font-medium">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>
                      Apple Pay & Google Pay
                      <span className="block text-[11px] font-normal text-muted-foreground">
                        Hosted digital wallet checkout ({currency})
                      </span>
                    </span>
                  </span>
                  <Switch
                    checked={form.wallet_pay_enabled}
                    onCheckedChange={(v) => set('wallet_pay_enabled', v)}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Super Admin Only: Strict Isolation Override */}
          {data?.is_super_admin && data?.tenant_type === 'wca_region' && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
              <div className="space-y-0.5 max-w-xl">
                <Label className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="h-4 w-4" />
                  Super Admin Override: Allow Head Office Gateway Fallback
                </Label>
                <p className="text-xs text-muted-foreground">
                  Keep <strong>OFF</strong> for strict regional fund isolation. Only enable if Head Office is explicitly authorized to collect online Card/MoMo payments while this region&apos;s own merchant account is inactive.
                </p>
              </div>
              <Switch
                checked={form.allow_central_fallback}
                onCheckedChange={(v) => set('allow_central_fallback', v)}
              />
            </div>
          )}
        </div>
      </GlassSection>

      {/* 4. Regional Bank Account Manager */}
      <GlassSection>
        <GlassSectionHeader
          icon={<Landmark className="h-5 w-5" />}
          title={`Bank Deposit & Wire Accounts · ${label}`}
          description="Shown exclusively for this tenant when members, visitors, or event registrants choose Bank Deposit. Never shared across regions."
        />
        <div className="space-y-5">
          <div className="flex items-center justify-between rounded-2xl border border-border bg-background/50 p-4">
            <div className="space-y-0.5">
              <Label>Accept Bank Deposits / Wire Transfers</Label>
              <p className="text-xs text-muted-foreground">
                Bank deposits generate a unique `{refPrefix}` reference and remain pending until confirmed by the finance team.
              </p>
            </div>
            <Switch
              checked={form.bank_transfer_enabled}
              onCheckedChange={(v) => set('bank_transfer_enabled', v)}
            />
          </div>

          {banks.map((b, i) => (
            <div key={i} className="grid gap-3 rounded-2xl border border-border bg-background/40 p-4 md:grid-cols-2">
              {(['bank_name', 'account_name', 'account_number', 'swift', 'branch'] as const).map((k) => (
                <div key={k} className="space-y-1.5">
                  <Label className="text-xs">
                    {{
                      bank_name: 'Bank Name',
                      account_name: 'Account Holder Name',
                      account_number: 'Account Number / IBAN / RIB',
                      swift: 'SWIFT / BIC',
                      branch: 'Branch / Routing Number',
                    }[k]}
                  </Label>
                  <Input
                    value={b[k]}
                    onChange={(e) =>
                      setBanks((arr) =>
                        arr.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)),
                      )
                    }
                    className="bg-background/70"
                  />
                </div>
              ))}
              <div className="flex items-end justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setBanks((arr) => arr.filter((_, j) => j !== i))}
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Remove
                </Button>
              </div>
            </div>
          ))}

          {banks.length < 5 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => setBanks((a) => [...a, { ...emptyBank }])}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Bank Account
            </Button>
          )}

          <div className="space-y-2">
            <Label>Transfer & Proof-of-Payment Instructions</Label>
            <Textarea
              value={form.bank_instructions}
              onChange={(e) => set('bank_instructions', e.target.value)}
              placeholder="e.g. Include your payment reference in the bank transfer narration and send your receipt to finance@..."
              className="h-24 bg-background/60"
            />
          </div>
        </div>
      </GlassSection>

      <div className="flex justify-end">
        <Button
          onClick={onSave}
          disabled={saving}
          className="rounded-full bg-gradient-to-r from-primary to-secondary px-8"
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Payment Settings
        </Button>
      </div>
    </div>
  );
}
