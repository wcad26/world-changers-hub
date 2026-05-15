import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useUpdateDiscipleshipRelationship, useDeleteDiscipleshipRelationship, type DiscipleshipRelationshipWithMembers } from '@/hooks/useDiscipleship';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useMembers } from '@/hooks/useMembers';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ManageDiscipleshipDialogProps {
  relationship: DiscipleshipRelationshipWithMembers | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const updateSchema = z.object({
  mentor_id: z.string().uuid('Invalid mentor ID'),
  status: z.enum(['active', 'completed', 'transferred', 'inactive']),
  notes: z.string().optional(),
  end_date: z.date().optional().nullable(),
});

type UpdateFormData = z.infer<typeof updateSchema>;

const ManageDiscipleshipDialog: React.FC<ManageDiscipleshipDialogProps> = ({
  relationship,
  isOpen,
  onOpenChange,
}) => {
  const updateRelationship = useUpdateDiscipleshipRelationship();
  const deleteRelationship = useDeleteDiscipleshipRelationship();
  const { toast } = useToast();
  const { userRegion } = useAuth();
  const { data: members = [] } = useMembers(userRegion?.id);

  const form = useForm<UpdateFormData>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      mentor_id: relationship?.mentor_id || '',
      status: relationship?.status || 'active',
      notes: relationship?.notes || '',
      end_date: relationship?.end_date ? new Date(relationship.end_date) : null,
    },
  });

  React.useEffect(() => {
    if (relationship) {
      form.reset({
        mentor_id: relationship.mentor_id,
        status: relationship.status || 'active',
        notes: relationship.notes || '',
        end_date: relationship.end_date ? new Date(relationship.end_date) : null,
      });
    }
  }, [relationship, form]);

  const onSubmit = async (data: UpdateFormData) => {
    if (!relationship) return;

    try {
      await updateRelationship.mutateAsync({
        id: relationship.id,
        updates: {
          mentor_id: data.mentor_id,
          status: data.status,
          notes: data.notes,
          end_date: data.end_date ? format(data.end_date, 'yyyy-MM-dd') : null,
        }
      });
      toast({
        title: "Success",
        description: "Discipleship relationship updated successfully",
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update discipleship relationship",
        variant: "destructive",
      });
    }
  };

  if (!relationship) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage Discipleship Relationship</DialogTitle>
          <DialogDescription>
            Update the status and details of this discipleship relationship.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Disciple</p>
              <p className="text-sm font-semibold">
                {relationship.disciple?.profiles?.first_name} {relationship.disciple?.profiles?.last_name}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Start Date</p>
              <p className="text-sm">
                {relationship.start_date ? format(new Date(relationship.start_date), 'PPP') : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="mentor_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mentor</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select mentor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {members
                        .filter((member) => member.id !== relationship.disciple_id)
                        .map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.profiles?.first_name} {member.profiles?.last_name} ({member.member_id})
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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="transferred">Transferred</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>End Date (Optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
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
                        selected={field.value || undefined}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date(relationship.start_date || new Date())
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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
                      placeholder="Add any notes about this relationship..."
                      {...field}
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-between items-center pt-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                    disabled={deleteRelationship.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {deleteRelationship.isPending ? 'Deleting...' : 'Delete'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this discipleship relationship?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove this mentor-disciple relationship. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={async () => {
                        try {
                          await deleteRelationship.mutateAsync(relationship.id);
                          toast({ title: 'Deleted', description: 'Discipleship relationship deleted' });
                          onOpenChange(false);
                        } catch (e: any) {
                          toast({
                            title: 'Error',
                            description: e?.message || 'Failed to delete relationship',
                            variant: 'destructive',
                          });
                        }
                      }}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateRelationship.isPending}
                >
                  {updateRelationship.isPending ? 'Updating...' : 'Update Relationship'}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ManageDiscipleshipDialog;
