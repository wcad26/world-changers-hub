
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { transactionSchema, useCreateFinancialTransaction, useFinancialCategories } from '@/hooks/useFinancials';
import { useDcgs } from '@/hooks/useDCGs';

interface AddTransactionDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

// We'll use a slightly different schema for the form to handle the Date object from the calendar component.
const formSchema = transactionSchema.extend({
  transaction_date: z.date({
    required_error: "A transaction date is required.",
  }),
});

export const AddTransactionDialog: React.FC<AddTransactionDialogProps> = ({ open, setOpen }) => {
  const createTransactionMutation = useCreateFinancialTransaction();
  const { data: dcgs, isLoading: isLoadingDcgs } = useDcgs();
  const { data: categories, isLoading: isLoadingCategories } = useFinancialCategories();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category_id: '',
      amount: 0,
      description: '',
      transaction_date: new Date(),
      dcg_id: '',
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Convert form data to match the expected mutation type
    const submissionData = {
      ...values,
      dcg_id: values.dcg_id || null, // Ensure empty string becomes null for the database
      transaction_date: values.transaction_date.toISOString(), // Convert Date object to ISO string
    };
    
    createTransactionMutation.mutate(submissionData, {
      onSuccess: () => {
        toast.success('Transaction added successfully!');
        form.reset();
        setOpen(false);
      },
      onError: (error) => {
        toast.error(`Failed to add transaction: ${error.message}`);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Transaction</DialogTitle>
          <DialogDescription>
            Fill in the details below to record a new financial transaction.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <FormField
              control={form.control}
              name="dcg_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>DCG (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger disabled={isLoadingDcgs}>
                        <SelectValue placeholder="Select a DCG" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">None (Region-level)</SelectItem>
                      {dcgs?.map(dcg => <SelectItem key={dcg.id} value={dcg.id}>{dcg.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger disabled={isLoadingCategories}>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories?.map(cat => <SelectItem key={cat.id} value={cat.id}>{`${cat.name} (${cat.type})`}</SelectItem>)}
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
                  <FormLabel>Transaction Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="A brief description of the transaction" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createTransactionMutation.isPending}>
                {createTransactionMutation.isPending ? 'Adding...' : 'Add Transaction'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

