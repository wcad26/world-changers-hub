import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateAttendanceEvent } from "@/hooks/useAttendance";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Users } from "lucide-react";

const attendanceEventSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  description: z.string().optional(),
  event_date: z.string().min(1, "Event date is required"),
});

interface CreateAttendanceDialogProps {
  trigger?: React.ReactNode;
}

export function CreateAttendanceDialog({ trigger }: CreateAttendanceDialogProps) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const { userRegion, user } = useAuth();
  const createAttendanceEvent = useCreateAttendanceEvent();

  const form = useForm<z.infer<typeof attendanceEventSchema>>({
    resolver: zodResolver(attendanceEventSchema),
    defaultValues: {
      name: "",
      description: "",
      event_date: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof attendanceEventSchema>) => {
    if (!userRegion?.id || !user?.id) {
      toast({
        title: "Error",
        description: "User region not found",
        variant: "destructive",
      });
      return;
    }

    createAttendanceEvent.mutate({
      name: values.name,
      description: values.description || null,
      event_date: values.event_date,
      region_id: userRegion.id,
      created_by: user.id,
    }, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Attendance tracking event created successfully",
        });
        form.reset();
        setOpen(false);
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Users className="mr-2 h-4 w-4" />
            Create Attendance Event
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Attendance Event</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Sunday Service" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="event_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add any additional details about this attendance tracking..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createAttendanceEvent.isPending}
              >
                {createAttendanceEvent.isPending ? "Creating..." : "Create Event"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}