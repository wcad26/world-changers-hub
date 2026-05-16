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
import { useFundraisingCampaigns, useCreateDonation } from "@/hooks/useFundraisingCampaigns";
import { useSearchDonors, type DonorRow } from "@/hooks/useDonors";
import { useAuth } from "@/hooks/useAuth";
import { useRegionCurrency } from "@/hooks/useCurrencies";
import { getCurrencySymbol } from "@/utils/currencyUtils";
import { cn } from "@/lib/utils";
import RegisterDonorDialog from "./RegisterDonorDialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCampaignId?: string;
}

type DonorType = "member" | "external" | "anonymous";

const RecordDonationDialog: React.FC<Props> = ({ open, onOpenChange, defaultCampaignId }) => {
  const { toast } = useToast();
  const { userRegion } = useAuth();
  const { data: regionCurrency } = useRegionCurrency(userRegion?.id);
  const symbol = getCurrencySymbol(regionCurrency);
  const { data: campaigns = [] } = useFundraisingCampaigns();
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
      setDonorType("member");
      setMemberId(""); setMemberLabel(""); setMemberSearch("");
      setDonorId(""); setDonorLabel(""); setDonorEmail(""); setDonorSearch("");
      setAmount(0);
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
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

          <div className="space-y-2">
            <Label>Donor Type</Label>
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
                    "flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer text-sm font-normal",
                    donorType === t ? "border-primary bg-primary/5" : "border-border"
                  )}
                >
                  <RadioGroupItem id={`dt-${t}`} value={t} />
                  <span className="capitalize">{t === "external" ? "External donor" : t}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>

          {donorType === "member" && (
            <div className="space-y-2">
              <Label>Member</Label>
              <Popover open={memberPopoverOpen} onOpenChange={setMemberPopoverOpen} modal={true}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" role="combobox" className="w-full justify-between font-normal">
                    <span className={cn("truncate", !memberLabel && "text-muted-foreground")}>
                      {memberLabel || "Search and select a member…"}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
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
              <Label>External Donor</Label>
              <Popover open={donorPopoverOpen} onOpenChange={setDonorPopoverOpen} modal={true}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" role="combobox" className="w-full justify-between font-normal">
                    <span className={cn("truncate", !donorLabel && "text-muted-foreground")}>
                      {donorLabel || "Search and select a donor…"}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
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
                    <div className="border-t p-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
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
