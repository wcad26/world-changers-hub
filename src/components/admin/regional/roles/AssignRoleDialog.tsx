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
import { Switch } from '@/components/ui/switch';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRegionalRoles } from '@/hooks/useRegionalRoles';
import { useAssignUserRole, useUserRegionalRoles, useIsApprovedAdmin } from '@/hooks/useUserPermissions';
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
  const [requiresApproval, setRequiresApproval] = useState(true);
  const { userRegion } = useAuth();
  const { data: roles } = useRegionalRoles();
  const { data: members } = useMembers(userRegion?.id);
  const { data: userRoles } = useUserRegionalRoles(selectedUserId);
  const { data: isApprovedAdmin } = useIsApprovedAdmin(selectedUserId, userRegion?.id);
  const assignRole = useAssignUserRole();

  // Reset selectedUserId when dialog opens or userId changes
  useEffect(() => {
    setSelectedUserId(userId || '');
    setRequiresApproval(true);
  }, [userId, open]);

  // Auto-set requiresApproval based on whether user is already an approved admin
  useEffect(() => {
    if (isApprovedAdmin !== undefined) {
      // If user is already an approved admin, they don't need approval for additional roles
      setRequiresApproval(!isApprovedAdmin);
    }
  }, [isApprovedAdmin]);

  const availableRoles = roles?.filter(role => 
    role.is_active && 
    !userRoles?.some(ur => ur.regional_role_id === role.id && ur.is_active)
  ) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRoleId || !selectedUserId) return;

    try {
      await assignRole.mutateAsync({
        userId: selectedUserId,
        roleId: selectedRoleId,
        requiresApproval: requiresApproval && !isApprovedAdmin,
      });
      
      setSelectedRoleId('');
      if (!userId) setSelectedUserId(''); // Reset user selection if this was a general assignment
      onOpenChange(false);
    } catch (error) {
      console.error('Error assigning role:', error);
    }
  };

  const showApprovalWarning = requiresApproval && !isApprovedAdmin;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Role</DialogTitle>
          <DialogDescription>
            Assign a role to this user to grant specific permissions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User Selection - only show if no specific userId was provided */}
          {!userId && (
            <div>
              <Label htmlFor="user">Select User *</Label>
              <Popover open={userComboboxOpen} onOpenChange={setUserComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={userComboboxOpen}
                    className="w-full justify-between"
                  >
                    {selectedUserId
                      ? members?.find((member) => member.profile_id === selectedUserId)
                        ? `${members.find((member) => member.profile_id === selectedUserId)?.profiles?.first_name} ${members.find((member) => member.profile_id === selectedUserId)?.profiles?.last_name}`
                        : "Select user..."
                      : "Select user..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search users..." />
                    <CommandList>
                      <CommandEmpty>No users found.</CommandEmpty>
                      <CommandGroup>
                        {members?.map((member) => (
                          <CommandItem
                            key={member.id}
                            value={`${member.profiles?.first_name} ${member.profiles?.last_name} ${member.profiles?.email}`}
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
                              <div className="font-medium">
                                {member.profiles?.first_name} {member.profiles?.last_name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {member.profiles?.email}
                              </div>
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
            <div>
              <Label className="text-sm font-medium">Current Roles</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {userRoles.map((userRole) => (
                  <Badge key={userRole.id} variant="secondary">
                    {userRole.regional_roles.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Approved Admin Status */}
          {selectedUserId && isApprovedAdmin && (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-700">
                This user is already an approved administrator. The role will be assigned immediately.
              </AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="role">Select Role *</Label>
            <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a role to assign" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    <div>
                      <div className="font-medium">{role.name}</div>
                      {role.description && (
                        <div className="text-sm text-muted-foreground">
                          {role.description}
                        </div>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {availableRoles.length === 0 && (
            <div className="text-sm text-muted-foreground">
              No additional roles available to assign.
            </div>
          )}

          {/* Approval Toggle - only show for non-approved admins */}
          {selectedUserId && !isApprovedAdmin && (
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Requires Super Admin Approval</Label>
                <p className="text-sm text-muted-foreground">
                  The role assignment will be pending until approved by a Super Admin.
                </p>
              </div>
              <Switch
                checked={requiresApproval}
                onCheckedChange={setRequiresApproval}
              />
            </div>
          )}

          {showApprovalWarning && (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700">
                This assignment will create a pending request that requires Super Admin approval before the user can access admin features.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!selectedRoleId || !selectedUserId || assignRole.isPending || availableRoles.length === 0}
            >
              {assignRole.isPending ? 'Assigning...' : (showApprovalWarning ? 'Submit for Approval' : 'Assign Role')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AssignRoleDialog;