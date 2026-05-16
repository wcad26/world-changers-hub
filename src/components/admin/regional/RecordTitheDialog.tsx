import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Check, ChevronsUpDown, HandCoins } from "lucide-react";

import { cn } from "@/lib/utils";
import { useMembers } from "@/hooks/useMembers";
import { useAuth } from "@/hooks/useAuth";
import { useCreateFinancialTransaction, useFinancialCategories } from "@/hooks/useFinancials";
import { useRegionalEventsForOfferings } from "@/hooks/useRegionalData";
import { useRegionCurrency } from "@/hooks/useCurrencies";
import { getCurrencySymbol } from "@/utils/currencyUtils";
import { toast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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

const NO_EVENT = "__none__";

const titheSchema = z.object({
  memberId: z.string().uuid({ message: "Please select a member" }),
  event_id: z.string().optional(),
  amount: z.coerce.number().positive("Amount must be positive"),
  method: z.string().min(1, "Please select a payment method"),
  notes: z.string().optional(),
});

type TitheFormData = z.infer<typeof titheSchema>;

const formatAmountInput = (raw: string) => {
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

interface RecordTitheDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RecordTitheDialog: React.FC<RecordTitheDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { userRegion } = useAuth();
  const { data: regionCurrency } = useRegionCurrency(userRegion?.id);
  const currencySymbol = getCurrencySymbol(regionCurrency);
  const { data: members = [] } = useMembers(userRegion?.id);
  const { data: categories = [] } = useFinancialCategories();
  const { data: events = [], isLoading: eventsLoading } = useRegionalEventsForOfferings(userRegion?.id);
  const createTransaction = useCreateFinancialTransaction();

  const [memberOpen, setMemberOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [amountText, setAmountText] = useState("");

  const form = useForm<TitheFormData>({
    resolver: zodResolver(titheSchema),
    defaultValues: {
      memberId: "",
      event_id: NO_EVENT,
      amount: undefined as unknown as number,
      method: "",
      notes: "",
    },
  });

  const titheCategory = useMemo(
    () => categories.find((c) => c.type === "Income" && c.name === "Tithes"),
    [categories],
  );

  const selectedMemberId = form.watch("memberId");
  const selectedEventId = form.watch("event_id");
  const selectedMember = members.find((m) => m.id === selectedMemberId);
  const selectedEvent = selectedEventId && selectedEventId !== NO_EVENT
    ? events.find((e) => e.id === selectedEventId)
    : undefined;

  const memberLabel = (m: typeof members[number]) =>
    `${m.profiles?.last_name ?? ""} ${m.profiles?.first_name ?? ""}`.trim();

  const onSubmit = async (data: TitheFormData) => {
    if (!titheCategory) {
      toast({
        title: "Error",
        description: "Tithes category not found. Please contact your administrator.",
        variant: "destructive",
      });
      return;
    }

    const member = members.find((m) => m.id === data.memberId);
    if (!member) return;

    const event = data.event_id && data.event_id !== NO_EVENT
      ? events.find((e) => e.id === data.event_id)
      : null;

    const transactionDate = event
      ? format(new Date(event.start_datetime), "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd");

    const memberName = memberLabel(member);
    const desc = `Tithe — ${memberName}${event ? ` · ${event.name}` : ""}${data.notes ? `: ${data.notes}` : ""} (${data.method})`;

    try {
      await createTransaction.mutateAsync({
        category_id: titheCategory.id,
        amount: data.amount,
        description: desc,
        transaction_date: transactionDate,
        dcg_id: null,
      });

      toast({ title: "Success", description: "Tithe recorded successfully" });
      form.reset({
        memberId: "",
        event_id: NO_EVENT,
        amount: undefined as unknown as number,
        method: "",
        notes: "",
      });
      setAmountText("");
      onOpenChange(false);
    } catch {
      toast({
        title: "Error",
        description: "Failed to record tithe. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0 border border-border/40 bg-gradient-to-br from-card/95 to-muted/20 backdrop-blur-xl shadow-2xl rounded-2xl">
        <div className="relative shrink-0 overflow-hidden rounded-t-2xl border-b border-border/30 bg-gradient-to-br from-primary/15 via-primary/5 to-purple-500/10 px-6 pt-6 pb-5">
          <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />
          <DialogHeader className="relative space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600 text-primary-foreground shadow-lg shadow-primary/20">
                <HandCoins className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">Record Tithe</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Date defaults to today, or the event date if linked.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-4">
              <div className="rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm p-4 space-y-4">
                {/* Member */}
                <FormField
                  control={form.control}
                  name="memberId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Member
                      </FormLabel>
                      <Popover open={memberOpen} onOpenChange={setMemberOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between bg-background/60 border-border/50 font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              <span className="truncate">
                                {selectedMember ? memberLabel(selectedMember) : "Select a member"}
                              </span>
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                          <Command className="max-h-80">
                            <CommandInput placeholder="Search members…" />
                            <CommandList
                              className="h-72 max-h-72 overflow-y-scroll overscroll-contain pr-1 touch-pan-y"
                              onWheelCapture={(event) => event.stopPropagation()}
                            >
                              <CommandEmpty>No members found.</CommandEmpty>
                              <CommandGroup className="overflow-visible">
                                {members.map((m) => {
                                  const label = memberLabel(m);
                                  return (
                                    <CommandItem
                                      key={m.id}
                                      value={label}
                                      onSelect={() => {
                                        field.onChange(m.id);
                                        setMemberOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          field.value === m.id ? "opacity-100" : "opacity-0",
                                        )}
                                      />
                                      <span className="truncate">{label}</span>
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Linked Event (optional) */}
                <FormField
                  control={form.control}
                  name="event_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Linked Event (Optional)
                      </FormLabel>
                      <Popover open={eventOpen} onOpenChange={setEventOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between bg-background/60 border-border/50 font-normal"
                            >
                              <span className="truncate">
                                {selectedEvent
                                  ? `${selectedEvent.name} · ${format(new Date(selectedEvent.start_datetime), "MMM dd, yyyy")}`
                                  : eventsLoading
                                    ? "Loading events…"
                                    : "No event — general tithe"}
                              </span>
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                          <Command className="max-h-80">
                            <CommandInput placeholder="Search events…" />
                            <CommandList
                              className="h-72 max-h-72 overflow-y-scroll overscroll-contain pr-1 touch-pan-y"
                              onWheelCapture={(event) => event.stopPropagation()}
                            >
                              <CommandEmpty>No events found.</CommandEmpty>
                              <CommandGroup className="overflow-visible">
                                <CommandItem
                                  value="No event — general tithe"
                                  onSelect={() => {
                                    field.onChange(NO_EVENT);
                                    setEventOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      !field.value || field.value === NO_EVENT ? "opacity-100" : "opacity-0",
                                    )}
                                  />
                                  <span className="truncate">No event — general tithe</span>
                                </CommandItem>
                                {events.map((e) => {
                                  const label = `${e.name} · ${format(new Date(e.start_datetime), "MMM dd, yyyy")}`;
                                  return (
                                    <CommandItem
                                      key={e.id}
                                      value={label}
                                      onSelect={() => {
                                        field.onChange(e.id);
                                        setEventOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          field.value === e.id ? "opacity-100" : "opacity-0",
                                        )}
                                      />
                                      <span className="truncate">{label}</span>
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <p className="text-xs text-muted-foreground pt-1">
                        Date: {selectedEvent
                          ? format(new Date(selectedEvent.start_datetime), "PPP")
                          : format(new Date(), "PPP")}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Amount */}
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Amount ({currencySymbol})
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="0"
                          className="bg-background/60 border-border/50"
                          value={amountText}
                          onChange={(e) => {
                            const formatted = formatAmountInput(e.target.value);
                            setAmountText(formatted);
                            field.onChange(parseAmount(formatted));
                          }}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Payment Method */}
                <FormField
                  control={form.control}
                  name="method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Payment Method
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background/60 border-border/50">
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="check">Check</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="credit_card">Credit Card</SelectItem>
                          <SelectItem value="mobile_payment">Mobile Payment</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Notes (Optional)
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional notes about this tithe…"
                          className="bg-background/60 border-border/50 resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="shrink-0 px-6 py-4 border-t border-border/30 bg-card/40 backdrop-blur-sm rounded-b-2xl gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="bg-background/60 border-border/50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createTransaction.isPending}
                className="bg-gradient-to-r from-primary to-purple-600 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:opacity-95"
              >
                {createTransaction.isPending ? "Recording…" : "Record Tithe"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
