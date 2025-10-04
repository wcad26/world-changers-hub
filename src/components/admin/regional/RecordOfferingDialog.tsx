import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useCreateFinancialTransaction } from '@/hooks/useFinancials';
import { useAuth } from '@/hooks/useAuth';
import { useRegionCurrency } from '@/hooks/useCurrencies';
import { getCurrencySymbol } from '@/utils/currencyUtils';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';

const offeringSchema = z.object({
  date: z.date({
    required_error: 'Date is required',
  }),
  service: z.string().min(1, 'Service is required'),
  amount: z.string().min(1, 'Amount is required'),
  category: z.string().min(1, 'Category is required'),
  notes: z.string().optional(),
});

type OfferingFormData = z.infer<typeof offeringSchema>;

interface RecordOfferingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RecordOfferingDialog: React.FC<RecordOfferingDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { toast } = useToast();
  const { userRegion } = useAuth();
  const { data: regionCurrency } = useRegionCurrency(userRegion?.id);
  const currencySymbol = regionCurrency ? getCurrencySymbol(regionCurrency.code) : '$';
  const createTransaction = useCreateFinancialTransaction();

  const form = useForm<OfferingFormData>({
    resolver: zodResolver(offeringSchema),
    defaultValues: {
      date: new Date(),
      service: '',
      amount: '',
      category: '',
      notes: '',
    },
  });

  const onSubmit = async (data: OfferingFormData) => {
    try {
      // Note: This is using mock categories. In a real implementation,
      // you would need to fetch the actual category IDs from the database
      const mockCategoryId = "mock-offering-category-id";
      
      await createTransaction.mutateAsync({
        amount: parseFloat(data.amount),
        category_id: mockCategoryId,
        transaction_date: data.date.toISOString().split('T')[0],
        description: `${data.service} - ${data.category}${data.notes ? `: ${data.notes}` : ''}`,
      });

      toast({
        title: 'Success',
        description: 'Offering recorded successfully',
      });

      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to record offering',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Record Offering
          </DialogTitle>
          <DialogDescription>
            Record a new offering entry with service and category details.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
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
                        disabled={(date) =>
                          date > new Date() || date < new Date('1900-01-01')
                        }
                        initialFocus
                        className={cn('p-3 pointer-events-auto')}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="service"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select service" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Sunday Morning">Sunday Morning</SelectItem>
                      <SelectItem value="Sunday Evening">Sunday Evening</SelectItem>
                      <SelectItem value="Midweek">Midweek</SelectItem>
                      <SelectItem value="Special">Special</SelectItem>
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
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="General Offering">General Offering</SelectItem>
                      <SelectItem value="Missions">Missions</SelectItem>
                      <SelectItem value="Building Fund">Building Fund</SelectItem>
                      <SelectItem value="Special Collection">Special Collection</SelectItem>
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
                      placeholder="Additional notes about this offering..."
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
                {createTransaction.isPending ? 'Recording...' : 'Record Offering'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default RecordOfferingDialog;