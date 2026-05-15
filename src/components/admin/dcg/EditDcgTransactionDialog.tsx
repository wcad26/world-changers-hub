import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { useFinancialCategories } from "@/hooks/useFinancials";
import { useUpdateDcgTransaction, type DcgFinancialTransaction } from "@/hooks/useDcgFinancials";

const editSchema = z.object({
  category_id: z.string().uuid("Please select a category"),
  amount: z.coerce.number().positive("Amount must be positive"),
  description: z.string().optional().nullable(),
  transaction_date: z.date(),
});

type EditFormData = z.infer<typeof editSchema>;

interface EditDcgTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dcgId: string;
  transaction: DcgFinancialTransaction | null;
}

export const EditDcgTransactionDialog: React.FC<EditDcgTransactionDialogProps> = ({
  open, onOpenChange, dcgId, transaction,
}) => {
  const { data: categories } = useFinancialCategories();
  const updateMutation = useUpdateDcgTransaction(dcgId);

  const txType = transaction?.category?.type ?? "Income";
  const filteredCategories = (categories || []).filter(c => c.type === txType);

  const form = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      category_id: "",
      amount: 0,
      description: "",
      transaction_date: new Date(),
    },
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit {txType} Transaction</DialogTitle>
          <DialogDescription>
            Update this DCG financial transaction.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredCategories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="transaction_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional details..."
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
