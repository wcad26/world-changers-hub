import { useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CreditCard, KeyRound, Landmark, Loader2, Plus, Smartphone, Trash2, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { GlassSection, GlassSectionHeader } from '@/components/ui/GlassSection';
import { getPaymentSettings, savePaymentSettings } from '@/lib/payment-settings.functions';

type Bank = { bank_name: string; account_name: string; account_number: string; swift: string; branch: string };
const emptyBank: Bank = { bank_name: '', account_name: '', account_number: '', swift: '', branch: '' };

/** Edits one payment scope: a region id, or 'global' for the head-office gateway. */
export default function PaymentSettingsPanel({ scope, label }: { scope: string; label: string }) {
  const qc = useQueryClient();
  const load = useServerFn(getPaymentSettings);
  const save = useServerFn(savePaymentSettings);
  const { data, isLoading, error } = useQuery({ queryKey: ['payment_settings', scope], queryFn: () => load({ data: { scope } }) });

  const [form, setForm] = useState({ flutterwave_enabled: false, flutterwave_mode: 'live' as 'test' | 'live', flutterwave_public_key: '', secret_key: '', encryption_key: '', mobile_money_enabled: true, card_enabled: true, bank_transfer_enabled: false, bank_instructions: '' });
  const [banks, setBanks] = useState<Bank[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    setForm({ flutterwave_enabled: data.flutterwave_enabled, flutterwave_mode: data.flutterwave_mode, flutterwave_public_key: data.flutterwave_public_key, secret_key: '', encryption_key: '', mobile_money_enabled: data.mobile_money_enabled, card_enabled: data.card_enabled, bank_transfer_enabled: data.bank_transfer_enabled, bank_instructions: data.bank_instructions });
    setBanks(data.bank_accounts.map((b) => ({ ...emptyBank, ...b })));
  }, [data]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const onSave = async () => {
    setSaving(true);
    try {
      await save({ data: { scope, ...form, secret_key: form.secret_key || undefined, encryption_key: form.encryption_key || undefined, bank_accounts: banks } });
      toast.success(`Payment settings saved for ${label}`);
      qc.invalidateQueries({ queryKey: ['payment_settings'] });
      qc.invalidateQueries({ queryKey: ['payment_gateway_status'] });
    } catch (e) {
      toast.error((e as Error).message || 'Could not save');
    } finally { setSaving(false); }
  };

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (error) return <p className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{(error as Error).message}</p>;

  const ready = form.flutterwave_enabled && (!!form.secret_key || !!data?.secret_key_hint);

  return (
    <div className="space-y-6">
      <GlassSection>
        <GlassSectionHeader icon={<Wallet className="h-5 w-5" />} title={`Flutterwave gateway · ${label}`} description="Gifts to this region go into this Flutterwave account, kept separate from other regions." />
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5"><Label>Use this region's own account</Label><p className="text-sm text-muted-foreground">{scope === 'global' ? 'Head-office account, also used by regions without their own.' : 'When off, gifts are processed by the head-office account.'}</p></div>
            <div className="flex items-center gap-3">
              <Badge variant={ready ? 'default' : 'secondary'}>{ready ? 'Active' : scope === 'global' ? 'Off' : 'Using head office'}</Badge>
              <Switch checked={form.flutterwave_enabled} onCheckedChange={(v) => set('flutterwave_enabled', v)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1 rounded-full bg-muted p-1 sm:w-64">
            {(['test', 'live'] as const).map((m) => (
              <button key={m} type="button" onClick={() => set('flutterwave_mode', m)} className={`rounded-full py-1.5 text-sm font-semibold capitalize ${form.flutterwave_mode === m ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'}`}>{m}</button>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2"><Label>Public key</Label><Input value={form.flutterwave_public_key} onChange={(e) => set('flutterwave_public_key', e.target.value)} placeholder="FLWPUBK-..." className="bg-background/60" /></div>
            <div className="space-y-2"><Label className="flex items-center gap-1"><KeyRound className="h-3.5 w-3.5" />Secret key</Label><Input type="password" autoComplete="new-password" value={form.secret_key} onChange={(e) => set('secret_key', e.target.value)} placeholder={data?.secret_key_hint ? `Saved ${data.secret_key_hint} — leave blank to keep` : 'FLWSECK-...'} className="bg-background/60" /></div>
            <div className="space-y-2"><Label>Encryption key</Label><Input type="password" autoComplete="new-password" value={form.encryption_key} onChange={(e) => set('encryption_key', e.target.value)} placeholder={data?.encryption_key_hint ? `Saved ${data.encryption_key_hint}` : 'Optional'} className="bg-background/60" /></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center justify-between rounded-2xl border border-border p-3"><span className="flex items-center gap-2 text-sm font-medium"><Smartphone className="h-4 w-4 text-primary" />Mobile Money (XAF)</span><Switch checked={form.mobile_money_enabled} onCheckedChange={(v) => set('mobile_money_enabled', v)} /></label>
            <label className="flex items-center justify-between rounded-2xl border border-border p-3"><span className="flex items-center gap-2 text-sm font-medium"><CreditCard className="h-4 w-4 text-primary" />Card</span><Switch checked={form.card_enabled} onCheckedChange={(v) => set('card_enabled', v)} /></label>
          </div>
        </div>
      </GlassSection>

      <GlassSection>
        <GlassSectionHeader icon={<Landmark className="h-5 w-5" />} title="Bank transfer" description="Members see these details with a unique reference. Confirm received transfers in Finances." />
        <div className="space-y-5">
          <div className="flex items-center justify-between"><Label>Offer bank transfer</Label><Switch checked={form.bank_transfer_enabled} onCheckedChange={(v) => set('bank_transfer_enabled', v)} /></div>
          {banks.map((b, i) => (
            <div key={i} className="grid gap-3 rounded-2xl border border-border p-4 md:grid-cols-2">
              {(['bank_name', 'account_name', 'account_number', 'swift', 'branch'] as const).map((k) => (
                <div key={k} className="space-y-1.5">
                  <Label className="text-xs">{{ bank_name: 'Bank name', account_name: 'Account name', account_number: 'Account number / RIB', swift: 'SWIFT / BIC', branch: 'Branch' }[k]}</Label>
                  <Input value={b[k]} onChange={(e) => setBanks((arr) => arr.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)))} className="bg-background/60" />
                </div>
              ))}
              <div className="flex items-end justify-end"><Button type="button" variant="ghost" size="sm" onClick={() => setBanks((arr) => arr.filter((_, j) => j !== i))}><Trash2 className="mr-1 h-4 w-4" />Remove</Button></div>
            </div>
          ))}
          {banks.length < 5 && <Button type="button" variant="outline" size="sm" onClick={() => setBanks((a) => [...a, { ...emptyBank }])}><Plus className="mr-1 h-4 w-4" />Add bank account</Button>}
          <div className="space-y-2"><Label>Instructions for members</Label><Textarea value={form.bank_instructions} onChange={(e) => set('bank_instructions', e.target.value)} placeholder="e.g. Send a screenshot of your transfer receipt to the finance desk." className="h-20 bg-background/60" /></div>
        </div>
      </GlassSection>

      <div className="flex justify-end">
        <Button onClick={onSave} disabled={saving} className="rounded-full bg-gradient-to-r from-primary to-secondary px-8">{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save payment settings</Button>
      </div>
    </div>
  );
}
