import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrencies } from "@/hooks/useCurrencies";
import type { PledgeRow } from "@/hooks/useCampaignPledgesDetailed";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pledge: PledgeRow | null;
  campaignId: string;
}

const STATUSES = ["pledged", "partial", "fulfilled", "cancelled"];

const EditPledgeDialog: React.FC<Props> = ({ open, onOpenChange, pledge, campaignId }) => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: currencies = [] } = useCurrencies();
  const [amount, setAmount] = useState<number>(0);
  const [currencyCode, setCurrencyCode] = useState("USD");
  const [status, setStatus] = useState("pledged");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && pledge) {
      setAmount(pledge.pledge_amount);
      setCurrencyCode(pledge.pledge_currency_code || "USD");
      setStatus(pledge.pledge_status || "pledged");
    }
  }, [open, pledge]);

  const handleSave = async () => {
    if (!pledge) return;
    if (!amount || amount <= 0) {
      toast({ title: "Invalid amount", description: "Enter an amount greater than zero.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("event_pre_registrations")
      .update({
        pledge_amount: amount,
        pledge_currency_code: currencyCode.toLowerCase(),
        pledge_status: status,
      })
      .eq("id", pledge.id);
    setSaving(false);
    if (error) {
      toast({ title: "Failed to update pledge", description: error.message, variant: "destructive" });
      return;
    }
    qc.invalidateQueries({ queryKey: ["campaign_pledges_detailed", campaignId] });
    qc.invalidateQueries({ queryKey: ["campaign_pledges"] });
    toast({ title: "Pledge updated" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 border border-border/40 bg-gradient-to-br from-card/95 to-muted/20 backdrop-blur-xl shadow-2xl rounded-2xl">
        <div className="relative overflow-hidden rounded-t-2xl border-b border-border/30 bg-gradient-to-br from-primary/15 via-primary/5 to-purple-500/10 px-6 pt-6 pb-5">
          <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
          <DialogHeader className="relative space-y-1.5">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600 text-primary-foreground shadow-lg shadow-primary/20">
                <Pencil className="h-5 w-5" />
              </span>
              Edit Pledge
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {pledge?.name || ""}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Amount</Label>
            <Input
              type="number"
              min={0}
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="bg-background/60 border-border/50"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Currency</Label>
            <Select value={currencyCode.toUpperCase()} onValueChange={(v) => setCurrencyCode(v)}>
              <SelectTrigger className="bg-background/60 border-border/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                {currencies.map((c) => (
                  <SelectItem key={c.code} value={c.code.toUpperCase()}>
                    {c.symbol} {c.code.toUpperCase()} — {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="bg-background/60 border-border/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="border-t border-border/30 px-6 py-4 bg-muted/20 rounded-b-2xl">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-primary to-purple-600 text-primary-foreground">
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditPledgeDialog;
