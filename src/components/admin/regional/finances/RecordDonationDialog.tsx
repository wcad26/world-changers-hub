import React, { useState, useEffect } from "react";
import { HeartHandshake, Check, ChevronsUpDown, Loader2, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCreateDonation } from "@/hooks/useFundraisingCampaigns";
import { useGlobalFundraisingCampaigns } from "@/hooks/useGlobalFundraising";
import { useSearchDonors, type DonorRow } from "@/hooks/useDonors";
import { useAuth } from "@/hooks/useAuth";
import { useRegionCurrency } from "@/hooks/useCurrencies";
import { getCurrencySymbol } from "@/utils/currencyUtils";
import { cn } from "@/lib/utils";
import RegisterDonorDialog from "./RegisterDonorDialog";

interface RedeemPledge {
  pre_registration_id: string;
  member_id: string | null;
  donor_name: string;
  donor_email: string | null;
  remaining: number;
  currency_code: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCampaignId?: string;
  redeemPledge?: RedeemPledge | null;
}

type DonorType = "member" | "external" | "anonymous";

const RecordDonationDialog: React.FC<Props> = ({ open, onOpenChange, defaultCampaignId, redeemPledge }) => {
  const { toast } = useToast();
  const { userRegion } = useAuth();
  const { data: regionCurrency } = useRegionCurrency(userRegion?.id);
  const symbol = getCurrencySymbol(regionCurrency);
  const { data: campaigns = [] } = useGlobalFundraisingCampaigns("all");
  const createDonation = useCreateDonation();

  const [campaignId, setCampaignId] = useState<string>(defaultCampaignId || "");
  const [donorType, setDonorType] = useState<DonorType>("member");

  // Member selection
  const [memberId, setMemberId] = useState<string>("");
  const [memberLabel, setMemberLabel] = useState<string>("");
  const [memberSearch, setMemberSearch] = useState("");
  const [memberPopoverOpen, setMemberPopoverOpen] = useState(false);

  // Donor selection
  const [donorId, setDonorId] = useState<string>("");
  const [donorLabel, setDonorLabel] = useState<string>("");
  const [donorEmail, setDonorEmail] = useState<string>("");
  const [donorSearch, setDonorSearch] = useState("");
  const [donorPopoverOpen, setDonorPopoverOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  const [amount, setAmount] = useState<number>(0);
  const [message, setMessage] = useState("");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (open) {
      setCampaignId(defaultCampaignId || "");
      if (redeemPledge) {
        setDonorType(redeemPledge.member_id ? "member" : "external");
        setMemberId(redeemPledge.member_id || "");
        setMemberLabel(redeemPledge.member_id ? redeemPledge.donor_name : "");
        setDonorId("");
        setDonorLabel(redeemPledge.member_id ? "" : redeemPledge.donor_name);
        setDonorEmail(redeemPledge.donor_email || "");
        setAmount(Math.max(0, Math.round(redeemPledge.remaining)));
      } else {
        setDonorType("member");
        setMemberId(""); setMemberLabel(""); setMemberSearch("");
        setDonorId(""); setDonorLabel(""); setDonorEmail(""); setDonorSearch("");
        setAmount(0);
      }
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
    enabled: open && donorType === "member",
  });

  const { data: donorResults = [], isFetching: donorsLoading } = useSearchDonors(donorSearch, open && donorType === "external");

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
    if (donorType === "member" && !memberId) {
      toast({ title: "Donor required", description: "Select a member or change donor type.", variant: "destructive" });
      return;
    }
    if (donorType === "external" && !donorId) {
      toast({ title: "Donor required", description: "Select a donor or register a new one.", variant: "destructive" });
      return;
    }
    try {
      await createDonation.mutateAsync({
        campaign_id: campaignId,
        amount,
        donor_name: donorType === "anonymous" ? null : (donorType === "member" ? memberLabel : donorLabel) || null,
        donor_email: donorType === "external" ? (donorEmail || null) : null,
        donor_id: donorType === "external" ? donorId : null,
        member_id: donorType === "member" ? memberId : null,
        message: message.trim() || null,
        anonymous: donorType === "anonymous",
        donation_date: new Date(date).toISOString(),
        currency_code: currencyCode,
      });
      toast({ title: "Donation recorded", description: `${symbol} ${amount.toLocaleString("en-US")} added to the campaign.` });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Failed to record donation", description: e?.message || "Please try again.", variant: "destructive" });
    }
  };

  const handleDonorCreated = (donor: DonorRow) => {
    const label = `${donor.last_name} ${donor.first_name}`.trim();
    setDonorId(donor.id);
    setDonorLabel(label);
    setDonorEmail(donor.email || "");
    setDonorPopoverOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-0 gap-0 border border-border/40 bg-gradient-to-br from-card/95 to-muted/20 backdrop-blur-xl shadow-2xl rounded-2xl">
        {/* Gradient header */}
        <div className="relative overflow-hidden rounded-t-2xl border-b border-border/30 bg-gradient-to-br from-primary/15 via-primary/5 to-purple-500/10 px-6 pt-6 pb-5">
          <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
          <DialogHeader className="relative space-y-1.5">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600 text-primary-foreground shadow-lg shadow-primary/20">
                <HeartHandshake className="h-5 w-5" />
              </span>
              Record Donation
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Log a donation manually against a fundraising campaign.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Campaign + Amount glass panel */}
          <div className="rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm p-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Campaign</Label>
              <Select value={campaignId} onValueChange={setCampaignId}>
                <SelectTrigger className="bg-background/60 border-border/50"><SelectValue placeholder="Select a campaign" /></SelectTrigger>
                <SelectContent>
                  {campaigns.length === 0 && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">No campaigns available</div>
                  )}
                  {campaigns.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                      <span className="text-muted-foreground text-xs ml-1">
                        · {c.region?.name || "Global"} · {c.status}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">{symbol}</span>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="5,000"
                  className="pl-9 bg-background/60 border-border/50 text-base font-semibold"
                  value={amount ? Number(amount).toLocaleString("en-US") : ""}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/[^\d]/g, "");
                    setAmount(digits ? Number(digits) : 0);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Donor section */}
          <div className="rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm p-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Donor Type</Label>
              <RadioGroup
                value={donorType}
                onValueChange={(v) => setDonorType(v as DonorType)}
                className="grid grid-cols-3 gap-2"
              >
                {(["member", "external", "anonymous"] as DonorType[]).map((t) => (
                  <Label
                    key={t}
                    htmlFor={`dt-${t}`}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 cursor-pointer text-sm font-medium transition-all",
                      donorType === t
                        ? "border-primary bg-gradient-to-br from-primary/15 to-purple-500/10 text-foreground shadow-sm"
                        : "border-border/50 bg-background/40 text-muted-foreground hover:bg-background/70 hover:text-foreground"
                    )}
                  >
                    <RadioGroupItem id={`dt-${t}`} value={t} className="sr-only" />
                    <span className="capitalize">{t === "external" ? "External" : t}</span>
                  </Label>
                ))}
              </RadioGroup>
            </div>

            {donorType === "member" && (
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Member</Label>
                <Popover open={memberPopoverOpen} onOpenChange={setMemberPopoverOpen} modal={true}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" role="combobox" className="w-full justify-between font-normal bg-background/60 border-border/50">
                      <span className={cn("truncate", !memberLabel && "text-muted-foreground")}>
                        {memberLabel || "Search and select a member…"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0 border-border/50 bg-card/95 backdrop-blur-xl" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput placeholder="Search by name…" value={memberSearch} onValueChange={setMemberSearch} />
                      <CommandList className="max-h-64 overflow-y-auto overscroll-contain">
                        {membersLoading ? (
                          <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Searching…
                          </div>
                        ) : (
                          <>
                            <CommandEmpty>No members found.</CommandEmpty>
                            <CommandGroup>
                              {memberResults.map((m) => {
                                const label = `${m.last_name || ""} ${m.first_name || ""}`.trim();
                                return (
                                  <CommandItem key={m.id} value={m.id} onSelect={() => {
                                    setMemberId(m.id); setMemberLabel(label); setMemberPopoverOpen(false);
                                  }}>
                                    <Check className={cn("mr-2 h-4 w-4", memberId === m.id ? "opacity-100" : "opacity-0")} />
                                    <span className="flex-1 truncate">{label}</span>
                                    <span className="text-xs text-muted-foreground ml-2">{m.member_id}</span>
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {donorType === "external" && (
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">External Donor</Label>
                <Popover open={donorPopoverOpen} onOpenChange={setDonorPopoverOpen} modal={true}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" role="combobox" className="w-full justify-between font-normal bg-background/60 border-border/50">
                      <span className={cn("truncate", !donorLabel && "text-muted-foreground")}>
                        {donorLabel || "Search and select a donor…"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0 border-border/50 bg-card/95 backdrop-blur-xl" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput placeholder="Search by name or email…" value={donorSearch} onValueChange={setDonorSearch} />
                      <CommandList className="max-h-64 overflow-y-auto overscroll-contain">
                        {donorsLoading ? (
                          <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Searching…
                          </div>
                        ) : (
                          <>
                            <CommandEmpty>
                              <div className="py-3 text-sm text-muted-foreground">No donors found.</div>
                            </CommandEmpty>
                            <CommandGroup>
                              {donorResults.map((d) => {
                                const label = `${d.last_name} ${d.first_name}`.trim();
                                return (
                                  <CommandItem key={d.id} value={d.id} onSelect={() => {
                                    setDonorId(d.id); setDonorLabel(label); setDonorEmail(d.email || "");
                                    setDonorPopoverOpen(false);
                                  }}>
                                    <Check className={cn("mr-2 h-4 w-4", donorId === d.id ? "opacity-100" : "opacity-0")} />
                                    <span className="flex-1 truncate">{label}</span>
                                    {d.email && <span className="text-xs text-muted-foreground ml-2 truncate">{d.email}</span>}
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </>
                        )}
                      </CommandList>
                      <div className="border-t border-border/40 p-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start hover:bg-primary/10 hover:text-primary"
                          onClick={() => { setDonorPopoverOpen(false); setRegisterOpen(true); }}
                        >
                          <UserPlus className="h-4 w-4 mr-2" /> Register new donor
                        </Button>
                      </div>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          {/* Meta panel */}
          <div className="rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm p-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Donation Date</Label>
              <Input type="date" className="bg-background/60 border-border/50" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Message <span className="normal-case text-muted-foreground/70">(optional)</span></Label>
              <Textarea rows={2} className="bg-background/60 border-border/50 resize-none" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Note about this donation" />
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border/30 bg-card/40 backdrop-blur-sm rounded-b-2xl gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="bg-background/60 border-border/50">Cancel</Button>
          <Button onClick={handleSubmit} disabled={createDonation.isPending} className="bg-gradient-to-r from-primary to-purple-600 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:opacity-95">
            {createDonation.isPending ? "Recording…" : "Record Donation"}
          </Button>
        </DialogFooter>

        <RegisterDonorDialog
          open={registerOpen}
          onOpenChange={setRegisterOpen}
          onCreated={handleDonorCreated}
          initialName={donorSearch}
        />
      </DialogContent>
    </Dialog>
  );
};

export default RecordDonationDialog;
