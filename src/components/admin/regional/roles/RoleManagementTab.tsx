import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Shield, Eye } from 'lucide-react';
import { useRegionalRoles, useDeleteRegionalRole } from '@/hooks/useRegionalRoles';
import EditRoleDialog from './EditRoleDialog';
import RoleDetailsDialog from './RoleDetailsDialog';

const RoleManagementTab: React.FC = () => {
  const { data: roles, isLoading } = useRegionalRoles();
  const deleteRole = useDeleteRegionalRole();
  const [editingRole, setEditingRole] = useState<any>(null);
  const [viewingRole, setViewingRole] = useState<any>(null);

  const handleDeleteRole = async (roleId: string) => {
    if (window.confirm('Are you sure you want to deactivate this role?')) {
      await deleteRole.mutateAsync(roleId);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading roles...</div>;
  }

  const activeRoles = roles?.filter(role => role.is_active) || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Regional Roles
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeRoles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No roles found. Create your first role to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeRoles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {role.name}
                        {role.name === 'Full Access Admin' && (
                          <Badge variant="secondary">Default</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {role.description || 'No description'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {role.permissions?.length || 0} permissions
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingRole(role)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingRole(role)}
                          disabled={role.name === 'Full Access Admin'}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteRole(role.id)}
                          disabled={role.name === 'Full Access Admin'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {editingRole && (
        <EditRoleDialog
          role={editingRole}
          open={!!editingRole}
          onOpenChange={(open) => !open && setEditingRole(null)}
        />
      )}

      {viewingRole && (
        <RoleDetailsDialog
          role={viewingRole}
          open={!!viewingRole}
          onOpenChange={(open) => !open && setViewingRole(null)}
        />
      )}
    </div>
  );
};

export default RoleManagementTab;