import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import { FEE_CATEGORIES, REQUIRED_FEE_CATEGORIES, type EventFeeRow, type FeeCategory } from '@/hooks/useEventRegistrationFees';

interface Props {
  rows: EventFeeRow[];
  onChange: (rows: EventFeeRow[]) => void;
  currencies?: { code: string; symbol: string; name: string }[];
}

export const RegistrationFeesEditor: React.FC<Props> = ({ rows, onChange, currencies }) => {
  const currency = rows[0]?.currency_code || '';

  const update = (i: number, patch: Partial<EventFeeRow>) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const setCurrency = (code: string) => onChange(rows.map((r) => ({ ...r, currency_code: code })));

  const add = () => {
    const used = rows.map((r) => r.category);
    const next = (FEE_CATEGORIES.find((c) => !used.includes(c.value))?.value || 'member') as FeeCategory;
    onChange([...rows, { category: next, label: '', amount: 0, currency_code: currency }]);
  };

  const missing = FEE_CATEGORIES.filter(
    (c) => REQUIRED_FEE_CATEGORIES.includes(c.value) && !rows.some((r) => r.category === c.value)
  );

  return (
    <div className="rounded-lg border border-border bg-background/60 p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <Label className="text-sm font-semibold">Registration Fees</Label>
          <p className="text-xs text-muted-foreground">
            Each person pre-registering pays the fee for their category. Categories with no fee register free.
          </p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={add}>
          <Plus className="h-4 w-4 mr-1" /> Add fee
        </Button>
      </div>

      {rows.length > 0 && (
        <div className="space-y-2">
          <div className="max-w-xs">
            <Label className="text-xs">Fee currency</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="">Select currency</option>
              {(currencies || []).map((c) => (
                <option key={c.code} value={c.code}>{c.symbol} - {c.name}</option>
              ))}
            </select>
          </div>

          {rows.map((row, i) => (
            <div key={i} className="space-y-1">
              <div className="grid grid-cols-1 md:grid-cols-[150px_1fr_130px_40px] gap-2 items-end">
                <div>
                  <Label className="text-xs">Category</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                    value={row.category}
                    onChange={(e) => update(i, { category: e.target.value as FeeCategory })}
                  >
                    {FEE_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Label (optional)</Label>
                  <Input
                    className="h-9"
                    placeholder="e.g. Leaders rate"
                    value={row.label}
                    onChange={(e) => update(i, { label: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Amount</Label>
                  <Input
                    className="h-9"
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.amount ?? 0}
                    onChange={(e) => update(i, { amount: e.target.value ? parseFloat(e.target.value) : 0 })}
                  />
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => onChange(rows.filter((_, idx) => idx !== i))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {FEE_CATEGORIES.find((c) => c.value === row.category)?.hint}
                {row.category === 'family'
                  ? '. Adults who are not the spouse, and children aged 16 or over, are billed on their own rate.'
                  : ''}
              </p>
            </div>
          ))}


          {!currency && (
            <p className="text-xs text-destructive">Select a currency so the fees can be saved.</p>
          )}
          {missing.length > 0 && (
            <p className="text-xs text-amber-600 flex items-start gap-1">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              No fee set for: {missing.map((m) => m.label).join(', ')} — those people will register for free.
            </p>
          )}
        </div>
      )}

      {rows.length === 0 && (
        <p className="text-xs text-muted-foreground">No fees yet — registration is free for everyone.</p>
      )}
    </div>
  );
};
