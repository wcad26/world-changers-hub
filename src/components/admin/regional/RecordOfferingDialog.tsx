import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Receipt, Check, ChevronsUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useCreateFinancialTransaction, useFinancialCategories } from '@/hooks/useFinancials';
import { useAuth } from '@/hooks/useAuth';
import { useRegionCurrency } from '@/hooks/useCurrencies';
import { useRegionalEventsForOfferings } from '@/hooks/useRegionalData';
import { getCurrencySymbol } from '@/utils/currencyUtils';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const offeringSchema = z.object({
  event_id: z.string().uuid('Please select an event'),
  amount: z.coerce.number().positive('Amount must be positive'),
  notes: z.string().optional(),
});

type OfferingFormData = z.infer<typeof offeringSchema>;

const formatAmountInput = (raw: string) => {
  // Keep digits and optional single decimal point
  const cleaned = raw.replace(/[^\d.]/g, '');
  const parts = cleaned.split('.');
  const intPart = parts[0].replace(/^0+(?=\d)/, '');
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (parts.length === 1) return withCommas;
  return `${withCommas}.${parts.slice(1).join('').slice(0, 2)}`;
};

const parseAmount = (formatted: string) => {
  const n = parseFloat(formatted.replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
};


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
  const currencySymbol = getCurrencySymbol(regionCurrency);
  const { data: categories = [] } = useFinancialCategories();
  const { data: events = [], isLoading: eventsLoading } = useRegionalEventsForOfferings(userRegion?.id);
  const createTransaction = useCreateFinancialTransaction();

  const [eventPopoverOpen, setEventPopoverOpen] = useState(false);
  const [amountText, setAmountText] = useState('');

  const form = useForm<OfferingFormData>({
    resolver: zodResolver(offeringSchema),
    defaultValues: { event_id: '', amount: undefined as unknown as number, notes: '' },
  });

  const offeringCategory = useMemo(
    () => categories.find(c => c.type === 'Income' && c.name === 'Offerings'),
    [categories],
  );

  const selectedEventId = form.watch('event_id');
  const selectedEvent = events.find(e => e.id === selectedEventId);

  const onSubmit = async (data: OfferingFormData) => {
    if (!offeringCategory) {
      toast({
        title: 'Error',
        description: 'Offerings category not found. Please contact your administrator.',
        variant: 'destructive',
      });
      return;
    }
    const event = events.find(e => e.id === data.event_id);
    if (!event) return;

    try {
      const desc = `Offering — ${event.name}${data.notes ? `: ${data.notes}` : ''}`;
      await createTransaction.mutateAsync({
        amount: data.amount,
        category_id: offeringCategory.id,
        transaction_date: format(new Date(event.start_datetime), 'yyyy-MM-dd'),
        description: desc,
      });

      toast({ title: 'Success', description: 'Offering recorded successfully' });
      form.reset();
      setAmountText('');
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
                <DialogTitle className="text-lg font-semibold">Record Offering</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Tied to a regional event — date is set automatically.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-4">
              <div className="rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm p-4 space-y-4">
                <FormField
                  control={form.control}
                  name="event_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Event
                      </FormLabel>
                      <Popover open={eventPopoverOpen} onOpenChange={setEventPopoverOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              role="combobox"
                              className={cn(
                                'w-full justify-between bg-background/60 border-border/50 font-normal',
                                !field.value && 'text-muted-foreground',
                              )}
                            >
                              <span className="truncate">
                                {selectedEvent
                                  ? `${selectedEvent.name} · ${format(new Date(selectedEvent.start_datetime), 'MMM dd, yyyy')}`
                                  : eventsLoading
                                    ? 'Loading events…'
                                    : 'Select an event'}
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
                                {events.map(e => {
                                  const label = `${e.name} · ${format(new Date(e.start_datetime), 'MMM dd, yyyy')}`;
                                  return (
                                    <CommandItem
                                      key={e.id}
                                      value={label}
                                      onSelect={() => {
                                        field.onChange(e.id);
                                        setEventPopoverOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          'mr-2 h-4 w-4',
                                          field.value === e.id ? 'opacity-100' : 'opacity-0',
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
                      {selectedEvent && (
                        <p className="text-xs text-muted-foreground pt-1">
                          Date: {format(new Date(selectedEvent.start_datetime), 'PPP')}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          placeholder="Additional notes about this offering…"
                          className="bg-background/60 border-border/50 resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="px-6 py-4 border-t border-border/30 bg-card/40 backdrop-blur-sm rounded-b-2xl gap-2">
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
                {createTransaction.isPending ? 'Recording…' : 'Record Offering'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default RecordOfferingDialog;
