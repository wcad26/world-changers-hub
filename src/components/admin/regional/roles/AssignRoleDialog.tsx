import React, { useState } from 'react';
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
import { useRegionalRoles } from '@/hooks/useRegionalRoles';
import { useAssignUserRole, useUserRegionalRoles } from '@/hooks/useUserPermissions';

interface AssignRoleDialogProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AssignRoleDialog: React.FC<AssignRoleDialogProps> = ({ 
  userId, 
  open, 
  onOpenChange 
}) => {
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const { data: roles } = useRegionalRoles();
  const { data: userRoles } = useUserRegionalRoles(userId);
  const assignRole = useAssignUserRole();

  const availableRoles = roles?.filter(role => 
    role.is_active && 
    !userRoles?.some(ur => ur.regional_role_id === role.id && ur.is_active)
  ) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRoleId) return;

    try {
      await assignRole.mutateAsync({
        userId,
        roleId: selectedRoleId,
      });
      
      setSelectedRoleId('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error assigning role:', error);
    }
  };

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

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!selectedRoleId || assignRole.isPending || availableRoles.length === 0}
            >
              {assignRole.isPending ? 'Assigning...' : 'Assign Role'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AssignRoleDialog;