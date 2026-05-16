import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { useFinancialCategories } from "@/hooks/useFinancials";
import { useUpdateRegionalTransaction } from "@/hooks/useRegionalLedger";
import type { LedgerRow } from "@/hooks/useRegionalLedger";

const editSchema = z.object({
  category_id: z.string().uuid("Please select a category"),
  amount: z.coerce.number().positive("Amount must be positive"),
  description: z.string().optional().nullable(),
  transaction_date: z.date(),
});

type EditFormData = z.infer<typeof editSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: LedgerRow | null;
}

export const EditDcgTransactionDialog: React.FC<Props> = ({ open, onOpenChange, transaction }) => {
  const { data: categories } = useFinancialCategories();
  const updateMutation = useUpdateRegionalTransaction();

  const txType = transaction?.category?.type ?? "Income";
  const filteredCategories = (categories || []).filter(c => c.type === txType);

  const form = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: { category_id: "", amount: 0, description: "", transaction_date: new Date() },
  });

  useEffect(() => {
    if (transaction && open) {
      form.reset({
        category_id: transaction.category_id || "",
        amount: Number(transaction.amount),
        description: transaction.description || "",
        transaction_date: new Date(transaction.transaction_date),
      });
    }
  }, [transaction, open, form]);

  const onSubmit = async (data: EditFormData) => {
    if (!transaction) return;
    try {
      await updateMutation.mutateAsync({
        id: transaction.id,
        data: {
          category_id: data.category_id,
          amount: data.amount,
          description: data.description ?? null,
          transaction_date: format(data.transaction_date, "yyyy-MM-dd"),
        },
      });
      toast.success("Transaction updated");
      onOpenChange(false);
    } catch (e: any) {
      toast.error("Failed to update transaction", { description: e?.message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-0 gap-0 border border-border/40 bg-gradient-to-br from-card/95 to-muted/20 backdrop-blur-xl shadow-2xl rounded-2xl">
        <div className="relative overflow-hidden rounded-t-2xl border-b border-border/30 bg-gradient-to-br from-primary/15 via-primary/5 to-purple-500/10 px-6 pt-6 pb-5">
          <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />
          <DialogHeader className="relative space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600 text-primary-foreground shadow-lg shadow-primary/20">
                <Pencil className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">Edit {txType} Transaction</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {transaction?.dcg?.name ?? "DCG"} · {transaction ? format(new Date(transaction.transaction_date), "MMM dd, yyyy") : ""}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="px-6 py-5 space-y-4">
              <div className="rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm p-4 space-y-4">
                <FormField control={form.control} name="category_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background/60 border-border/50"><SelectValue placeholder="Select category" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredCategories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="amount" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Amount</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" className="bg-background/60 border-border/50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="transaction_date" render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" className={cn("bg-background/60 border-border/50 pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                              {field.value ? format(field.value, "PP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange}
                            disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                            initialFocus className="pointer-events-auto" />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Additional details..." className="bg-background/60 border-border/50 resize-none" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            <DialogFooter className="px-6 py-4 border-t border-border/30 bg-card/40 backdrop-blur-sm rounded-b-2xl gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="bg-background/60 border-border/50">Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}
                className="bg-gradient-to-r from-primary to-purple-600 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:opacity-95">
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditDcgTransactionDialog;
