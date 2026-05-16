import React from "react";
import { HeartHandshake } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useRegionCurrency, useCurrencies } from "@/hooks/useCurrencies";
import { formatCurrencyWithSymbol } from "@/utils/currencyUtils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  donation: any | null;
}

const ViewDonationDialog: React.FC<Props> = ({ open, onOpenChange, donation }) => {
  const { userRegion } = useAuth();
  const { data: regionCurrency } = useRegionCurrency(userRegion?.id);
  const { data: currencies = [] } = useCurrencies();

  if (!donation) return null;

  const cur =
    currencies.find(
      (c) =>
        c.code?.toLowerCase() ===
        (donation.currency_code || donation.campaign?.currency_code || "").toLowerCase(),
    ) || regionCurrency;
  const amount = formatCurrencyWithSymbol(Number(donation.amount || 0) / 100, cur);
  const donor = donation.anonymous ? "Anonymous" : donation.donor_name || "—";

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex flex-col gap-1 rounded-lg border border-border/40 bg-background/40 p-3">
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{value || "—"}</span>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 border border-border/40 bg-gradient-to-br from-card/95 to-muted/20 backdrop-blur-xl shadow-2xl rounded-2xl">
        <div className="relative overflow-hidden rounded-t-2xl border-b border-border/30 bg-gradient-to-br from-primary/15 via-primary/5 to-purple-500/10 px-6 pt-6 pb-5">
          <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
          <DialogHeader className="relative space-y-1.5">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600 text-primary-foreground shadow-lg shadow-primary/20">
                <HeartHandshake className="h-5 w-5" />
              </span>
              Donation Details
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Full information for this donation entry.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Row label="Amount" value={<span className="font-semibold text-green-600 tabular-nums">{amount}</span>} />
            <Row label="Date" value={format(new Date(donation.donation_date), "MMM dd, yyyy")} />
          </div>
          <Row label="Campaign" value={donation.campaign?.name} />
          <div className="grid grid-cols-2 gap-3">
            <Row label="Donor" value={donor} />
            <Row label="Donor Email" value={donation.anonymous ? "—" : donation.donor_email} />
          </div>
          <Row label="Message" value={donation.message} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewDonationDialog;
