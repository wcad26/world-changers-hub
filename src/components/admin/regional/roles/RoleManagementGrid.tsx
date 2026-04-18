import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Edit, Trash2, Eye, XCircle, Shield, KeyRound, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  useRegionalRoles,
  useDeleteRegionalRole,
  useHardDeleteRegionalRole,
  type RegionalRole,
} from '@/hooks/useRegionalRoles';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import EditRoleDialog from './EditRoleDialog';
import RoleDetailsDialog from './RoleDetailsDialog';
import { RESERVED_ROLE_NAME } from '@/config/regionalPermissions';

const RoleManagementGrid: React.FC = () => {
  const { userRegion } = useAuth();
  const regionId = userRegion?.id;
  const { data: roles, isLoading } = useRegionalRoles();
  const deleteRole = useDeleteRegionalRole();
  const hardDeleteRole = useHardDeleteRegionalRole();

  const [editingRole, setEditingRole] = useState<RegionalRole | null>(null);
  const [viewingRole, setViewingRole] = useState<RegionalRole | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    role: RegionalRole;
    type: 'soft' | 'hard';
  } | null>(null);

  // Per-role assignment counts so each card can show "Used by N users".
  const { data: usageCounts } = useQuery({
    queryKey: ['role-usage-counts', regionId],
    queryFn: async () => {
      if (!regionId) return {} as Record<string, number>;
      const { data, error } = await supabase
        .from('regional_user_roles')
        .select('regional_role_id')
        .eq('region_id', regionId)
        .eq('is_active', true);
      if (error) throw error;
      const map: Record<string, number> = {};
      for (const row of data ?? []) {
        const id = (row as any).regional_role_id;
        map[id] = (map[id] ?? 0) + 1;
      }
      return map;
    },
    enabled: !!regionId,
  });

  if (isLoading) {
    return <div className="py-12 text-center text-muted-foreground">Loading roles…</div>;
  }

  const activeRoles = (roles ?? []).filter((r) => r.is_active);
  const reservedRole = activeRoles.find((r) => r.name === RESERVED_ROLE_NAME);
  const customRoles = activeRoles.filter((r) => r.name !== RESERVED_ROLE_NAME);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reservedRole ? (
          <Card className="relative border-dashed bg-muted/30">
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">Regional Admin</h3>
                </div>
                <Badge variant="outline">Default</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Built-in role with full access. Cannot be edited or deleted.
              </p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <KeyRound className="h-4 w-4" />
                <span>{reservedRole.permissions?.length ?? 0} permissions</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setViewingRole(reservedRole)}
              >
                <Eye className="mr-2 h-4 w-4" />
                View permissions
              </Button>
            </CardFooter>
          </Card>
        ) : null}

        {customRoles.length === 0 && !reservedRole ? (
          <div className="col-span-full rounded-lg border border-dashed p-12 text-center text-muted-foreground">
            No roles yet. Click <strong>Create Role</strong> to add your first one.
          </div>
        ) : null}

        {customRoles.map((role) => {
          const usage = usageCounts?.[role.id] ?? 0;
          return (
            <Card key={role.id} className="flex flex-col">
              <CardHeader className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold">{role.name}</h3>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                        <span className="sr-only">Open menu</span>
                        ⋯
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover">
                      <DropdownMenuItem onClick={() => setViewingRole(role)}>
                        <Eye className="mr-2 h-4 w-4" /> View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditingRole(role)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleteConfirm({ role, type: 'soft' })}
                        className="text-destructive focus:text-destructive"
                      >
                        <XCircle className="mr-2 h-4 w-4" /> Deactivate
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteConfirm({ role, type: 'hard' })}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete permanently
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">
                  {role.description || 'No description provided.'}
                </p>
              </CardHeader>
              <CardContent className="flex-1 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <KeyRound className="h-4 w-4" />
                  <span>{role.permissions?.length ?? 0} permissions</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>
                    Used by {usage} {usage === 1 ? 'user' : 'users'}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setViewingRole(role)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setEditingRole(role)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {editingRole ? (
        <EditRoleDialog
          role={editingRole}
          open={!!editingRole}
          onOpenChange={(open) => !open && setEditingRole(null)}
        />
      ) : null}

      {viewingRole ? (
        <RoleDetailsDialog
          role={viewingRole}
          open={!!viewingRole}
          onOpenChange={(open) => !open && setViewingRole(null)}
        />
      ) : null}

      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteConfirm?.type === 'hard'
                ? 'Permanently delete role?'
                : 'Deactivate role?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm?.type === 'hard'
                ? `This will permanently delete "${deleteConfirm?.role?.name}". This action cannot be undone, and the role must have no users assigned to it.`
                : `This will deactivate "${deleteConfirm?.role?.name}". Users with this role will lose its associated permissions.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!deleteConfirm) return;
                if (deleteConfirm.type === 'hard') {
                  await hardDeleteRole.mutateAsync(deleteConfirm.role.id);
                } else {
                  await deleteRole.mutateAsync(deleteConfirm.role.id);
                }
                setDeleteConfirm(null);
              }}
            >
              {deleteConfirm?.type === 'hard' ? 'Delete permanently' : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RoleManagementGrid;
