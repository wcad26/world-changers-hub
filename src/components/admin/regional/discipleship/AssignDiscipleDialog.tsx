import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMembers } from '@/hooks/useMembers';
import { useAuth } from '@/hooks/useAuth';
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
  
  const [mentorOpen, setMentorOpen] = useState(false);
  const [discipleOpen, setDiscipleOpen] = useState(false);

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

  // Filter mentor options to only include members (not visitors)
  const mentorOptions = useMemo(() => 
    members?.filter(member => member.member_type === 'member') || [], 
    [members]
  );
  
  // All members can be disciples
  const discipleOptions = members || [];

  const getMemberLabel = (memberId: string) => {
    const member = members?.find(m => m.id === memberId);
    if (!member) return '';
    return `${member.profiles?.first_name} ${member.profiles?.last_name} (${member.member_id})`;
  };

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
                <FormItem className="flex flex-col">
                  <FormLabel>Mentor (Member)</FormLabel>
                  <Popover open={mentorOpen} onOpenChange={setMentorOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={mentorOpen}
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={!!preselectedMentor}
                        >
                          {field.value
                            ? getMemberLabel(field.value)
                            : "Search and select a mentor..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-popover z-50" align="start">
                      <Command>
                        <CommandInput placeholder="Search members..." />
                        <CommandList>
                          <CommandEmpty>No member found.</CommandEmpty>
                          <CommandGroup>
                            {mentorOptions.map((member) => (
                              <CommandItem
                                key={member.id}
                                value={`${member.profiles?.first_name} ${member.profiles?.last_name} ${member.member_id}`}
                                onSelect={() => {
                                  field.onChange(member.id);
                                  setMentorOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === member.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {member.profiles?.first_name} {member.profiles?.last_name} ({member.member_id})
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="disciple_id"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Disciple (Member or Visitor)</FormLabel>
                  <Popover open={discipleOpen} onOpenChange={setDiscipleOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={discipleOpen}
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={!!preselectedDisciple}
                        >
                          {field.value
                            ? getMemberLabel(field.value)
                            : "Search and select a disciple..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-popover z-50" align="start">
                      <Command>
                        <CommandInput placeholder="Search members..." />
                        <CommandList>
                          <CommandEmpty>No member found.</CommandEmpty>
                          <CommandGroup>
                            {discipleOptions.map((member) => (
                              <CommandItem
                                key={member.id}
                                value={`${member.profiles?.first_name} ${member.profiles?.last_name} ${member.member_id}`}
                                onSelect={() => {
                                  field.onChange(member.id);
                                  setDiscipleOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === member.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {member.profiles?.first_name} {member.profiles?.last_name} ({member.member_id})
                                {member.member_type === 'visitor' ? ' - Visitor' : ' - Member'}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
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
