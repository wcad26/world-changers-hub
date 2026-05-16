import React, { useState, useEffect } from "react";
import { HeartHandshake, Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useFundraisingCampaigns, useCreateDonation } from "@/hooks/useFundraisingCampaigns";
import { useAuth } from "@/hooks/useAuth";
import { useRegionCurrency } from "@/hooks/useCurrencies";
import { getCurrencySymbol } from "@/utils/currencyUtils";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCampaignId?: string;
}

const RecordDonationDialog: React.FC<Props> = ({ open, onOpenChange, defaultCampaignId }) => {
  const { toast } = useToast();
  const { userRegion } = useAuth();
  const { data: regionCurrency } = useRegionCurrency(userRegion?.id);
  const symbol = getCurrencySymbol(regionCurrency);
  const { data: campaigns = [] } = useFundraisingCampaigns();
  const createDonation = useCreateDonation();

  const [campaignId, setCampaignId] = useState<string>(defaultCampaignId || "");
  const [memberId, setMemberId] = useState<string>("");
  const [memberLabel, setMemberLabel] = useState<string>("");
  const [memberSearch, setMemberSearch] = useState("");
  const [memberPopoverOpen, setMemberPopoverOpen] = useState(false);
  const [amount, setAmount] = useState<number>(0);
  const [anonymous, setAnonymous] = useState(false);
  const [message, setMessage] = useState("");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (open) {
      setCampaignId(defaultCampaignId || "");
      setMemberId("");
      setMemberLabel("");
      setMemberSearch("");
      setAmount(0);
      setAnonymous(false);
      setMessage("");
      setDate(new Date().toISOString().slice(0, 10));
    }
  }, [open, defaultCampaignId]);

  const { data: memberResults = [], isFetching: membersLoading } = useQuery({
    queryKey: ["donation-member-search", memberSearch],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("search_all_members", { _search: memberSearch });
      if (error) throw error;
      return (data || []) as Array<{ id: string; member_id: string; first_name: string; last_name: string }>;
    },
    enabled: open && !anonymous,
  });

  const selectedCampaign = campaigns.find(c => c.id === campaignId);
  const currencyCode = selectedCampaign?.currency_code || regionCurrency?.code?.toLowerCase() || "usd";

  const handleSubmit = async () => {
    if (!campaignId) {
      toast({ title: "Campaign required", description: "Please select a campaign.", variant: "destructive" });
      return;
    }
    if (!amount || amount <= 0) {
      toast({ title: "Invalid amount", description: "Enter an amount greater than zero.", variant: "destructive" });
      return;
    }
    try {
      await createDonation.mutateAsync({
        campaign_id: campaignId,
        amount,
        donor_name: anonymous ? null : (memberLabel || null),
        donor_email: null,
        message: message.trim() || null,
        anonymous,
        donation_date: new Date(date).toISOString(),
        currency_code: currencyCode,
      });
      toast({ title: "Donation recorded", description: `${symbol} ${amount.toLocaleString("en-US")} added to the campaign.` });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Failed to record donation", description: e?.message || "Please try again.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HeartHandshake className="h-5 w-5 text-primary" /> Record Donation
          </DialogTitle>
          <DialogDescription>Log a donation manually against a fundraising campaign.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Campaign</Label>
            <Select value={campaignId} onValueChange={setCampaignId}>
              <SelectTrigger><SelectValue placeholder="Select a campaign" /></SelectTrigger>
              <SelectContent>
                {campaigns.length === 0 && (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">No campaigns available</div>
                )}
                {campaigns.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} <span className="text-muted-foreground text-xs ml-1">· {c.status}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Amount ({symbol})</Label>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="5,000"
              value={amount ? Number(amount).toLocaleString("en-US") : ""}
              onChange={(e) => {
                const digits = e.target.value.replace(/[^\d]/g, "");
                setAmount(digits ? Number(digits) : 0);
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Donor Name</Label>
              <Input value={donorName} onChange={(e) => setDonorName(e.target.value)} disabled={anonymous} placeholder={anonymous ? "Anonymous" : "Last First"} />
            </div>
            <div className="space-y-2">
              <Label>Donor Email</Label>
              <Input type="email" value={donorEmail} onChange={(e) => setDonorEmail(e.target.value)} disabled={anonymous} placeholder="optional" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="anon-donation" checked={anonymous} onCheckedChange={(v) => setAnonymous(!!v)} />
            <Label htmlFor="anon-donation" className="text-sm font-normal cursor-pointer">Mark as anonymous</Label>
          </div>

          <div className="space-y-2">
            <Label>Donation Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Message (optional)</Label>
            <Textarea rows={2} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Note about this donation" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createDonation.isPending} className="bg-gradient-to-r from-primary to-purple-600 text-primary-foreground">
            {createDonation.isPending ? "Recording…" : "Record Donation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RecordDonationDialog;
