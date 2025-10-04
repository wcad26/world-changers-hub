import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, PiggyBank } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';

const specialGivingSchema = z.object({
  date: z.date({
    required_error: 'Date is required',
  }),
  fund: z.string().min(1, 'Fund/Project is required'),
  amount: z.string().min(1, 'Amount is required'),
  anonymous: z.boolean().default(false),
  donor: z.string().optional(),
  notes: z.string().optional(),
});

type SpecialGivingFormData = z.infer<typeof specialGivingSchema>;

interface RecordSpecialGivingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RecordSpecialGivingDialog: React.FC<RecordSpecialGivingDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { toast } = useToast();
  const { userRegion } = useAuth();
  const { data: regionCurrency } = useRegionCurrency(userRegion?.id);
  const currencySymbol = regionCurrency ? getCurrencySymbol(regionCurrency.code) : '$';
  const createTransaction = useCreateFinancialTransaction();

  const form = useForm<SpecialGivingFormData>({
    resolver: zodResolver(specialGivingSchema),
    defaultValues: {
      date: new Date(),
      fund: '',
      amount: '',
      anonymous: false,
      donor: '',
      notes: '',
    },
  });

  const isAnonymous = form.watch('anonymous');

  const onSubmit = async (data: SpecialGivingFormData) => {
    try {
      // Note: This is using mock categories. In a real implementation,
      // you would need to fetch the actual category IDs from the database
      const mockCategoryId = "mock-special-giving-category-id";
      
      await createTransaction.mutateAsync({
        amount: parseFloat(data.amount),
        category_id: mockCategoryId,
        transaction_date: data.date.toISOString().split('T')[0],
        description: `${data.fund}${data.anonymous ? ' (Anonymous)' : data.donor ? ` - ${data.donor}` : ''}${data.notes ? `: ${data.notes}` : ''}`,
      });

      toast({
        title: 'Success',
        description: 'Special giving recorded successfully',
      });

      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to record special giving',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5" />
            Record Special Giving
          </DialogTitle>
          <DialogDescription>
            Record a new special giving entry with fund/project details.
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
              name="fund"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fund/Project</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select fund or project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Building Fund">Building Fund</SelectItem>
                      <SelectItem value="Mission Fund">Mission Fund</SelectItem>
                      <SelectItem value="Youth Ministry">Youth Ministry</SelectItem>
                      <SelectItem value="Community Outreach">Community Outreach</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
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
              name="anonymous"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Anonymous donation</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {!isAnonymous && (
              <FormField
                control={form.control}
                name="donor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Donor</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a donor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="John Smith">John Smith</SelectItem>
                        <SelectItem value="Sarah Johnson">Sarah Johnson</SelectItem>
                        <SelectItem value="Michael Brown">Michael Brown</SelectItem>
                        <SelectItem value="Emily Wilson">Emily Wilson</SelectItem>
                        <SelectItem value="David Lee">David Lee</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about this special giving..."
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
                {createTransaction.isPending ? 'Recording...' : 'Record Special Giving'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default RecordSpecialGivingDialog;