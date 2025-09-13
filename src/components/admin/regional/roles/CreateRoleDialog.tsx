import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useCreateRegionalRole } from '@/hooks/useRegionalRoles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CreateRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PERMISSION_GROUPS = {
  'Dashboard': ['dashboard_view'],
  'Members': ['members_view', 'members_create', 'members_edit', 'members_export'],
  'Events': ['events_view', 'events_create', 'events_edit', 'events_delete'],
  'Finances': ['finances_view', 'finances_create', 'finances_edit'],
  'DCG': ['dcg_view', 'dcg_create', 'dcg_edit'],
  'Reports': ['reports_view', 'reports_export'],
  'Communication': ['communication_view', 'communication_create', 'communication_send'],
  'Locations': ['locations_view', 'locations_create', 'locations_edit'],
  'Fundraising': ['fundraising_view', 'fundraising_create', 'fundraising_edit'],
  'Settings': ['settings_view', 'settings_edit'],
};

const CreateRoleDialog: React.FC<CreateRoleDialogProps> = ({ open, onOpenChange }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const createRole = useCreateRegionalRole();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;

    try {
      await createRole.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        permissions: selectedPermissions,
      });
      
      setName('');
      setDescription('');
      setSelectedPermissions([]);
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating role:', error);
    }
  };

  const togglePermission = (permission: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const toggleGroupPermissions = (groupPermissions: string[]) => {
    const allSelected = groupPermissions.every(p => selectedPermissions.includes(p));
    
    if (allSelected) {
      setSelectedPermissions(prev => prev.filter(p => !groupPermissions.includes(p)));
    } else {
      setSelectedPermissions(prev => [
        ...prev.filter(p => !groupPermissions.includes(p)),
        ...groupPermissions
      ]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Role</DialogTitle>
          <DialogDescription>
            Create a new regional role and assign specific permissions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="name">Role Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Finance Manager, Event Coordinator"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the role and its responsibilities..."
                rows={3}
              />
            </div>
          </div>

          <div>
            <Label className="text-base font-semibold">Permissions</Label>
            <p className="text-sm text-muted-foreground mb-4">
              Select the permissions this role should have access to.
            </p>
            
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(PERMISSION_GROUPS).map(([group, permissions]) => {
                const allSelected = permissions.every(p => selectedPermissions.includes(p));
                const someSelected = permissions.some(p => selectedPermissions.includes(p));
                
                return (
                  <Card key={group}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Checkbox
                          checked={allSelected}
                          ref={(el) => {
                            if (el) {
                              const checkbox = el.querySelector('input[type="checkbox"]') as HTMLInputElement;
                              if (checkbox) checkbox.indeterminate = someSelected && !allSelected;
                            }
                          }}
                          onCheckedChange={() => toggleGroupPermissions(permissions)}
                        />
                        {group}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {permissions.map((permission) => (
                        <div key={permission} className="flex items-center gap-2 ml-6">
                          <Checkbox
                            id={permission}
                            checked={selectedPermissions.includes(permission)}
                            onCheckedChange={() => togglePermission(permission)}
                          />
                          <Label 
                            htmlFor={permission}
                            className="text-sm text-muted-foreground cursor-pointer"
                          >
                            {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Label>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || createRole.isPending}>
              {createRole.isPending ? 'Creating...' : 'Create Role'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRoleDialog;