import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useCreateDcgEvent } from '@/hooks/useDcgEvents';
import type { Event } from '@/hooks/useDcgEvents';
import { useCurrencies } from '@/hooks/useCurrencies';
import { supabase } from '@/integrations/supabase/client';
import { RecurrenceSettings } from '@/components/admin/events/RecurrenceSettings';
import {
  useCreateRecurrenceRule,
  DEFAULT_RECURRENCE,
  type RecurrenceInput,
} from '@/hooks/useRecurringEvents';
import { useAuth } from '@/hooks/useAuth';

const eventFormSchema = z.object({
  name: z.string().min(1, 'Event name is required'),
  description: z.string().optional(),
  category: z.enum([
    'DCG Meeting',
    'Bible Study',
    'Worship',
    'Outreach',
    'Community Service',
    'Training',
    'Other'
  ]),
  start_date: z.string().min(1, 'Start date is required'),
  start_time: z.string().min(1, 'Start time is required'),
  end_date: z.string().optional(),
  end_time: z.string().optional(),
  location_name: z.string().optional(),
  address: z.string().optional(),
  capacity: z.number().optional(),
  cost: z.coerce.number().min(0, "Cost cannot be negative").optional().default(0),
  cost_currency_code: z.string().optional(),
  event_card_image: z.instanceof(File).optional(),
  whatsapp_contact: z.string().optional(),
  is_public: z.boolean().default(false),
  is_featured: z.boolean().default(false),
}).refine((data) => {
  if (data.end_date && data.start_date) {
    return new Date(data.end_date) >= new Date(data.start_date);
  }
  return true;
}, {
  message: "End date must be after or same as start date",
  path: ["end_date"]
});

type EventFormData = z.infer<typeof eventFormSchema>;

interface CreateEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  duplicateFrom?: Event | null;
}

