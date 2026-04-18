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
import { formatDistanceToNow } from 'date-fns';
import { type RegionalRole } from '@/hooks/useRegionalRoles';
import {
  PERMISSION_GROUPS,
  getPermissionDef,
  getPermissionsByGroup,
} from '@/config/regionalPermissions';

interface RoleDetailsDialogProps {
  role: RegionalRole;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RoleDetailsDialog: React.FC<RoleDetailsDialogProps> = ({
  role,
  open,
  onOpenChange,
}) => {
  const permSet = new Set(role.permissions || []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{role.name}</DialogTitle>
          <DialogDescription>
            {role.description || 'No description provided.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Role information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Created</span>
                  <p>
                    {formatDistanceToNow(new Date(role.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Last updated</span>
                  <p>
                    {formatDistanceToNow(new Date(role.updated_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={role.is_active ? 'default' : 'secondary'}>
                    {role.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Total permissions</span>
                  <p>{role.permissions?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div>
            <h3 className="mb-3 text-base font-semibold">Permissions</h3>
            {(!role.permissions || role.permissions.length === 0) ? (
              <p className="text-sm text-muted-foreground">
                No permissions assigned to this role.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {PERMISSION_GROUPS.map((group) => {
                  const groupPerms = getPermissionsByGroup(group).filter((p) =>
                    permSet.has(p.key),
                  );
                  if (groupPerms.length === 0) return null;
                  return (
                    <Card key={group}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">{group}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1.5">
                          {groupPerms.map((p) => (
                            <li key={p.key} className="text-sm">
                              <span className="font-medium">{p.label}</span>
                              <span className="block text-xs text-muted-foreground">
                                {p.hint}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Surface any unknown keys gracefully */}
                {(() => {
                  const known = new Set(
                    PERMISSION_GROUPS.flatMap((g) =>
                      getPermissionsByGroup(g).map((p) => p.key),
                    ),
                  );
                  const unknown = (role.permissions ?? []).filter((k) => !known.has(k));
                  if (unknown.length === 0) return null;
                  return (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Other</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-1">
                          {unknown.map((k) => (
                            <Badge key={k} variant="outline" className="text-xs">
                              {getPermissionDef(k)?.label ?? k}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoleDetailsDialog;
