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
import { dcgSchema, DcgWithLeader } from '@/hooks/useDCGs';
import { useMembers } from '@/hooks/useMembers';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import LocationCoordinatePicker from '@/components/ui/LocationCoordinatePicker';

interface EditDcgDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  dcg: DcgWithLeader | null;
}

const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Enhanced schema for DCG with location fields - same as AddDcgDialog
const enhancedDcgSchema = dcgSchema.extend({
  // Location fields
  address: z.string().min(5, "Please provide a valid address."),
  city: z.string().min(2, "Please enter a city."),
  state: z.string().min(2, "Please enter a state/region/province."),
  zip: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const EditDcgDialog: React.FC<EditDcgDialogProps> = ({ open, setOpen, dcg }) => {
  const { userRegion } = useAuth();
  const { data: members = [] } = useMembers(userRegion?.id);
  const [leaderOpen, setLeaderOpen] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{lat: number, lng: number, address?: string} | null>(null);

  const form = useForm<z.infer<typeof enhancedDcgSchema>>({
    resolver: zodResolver(enhancedDcgSchema),
    defaultValues: {
      name: '',
      description: '',
      location: '',
      meeting_day: undefined,
      meeting_time: '',
      contact_phone: '',
      leader_id: null,
      address: '',
      city: '',
      state: '',
      zip: '',
      latitude: undefined,
      longitude: undefined,
    },
  });

  // Set form values when dcg changes
  useEffect(() => {
    if (dcg && open) {
      form.reset({
        name: dcg.name || '',
        description: dcg.description || '',
        location: dcg.location || '',
        meeting_day: dcg.meeting_day || undefined,
        meeting_time: dcg.meeting_time || '',
        contact_phone: dcg.contact_phone || '',
        leader_id: dcg.leader_id,
        address: '',
        city: '',
        state: '',
        zip: '',
        latitude: undefined,
        longitude: undefined,
      });
    }
  }, [dcg, open, form]);

  const onSubmit = async (values: z.infer<typeof enhancedDcgSchema>) => {
    try {
      if (!dcg) {
        throw new Error('No DCG selected for editing');
      }

      const selectedMember = members.find(m => m.id === values.leader_id);
      
      if (values.leader_id && !selectedMember?.profile_id) {
        throw new Error('Selected member must have a valid profile to become a DCG leader');
      }

      // Update DCG basic information
      const { error: dcgError } = await supabase
        .from('dcgs')
        .update({
          name: values.name,
          description: values.description,
          location: values.location,
          meeting_day: values.meeting_day,
          meeting_time: values.meeting_time,
          contact_phone: values.contact_phone,
          leader_id: values.leader_id,
        })
        .eq('id', dcg.id);

      if (dcgError) {
        throw new Error(`Failed to update DCG: ${dcgError.message}`);
      }

      // Create or update location if needed
      if (values.address && values.city && values.state) {
        const locationData = {
          name: `${values.name} - DCG Location`,
          type: 'DCG Location' as const,
          address: values.address,
          city: values.city,
          state: values.state,
          zip: values.zip,
          latitude: values.latitude,
          longitude: values.longitude,
          contact_person: selectedMember?.profiles?.first_name && selectedMember?.profiles?.last_name 
            ? `${selectedMember.profiles.first_name} ${selectedMember.profiles.last_name}`
            : undefined,
          contact_phone: selectedMember?.profiles?.phone || values.contact_phone,
          region_id: userRegion?.id ?? '',
        };

        const { error: locationError } = await supabase
          .from('locations')
          .insert(locationData);

        if (locationError) {
          console.error('Failed to create location:', locationError);
        }
      }

      // DCG portal access is governed by dcg_user_sessions; no role write here.
      if (values.leader_id && selectedMember?.profile_id) {

        // Update DCG user session
        await supabase
          .from('dcg_user_sessions')
          .delete()
          .eq('dcg_id', dcg.id);

        const { error: sessionError } = await supabase
          .from('dcg_user_sessions')
          .insert({
            dcg_id: dcg.id,
            user_id: selectedMember.profile_id,
            is_active: true
          });

        if (sessionError) {
          console.error('Failed to create DCG session:', sessionError);
        }

        // Update DCG member leadership
        await supabase
          .from('dcg_members')
          .update({ role: 'Member' })
          .eq('dcg_id', dcg.id)
          .eq('role', 'Leader');

        const { error: memberError } = await supabase
          .from('dcg_members')
          .upsert({
            dcg_id: dcg.id,
            member_id: selectedMember.id,
            role: 'Leader',
            joined_date: new Date().toISOString().split('T')[0],
            is_active: true
          });

        if (memberError) {
          console.error('Failed to update DCG member leadership:', memberError);
        }
      }
      
      toast.success('DCG updated successfully!');
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
          <DialogTitle>Edit DCG</DialogTitle>
          <DialogDescription>
            Update the details for {dcg.name} and its location.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* DCG Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">DCG Information</h3>
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>DCG Name</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., Victory DCG" {...field} />
                      </FormControl>
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
                         <Input placeholder="A brief description of the DCG" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location Description</FormLabel>
                      <FormControl>
                         <Input placeholder="E.g., Downtown Community Center" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="meeting_day"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meeting Day</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a day" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {weekDays.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="meeting_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meeting Time</FormLabel>
                        <FormControl>
                           <Input type="time" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="contact_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone</FormLabel>
                      <FormControl>
                         <Input placeholder="Optional contact number" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="leader_id"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>DCG Leader</FormLabel>
                      <Popover open={leaderOpen} onOpenChange={setLeaderOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? members.find((member) => member.id === field.value)?.profiles
                                  ? `${members.find((member) => member.id === field.value)?.profiles?.first_name || ''} ${members.find((member) => member.id === field.value)?.profiles?.last_name || ''}`
                                  : "Member not found"
                                : "Select DCG leader"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Search members..." />
                            <CommandList>
                              <CommandEmpty>No members found.</CommandEmpty>
                              <CommandGroup>
                                {members.map((member) => (
                                  <CommandItem
                                    value={`${member.profiles?.first_name || ''} ${member.profiles?.last_name || ''}`}
                                    key={member.id}
                                    onSelect={() => {
                                      field.onChange(member.id);
                                      setLeaderOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        member.id === field.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {member.profiles?.first_name || ''} {member.profiles?.last_name || ''}
                                    <span className="ml-2 text-sm text-muted-foreground">
                                      ({member.member_id})
                                    </span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Select the member who will lead this DCG.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Location Information */}
              <div className="space-y-4 border-t pt-4">
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
            disabled={false}
            onClick={form.handleSubmit(onSubmit)}
          >
            Update DCG & Location
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};