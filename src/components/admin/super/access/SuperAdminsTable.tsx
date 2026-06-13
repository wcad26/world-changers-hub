import React, { useState } from 'react';
import { Crown, Shield, UserPlus, KeyRound, Trash2, Edit2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  useSuperAdminUsers,
  useAssignSuperAdminRole,
  useRevokeSuperAdminRole,
  useRevokeSuperAdminEntirely,
  type SuperAdminUserRow,
} from '@/hooks/useSuperAdminUsers';
import { useSuperAdminRoles } from '@/hooks/useSuperAdminRoles';
import { useSuperAdminPermissions } from '@/hooks/useSuperAdminPermissions';
import PromoteSuperAdminDialog from './PromoteSuperAdminDialog';

const SuperAdminsTable: React.FC = () => {
  const { data: users, isLoading } = useSuperAdminUsers();
  const { data: roles } = useSuperAdminRoles();
  const { isPrincipal } = useSuperAdminPermissions();
  const assign = useAssignSuperAdminRole();
  const revoke = useRevokeSuperAdminRole();
  const revokeAll = useRevokeSuperAdminEntirely();

  const [promoteOpen, setPromoteOpen] = useState(false);
  const [editing, setEditing] = useState<SuperAdminUserRow | null>(null);
  const [editRoleId, setEditRoleId] = useState<string>('');
  const [confirm, setConfirm] = useState<{ user: SuperAdminUserRow; assignmentId?: string } | null>(
    null,
  );

  const canManage = isPrincipal;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Every user with super admin access. Only the Principal Super Admin can promote, revoke,
          or change role assignments here.
        </p>
        {canManage && (
          <Button onClick={() => setPromoteOpen(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Promote Super Admin
          </Button>
        )}
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading super admins…</div>
        ) : !users || users.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No super admins yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead>Role(s)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.user_id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {u.isPrincipal ? (
                          <Crown className="h-4 w-4 text-amber-500" />
                        ) : (
                          <Shield className="h-4 w-4 text-primary" />
                        )}
                        {`${u.last_name ?? ''} ${u.first_name ?? ''}`.trim() || u.email}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {u.email}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {u.roles.length === 0 ? (
                          <Badge variant="outline" className="text-muted-foreground">
                            No tier
                          </Badge>
                        ) : (
                          u.roles.map((r) => (
                            <Badge
                              key={r.assignmentId}
                              className={
                                r.isReserved
                                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }
                              variant="outline"
                            >
                              {r.isReserved ? <Crown className="mr-1 h-3 w-3" /> : <KeyRound className="mr-1 h-3 w-3" />}
                              {r.name}
                              {canManage && !r.isReserved && (
                                <button
                                  onClick={() =>
                                    setConfirm({ user: u, assignmentId: r.assignmentId })
                                  }
                                  className="ml-1 rounded-full p-0.5 hover:bg-destructive/10 hover:text-destructive"
                                  aria-label="Remove role"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {canManage && (
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditing(u);
                              setEditRoleId('');
                            }}
                            disabled={u.isPrincipal && users.filter((x) => x.isPrincipal).length === 1}
                          >
                            <Edit2 className="mr-1 h-3.5 w-3.5" />
                            Change
                          </Button>
                          {!u.isPrincipal && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setConfirm({ user: u })}
                            >
                              <Trash2 className="mr-1 h-3.5 w-3.5" />
                              Revoke
                            </Button>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {!canManage && (
        <p className="text-xs text-muted-foreground italic">
          You don't have permission to manage super admin assignments. Ask the Principal Super
          Admin.
        </p>
      )}

      <PromoteSuperAdminDialog open={promoteOpen} onOpenChange={setPromoteOpen} />

      {/* Change role */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add a super admin role</DialogTitle>
            <DialogDescription>
              Add another role tier for{' '}
              <strong>
                {editing?.last_name} {editing?.first_name}
              </strong>
              . Roles stack — pick the most restrictive one needed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Role tier</Label>
            <Select value={editRoleId} onValueChange={setEditRoleId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a role" />
              </SelectTrigger>
              <SelectContent>
                {(roles ?? [])
                  .filter((r) => r.is_active)
                  .filter((r) => !editing?.roles.some((er) => er.roleId === r.id))
                  .map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.is_reserved ? '👑 ' : ''}
                      {r.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (editing && editRoleId) {
                  await assign.mutateAsync({ userId: editing.user_id, roleId: editRoleId });
                  setEditing(null);
                }
              }}
              disabled={!editRoleId || assign.isPending}
            >
              {assign.isPending ? 'Assigning…' : 'Assign role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm revoke */}
      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.assignmentId ? 'Remove this role?' : 'Revoke super admin access?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.assignmentId ? (
                <>
                  Remove this role tier from{' '}
                  <strong>
                    {confirm.user.last_name} {confirm.user.first_name}
                  </strong>
                  . They keep any other roles they hold.
                </>
              ) : (
                <>
                  Remove all super admin access from{' '}
                  <strong>
                    {confirm?.user.last_name} {confirm?.user.first_name}
                  </strong>
                  . They will no longer be able to sign into the super admin portal.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!confirm) return;
                if (confirm.assignmentId) {
                  await revoke.mutateAsync(confirm.assignmentId);
                } else {
                  await revokeAll.mutateAsync(confirm.user.user_id);
                }
                setConfirm(null);
              }}
            >
              {confirm?.assignmentId ? 'Remove role' : 'Revoke access'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SuperAdminsTable;
