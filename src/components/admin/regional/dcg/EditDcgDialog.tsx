import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUpdateLocation } from '@/hooks/useLocations';
import { useMembers } from '@/hooks/useMembers';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import LocationCoordinatePicker from '@/components/ui/LocationCoordinatePicker';
import type { Database } from '@/integrations/supabase/types';

type DcgWithLocation = {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  meeting_day: string | null;
  meeting_time: string | null;
  contact_phone: string | null;
  leader_id: string | null;
  locations?: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string | null;
    latitude: number | null;
    longitude: number | null;
    contact_person: string | null;
    contact_phone: string | null;
  } | null;
};

interface EditDcgDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  dcg: DcgWithLocation | null;
}

const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const editDcgSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  description: z.string().optional(),
  location: z.string().optional(),
  meeting_day: z.string().optional(),
  meeting_time: z.string().optional(),
  contact_phone: z.string().optional(),
  leader_id: z.string().nullable(),
  // Location fields
  address: z.string().min(5, "Please provide a valid address."),
  city: z.string().min(2, "Please enter a city."),
  state: z.string().min(2, "Please enter a state/region/province."),
  zip: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  contact_person: z.string().optional(),
  location_contact_phone: z.string().optional(),
});

export const EditDcgDialog: React.FC<EditDcgDialogProps> = ({ open, setOpen, dcg }) => {
  const { userRegion } = useAuth();
  const updateLocationMutation = useUpdateLocation();
  const { data: members = [] } = useMembers(userRegion?.id);
  const [leaderOpen, setLeaderOpen] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{lat: number, lng: number, address?: string} | null>(null);

  const form = useForm<z.infer<typeof editDcgSchema>>({
    resolver: zodResolver(editDcgSchema),
    defaultValues: {
      name: '',
      description: '',
      location: '',
      meeting_day: '',
      meeting_time: '',
      contact_phone: '',
      leader_id: null,
      address: '',
      city: '',
      state: '',
      zip: '',
      latitude: undefined,
      longitude: undefined,
      contact_person: '',
      location_contact_phone: '',
    },
  });

  // Set form values when dcg changes
  useEffect(() => {
    if (dcg && open) {
      form.reset({
        name: dcg.name || '',
        description: dcg.description || '',
        location: dcg.location || '',
        meeting_day: dcg.meeting_day || '',
        meeting_time: dcg.meeting_time || '',
        contact_phone: dcg.contact_phone || '',
        leader_id: dcg.leader_id,
        address: dcg.locations?.address || '',
        city: dcg.locations?.city || '',
        state: dcg.locations?.state || '',
        zip: dcg.locations?.zip || '',
        latitude: dcg.locations?.latitude || undefined,
        longitude: dcg.locations?.longitude || undefined,
        contact_person: dcg.locations?.contact_person || '',
        location_contact_phone: dcg.locations?.contact_phone || '',
      });

      if (dcg.locations?.latitude && dcg.locations?.longitude) {
        setSelectedCoordinates({
          lat: dcg.locations.latitude,
          lng: dcg.locations.longitude,
          address: dcg.locations.address
        });
      }
    }
  }, [dcg, open, form]);

  const onSubmit = async (values: z.infer<typeof editDcgSchema>) => {
    try {
      if (!dcg?.locations?.id) {
        throw new Error('DCG location not found');
      }

      // Update only the location (DCG updates would require additional mutations)
      const locationData = {
        id: dcg.locations.id,
        name: `${values.name} - DCG Location`,
        address: values.address,
        city: values.city,
        state: values.state,
        zip: values.zip,
        latitude: values.latitude,
        longitude: values.longitude,
        contact_person: values.contact_person,
        contact_phone: values.location_contact_phone,
      };

      await updateLocationMutation.mutateAsync(locationData);
      
      toast.success('DCG location updated successfully!');
      setOpen(false);
    } catch (error: any) {
      toast.error(`Failed to update DCG: ${error.message}`);
    }
  };

  if (!dcg) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Edit DCG Location</DialogTitle>
          <DialogDescription>
            Update the location details for {dcg.name}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Location Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Location Details</h3>
                
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main Street" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="New York" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State/Region/Province</FormLabel>
                        <FormControl>
                          <Input placeholder="NY" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="zip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP/Postal Code (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="10001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contact_person"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Person</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location_contact_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+1234567890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              {/* Location Coordinate Picker */}
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">Location Coordinates</h3>
                <LocationCoordinatePicker
                  latitude={selectedCoordinates?.lat}
                  longitude={selectedCoordinates?.lng}
                  initialAddress={selectedCoordinates?.address}
                  onCoordinateSelect={(lat, lng, address) => {
                    setSelectedCoordinates({ lat, lng, address });
                    form.setValue('latitude', lat);
                    form.setValue('longitude', lng);
                    if (address && !form.getValues('address')) {
                      form.setValue('address', address);
                    }
                  }}
                />
              </div>
            </form>
          </Form>
        </div>
        
        <DialogFooter className="flex-shrink-0 mt-4">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={updateLocationMutation.isPending}
            onClick={form.handleSubmit(onSubmit)}
          >
            {updateLocationMutation.isPending ? 'Updating...' : 'Update Location'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};