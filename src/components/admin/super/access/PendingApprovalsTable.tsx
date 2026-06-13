import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  Loader2,
  Clock,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { getPermissionLabel } from '@/config/regionalPermissions';

interface PendingRow {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  region_id: string;
  region_name: string;
  role_id: string | null;
  role_name: string;
  permissions: string[];
  assigned_at: string;
}

const PendingApprovalsTable: React.FC = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewRow, setViewRow] = useState<PendingRow | null>(null);
  const [rejectRow, setRejectRow] = useState<PendingRow | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: rows, isLoading } = useQuery({
    queryKey: ['super-pending-approvals'],
    queryFn: async (): Promise<PendingRow[]> => {
      const { data: roleRows, error } = await supabase
        .from('user_roles')
        .select('id, user_id, region_id, requested_regional_role_id, assigned_at')
        .eq('status', 'pending')
        .eq('role', 'regional_admin')
        .not('requested_regional_role_id', 'is', null)
        .order('assigned_at', { ascending: false });
      if (error) throw error;
      if (!roleRows || roleRows.length === 0) return [];

      const userIds = Array.from(new Set(roleRows.map((r: any) => r.user_id)));
      const regionIds = Array.from(
        new Set(roleRows.map((r: any) => r.region_id).filter(Boolean)),
      ) as string[];
      const roleIds = Array.from(
        new Set(roleRows.map((r: any) => r.requested_regional_role_id).filter(Boolean)),
      ) as string[];

      const [profilesRes, regionsRes, regionalRolesRes] = await Promise.all([
        supabase.from('profiles').select('id, first_name, last_name, email').in('id', userIds),
        regionIds.length > 0
          ? supabase.from('regions').select('id, name').in('id', regionIds)
          : Promise.resolve({ data: [] as any[] } as any),
        roleIds.length > 0
          ? supabase
              .from('regional_roles')
              .select('id, name, permissions')
              .in('id', roleIds)
          : Promise.resolve({ data: [] as any[] } as any),
      ]);

      const profileMap = new Map<string, any>(
        (profilesRes.data ?? []).map((p: any) => [p.id, p]),
      );
      const regionMap = new Map<string, any>(
        (regionsRes.data ?? []).map((r: any) => [r.id, r]),
      );
      const roleMap = new Map<string, any>(
        (regionalRolesRes.data ?? []).map((r: any) => [r.id, r]),
      );

      return roleRows.map((r: any) => {
        const p = profileMap.get(r.user_id) ?? {};
        const region = regionMap.get(r.region_id) ?? {};
        const role = r.requested_regional_role_id
          ? roleMap.get(r.requested_regional_role_id)
          : null;
        return {
          id: r.id,
          user_id: r.user_id,
          user_name:
            `${p.last_name ?? ''} ${p.first_name ?? ''}`.trim() || 'Unknown',
          user_email: p.email ?? '',
          region_id: r.region_id,
          region_name: region.name ?? 'Unknown',
          role_id: r.requested_regional_role_id ?? null,
          role_name: role?.name ?? '—',
          permissions: (role?.permissions as string[]) ?? [],
          assigned_at: r.assigned_at,
        };
      });
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (rows ?? []).filter((row) => {
      const matchesSearch =
        !q ||
        row.user_name.toLowerCase().includes(q) ||
        row.user_email.toLowerCase().includes(q) ||
        row.role_name.toLowerCase().includes(q);
      const matchesRegion = regionFilter === 'all' || row.region_id === regionFilter;
      return matchesSearch && matchesRegion;
    });
  }, [rows, search, regionFilter]);

  const regions = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of rows ?? []) m.set(r.region_id, r.region_name);
    return Array.from(m.entries()).map(([id, name]) => ({ id, name }));
  }, [rows]);

  const approve = useMutation({
    mutationFn: async (row: PendingRow) => {
      const { error: upErr } = await supabase
        .from('user_roles')
        .update({
          status: 'active' as any,
          is_active: true,
          decided_by: user?.id ?? null,
          decided_at: new Date().toISOString(),
        })
        .eq('id', row.id);
      if (upErr) throw upErr;

      if (row.role_id && row.region_id) {
        // Avoid duplicate assignment
        const { data: existing } = await supabase
          .from('regional_user_roles')
          .select('id, is_active')
          .eq('user_id', row.user_id)
          .eq('region_id', row.region_id)
          .eq('regional_role_id', row.role_id)
          .maybeSingle();
        if (existing) {
          if (!existing.is_active) {
            await supabase
              .from('regional_user_roles')
              .update({
                is_active: true,
                assigned_by: user?.id ?? null,
                assigned_at: new Date().toISOString(),
              })
              .eq('id', existing.id);
          }
        } else {
          await supabase.from('regional_user_roles').insert({
            user_id: row.user_id,
            region_id: row.region_id,
            regional_role_id: row.role_id,
            assigned_by: user?.id ?? null,
            is_active: true,
          });
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['super-pending-approvals'] });
      qc.invalidateQueries({ queryKey: ['regional-access-requests'] });
      qc.invalidateQueries({ queryKey: ['users-with-access'] });
      qc.invalidateQueries({ queryKey: ['global-access-kpis'] });
      toast({ title: 'Request approved' });
    },
    onError: (e: any) =>
      toast({ title: 'Approval failed', description: e.message, variant: 'destructive' }),
  });

  const reject = useMutation({
    mutationFn: async ({ row, reason }: { row: PendingRow; reason: string }) => {
      const { error } = await supabase
        .from('user_roles')
        .update({
          status: 'rejected' as any,
          is_active: false,
          rejection_reason: reason || null,
          decided_by: user?.id ?? null,
          decided_at: new Date().toISOString(),
        })
        .eq('id', row.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['super-pending-approvals'] });
      qc.invalidateQueries({ queryKey: ['regional-access-requests'] });
      qc.invalidateQueries({ queryKey: ['global-access-kpis'] });
      toast({ title: 'Request rejected' });
    },
    onError: (e: any) =>
      toast({ title: 'Reject failed', description: e.message, variant: 'destructive' }),
  });

  const allSelectedOnPage = filtered.length > 0 && filtered.every((r) => selectedIds.has(r.id));
  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelectedOnPage) {
        filtered.forEach((r) => next.delete(r.id));
      } else {
        filtered.forEach((r) => next.add(r.id));
      }
      return next;
    });
  };
  const toggleOne = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const bulkApprove = async () => {
    const targets = filtered.filter((r) => selectedIds.has(r.id));
    for (const r of targets) await approve.mutateAsync(r);
    setSelectedIds(new Set());
  };
  const bulkReject = async () => {
    const targets = filtered.filter((r) => selectedIds.has(r.id));
    for (const r of targets) await reject.mutateAsync({ row: r, reason: 'Bulk rejection' });
    setSelectedIds(new Set());
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, role…"
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
        {selectedIds.size > 0 && (
          <div className="flex gap-2">
            <Button size="sm" onClick={bulkApprove} disabled={approve.isPending}>
              <CheckCircle2 className="mr-1 h-4 w-4" /> Approve ({selectedIds.size})
            </Button>
            <Button size="sm" variant="destructive" onClick={bulkReject} disabled={reject.isPending}>
              <XCircle className="mr-1 h-4 w-4" /> Reject ({selectedIds.size})
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <div className="rounded-full bg-muted p-3">
              <Clock className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium">No pending requests</p>
            <p className="max-w-md text-sm text-muted-foreground">
              When regional admins submit role assignments they'll appear here for your review.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allSelectedOnPage}
                      onCheckedChange={toggleAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Requested role</TableHead>
                  <TableHead className="hidden lg:table-cell">Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(row.id)}
                        onCheckedChange={() => toggleOne(row.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{row.user_name}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {row.user_email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{row.region_name}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{row.role_name}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {formatDistanceToNow(new Date(row.assigned_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setViewRow(row)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-emerald-700 hover:text-emerald-800"
                          onClick={() => approve.mutate(row)}
                          disabled={approve.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            setRejectRow(row);
                            setRejectReason('');
                          }}
                          disabled={reject.isPending}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* View permissions */}
      <Dialog open={!!viewRow} onOpenChange={(o) => !o && setViewRow(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewRow?.role_name}</DialogTitle>
            <DialogDescription>
              Permissions granted by this role in {viewRow?.region_name}.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[50vh] overflow-y-auto">
            {viewRow?.permissions?.length ? (
              <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {viewRow.permissions.map((p) => (
                  <li
                    key={p}
                    className="rounded-md bg-muted/50 px-3 py-1.5 text-sm"
                  >
                    {getPermissionLabel(p)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                This role doesn't grant any specific permissions yet.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject reason */}
      <AlertDialog open={!!rejectRow} onOpenChange={(o) => !o && setRejectRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject this access request?</AlertDialogTitle>
            <AlertDialogDescription>
              Tell the submitter why this was rejected. They will see this note in their
              "My Requests" tab.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., requires additional training first"
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (rejectRow) {
                  await reject.mutateAsync({ row: rejectRow, reason: rejectReason });
                  setRejectRow(null);
                }
              }}
            >
              Reject request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PendingApprovalsTable;
