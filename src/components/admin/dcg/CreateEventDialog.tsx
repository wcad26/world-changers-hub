import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Copy, Pencil, Plus } from 'lucide-react';
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
  FormDescription,
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCreateDcgEvent, useUpdateDcgEvent } from '@/hooks/useDcgEvents';
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
import { SheetHeader } from '@/components/admin/dcg/DcgUI';

const ALLOWED_CATEGORIES = [
  'DCG Meeting',
  'Bible Study',
  'Worship',
  'Outreach',
  'Community Service',
  'Training',
  'Other',
] as const;

const eventFormSchema = z
  .object({
    name: z.string().min(1, 'Event name is required'),
    description: z.string().optional(),
    expectations: z.string().optional(),
    requirements: z.string().optional(),
    category: z.enum(ALLOWED_CATEGORIES),
    start_date: z.string().min(1, 'Start date is required'),
    start_time: z.string().min(1, 'Start time is required'),
    end_date: z.string().optional(),
    end_time: z.string().optional(),
    location_name: z.string().optional(),
    address: z.string().optional(),
    capacity: z.number().optional(),
    cost: z.coerce.number().min(0, 'Cost cannot be negative').optional().default(0),
    cost_currency_code: z.string().optional(),
    event_card_image: z.instanceof(File).optional(),
    whatsapp_contact: z.string().optional(),
    is_public: z.boolean().default(false),
    is_featured: z.boolean().default(false),
  })
  .refine(
    (data) => {
      if (data.end_date && data.start_date) {
        return new Date(data.end_date) >= new Date(data.start_date);
      }
      return true;
    },
    {
      message: 'End date must be after or same as start date',
      path: ['end_date'],
    },
  );

type EventFormData = z.infer<typeof eventFormSchema>;

interface CreateEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  duplicateFrom?: Event | null;
  editEvent?: Event | null;
}

