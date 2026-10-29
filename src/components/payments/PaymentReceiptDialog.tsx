import { useState } from 'react';
import { Check, CheckCircle2, Copy, Printer, ShieldCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatMajorCurrency } from '@/lib/payment-utils';

export interface PaymentReceiptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  txRef: string;
  amount: number;
  currency: string;
  tenantName: string;
  payerName?: string;
  payerEmail?: string;
  paymentMethod?: string;
  purpose?: string;
  isBankPending?: boolean;
  issuedAt?: string;
}

export function PaymentReceiptDialog({
  open,
  onOpenChange,
  txRef,
  amount,
  currency,
  tenantName,
  payerName,
  payerEmail,
  paymentMethod,
  purpose,
  isBankPending = false,
  issuedAt,
}: PaymentReceiptProps) {
  const [copied, setCopied] = useState(false);
  const formattedAmount = formatMajorCurrency(amount, currency);
  const dateText = issuedAt
    ? new Date(issuedAt).toLocaleString()
    : new Date().toLocaleString();

  const methodLabel =
    paymentMethod === 'mobile_money'
      ? 'Mobile Money'
      : paymentMethod === 'card'
        ? 'Credit / Debit Card'
        : paymentMethod === 'wallet_pay'
          ? 'Apple Pay / Google Pay'
          : paymentMethod === 'bank_transfer'
            ? 'Bank Deposit / Transfer'
            : paymentMethod || 'Online Payment';

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] rounded-2xl print:shadow-none print:border-0">
        <DialogHeader className="text-center sm:text-center border-b border-border/60 pb-4">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-sm">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <DialogTitle className="font-heading text-lg font-bold tracking-tight">
            World Changers Army · Official Receipt
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {tenantName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {isBankPending ? 'Pending Bank Deposit Amount' : 'Total Paid'}
            </p>
            <p className="mt-1 font-heading text-3xl font-extrabold text-foreground">
              {formattedAmount}
            </p>
            <div className="mt-2 flex justify-center">
              <Badge
                variant="outline"
                className={
                  isBankPending
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                    : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                }
              >
                {isBankPending ? 'Pending Bank Verification' : 'Verified & Confirmed'}
              </Badge>
            </div>
          </div>

          <div className="divide-y divide-border/60 rounded-2xl border border-border/70 bg-background/60 px-4 text-sm">
            <div className="flex items-center justify-between gap-2 py-2.5">
              <span className="text-xs text-muted-foreground">Reference</span>
              <span className="flex items-center gap-1.5 font-mono text-xs font-semibold text-foreground">
                {txRef || 'N/A'}
                {txRef && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(txRef);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    }}
                    className="rounded p-1 hover:bg-muted print:hidden"
                    title="Copy reference"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </button>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 py-2.5">
              <span className="text-xs text-muted-foreground">Destination Tenant</span>
              <span className="font-medium text-foreground text-right">{tenantName}</span>
            </div>

            {purpose && (
              <div className="flex items-center justify-between gap-2 py-2.5">
                <span className="text-xs text-muted-foreground">Purpose / Item</span>
                <span className="font-medium text-foreground text-right max-w-[240px] truncate">
                  {purpose}
                </span>
              </div>
            )}

            {payerName && (
              <div className="flex items-center justify-between gap-2 py-2.5">
                <span className="text-xs text-muted-foreground">Name</span>
                <span className="font-medium text-foreground text-right">{payerName}</span>
              </div>
            )}

            {payerEmail && (
              <div className="flex items-center justify-between gap-2 py-2.5">
                <span className="text-xs text-muted-foreground">Email</span>
                <span className="text-xs text-foreground text-right">{payerEmail}</span>
              </div>
            )}

            <div className="flex items-center justify-between gap-2 py-2.5">
              <span className="text-xs text-muted-foreground">Payment Method</span>
              <span className="font-medium text-foreground">{methodLabel}</span>
            </div>

            <div className="flex items-center justify-between gap-2 py-2.5">
              <span className="text-xs text-muted-foreground">Date & Time</span>
              <span className="text-xs text-foreground">{dateText}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
            <span>
              Strict Multi-Tenant Settlement · Directly credited to {tenantName}.
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between print:hidden">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrint}
            className="rounded-xl gap-1.5"
          >
            <Printer className="h-4 w-4" />
            Print / Save PDF
          </Button>
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
