import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Check, ChevronsUpDown, Receipt, Upload, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useMembers } from "@/hooks/useMembers";
import { useRegionCurrency } from "@/hooks/useCurrencies";
import { getCurrencySymbol } from "@/utils/currencyUtils";
import { useCreateFinancialTransaction, useFinancialCategories } from "@/hooks/useFinancials";
import { toast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const expenseSchema = z.object({
  date: z.date({ required_error: "Date is required" }),
  category_id: z.string().uuid("Please select a category"),
  member_id: z.string().uuid("Please select the member in charge"),
  item: z.string().min(1, "Item or service is required"),
  payee: z.string().min(1, "Payee is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  notes: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

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

interface RecordExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RecordExpenseDialog: React.FC<RecordExpenseDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { userRegion } = useAuth();
  const { data: regionCurrency } = useRegionCurrency(userRegion?.id);
  const currencySymbol = getCurrencySymbol(regionCurrency);
  const { data: members = [] } = useMembers(userRegion?.id);
  const { data: categories = [] } = useFinancialCategories();
  const createTransaction = useCreateFinancialTransaction();

  const [memberOpen, setMemberOpen] = useState(false);
  const [amountText, setAmountText] = useState("");
  const [receiptImage, setReceiptImage] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === "Expense"),
    [categories],
  );

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: new Date(),
      category_id: "",
      member_id: "",
      item: "",
      payee: "",
      amount: undefined as unknown as number,
      notes: "",
    },
  });

  const selectedMemberId = form.watch("member_id");
  const selectedMember = members.find((m) => m.id === selectedMemberId);

  const memberLabel = (m: typeof members[number]) =>
    `${m.profiles?.last_name ?? ""} ${m.profiles?.first_name ?? ""}`.trim();

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setReceiptImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setReceiptPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setReceiptImage(null);
    setReceiptPreview(null);
  };

  const onSubmit = async (data: ExpenseFormData) => {
    const member = members.find((m) => m.id === data.member_id);
    if (!member) return;

    const memberName = memberLabel(member);
    const desc = `${data.item} — Payee: ${data.payee} · In charge: ${memberName}${
      data.notes ? `: ${data.notes}` : ""
    }`;

    try {
      await createTransaction.mutateAsync({
        category_id: data.category_id,
        amount: data.amount,
        description: desc,
        transaction_date: format(data.date, "yyyy-MM-dd"),
        dcg_id: null,
      });

      toast({ title: "Success", description: "Expense recorded successfully" });
      form.reset({
        date: new Date(),
        category_id: "",
        member_id: "",
        item: "",
        payee: "",
        amount: undefined as unknown as number,
        notes: "",
      });
      setAmountText("");
      removeImage();
      onOpenChange(false);
    } catch {
      toast({
        title: "Error",
        description: "Failed to record expense. Please try again.",
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
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">Record Expense</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Log a regional expense and the member who handled it.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 min-h-0 overflow-hidden"
          >
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-4">
              <div className="rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm p-4 space-y-4">
                {/* Date */}
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Date
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              className={cn(
                                "w-full justify-between bg-background/60 border-border/50 font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Category */}
                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Category
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background/60 border-border/50">
                            <SelectValue placeholder="Select expense category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {expenseCategories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Member in charge */}
                <FormField
                  control={form.control}
                  name="member_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Member in charge
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
                        <PopoverContent
                          className="w-[var(--radix-popover-trigger-width)] p-0"
                          align="start"
                        >
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

                {/* Item or service */}
                <FormField
                  control={form.control}
                  name="item"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Item or service
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="What was bought or paid for"
                          className="bg-background/60 border-border/50"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description (acts as notes) */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Description (Optional)
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional details about this expense…"
                          className="bg-background/60 border-border/50 resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Payee */}
                <FormField
                  control={form.control}
                  name="payee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Payee
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Who was paid"
                          className="bg-background/60 border-border/50"
                          {...field}
                        />
                      </FormControl>
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

                {/* Receipt Image */}
                <div className="space-y-2">
                  <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Receipt Image (Optional)
                  </FormLabel>
                  <div className="border-2 border-dashed border-border/50 rounded-xl p-5 text-center bg-background/40">
                    {receiptPreview ? (
                      <div className="space-y-3">
                        <div className="relative inline-block">
                          <img
                            src={receiptPreview}
                            alt="Receipt preview"
                            className="max-w-full max-h-48 object-contain rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 h-6 w-6 p-0"
                            onClick={removeImage}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">{receiptImage?.name}</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="mx-auto h-7 w-7 text-muted-foreground" />
                        <div>
                          <label
                            htmlFor="receipt-upload"
                            className="cursor-pointer text-primary hover:underline text-sm"
                          >
                            Click to upload receipt
                          </label>
                          <input
                            id="receipt-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                      </div>
                    )}
                  </div>
                </div>

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
                {createTransaction.isPending ? "Recording…" : "Record Expense"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default RecordExpenseDialog;
