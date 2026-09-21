import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import {
  Search,
  Filter,
  Plus,
  UserMinus,
  UserCog,
  Users as UsersIcon,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRegionalRoles } from '@/hooks/useRegionalRoles';
import { useCanManageRegionalAccess } from '@/hooks/useCanManageRegionalAccess';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
import AssignRoleDialog from './AssignRoleDialog';
import { RESERVED_ROLE_NAME } from '@/config/regionalPermissions';

interface AccessRow {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  roles: Array<{
    assignmentId: string;
    roleId: string;
    name: string;
    description: string | null;
    assignedAt: string;
  }>;
  lastUpdated: string;
}

const initials = (first?: string | null, last?: string | null) =>
  `${(first ?? '').charAt(0)}${(last ?? '').charAt(0)}`.toUpperCase() || '?';

const UsersWithAccessTable: React.FC = () => {
  const { userRegion } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const regionId = userRegion?.id;

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [assigningUserId, setAssigningUserId] = useState<string | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<{
    user: AccessRow;
    assignment?: AccessRow['roles'][number];
  } | null>(null);

  const { data: roles } = useRegionalRoles(regionId);

  const { data: canManageAccess, isLoading: checkingAccess } =
    useCanManageRegionalAccess(regionId);

  const { data: rows, isLoading, error: rowsError } = useQuery({
    queryKey: ['users-with-access', regionId],
    queryFn: async (): Promise<AccessRow[]> => {
      if (!regionId) return [];

      const { data: assignments, error } = await supabase
        .from('regional_user_roles')
        .select(`
          id,
          user_id,
          regional_role_id,
          assigned_at,
          regional_roles:regional_role_id ( id, name, description )
        `)
        .eq('region_id', regionId)
        .eq('is_active', true);

      if (error) throw error;
      if (!assignments || assignments.length === 0) return [];

      const userIds = Array.from(new Set(assignments.map((a: any) => a.user_id)));

      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', userIds);
      if (pErr) throw pErr;

      const { data: members } = await supabase
        .from('members')
        .select('profile_id, photo_url')
        .in('profile_id', userIds);

      const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) ?? []);
      const photoMap = new Map(members?.map((m: any) => [m.profile_id, m.photo_url]) ?? []);

      const grouped = new Map<string, AccessRow>();
      for (const a of assignments as any[]) {
        // Keep the assignment visible even when the person's profile cannot be
        // read — dropping it used to make a populated list look empty.
        const profile = profileMap.get(a.user_id) ?? {};

        const row = grouped.get(a.user_id) ?? {
          user_id: a.user_id,
          email: profile.email ?? '',
          first_name: profile.first_name ?? '',
          last_name: profile.last_name ?? 'Unknown member',
          photo_url: photoMap.get(a.user_id) ?? null,
          roles: [],
          lastUpdated: a.assigned_at,
        };
        row.roles.push({
          assignmentId: a.id,
          roleId: a.regional_role_id,
          name: a.regional_roles?.name ?? 'Unknown',
          description: a.regional_roles?.description ?? null,
          assignedAt: a.assigned_at,
        });
        if (new Date(a.assigned_at) > new Date(row.lastUpdated)) {
          row.lastUpdated = a.assigned_at;
        }
        grouped.set(a.user_id, row);
      }

      return Array.from(grouped.values()).sort((a, b) =>
        a.last_name.localeCompare(b.last_name),
      );
    },
    enabled: !!regionId,
  });

  const revokeMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from('regional_user_roles')
        .update({ is_active: false })
        .eq('id', assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-access'] });
      queryClient.invalidateQueries({ queryKey: ['access-management-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['user-regional-roles'] });
      toast({ title: 'Access revoked', description: 'The role has been removed.' });
      setRevokeTarget(null);
    },
    onError: (err: any) => {
      toast({
        title: 'Error revoking access',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  const filteredRows = useMemo(() => {
    if (!rows) return [];
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesSearch =
        !q ||
        `${r.last_name} ${r.first_name}`.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q);
      const matchesRole =
        roleFilter === 'all' || r.roles.some((role) => role.name === roleFilter);
      return matchesSearch && matchesRole;
    });
  }, [rows, search, roleFilter]);

  // Hide the auto-created Regional Admin role from the filter dropdown.
  const filterableRoles = (roles ?? []).filter(
    (r) => r.is_active && r.name !== RESERVED_ROLE_NAME,
  );

  const openAssignFor = (userId?: string) => {
    setAssigningUserId(userId ?? null);
    setAssignDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email…"
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {filterableRoles.map((r) => (
                  <SelectItem key={r.id} value={r.name}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={() => openAssignFor()} className="gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Assign Access
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        {isLoading || checkingAccess ? (
          <div className="p-8 text-center text-muted-foreground">Loading users…</div>
        ) : rowsError || canManageAccess === false ? (
          // An empty list and a list you are not allowed to read used to look the
          // same. Say which one it is so missing people are never mistaken for
          // deleted people.
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <div className="rounded-full bg-muted p-3">
              <UsersIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">You don't have permission to view this list</p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Existing access assignments for this branch are safe — your account
                just isn't allowed to see them. Ask a Super Admin to give your
                account the Access Management permission for this branch.
              </p>
            </div>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <div className="rounded-full bg-muted p-3">
              <UsersIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">No users with access yet</p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Use <span className="font-medium">Assign Access</span> to grant a member
                one of your custom roles. Approved assignments will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead>Assigned roles</TableHead>
                <TableHead className="hidden lg:table-cell">Last updated</TableHead>
                <TableHead className="w-32 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((row) => (
                <TableRow key={row.user_id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        {row.photo_url ? (
                          <AvatarImage src={row.photo_url} alt="" />
                        ) : null}
                        <AvatarFallback>
                          {initials(row.first_name, row.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {row.last_name} {row.first_name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{row.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {row.roles.map((r) => (
                        <Tooltip key={r.assignmentId}>
                          <TooltipTrigger asChild>
                            <Badge
                              variant="secondary"
                              className="cursor-default gap-1 pr-1"
                            >
                              {r.name}
                              <button
                                type="button"
                                aria-label={`Revoke ${r.name}`}
                                onClick={() =>
                                  setRevokeTarget({ user: row, assignment: r })
                                }
                                className="ml-1 rounded-full p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                              >
                                <UserMinus className="h-3 w-3" />
                              </button>
                            </Badge>
                          </TooltipTrigger>
                          {r.description ? (
                            <TooltipContent className="max-w-xs">
                              {r.description}
                            </TooltipContent>
                          ) : null}
                        </Tooltip>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {formatDistanceToNow(new Date(row.lastUpdated), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openAssignFor(row.user_id)}
                          >
                            <UserCog className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Add another role</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setRevokeTarget({ user: row })}
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Revoke all access</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        )}
      </div>

      <AssignRoleDialog
        userId={assigningUserId ?? undefined}
        open={assignDialogOpen}
        onOpenChange={(open) => {
          setAssignDialogOpen(open);
          if (!open) setAssigningUserId(null);
        }}
      />

      <AlertDialog
        open={!!revokeTarget}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {revokeTarget?.assignment ? 'Revoke this role?' : 'Revoke all access?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {revokeTarget?.assignment ? (
                <>
                  Remove the <strong>{revokeTarget.assignment.name}</strong> role from{' '}
                  <strong>
                    {revokeTarget.user.last_name} {revokeTarget.user.first_name}
                  </strong>
                  . They will lose any permissions granted only by this role.
                </>
              ) : (
                <>
                  Remove every role from{' '}
                  <strong>
                    {revokeTarget?.user.last_name} {revokeTarget?.user.first_name}
                  </strong>
                  . They will no longer be able to access any restricted page.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!revokeTarget) return;
                if (revokeTarget.assignment) {
                  await revokeMutation.mutateAsync(revokeTarget.assignment.assignmentId);
                } else {
                  for (const r of revokeTarget.user.roles) {
                    await revokeMutation.mutateAsync(r.assignmentId);
                  }
                  setRevokeTarget(null);
                }
              }}
            >
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UsersWithAccessTable;
