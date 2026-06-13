import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Search, Filter, UserMinus, Trash2, Users as UsersIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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

interface Row {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  region_id: string;
  region_name: string;
  roles: Array<{ assignmentId: string; roleId: string; name: string; assignedAt: string }>;
  lastUpdated: string;
}

const RegionalUsersTable: React.FC = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [revokeTarget, setRevokeTarget] = useState<{ row: Row; assignmentId?: string } | null>(
    null,
  );

  const { data: rows, isLoading } = useQuery({
    queryKey: ['super-regional-users'],
    queryFn: async (): Promise<Row[]> => {
      const { data: assignments, error } = await supabase
        .from('regional_user_roles')
        .select(`
          id,
          user_id,
          region_id,
          regional_role_id,
          assigned_at,
          regional_roles:regional_role_id ( id, name )
        `)
        .eq('is_active', true);
      if (error) throw error;
      if (!assignments || assignments.length === 0) return [];

      const userIds = Array.from(new Set(assignments.map((a: any) => a.user_id)));
      const regionIds = Array.from(new Set(assignments.map((a: any) => a.region_id)));

      const [profilesRes, regionsRes] = await Promise.all([
        supabase.from('profiles').select('id, email, first_name, last_name').in('id', userIds),
        supabase.from('regions').select('id, name').in('id', regionIds as string[]),
      ]);

      const profileMap = new Map<string, any>(
        (profilesRes.data ?? []).map((p: any) => [p.id, p]),
      );
      const regionMap = new Map<string, any>(
        (regionsRes.data ?? []).map((r: any) => [r.id, r]),
      );

      // Group by user+region
      const grouped = new Map<string, Row>();
      for (const a of assignments as any[]) {
        const key = `${a.user_id}::${a.region_id}`;
        const profile = profileMap.get(a.user_id);
        if (!profile) continue;
        const row =
          grouped.get(key) ??
          ({
            user_id: a.user_id,
            email: profile.email ?? '',
            first_name: profile.first_name ?? null,
            last_name: profile.last_name ?? null,
            region_id: a.region_id,
            region_name: regionMap.get(a.region_id)?.name ?? 'Unknown',
            roles: [],
            lastUpdated: a.assigned_at,
          } as Row);
        row.roles.push({
          assignmentId: a.id,
          roleId: a.regional_role_id,
          name: a.regional_roles?.name ?? 'Unknown',
          assignedAt: a.assigned_at,
        });
        if (new Date(a.assigned_at) > new Date(row.lastUpdated)) row.lastUpdated = a.assigned_at;
        grouped.set(key, row);
      }
      return Array.from(grouped.values()).sort((a, b) =>
        (a.last_name ?? '').localeCompare(b.last_name ?? ''),
      );
    },
  });

  const regions = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of rows ?? []) m.set(r.region_id, r.region_name);
    return Array.from(m.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (rows ?? []).filter((row) => {
      const matchesQ =
        !q ||
        row.email.toLowerCase().includes(q) ||
        `${row.last_name ?? ''} ${row.first_name ?? ''}`.toLowerCase().includes(q) ||
        row.roles.some((r) => r.name.toLowerCase().includes(q));
      const matchesRegion = regionFilter === 'all' || row.region_id === regionFilter;
      return matchesQ && matchesRegion;
    });
  }, [rows, search, regionFilter]);

  const revoke = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from('regional_user_roles')
        .update({ is_active: false })
        .eq('id', assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['super-regional-users'] });
      qc.invalidateQueries({ queryKey: ['users-with-access'] });
      qc.invalidateQueries({ queryKey: ['global-access-kpis'] });
      toast({ title: 'Access revoked' });
    },
    onError: (e: any) =>
      toast({ title: 'Could not revoke', description: e.message, variant: 'destructive' }),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or role…"
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="Filter by region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All regions</SelectItem>
              {regions.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <div className="rounded-full bg-muted p-3">
              <UsersIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium">No regional users with access yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead className="hidden lg:table-cell">Last updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow key={`${row.user_id}::${row.region_id}`}>
                    <TableCell className="font-medium">
                      {`${row.last_name ?? ''} ${row.first_name ?? ''}`.trim() || row.email}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {row.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{row.region_name}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {row.roles.map((r) => (
                          <Badge
                            key={r.assignmentId}
                            variant="secondary"
                            className="cursor-default gap-1 pr-1"
                          >
                            {r.name}
                            <button
                              type="button"
                              aria-label={`Revoke ${r.name}`}
                              onClick={() =>
                                setRevokeTarget({ row, assignmentId: r.assignmentId })
                              }
                              className="ml-1 rounded-full p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            >
                              <UserMinus className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {formatDistanceToNow(new Date(row.lastUpdated), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setRevokeTarget({ row })}
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        Revoke all
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <AlertDialog open={!!revokeTarget} onOpenChange={(o) => !o && setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {revokeTarget?.assignmentId ? 'Revoke this role?' : 'Revoke all roles?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {revokeTarget?.assignmentId
                ? 'The user keeps any other roles they hold in this region.'
                : 'Remove every regional role this user holds in this region.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!revokeTarget) return;
                if (revokeTarget.assignmentId) {
                  await revoke.mutateAsync(revokeTarget.assignmentId);
                } else {
                  for (const r of revokeTarget.row.roles) {
                    await revoke.mutateAsync(r.assignmentId);
                  }
                }
                setRevokeTarget(null);
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

export default RegionalUsersTable;
