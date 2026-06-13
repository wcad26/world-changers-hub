import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Crown, KeyRound, Eye, Edit2, Trash2, Plus, Users, Lock } from 'lucide-react';
import {
  useSuperAdminRoles,
  useSuperAdminRoleUsage,
  useDeleteSuperAdminRole,
  type SuperAdminRole,
} from '@/hooks/useSuperAdminRoles';
import { useSuperAdminPermissions } from '@/hooks/useSuperAdminPermissions';
import CreateSuperAdminRoleDialog from './CreateSuperAdminRoleDialog';
import EditSuperAdminRoleDialog from './EditSuperAdminRoleDialog';
import ViewSuperAdminRoleDialog from './ViewSuperAdminRoleDialog';

const SuperAdminRolesGrid: React.FC = () => {
  const { data: roles, isLoading } = useSuperAdminRoles();
  const { data: usage } = useSuperAdminRoleUsage();
  const { isPrincipal } = useSuperAdminPermissions();
  const del = useDeleteSuperAdminRole();

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<SuperAdminRole | null>(null);
  const [viewing, setViewing] = useState<SuperAdminRole | null>(null);
  const [confirmDel, setConfirmDel] = useState<SuperAdminRole | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Each role tier defines what a super admin assigned to it can see and do across the
          platform. Only the Principal can create or edit these tiers.
        </p>
        {isPrincipal && (
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Role Tier
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">Loading roles…</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(roles ?? []).map((role) => {
            const count = usage?.[role.id] ?? 0;
            return (
              <Card
                key={role.id}
                className={
                  role.is_reserved
                    ? 'relative border-amber-300/50 bg-amber-50/40'
                    : 'flex flex-col'
                }
              >
                <CardHeader className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {role.is_reserved ? (
                        <Crown className="h-4 w-4 text-amber-500" />
                      ) : (
                        <KeyRound className="h-4 w-4 text-primary" />
                      )}
                      <h3 className="font-semibold">{role.name}</h3>
                    </div>
                    {role.is_reserved ? (
                      <Badge variant="outline" className="border-amber-300 text-amber-700">
                        Reserved
                      </Badge>
                    ) : !role.is_active ? (
                      <Badge variant="outline" className="text-muted-foreground">
                        Inactive
                      </Badge>
                    ) : null}
                  </div>
                  <p className="line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">
                    {role.description || 'No description provided.'}
                  </p>
                </CardHeader>
                <CardContent className="flex-1 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <KeyRound className="h-4 w-4" />
                    <span>
                      {role.is_reserved
                        ? 'All permissions (full access)'
                        : `${role.permissions?.length ?? 0} permissions`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>
                      Held by {count} {count === 1 ? 'super admin' : 'super admins'}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setViewing(role)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Button>
                  {role.is_reserved ? (
                    <Button size="sm" variant="outline" className="flex-1" disabled>
                      <Lock className="mr-2 h-4 w-4" />
                      Locked
                    </Button>
                  ) : isPrincipal ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setEditing(role)}
                      >
                        <Edit2 className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setConfirmDel(role)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  ) : null}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <CreateSuperAdminRoleDialog open={createOpen} onOpenChange={setCreateOpen} />
      {editing && (
        <EditSuperAdminRoleDialog
          role={editing}
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}
      {viewing && (
        <ViewSuperAdminRoleDialog
          role={viewing}
          open={!!viewing}
          onOpenChange={(o) => !o && setViewing(null)}
        />
      )}

      <AlertDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this role tier?</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete <strong>{confirmDel?.name}</strong>. The role must have no super
              admins currently assigned to it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (confirmDel) {
                  await del.mutateAsync(confirmDel.id);
                  setConfirmDel(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SuperAdminRolesGrid;
