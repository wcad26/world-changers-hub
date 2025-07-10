import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMembers } from '@/hooks/useMembers';
import { useAuth } from '@/hooks/useAuth.tsx';
import { useCreateDiscipleshipRelationship, discipleshipRelationshipSchema, type NewDiscipleshipRelationshipData } from '@/hooks/useDiscipleship';
import { useToast } from '@/hooks/use-toast';

interface AssignDiscipleDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedMentor?: string;
  preselectedDisciple?: string;
}

const AssignDiscipleDialog: React.FC<AssignDiscipleDialogProps> = ({
  isOpen,
  onOpenChange,
  preselectedMentor,
  preselectedDisciple
}) => {
  const { userRegion } = useAuth();
  const { data: members, isLoading: membersLoading } = useMembers(userRegion?.id);
  const createRelationship = useCreateDiscipleshipRelationship();
  const { toast } = useToast();

  const form = useForm<NewDiscipleshipRelationshipData>({
    resolver: zodResolver(discipleshipRelationshipSchema),
    defaultValues: {
      mentor_id: preselectedMentor || '',
      disciple_id: preselectedDisciple || '',
      notes: '',
    },
  });

  const onSubmit = async (data: NewDiscipleshipRelationshipData) => {
    try {
      await createRelationship.mutateAsync(data);
      toast({
        title: "Success",
        description: "Discipleship relationship created successfully",
      });
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create discipleship relationship",
        variant: "destructive",
      });
    }
  };

  const activeMembers = members?.filter(member => 
    member.status === 'active' || member.member_type === 'visitor'
  ) || [];

  const mentorOptions = activeMembers.filter(member => member.status === 'active');
  const discipleOptions = activeMembers;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Discipleship Relationship</DialogTitle>
          <DialogDescription>
            Create a new discipleship relationship between a mentor and disciple.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="mentor_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mentor (Active Member)</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={!!preselectedMentor}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a mentor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {mentorOptions.map((member) => (
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
              name="disciple_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Disciple (Member or Visitor)</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={!!preselectedDisciple}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a disciple" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {discipleOptions.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.profiles?.first_name} {member.profiles?.last_name} ({member.member_id})
                          {member.member_type === 'visitor' && ' - Visitor'}
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add any initial notes about this relationship..."
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
                disabled={createRelationship.isPending || membersLoading}
              >
                {createRelationship.isPending ? 'Creating...' : 'Create Relationship'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AssignDiscipleDialog;