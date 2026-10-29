import React, { useState } from "react";
import { MoreHorizontal, Eye, Pencil, Trash2, RotateCcw, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteRegionalTransaction, type LedgerRow } from "@/hooks/useRegionalLedger";
import { refundPaymentTransaction } from "@/lib/payment-settings.functions";
import EditDcgTransactionDialog from "./EditDcgTransactionDialog";
import ViewDcgTransactionDialog from "./ViewDcgTransactionDialog";

interface Props { row: LedgerRow }

const DcgTransactionRowActions: React.FC<Props> = ({ row }) => {
  const qc = useQueryClient();
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [refunding, setRefunding] = useState(false);
  const deleteMutation = useDeleteRegionalTransaction();
  const refundFn = useServerFn(refundPaymentTransaction);

  const isRefunded = row.payment_status === "refunded";

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(row.id);
      toast.success("Transaction deleted");
      setDeleteOpen(false);
    } catch (e: any) {
      toast.error("Failed to delete transaction", { description: e?.message });
    }
  };

  const handleRefund = async () => {
    if (refundReason.trim().length < 3) {
      toast.error("Please enter a brief reason for this refund or reversal.");
      return;
    }
    setRefunding(true);
    try {
      const res = await refundFn({
        data: {
          transactionId: row.id,
          reason: refundReason.trim(),
        },
      });
      toast.success(`Transaction refunded / reversed (${res.refundReference})`);
      setRefundOpen(false);
      setRefundReason("");
      qc.invalidateQueries({ queryKey: ["regional_ledger"] });
      qc.invalidateQueries({ queryKey: ["financial_transactions"] });
      qc.invalidateQueries({ queryKey: ["financial_summary"] });
      qc.invalidateQueries({ queryKey: ["dcg_financial_transactions"] });
      qc.invalidateQueries({ queryKey: ["dcg_financial_summary"] });
    } catch (e: any) {
      toast.error("Refund / Reversal failed", { description: e?.message });
    } finally {
      setRefunding(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => setViewOpen(true)}>
            <Eye className="mr-2 h-4 w-4" /> View details
          </DropdownMenuItem>
          {!isRefunded && (
            <>
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRefundOpen(true)} className="text-amber-600 focus:text-amber-600">
                <RotateCcw className="mr-2 h-4 w-4" /> Refund / Reverse
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-destructive focus:text-destructive">
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ViewDcgTransactionDialog open={viewOpen} onOpenChange={setViewOpen} transaction={row} />
      <EditDcgTransactionDialog open={editOpen} onOpenChange={setEditOpen} transaction={row} />

      <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Refund / Reverse Transaction</DialogTitle>
            <DialogDescription>
              {row.payment_method && ["mobile_money", "card", "wallet_pay"].includes(row.payment_method)
                ? "This will initiate a gateway refund (Flutterwave/Stripe) and reverse the ledger balance."
                : "This will mark the transaction as refunded/reversed and exclude it from net ledger totals."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs space-y-1">
              <p><span className="text-muted-foreground">Amount:</span> <strong>{Number(row.amount).toLocaleString()}</strong></p>
              {row.payment_reference && (
                <p><span className="text-muted-foreground">Reference:</span> <span className="font-mono">{row.payment_reference}</span></p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="refund-reason">Reason for Refund / Reversal *</Label>
              <Input
                id="refund-reason"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="e.g. Duplicate charge / Donor requested refund"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundOpen(false)} disabled={refunding}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRefund}
              disabled={refunding || refundReason.trim().length < 3}
            >
              {refunding && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Confirm Refund / Reversal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this {row.category?.type?.toLowerCase()} entry of{" "}
              <span className="font-semibold">{Number(row.amount).toLocaleString()}</span> from {row.dcg?.name || "this DCG"}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DcgTransactionRowActions;
