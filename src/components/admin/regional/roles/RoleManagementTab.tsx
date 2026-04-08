import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Edit, Trash2, Shield, Eye, MoreHorizontal, XCircle } from 'lucide-react';
import { useRegionalRoles, useDeleteRegionalRole, useHardDeleteRegionalRole } from '@/hooks/useRegionalRoles';
import EditRoleDialog from './EditRoleDialog';
import RoleDetailsDialog from './RoleDetailsDialog';

const RoleManagementTab: React.FC = () => {
  const { data: roles, isLoading } = useRegionalRoles();
  const deleteRole = useDeleteRegionalRole();
  const hardDeleteRole = useHardDeleteRegionalRole();
  const [editingRole, setEditingRole] = useState<any>(null);
  const [viewingRole, setViewingRole] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ role: any; type: 'soft' | 'hard' } | null>(null);

  const handleDeleteRole = (role: any, type: 'soft' | 'hard') => {
    setDeleteConfirm({ role, type });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'hard') {
      await hardDeleteRole.mutateAsync(deleteConfirm.role.id);
    } else {
      await deleteRole.mutateAsync(deleteConfirm.role.id);
    }
    setDeleteConfirm(null);
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-background border shadow-md">
                          <DropdownMenuItem onClick={() => setViewingRole(role)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setEditingRole(role)}
                            disabled={role.name === 'Regional Admin'}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteRole(role, 'soft')}
                            disabled={role.name === 'Regional Admin'}
                            className="text-destructive focus:text-destructive"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Deactivate
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteRole(role, 'hard')}
                            disabled={role.name === 'Regional Admin'}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Permanently
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteConfirm?.type === 'hard' ? 'Permanently Delete Role?' : 'Deactivate Role?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm?.type === 'hard' 
                ? `This will permanently delete the role "${deleteConfirm?.role?.name}". This action cannot be undone. The role must have no users assigned to it.`
                : `This will deactivate the role "${deleteConfirm?.role?.name}". Users with this role will lose their associated permissions.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteConfirm?.type === 'hard' ? 'Delete Permanently' : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RoleManagementTab;