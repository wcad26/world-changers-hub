import React, { useEffect, useMemo, useState } from "react";
import { PiggyBank, Check, ChevronsUpDown, Loader2, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateFinancialTransaction,
  useFinancialCategories,
} from "@/hooks/useFinancials";
import { useSearchDonors, type DonorRow } from "@/hooks/useDonors";
import { useAuth } from "@/hooks/useAuth";
import { useRegionCurrency } from "@/hooks/useCurrencies";
import { getCurrencySymbol } from "@/utils/currencyUtils";
import { cn } from "@/lib/utils";
import RegisterDonorDialog from "./finances/RegisterDonorDialog";

type GiverType = "member" | "external" | "anonymous";

interface RecordSpecialGivingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatAmount = (raw: string) => {
  const cleaned = raw.replace(/[^\d.]/g, "");
  const parts = cleaned.split(".");
  const intPart = parts[0].replace(/^0+(?=\d)/, "");
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (parts.length === 1) return withCommas;
  return `${withCommas}.${parts.slice(1).join("").slice(0, 2)}`;
};
const parseAmount = (formatted: string) => {
  const n = parseFloat(formatted.replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const RecordSpecialGivingDialog: React.FC<RecordSpecialGivingDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { toast } = useToast();
  const { userRegion } = useAuth();
  const { data: regionCurrency } = useRegionCurrency(userRegion?.id);
  const symbol = getCurrencySymbol(regionCurrency);

  const { data: categories = [] } = useFinancialCategories();
  const specialGivingCategory = useMemo(
    () =>
      categories.find(
        (c) => c.type === "Income" && c.name?.toLowerCase() === "special giving"
      ),
    [categories]
  );

  const createTransaction = useCreateFinancialTransaction();

  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState<string>("");
  const [method, setMethod] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const [giverType, setGiverType] = useState<GiverType>("member");

  // Member selection
  const [memberId, setMemberId] = useState<string>("");
  const [memberLabel, setMemberLabel] = useState<string>("");
  const [memberSearch, setMemberSearch] = useState("");
  const [memberPopoverOpen, setMemberPopoverOpen] = useState(false);

  // Donor selection
  const [donorId, setDonorId] = useState<string>("");
  const [donorLabel, setDonorLabel] = useState<string>("");
  const [donorSearch, setDonorSearch] = useState("");
  const [donorPopoverOpen, setDonorPopoverOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setDate(new Date().toISOString().slice(0, 10));
      setAmount("");
      setMethod("");
      setDescription("");
      setGiverType("member");
      setMemberId(""); setMemberLabel(""); setMemberSearch("");
      setDonorId(""); setDonorLabel(""); setDonorSearch("");
    }
  }, [open]);

  const { data: memberResults = [], isFetching: membersLoading } = useQuery({
    queryKey: ["special-giving-member-search", memberSearch],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("search_all_members", { _search: memberSearch });
      if (error) throw error;
      return (data || []) as Array<{ id: string; member_id: string; first_name: string; last_name: string }>;
    },
    enabled: open && giverType === "member",
  });

  const { data: donorResults = [], isFetching: donorsLoading } = useSearchDonors(
    donorSearch,
    open && giverType === "external"
  );

  const handleDonorCreated = (donor: DonorRow) => {
    const label = `${donor.last_name} ${donor.first_name}`.trim();
    setDonorId(donor.id);
    setDonorLabel(label);
    setDonorPopoverOpen(false);
  };

  const handleSubmit = async () => {
    const amt = parseAmount(amount);
    if (!amt || amt <= 0) {
      toast({ title: "Invalid amount", description: "Enter an amount greater than zero.", variant: "destructive" });
      return;
    }
    if (!method) {
      toast({ title: "Payment method required", description: "Select a payment method.", variant: "destructive" });
      return;
    }
    if (!description.trim()) {
      toast({ title: "Description required", description: "Describe the purpose of the special giving.", variant: "destructive" });
      return;
    }
    if (giverType === "member" && !memberId) {
      toast({ title: "Giver required", description: "Select a member or change giver type.", variant: "destructive" });
      return;
    }
    if (giverType === "external" && !donorId) {
      toast({ title: "Giver required", description: "Select a donor or register a new one.", variant: "destructive" });
      return;
    }
    if (!specialGivingCategory) {
      toast({ title: "Category missing", description: "Special Giving category is not configured.", variant: "destructive" });
      return;
    }

    const giverName =
      giverType === "anonymous"
        ? "Anonymous"
        : giverType === "member"
        ? memberLabel
        : donorLabel;

    const desc = `${description.trim()} · Giver: ${giverName} (${method})`;

    try {
      await createTransaction.mutateAsync({
        amount: amt,
        category_id: specialGivingCategory.id,
        transaction_date: format(new Date(date), "yyyy-MM-dd"),
        description: desc,
        dcg_id: null,
      } as any);
      toast({ title: "Special giving recorded", description: `${symbol} ${amt.toLocaleString("en-US")} added.` });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Failed to record", description: e?.message || "Please try again.", variant: "destructive" });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] p-0 gap-0 border border-border/40 bg-gradient-to-br from-card/95 to-muted/20 backdrop-blur-xl shadow-2xl rounded-2xl flex flex-col overflow-hidden">
          {/* Gradient header */}
          <div className="relative overflow-hidden rounded-t-2xl border-b border-border/30 bg-gradient-to-br from-primary/15 via-primary/5 to-purple-500/10 px-6 pt-6 pb-5 shrink-0">
            <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
            <DialogHeader className="relative space-y-1.5">
              <DialogTitle className="flex items-center gap-3 text-xl">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600 text-primary-foreground shadow-lg shadow-primary/20">
                  <PiggyBank className="h-5 w-5" />
                </span>
                Record Special Giving
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Log a special giving entry against the regional ledger.
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Scrollable body */}
          <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
            {/* Date + Amount + Method */}
            <div className="rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm p-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</Label>
                <Input
                  type="date"
                  className="bg-background/60 border-border/50"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">{symbol}</span>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="5,000"
                    className="pl-9 bg-background/60 border-border/50 text-base font-semibold"
                    value={amount}
                    onChange={(e) => setAmount(formatAmount(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Payment Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className="bg-background/60 border-border/50">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="mobile_payment">Mobile Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Giver section */}
            <div className="rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm p-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Giver Type</Label>
                <RadioGroup
                  value={giverType}
                  onValueChange={(v) => setGiverType(v as GiverType)}
                  className="grid grid-cols-3 gap-2"
                >
                  {(["member", "external", "anonymous"] as GiverType[]).map((t) => (
                    <Label
                      key={t}
                      htmlFor={`gt-${t}`}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 cursor-pointer text-sm font-medium transition-all",
                        giverType === t
                          ? "border-primary bg-gradient-to-br from-primary/15 to-purple-500/10 text-foreground shadow-sm"
                          : "border-border/50 bg-background/40 text-muted-foreground hover:bg-background/70 hover:text-foreground"
                      )}
                    >
                      <RadioGroupItem id={`gt-${t}`} value={t} className="sr-only" />
                      <span className="capitalize">{t === "external" ? "External" : t}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              {giverType === "member" && (
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
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 border-border/50 bg-card/95 backdrop-blur-xl" align="start">
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

              {giverType === "external" && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">External Giver</Label>
                  <Popover open={donorPopoverOpen} onOpenChange={setDonorPopoverOpen} modal={true}>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" role="combobox" className="w-full justify-between font-normal bg-background/60 border-border/50">
                        <span className={cn("truncate", !donorLabel && "text-muted-foreground")}>
                          {donorLabel || "Search and select a donor…"}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 border-border/50 bg-card/95 backdrop-blur-xl" align="start">
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
                                      setDonorId(d.id); setDonorLabel(label);
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

            {/* Description */}
            <div className="rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm p-4 space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Description</Label>
              <Textarea
                rows={3}
                className="bg-background/60 border-border/50 resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Purpose of this special giving (e.g. Building fund, missions trip, anniversary gift)"
              />
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-border/30 bg-card/40 backdrop-blur-sm shrink-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={createTransaction.isPending}
              className="bg-gradient-to-r from-primary to-purple-600 text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-95"
            >
              {createTransaction.isPending ? "Recording…" : "Record Special Giving"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RegisterDonorDialog
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        onCreated={handleDonorCreated}
      />
    </>
  );
};

export default RecordSpecialGivingDialog;
