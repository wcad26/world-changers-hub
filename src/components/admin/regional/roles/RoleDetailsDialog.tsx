import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type RegionalRole } from '@/hooks/useRegionalRoles';
import { formatDistanceToNow } from 'date-fns';

interface RoleDetailsDialogProps {
  role: RegionalRole;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PERMISSION_LABELS = {
  dashboard_view: 'View Dashboard',
  members_view: 'View Members',
  members_create: 'Create Members',
  members_edit: 'Edit Members',
  members_export: 'Export Members',
  events_view: 'View Events',
  events_create: 'Create Events',
  events_edit: 'Edit Events',
  events_delete: 'Delete Events',
  finances_view: 'View Finances',
  finances_create: 'Create Financial Records',
  finances_edit: 'Edit Financial Records',
  dcg_view: 'View DCGs',
  dcg_create: 'Create DCGs',
  dcg_edit: 'Edit DCGs',
  reports_view: 'View Reports',
  reports_export: 'Export Reports',
  communication_view: 'View Communications',
  communication_create: 'Create Communications',
  communication_send: 'Send Communications',
  locations_view: 'View Locations',
  locations_create: 'Create Locations',
  locations_edit: 'Edit Locations',
  fundraising_view: 'View Fundraising',
  fundraising_create: 'Create Fundraising Campaigns',
  fundraising_edit: 'Edit Fundraising Campaigns',
  settings_view: 'View Settings',
  settings_edit: 'Edit Settings',
};

const RoleDetailsDialog: React.FC<RoleDetailsDialogProps> = ({ role, open, onOpenChange }) => {
  const groupedPermissions = {
    Dashboard: role.permissions?.filter(p => p.startsWith('dashboard_')) || [],
    Members: role.permissions?.filter(p => p.startsWith('members_')) || [],
    Events: role.permissions?.filter(p => p.startsWith('events_')) || [],
    Finances: role.permissions?.filter(p => p.startsWith('finances_')) || [],
    DCG: role.permissions?.filter(p => p.startsWith('dcg_')) || [],
    Reports: role.permissions?.filter(p => p.startsWith('reports_')) || [],
    Communication: role.permissions?.filter(p => p.startsWith('communication_')) || [],
    Locations: role.permissions?.filter(p => p.startsWith('locations_')) || [],
    Fundraising: role.permissions?.filter(p => p.startsWith('fundraising_')) || [],
    Settings: role.permissions?.filter(p => p.startsWith('settings_')) || [],
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {role.name}
            {role.name === 'Full Access Admin' && (
              <Badge variant="secondary">Default</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {role.description || 'No description available'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Role Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Role Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <p>{formatDistanceToNow(new Date(role.created_at), { addSuffix: true })}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Updated:</span>
                  <p>{formatDistanceToNow(new Date(role.updated_at), { addSuffix: true })}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={role.is_active ? 'default' : 'secondary'}>
                    {role.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Permissions:</span>
                  <p>{role.permissions?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permissions */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Permissions</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(groupedPermissions).map(([group, permissions]) => (
                permissions.length > 0 && (
                  <Card key={group}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">{group}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {permissions.map((permission) => (
                          <Badge key={permission} variant="outline" className="text-xs">
                            {PERMISSION_LABELS[permission as keyof typeof PERMISSION_LABELS] || permission}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              ))}
            </div>
            
            {role.permissions?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No permissions assigned to this role.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoleDetailsDialog;