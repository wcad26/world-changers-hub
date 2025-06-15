
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dcgSchema, useCreateDcg } from '@/hooks/useDCGs';

interface AddDcgDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const AddDcgDialog: React.FC<AddDcgDialogProps> = ({ open, setOpen }) => {
  const createDcgMutation = useCreateDcg();

  const form = useForm<z.infer<typeof dcgSchema>>({
    resolver: zodResolver(dcgSchema),
    defaultValues: {
      name: '',
      description: '',
      location: '',
      meeting_day: undefined,
      meeting_time: '',
      contact_phone: '',
      leader_id: null,
    },
  });

  const onSubmit = (values: z.infer<typeof dcgSchema>) => {
    createDcgMutation.mutate(values, {
      onSuccess: () => {
        toast.success('DCG created successfully!');
        form.reset();
        setOpen(false);
      },
      onError: (error) => {
        toast.error(`Failed to create DCG: ${error.message}`);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New DCG</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new Destiny Care Group.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <Input placeholder="A brief description of the DCG" {...field} />
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
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g., Downtown" {...field} />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      <Input type="time" {...field} />
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
                    <Input placeholder="Optional contact number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="leader_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Leader ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional leader UUID" {...field} value={field.value ?? ''} />
                  </FormControl>
                   <FormDescription>
                    Paste the user UUID of the DCG leader.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createDcgMutation.isPending}>
                {createDcgMutation.isPending ? 'Creating...' : 'Create DCG'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