export const CreateEventDialog: React.FC<CreateEventDialogProps> = ({
  isOpen,
  onClose,
  duplicateFrom,
}) => {
  const [cardImagePreview, setCardImagePreview] = React.useState<string>('');
  const [recurrenceEnabled, setRecurrenceEnabled] = React.useState(false);
  const [recurrence, setRecurrence] = React.useState<RecurrenceInput>(DEFAULT_RECURRENCE);
  const createEvent = useCreateDcgEvent();
  const createRule = useCreateRecurrenceRule();
  const { user, userDcg, userRegion } = useAuth();
  const { data: currencies } = useCurrencies();

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      name: '',
      description: '',
      category: 'DCG Meeting',
      start_date: '',
      start_time: '',
      end_date: '',
      end_time: '',
      location_name: '',
      address: '',
      is_public: false,
    },
  });

  // Prefill form when duplicating an event
  React.useEffect(() => {
    if (isOpen && duplicateFrom) {
      const allowedCategories = [
        'DCG Meeting','Bible Study','Worship','Outreach',
        'Community Service','Training','Other'
      ] as const;
      const category = (allowedCategories as readonly string[]).includes(duplicateFrom.category as string)
        ? (duplicateFrom.category as EventFormData['category'])
        : 'DCG Meeting';

      form.reset({
        name: `${duplicateFrom.name} (Copy)`,
        description: duplicateFrom.description ?? '',
        category,
        start_date: '',
        start_time: '',
        end_date: '',
        end_time: '',
        location_name: duplicateFrom.location_name ?? '',
        address: duplicateFrom.address ?? '',
        capacity: duplicateFrom.capacity ?? undefined,
        cost: duplicateFrom.cost ?? 0,
        cost_currency_code: duplicateFrom.cost_currency_code ?? undefined,
        whatsapp_contact: duplicateFrom.whatsapp_contact ?? '',
        is_public: duplicateFrom.is_public ?? false,
        is_featured: duplicateFrom.is_featured ?? false,
      });
      setCardImagePreview('');
    } else if (isOpen && !duplicateFrom) {
      form.reset({
        name: '',
        description: '',
        category: 'DCG Meeting',
        start_date: '',
        start_time: '',
        end_date: '',
        end_time: '',
        location_name: '',
        address: '',
        is_public: false,
      });
      setCardImagePreview('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, duplicateFrom?.id]);

  const handleSubmit = async (data: EventFormData) => {
    try {
      // Upload event card image if provided
      let eventCardImageUrl: string | null = null;
      if (data.event_card_image) {
        const fileExt = data.event_card_image.name.split('.').pop();
        const fileName = `dcg-card-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('event-images')
          .upload(filePath, data.event_card_image);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('event-images')
            .getPublicUrl(filePath);
          eventCardImageUrl = publicUrl;
        }
      }

      const start_datetime = new Date(`${data.start_date}T${data.start_time}`).toISOString();
      let end_datetime = null;
      
      if (data.end_date) {
        const endTime = data.end_time || data.start_time; // Use start time if no end time specified
        end_datetime = new Date(`${data.end_date}T${endTime}`).toISOString();
      }
      
      const createdEvent = await createEvent.mutateAsync({
        name: data.name,
        description: data.description,
        category: data.category,
        start_datetime: start_datetime,
        end_datetime: end_datetime,
        location_name: data.location_name,
        address: data.address,
        capacity: data.capacity || null,
        cost: data.cost || 0,
        cost_currency_code: data.cost_currency_code || null,
        whatsapp_contact: data.whatsapp_contact || null,
        is_public: data.is_public,
        is_featured: data.is_featured,
        image_url: eventCardImageUrl || null,
      });

      if (recurrenceEnabled && createdEvent?.id) {
        await createRule.mutateAsync({
          templateEventId: createdEvent.id,
          name: data.name,
          regionId: userRegion?.id ?? null,
          dcgId: userDcg?.id ?? null,
          startDatetime: start_datetime,
          endDatetime: end_datetime,
          createdBy: user?.id ?? null,
          recurrence,
        });
      }

      form.reset();
      setCardImagePreview('');
      setRecurrenceEnabled(false);
      setRecurrence(DEFAULT_RECURRENCE);
      onClose();
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{duplicateFrom ? 'Duplicate Event' : 'Create New Event'}</DialogTitle>
          <DialogDescription>
            {duplicateFrom
              ? 'Review the prefilled details and pick new dates to duplicate this event.'
              : 'Create a new event for your DCG. This event will be visible to DCG members.'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto pr-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter event name" {...field} />
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
                        <SelectItem value="DCG Meeting">DCG Meeting</SelectItem>
                        <SelectItem value="Bible Study">Bible Study</SelectItem>
                        <SelectItem value="Worship">Worship</SelectItem>
                        <SelectItem value="Outreach">Outreach</SelectItem>
                        <SelectItem value="Community Service">Community Service</SelectItem>
                        <SelectItem value="Training">Training</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter event description"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time (Optional)</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="location_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Community Center" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Max attendees"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cost_currency_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencies?.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.symbol} - {currency.name}
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
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Cost</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="event_card_image"
              render={({ field: { onChange, value, ...field } }) => (
                <FormItem>
                  <FormLabel>Event Card Image</FormLabel>
                  <FormControl>
                    <Input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          onChange(file);
                          setCardImagePreview(URL.createObjectURL(file));
                        }
                      }}
                      {...field}
                      value={undefined}
                    />
                  </FormControl>
                  <div className="text-xs text-muted-foreground">
                    This image will appear on the Events listing page
                  </div>
                  {cardImagePreview && (
                    <div className="mt-2 relative w-32 aspect-[4/3] rounded-md overflow-hidden border">
                      <img src={cardImagePreview} alt="Card preview" className="object-cover w-full h-full" />
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter full address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="whatsapp_contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WhatsApp Contact (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 234 567 890" {...field} />
                  </FormControl>
                  <div className="text-xs text-muted-foreground">
                    Include country code for WhatsApp link (e.g., +1 for US)
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_featured"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 mt-1"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Featured Event</FormLabel>
                    <div className="text-xs text-muted-foreground">
                      Highlight this event on the homepage
                    </div>
                  </div>
                </FormItem>
              )}
            />

            <RecurrenceSettings
              enabled={recurrenceEnabled}
              onEnabledChange={setRecurrenceEnabled}
              value={recurrence}
              onChange={setRecurrence}
            />



            <DialogFooter className="flex-shrink-0 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={createEvent.isPending}>
                {createEvent.isPending
                  ? (duplicateFrom ? 'Duplicating...' : 'Creating...')
                  : (duplicateFrom ? 'Duplicate Event' : 'Create Event')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};