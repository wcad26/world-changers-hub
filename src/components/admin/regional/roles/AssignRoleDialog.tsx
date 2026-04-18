import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRegionalRoles } from '@/hooks/useRegionalRoles';
import { useAssignUserRole, useUserRegionalRoles } from '@/hooks/useUserPermissions';
import { useMembers } from '@/hooks/useMembers';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AssignRoleDialogProps {
  userId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AssignRoleDialog: React.FC<AssignRoleDialogProps> = ({ 
  userId, 
  open, 
  onOpenChange 
}) => {
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(userId || '');
  const [userComboboxOpen, setUserComboboxOpen] = useState(false);
  const { userRegion } = useAuth();
  const { data: roles } = useRegionalRoles();
  const { data: members } = useMembers(userRegion?.id);
  const { data: userRoles } = useUserRegionalRoles(selectedUserId);
  const assignRole = useAssignUserRole();

  useEffect(() => {
    setSelectedUserId(userId || '');
    setSelectedRoleId('');
  }, [userId, open]);

  // Hide the auto-created "Regional Admin" role — it's region-owner only.
  const availableRoles = roles?.filter(role =>
    role.is_active &&
    role.name !== 'Regional Admin' &&
    !userRoles?.some(ur => ur.regional_role_id === role.id && ur.is_active)
  ) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRoleId || !selectedUserId) return;

    try {
      await assignRole.mutateAsync({
        userId: selectedUserId,
        roleId: selectedRoleId,
        requiresApproval: true,
      });
      
      setSelectedRoleId('');
      if (!userId) setSelectedUserId('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error assigning role:', error);
    }
  };

  const selectedMember = members?.find(m => m.profile_id === selectedUserId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Role</DialogTitle>
          <DialogDescription>
            Assign a regional role to a member. All assignments require Super Admin approval.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Info banner */}
          <Alert className="border-primary/20 bg-primary/5">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm text-muted-foreground">
              Role assignments will be submitted for Super Admin approval before taking effect.
            </AlertDescription>
          </Alert>

          {/* User Selection */}
          {!userId && (
            <div className="space-y-2">
              <Label>Select Member *</Label>
              <Popover open={userComboboxOpen} onOpenChange={setUserComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={userComboboxOpen}
                    className="w-full justify-between font-normal"
                  >
                    {selectedMember
                      ? `${selectedMember.profiles?.last_name} ${selectedMember.profiles?.first_name}`
                      : "Select a member..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search members..." />
                    <CommandList>
                      <CommandEmpty>No members found.</CommandEmpty>
                      <CommandGroup>
                        {members?.map((member) => (
                          <CommandItem
                            key={member.id}
                            value={`${member.profiles?.last_name} ${member.profiles?.first_name} ${member.profiles?.email}`}
                            onSelect={() => {
                              setSelectedUserId(member.profile_id || '');
                              setUserComboboxOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedUserId === member.profile_id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {member.profiles?.last_name} {member.profiles?.first_name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {member.profiles?.email}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Current Roles */}
          {userRoles && userRoles.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Current Roles</Label>
              <div className="flex flex-wrap gap-2">
                {userRoles.map((userRole) => (
                  <Badge key={userRole.id} variant="secondary">
                    {userRole.regional_roles.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Role Selection */}
          <div className="space-y-2">
            <Label>Select Role *</Label>
            <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a role to assign" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Show selected role description below */}
            {selectedRoleId && (() => {
              const selectedRole = availableRoles.find(r => r.id === selectedRoleId);
              return selectedRole?.description ? (
                <p className="text-xs text-muted-foreground">{selectedRole.description}</p>
              ) : null;
            })()}
          </div>

          {availableRoles.length === 0 && selectedUserId && (
            <p className="text-sm text-muted-foreground">
              No additional roles available to assign.
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!selectedRoleId || !selectedUserId || assignRole.isPending || availableRoles.length === 0}
            >
              {assignRole.isPending ? 'Submitting...' : 'Submit for Approval'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AssignRoleDialog;
