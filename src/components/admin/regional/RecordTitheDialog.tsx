import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMembers } from "@/hooks/useMembers";
import { useAuth } from "@/hooks/useAuth";
import { useCreateFinancialTransaction, useFinancialCategories } from "@/hooks/useFinancials";
import { toast } from "@/hooks/use-toast";
import { useRegionCurrency } from "@/hooks/useCurrencies";
import { getCurrencySymbol } from "@/utils/currencyUtils";

const titheSchema = z.object({
  date: z.string().min(1, { message: "Date is required" }),
  memberId: z.string().min(1, { message: "Please select a member" }),
  amount: z.string().min(1, { message: "Amount is required" }),
  method: z.string().min(1, { message: "Please select a payment method" }),
  notes: z.string().optional(),
});

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
  const currencySymbol = regionCurrency ? getCurrencySymbol(regionCurrency.code) : '$';
  const { data: members = [] } = useMembers(userRegion?.id);
  const { data: categories = [] } = useFinancialCategories();
  const createTransaction = useCreateFinancialTransaction();

  const form = useForm<z.infer<typeof titheSchema>>({
    resolver: zodResolver(titheSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      memberId: "",
      amount: "",
      method: "",
      notes: "",
    },
  });

  const titheCategory = categories.find(cat => 
    cat.type === 'Income' && cat.name.toLowerCase().includes('tithe')
  );

  const onSubmit = async (values: z.infer<typeof titheSchema>) => {
    if (!titheCategory) {
      toast({
        title: "Error",
        description: "Tithe category not found. Please contact your administrator.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createTransaction.mutateAsync({
        category_id: titheCategory.id,
        amount: parseFloat(values.amount),
        description: `Tithe from member - ${values.method}${values.notes ? ` - ${values.notes}` : ''}`,
        transaction_date: values.date,
        dcg_id: null,
      });

      toast({
        title: "Success",
        description: "Tithe recorded successfully!",
      });

      form.reset({
        date: new Date().toISOString().split('T')[0],
        memberId: "",
        amount: "",
        method: "",
        notes: "",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record tithe. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Tithe</DialogTitle>
          <DialogDescription>
            Record a new tithe payment from a member.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="memberId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Member</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a member" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {members.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.profiles?.first_name} {member.profiles?.last_name}
                        </SelectItem>
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
                  <FormLabel>Amount ({currencySymbol})</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
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
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional notes about this tithe..." 
                      className="resize-none" 
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createTransaction.isPending}
              >
                {createTransaction.isPending ? "Recording..." : "Record Tithe"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};