export const CreateEventDialog: React.FC<CreateEventDialogProps> = ({
  isOpen,
  onClose,
  duplicateFrom,
  editEvent,
}) => {
  const [cardImagePreview, setCardImagePreview] = React.useState<string>('');
  const [recurrenceEnabled, setRecurrenceEnabled] = React.useState(false);
  const [recurrence, setRecurrence] = React.useState<RecurrenceInput>(DEFAULT_RECURRENCE);
  const createEvent = useCreateDcgEvent();
  const updateEvent = useUpdateDcgEvent();
  const createRule = useCreateRecurrenceRule();
  const { user, userDcg, userRegion } = useAuth();
  const { data: currencies } = useCurrencies();

  const isEditing = !!editEvent;

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      name: '',
      description: '',
      expectations: '',
      requirements: '',
      category: 'DCG Meeting',
      start_date: '',
      start_time: '',
      end_date: '',
      end_time: '',
      location_name: '',
      address: '',
      is_public: false,
      is_featured: false,
    },
  });

  // Prefill form when editing or duplicating an event
  React.useEffect(() => {
    const resolveCat = (raw?: string | null): EventFormData['category'] =>
      (ALLOWED_CATEGORIES as readonly string[]).includes(raw || '')
        ? (raw as EventFormData['category'])
        : 'DCG Meeting';

    if (isOpen && editEvent) {
      const startDt = editEvent.start_datetime ? new Date(editEvent.start_datetime) : null;
      const endDt = editEvent.end_datetime ? new Date(editEvent.end_datetime) : null;

      form.reset({
        name: editEvent.name || '',
        description: editEvent.description ?? '',
        expectations: editEvent.expectations ?? '',
        requirements: editEvent.requirements ?? '',
        category: resolveCat(editEvent.category),
        start_date: startDt && !isNaN(startDt.getTime()) ? format(startDt, 'yyyy-MM-dd') : '',
        start_time: startDt && !isNaN(startDt.getTime()) ? startDt.toTimeString().slice(0, 5) : '',
        end_date: endDt && !isNaN(endDt.getTime()) ? format(endDt, 'yyyy-MM-dd') : '',
        end_time: endDt && !isNaN(endDt.getTime()) ? endDt.toTimeString().slice(0, 5) : '',
        location_name: editEvent.location_name ?? '',
        address: editEvent.address ?? '',
        capacity: editEvent.capacity ?? undefined,
        cost: editEvent.cost ?? 0,
        cost_currency_code: editEvent.cost_currency_code ?? undefined,
        whatsapp_contact: editEvent.whatsapp_contact ?? '',
        is_public: editEvent.is_public ?? false,
        is_featured: editEvent.is_featured ?? false,
      });
      setCardImagePreview(editEvent.image_url || '');
      setRecurrenceEnabled(false);
    } else if (isOpen && duplicateFrom) {
      form.reset({
        name: `${duplicateFrom.name} (Copy)`,
        description: duplicateFrom.description ?? '',
        expectations: duplicateFrom.expectations ?? '',
        requirements: duplicateFrom.requirements ?? '',
        category: resolveCat(duplicateFrom.category),
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
      setRecurrenceEnabled(false);
    } else if (isOpen) {
      form.reset({
        name: '',
        description: '',
        expectations: '',
        requirements: '',
        category: 'DCG Meeting',
        start_date: '',
        start_time: '',
        end_date: '',
        end_time: '',
        location_name: '',
        address: '',
        is_public: false,
        is_featured: false,
      });
      setCardImagePreview('');
      setRecurrenceEnabled(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, duplicateFrom?.id, editEvent?.id]);

  const handleSubmit = async (data: EventFormData) => {
    try {
      let eventCardImageUrl: string | null = editEvent?.image_url ?? null;
      if (data.event_card_image) {
        const fileExt = data.event_card_image.name.split('.').pop();
        const fileName = `dcg-card-${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('event-images')
          .upload(fileName, data.event_card_image);

        if (!uploadError) {
          const {
            data: { publicUrl },
          } = supabase.storage.from('event-images').getPublicUrl(fileName);
          eventCardImageUrl = publicUrl;
        }
      }

      const start_datetime = new Date(`${data.start_date}T${data.start_time}`).toISOString();
      let end_datetime: string | null = null;
      if (data.end_date) {
        const endTime = data.end_time || data.start_time;
        end_datetime = new Date(`${data.end_date}T${endTime}`).toISOString();
      }

      const payload = {
        name: data.name,
        description: data.description,
        expectations: data.expectations || null,
        requirements: data.requirements || null,
        category: data.category,
        start_datetime,
        end_datetime,
        location_name: data.location_name,
        address: data.address,
        capacity: data.capacity || null,
        cost: data.cost || 0,
        cost_currency_code: data.cost_currency_code || null,
        whatsapp_contact: data.whatsapp_contact || null,
        is_public: data.is_public,
        is_featured: data.is_featured,
        image_url: eventCardImageUrl,
      };

      if (isEditing && editEvent) {
        await updateEvent.mutateAsync({
          id: editEvent.id,
          ...payload,
        });

        if (recurrenceEnabled && !editEvent.recurrence_rule_id) {
          await createRule.mutateAsync({
            templateEventId: editEvent.id,
            name: data.name,
            regionId: editEvent.region_id ?? userRegion?.id ?? null,
            dcgId: editEvent.dcg_id ?? userDcg?.id ?? null,
            startDatetime: start_datetime,
            endDatetime: end_datetime,
            createdBy: user?.id ?? null,
            recurrence,
          });
        }
      } else {
        const createdEvent = await createEvent.mutateAsync(payload);

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
      }

      form.reset();
      setCardImagePreview('');
      setRecurrenceEnabled(false);
      setRecurrence(DEFAULT_RECURRENCE);
      onClose();
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const isPending = createEvent.isPending || updateEvent.isPending || createRule.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-[640px]">
        <SheetHeader
          icon={isEditing ? Pencil : duplicateFrom ? Copy : Plus}
          title={isEditing ? 'Edit Event' : duplicateFrom ? 'Duplicate Event' : 'Create DCG Event'}
          description={
            isEditing
              ? 'Update schedule, location, and details for this DCG event.'
              : duplicateFrom
                ? 'Review prefilled details and pick new dates to duplicate this event.'
                : 'Schedule a gathering or activity for your DCG members.'
          }
        />
        <DialogHeader className="sr-only">
          <DialogTitle>
            {isEditing ? 'Edit Event' : duplicateFrom ? 'Duplicate Event' : 'Create New Event'}
          </DialogTitle>
          <DialogDescription>Fill out event details below.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ALLOWED_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
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
                    <Textarea placeholder="Enter event description" className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expectations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What to Expect</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={'Teaching sessions\nWorship and prayer\nNetworking with other members'}
                      className="min-h-[90px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Enter one programme highlight or experience per line.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What Attendees Should Prepare</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Items, documents, clothing or eligibility requirements..."
                      className="min-h-[80px] resize-none"
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              render={({ field: { onChange, value: _val, ...field } }) => (
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
                    <div className="relative mt-2 aspect-[4/3] w-32 overflow-hidden rounded-xl border">
                      <img src={cardImagePreview} alt="Card preview" className="h-full w-full object-cover" />
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
                      className="mt-1 h-4 w-4 rounded border-border"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Featured Event</FormLabel>
                    <div className="text-xs text-muted-foreground">Highlight this event on the homepage</div>
                  </div>
                </FormItem>
              )}
            />

            {(!isEditing || !editEvent?.recurrence_rule_id) && (
              <RecurrenceSettings
                enabled={recurrenceEnabled}
                onEnabledChange={setRecurrenceEnabled}
                value={recurrence}
                onChange={setRecurrence}
              />
            )}

            <DialogFooter className="gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="rounded-full">
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="rounded-full px-5 shadow-regal">
                <CalendarIcon className="mr-1.5 h-4 w-4" />
                {isPending
                  ? isEditing
                    ? 'Saving…'
                    : duplicateFrom
                      ? 'Duplicating…'
                      : 'Creating…'
                  : isEditing
                    ? 'Save Changes'
                    : duplicateFrom
                      ? 'Duplicate Event'
                      : 'Create Event'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
