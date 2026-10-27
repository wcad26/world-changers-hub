import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { ArrowDownRight, ArrowUpRight, CalendarIcon, Loader2, Pencil } from 'lucide-react';
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
import { useUpdateDcgTransaction, type DcgFinancialTransaction } from '@/hooks/useDcgFinancials';
import type { Currency } from '@/hooks/useCurrencies';
import { getCurrencySymbol } from '@/utils/currencyUtils';
import { SheetHeader } from '@/components/admin/dcg/DcgUI';

const editSchema = z.object({
  category_id: z.string().uuid('Please select a category'),
  amount: z.coerce.number().positive('Amount must be positive'),
  description: z.string().optional().nullable(),
  transaction_date: z.date(),
});

type EditFormData = z.infer<typeof editSchema>;

const parseLocalDate = (raw: string): Date => {
  if (!raw) return new Date();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, m, d] = raw.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  const parsed = new Date(raw);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
};

interface EditDcgTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dcgId: string;
  transaction: DcgFinancialTransaction | null;
  regionCurrency?: Currency | null;
}

export const EditDcgTransactionDialog: React.FC<EditDcgTransactionDialogProps> = ({
  open,
  onOpenChange,
  dcgId,
  transaction,
  regionCurrency,
}) => {
  const currencySymbol = getCurrencySymbol(regionCurrency);
  const { data: categories = [] } = useFinancialCategories();
  const updateMutation = useUpdateDcgTransaction(dcgId);

  const initialType: 'income' | 'expense' =
    (transaction?.category?.type || '').toLowerCase() === 'expense' ? 'expense' : 'income';
  const [selectedType, setSelectedType] = useState<'income' | 'expense'>(initialType);

  const filteredCategories = categories.filter(
    (c) => (c.type || '').toLowerCase() === selectedType,
  );

  const form = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      category_id: '',
      amount: 0,
      description: '',
      transaction_date: new Date(),
    },
  });

  useEffect(() => {
    if (transaction && open) {
      const tType: 'income' | 'expense' =
        (transaction.category?.type || '').toLowerCase() === 'expense' ? 'expense' : 'income';
      setSelectedType(tType);
      form.reset({
        category_id: transaction.category_id || '',
        amount: Number(transaction.amount) || 0,
        description: transaction.description || '',
        transaction_date: parseLocalDate(transaction.transaction_date),
      });
    }
  }, [transaction, open, form]);

  const handleTypeSwitch = (nextType: 'income' | 'expense') => {
    if (nextType === selectedType) return;
    setSelectedType(nextType);
    const matching = categories.filter((c) => (c.type || '').toLowerCase() === nextType);
    // If the original transaction belonged to this type, restore its category; otherwise pick the first available category
    if (
      transaction?.category_id &&
      (transaction.category?.type || '').toLowerCase() === nextType
    ) {
      form.setValue('category_id', transaction.category_id, { shouldValidate: true });
    } else {
      form.setValue('category_id', matching[0]?.id || '', { shouldValidate: true });
    }
  };

  const onSubmit = async (data: EditFormData) => {
    if (!transaction) return;
    try {
      await updateMutation.mutateAsync({
        id: transaction.id,
        data: {
          category_id: data.category_id,
          amount: data.amount,
          description: data.description?.trim() ? data.description.trim() : null,
          transaction_date: format(data.transaction_date, 'yyyy-MM-dd'),
        },
      });
      toast.success('Financial record updated');
      onOpenChange(false);
    } catch (e: any) {
      toast.error('Failed to update record', {
        description: e?.message ?? 'Please try again.',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-[460px]">
        <SheetHeader
          icon={Pencil}
          title="Edit Financial Record"
          description="Update transaction type, category, amount, date, or notes."
        />
        <DialogHeader className="sr-only">
          <DialogTitle>Edit Financial Record</DialogTitle>
          <DialogDescription>Update this DCG financial transaction.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Transaction Type Switcher */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Transaction Type</label>
              <div className="grid grid-cols-2 gap-1.5 rounded-full border border-border bg-muted/50 p-1">
                <button
                  type="button"
                  onClick={() => handleTypeSwitch('income')}
                  className={cn(
                    'inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-all',
                    selectedType === 'income'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  Income
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeSwitch('expense')}
                  className={cn(
                    'inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-all',
                    selectedType === 'expense'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <ArrowDownRight className="h-3.5 w-3.5" />
                  Expense
                </button>
              </div>
            </div>

            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
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
                      placeholder="Additional details..."
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
                disabled={updateMutation.isPending}
                className="rounded-full bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-regal hover:opacity-95"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
