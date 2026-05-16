import React from "react";
import { format } from "date-fns";
import { Eye } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useRegionCurrency } from "@/hooks/useCurrencies";
import { formatCurrencyWithSymbol } from "@/utils/currencyUtils";
import type { LedgerRow } from "@/hooks/useRegionalLedger";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: LedgerRow | null;
}

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-start justify-between gap-4 py-2 border-b border-border/30 last:border-0">
    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
    <span className="text-sm text-foreground text-right">{children}</span>
  </div>
);

export const ViewDcgTransactionDialog: React.FC<Props> = ({ open, onOpenChange, transaction }) => {
  const { userRegion } = useAuth();
  const { data: regionCurrency } = useRegionCurrency(userRegion?.id);
  const fc = (n: number) => formatCurrencyWithSymbol(n, regionCurrency);
  const type = transaction?.category?.type?.toLowerCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto p-0 gap-0 border border-border/40 bg-gradient-to-br from-card/95 to-muted/20 backdrop-blur-xl shadow-2xl rounded-2xl">
        <div className="relative overflow-hidden rounded-t-2xl border-b border-border/30 bg-gradient-to-br from-primary/15 via-primary/5 to-purple-500/10 px-6 pt-6 pb-5">
          <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
          <DialogHeader className="relative space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600 text-primary-foreground shadow-lg shadow-primary/20">
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">Transaction Details</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">Read-only view</DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="px-6 py-5">
          <div className="rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm p-4">
            {transaction ? (
              <>
                <Row label="Date">{format(new Date(transaction.transaction_date), "PPP")}</Row>
                <Row label="DCG">{transaction.dcg?.name || "—"}</Row>
                <Row label="Category">{transaction.category?.name || "—"}</Row>
                <Row label="Type">
                  <Badge variant={type === "income" ? "default" : "secondary"} className="capitalize">{transaction.category?.type}</Badge>
                </Row>
                <Row label="Amount"><span className="font-semibold tabular-nums">{fc(Number(transaction.amount))}</span></Row>
                <Row label="Description">{transaction.description || "—"}</Row>
              </>
            ) : null}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border/30 bg-card/40 backdrop-blur-sm rounded-b-2xl">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="bg-background/60 border-border/50">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewDcgTransactionDialog;
