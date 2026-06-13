import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  SUPER_PERMISSION_GROUPS,
  getSuperPermissionsByGroup,
  getSuperPermissionLabel,
} from '@/config/superAdminPermissions';
import type { SuperAdminRole } from '@/hooks/useSuperAdminRoles';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';

interface Props {
  role: SuperAdminRole;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

const ViewSuperAdminRoleDialog: React.FC<Props> = ({ role, open, onOpenChange }) => {
  const granted = new Set(role.permissions ?? []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {role.is_reserved && <Crown className="h-5 w-5 text-amber-500" />}
            {role.name}
          </DialogTitle>
          <DialogDescription>
            {role.description || 'No description provided.'}
          </DialogDescription>
        </DialogHeader>

        {role.is_reserved ? (
          <div className="rounded-lg border border-amber-300/50 bg-amber-50/50 p-4 text-sm">
            <p className="font-medium">Reserved role — full access</p>
            <p className="mt-1 text-muted-foreground">
              The Principal Super Admin role grants every permission and cannot be edited.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {SUPER_PERMISSION_GROUPS.map((group) => {
              const perms = getSuperPermissionsByGroup(group);
              const groupGranted = perms.filter((p) => granted.has(p.key));
              return (
                <div key={group} className="rounded-lg border bg-card p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{group}</p>
                    <Badge variant="outline" className="text-xs">
                      {groupGranted.length} / {perms.length}
                    </Badge>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {perms.map((p) => {
                      const on = granted.has(p.key);
                      return (
                        <li
                          key={p.key}
                          className={
                            on
                              ? 'text-sm text-foreground'
                              : 'text-sm text-muted-foreground line-through opacity-60'
                          }
                        >
                          {p.label}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ViewSuperAdminRoleDialog;
