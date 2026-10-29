import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock, Landmark, Loader2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  listPendingBankTransfers,
  reconcileBankTransfer,
} from '@/lib/payment-settings.functions';
import { formatMajorCurrency } from '@/lib/payment-utils';

/**
 * Displays pending Bank Deposit / Wire Transfer transactions for a region (or 'all'/'global' for Super Admin)
 * so finance admins can 1-click Confirm Receipt or Reject after checking their bank statement.
 */
export default function PendingBankTransfersPanel({ scope }: { scope: string }) {
  const qc = useQueryClient();
  const loadPending = useServerFn(listPendingBankTransfers);
  const reconcile = useServerFn(reconcileBankTransfer);
  const [busyRef, setBusyRef] = useState<string | null>(null);

  const { data: rows } = useQuery({
    queryKey: ['pending_bank_transfers', scope],
    queryFn: () => loadPending({ data: { scope } }),
    enabled: !!scope,
    staleTime: 30_000,
  });

  if (!rows || rows.length === 0) return null;

  const onAction = async (txRef: string | null, decision: 'confirm' | 'reject') => {
    if (!txRef) return;
    setBusyRef(txRef);
    try {
      await reconcile({ data: { txRef, decision } });
      toast.success(
        decision === 'confirm'
          ? `Bank deposit ${txRef} confirmed and posted to ledger`
          : `Bank deposit ${txRef} marked as rejected`,
      );
      qc.invalidateQueries({ queryKey: ['pending_bank_transfers'] });
      qc.invalidateQueries({ queryKey: ['regional_ledger'] });
      qc.invalidateQueries({ queryKey: ['global_ledger'] });
      qc.invalidateQueries({ queryKey: ['dcg_financial_summary'] });
      qc.invalidateQueries({ queryKey: ['dcg_financial_transactions'] });
      qc.invalidateQueries({ queryKey: ['campaign-contributions'] });
    } catch (e) {
      toast.error((e as Error).message || 'Could not update bank deposit');
    } finally {
      setBusyRef(null);
    }
  };

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
            <Landmark className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              Pending Bank Deposits Awaiting Confirmation
              <Badge variant="secondary" className="bg-amber-500/20 text-amber-800 dark:text-amber-200">
                {rows.length}
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground">
              Verify the reference on your bank statement before confirming receipt. Confirmed deposits automatically update ledgers, campaigns, and event fees.
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-border/60 rounded-xl border border-border/60 bg-card/80">
        {rows.map((r) => {
          const ref = r.payment_reference || '';
          const isBusy = busyRef === ref;
          const cleanDesc = (r.description || '')
            .replace(/^event_fee:[^:]+:/, 'Event Fee · ')
            .replace(/^campaign:/, 'Campaign · ')
            .replace(/^store:/, 'Store · ')
            .replace(/^public:/, '');
          return (
            <div
              key={r.id}
              className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-primary">{ref}</span>
                  {r.region?.name && scope === 'all' && (
                    <Badge variant="outline" className="text-[10px]">
                      {r.region.name}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <Clock className="h-3 w-3" />
                    {r.transaction_date}
                  </Badge>
                </div>
                <p className="text-sm font-medium text-foreground truncate">
                  {r.donor_name || 'Member / Donor'} ·{' '}
                  <span className="font-bold">
                    {formatMajorCurrency(r.amount, r.currency_code)}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {r.category?.name || 'Income'}
                  {cleanDesc ? ` — ${cleanDesc}` : ''}
                  {r.donor_phone ? ` • ${r.donor_phone}` : ''}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isBusy}
                  onClick={() => onAction(ref, 'reject')}
                  className="h-8 rounded-full text-xs text-destructive hover:text-destructive"
                >
                  <XCircle className="mr-1 h-3.5 w-3.5" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  disabled={isBusy}
                  onClick={() => onAction(ref, 'confirm')}
                  className="h-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                >
                  {isBusy ? (
                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                  )}
                  Confirm Receipt
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
