import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { ArrowUpRight, CalendarIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useFinancialCategories } from '@/hooks/useFinancials';
import { useCreateDcgTransaction } from '@/hooks/useDcgFinancials';
import type { Currency } from '@/hooks/useCurrencies';
import { getCurrencySymbol } from '@/utils/currencyUtils';
import { SheetHeader } from '@/components/admin/dcg/DcgUI';

const incomeSchema = z.object({
  category_id: z.string().uuid('Please select a category'),
  amount: z.coerce.number().positive('Amount must be positive'),
  description: z.string().optional(),
  transaction_date: z.date(),
});

type IncomeFormData = z.infer<typeof incomeSchema>;

interface RecordDcgIncomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dcgId: string;
  regionCurrency?: Currency | null;
}

export const RecordDcgIncomeDialog: React.FC<RecordDcgIncomeDialogProps> = ({
  open,
  onOpenChange,
  dcgId,
  regionCurrency,
}) => {
  const currencySymbol = getCurrencySymbol(regionCurrency);
  const createTransaction = useCreateDcgTransaction(dcgId);
  const { data: categories } = useFinancialCategories();

  const form = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: { category_id: '', transaction_date: new Date(), description: '' },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        category_id: '',
        amount: undefined as unknown as number,
        transaction_date: new Date(),
        description: '',
      });
    }
  }, [open, form]);

  const incomeCategories =
    categories?.filter((cat) => (cat.type || '').toLowerCase() === 'income') || [];

  const onSubmit = async (data: IncomeFormData) => {
    if (!dcgId) {
      toast.error('DCG information not found');
      return;
    }
    try {
      await createTransaction.mutateAsync({
        category_id: data.category_id,
        amount: data.amount,
        description: data.description?.trim() ? data.description.trim() : null,
        transaction_date: format(data.transaction_date, 'yyyy-MM-dd'),
      });
      toast.success('Income recorded successfully');
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Failed to record income', {
        description: error?.message ?? 'Please try again.',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-[460px]">
        <SheetHeader
          icon={ArrowUpRight}
          title="Record DCG Income"
          description="Log offerings, contributions, or special giving for your DCG."
        />
        <DialogHeader className="sr-only">
          <DialogTitle>Record DCG Income</DialogTitle>
          <DialogDescription>Record income for your DCG</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Income Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue placeholder="Select income category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {incomeCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                        min="0"
                        placeholder="0.00"
                        className="h-11 rounded-xl tabular-nums"
                        {...field}
                        value={field.value ?? ''}
                      />
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
                            type="button"
                            variant="outline"
                            className={cn(
                              'h-11 w-full rounded-xl pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground',
                            )}
                          >
                            {field.value ? format(field.value, 'MMM d, yyyy') : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(d) => d && field.onChange(d)}
                          disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional details about this income..."
                      className="min-h-[84px] resize-none rounded-xl"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-full"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createTransaction.isPending}
                className="rounded-full bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-regal hover:opacity-95"
              >
                {createTransaction.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Recording...
                  </>
                ) : (
                  'Record Income'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
