import React, { useState } from "react";
import { HeartHandshake, ChevronDown, Plus } from "lucide-react";
import { format } from "date-fns";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRegionDonations } from "@/hooks/useFundraisingCampaigns";
import { useAuth } from "@/hooks/useAuth";
import { useRegionCurrency, useCurrencies } from "@/hooks/useCurrencies";
import { formatCurrencyWithSymbol } from "@/utils/currencyUtils";
import RecordDonationDialog from "./RecordDonationDialog";
import type { PeriodRange } from "./PeriodSelector";

interface Props { range: PeriodRange }

const FundraisingTransactionsCard: React.FC<Props> = ({ range }) => {
  const [open, setOpen] = useState(false); // collapsed by default
  const [dialogOpen, setDialogOpen] = useState(false);
  const { userRegion } = useAuth();
  const { data: regionCurrency } = useRegionCurrency(userRegion?.id);
  const { data: currencies = [] } = useCurrencies();
  const { data: donations = [], isLoading } = useRegionDonations(range.from, range.to);

  const fmt = (amountCents: number, code?: string | null) => {
    const cur = currencies.find(c => c.code?.toLowerCase() === (code || "").toLowerCase()) || regionCurrency;
    return formatCurrencyWithSymbol(amountCents / 100, cur);
  };

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen} className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6">
        <div className="flex items-center justify-between gap-3">
          <CollapsibleTrigger className="flex flex-1 items-center justify-between gap-2 group">
            <div className="flex items-center gap-2">
              <HeartHandshake className="h-4 w-4 text-primary" />
              <div className="text-left">
                <h3 className="text-base font-semibold text-foreground">Fundraising Transactions</h3>
                <p className="text-xs text-muted-foreground">All donations across your region's campaigns</p>
              </div>
            </div>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <Button
            size="sm"
            onClick={(e) => { e.stopPropagation(); setDialogOpen(true); }}
            className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 text-primary-foreground shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" /> Record Donation
          </Button>
        </div>
        <CollapsibleContent className="mt-4">
          {isLoading ? (
            <p className="py-8 text-center text-muted-foreground text-sm">Loading…</p>
          ) : donations.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground text-sm">No donations in this period.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/30">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow className="border-border/30 hover:bg-transparent">
                    <TableHead>Date</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Donor</TableHead>
                    <TableHead className="hidden md:table-cell">Message</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donations.map((d: any) => (
                    <TableRow key={d.id} className="border-border/20 hover:bg-muted/30">
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {format(new Date(d.donation_date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell className="font-medium">{d.campaign?.name || "—"}</TableCell>
                      <TableCell>{d.anonymous ? <span className="italic text-muted-foreground">Anonymous</span> : (d.donor_name || "—")}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{d.message || "—"}</TableCell>
                      <TableCell className="text-right whitespace-nowrap font-semibold tabular-nums text-green-600">
                        {fmt(Number(d.amount), d.currency_code || d.campaign?.currency_code)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      <RecordDonationDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
};

export default FundraisingTransactionsCard;
