import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Clock, CheckCircle2, XCircle, Ban, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
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

interface RequestRow {
  id: string;
  user_id: string;
  status: 'pending' | 'active' | 'rejected' | string;
  requested_regional_role_id: string | null;
  assigned_at: string;
  decided_at: string | null;
  rejection_reason: string | null;
  user_name: string;
  user_email: string;
  role_name: string;
}

/**
 * Lists role assignment requests submitted in the current region (by anyone in
 * this region). Regional admins can cancel their own pending requests.
 */
const MyRequestsList: React.FC = () => {
  const { userRegion } = useAuth();
  const regionId = userRegion?.id;
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: rows, isLoading } = useQuery({
    queryKey: ['regional-access-requests', regionId],
    queryFn: async (): Promise<RequestRow[]> => {
      if (!regionId) return [];

      const { data: roleRows, error } = await supabase
        .from('user_roles')
        .select(
          'id, user_id, status, requested_regional_role_id, assigned_at, decided_at, rejection_reason',
        )
        .eq('region_id', regionId)
        .eq('role', 'regional_admin')
        .not('requested_regional_role_id', 'is', null)
        .order('assigned_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      if (!roleRows || roleRows.length === 0) return [];

      const userIds = Array.from(new Set(roleRows.map((r: any) => r.user_id)));
      const roleIds = Array.from(
        new Set(roleRows.map((r: any) => r.requested_regional_role_id).filter(Boolean)),
      ) as string[];

      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from('profiles').select('id, first_name, last_name, email').in('id', userIds),
        roleIds.length > 0
          ? supabase.from('regional_roles').select('id, name').in('id', roleIds)
          : Promise.resolve({ data: [] as any[], error: null } as any),
      ]);

      const profileMap = new Map<string, any>(
        (profilesRes.data ?? []).map((p: any) => [p.id, p]),
      );
      const roleMap = new Map<string, any>(
        (rolesRes.data ?? []).map((r: any) => [r.id, r]),
      );

      return roleRows.map((r: any) => {
        const p = profileMap.get(r.user_id) ?? {};
        const role = r.requested_regional_role_id
          ? roleMap.get(r.requested_regional_role_id)
          : null;
        return {
          id: r.id,
          user_id: r.user_id,
          status: r.status,
          requested_regional_role_id: r.requested_regional_role_id,
          assigned_at: r.assigned_at,
          decided_at: r.decided_at,
          rejection_reason: r.rejection_reason,
          user_name: `${p.last_name ?? ''} ${p.first_name ?? ''}`.trim() || 'Unknown',
          user_email: p.email ?? '',
          role_name: role?.name ?? '—',
        };
      });
    },
    enabled: !!regionId,
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_roles')
        .update({ status: 'rejected' as any, is_active: false, rejection_reason: 'Cancelled by submitter' })
        .eq('id', id)
        .eq('status', 'pending');
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['regional-access-requests'] });
      qc.invalidateQueries({ queryKey: ['access-management-kpis'] });
      toast({ title: 'Request cancelled' });
    },
    onError: (e: any) =>
      toast({ title: 'Could not cancel', description: e.message, variant: 'destructive' }),
  });

  const statusBadge = (s: string) => {
    if (s === 'pending')
      return (
        <Badge variant="outline" className="gap-1 border-amber-300 bg-amber-50 text-amber-700">
          <Clock className="h-3 w-3" /> Pending
        </Badge>
      );
    if (s === 'active')
      return (
        <Badge className="gap-1 bg-emerald-100 text-emerald-700 border-emerald-200">
          <CheckCircle2 className="h-3 w-3" /> Approved
        </Badge>
      );
    return (
      <Badge variant="outline" className="gap-1 border-red-300 bg-red-50 text-red-700">
        <XCircle className="h-3 w-3" /> Rejected
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading requests…
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        <ListChecksEmpty />
        <p className="mt-3 font-medium text-foreground">No requests yet</p>
        <p className="mt-1 text-sm">
          When you assign a role to a member, the request will appear here while it waits for
          Super Admin approval.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead>Requested role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.user_name}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {row.user_email}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{row.role_name}</Badge>
                  {row.status === 'rejected' && row.rejection_reason && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Reason: {row.rejection_reason}
                    </p>
                  )}
                </TableCell>
                <TableCell>{statusBadge(row.status)}</TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground">
                  {formatDistanceToNow(new Date(row.assigned_at), { addSuffix: true })}
                </TableCell>
                <TableCell className="text-right">
                  {row.status === 'pending' ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1 text-destructive hover:text-destructive"
                      onClick={() => cancel.mutate(row.id)}
                      disabled={cancel.isPending}
                    >
                      <Ban className="h-3.5 w-3.5" /> Cancel
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {row.decided_at
                        ? `Decided ${formatDistanceToNow(new Date(row.decided_at), { addSuffix: true })}`
                        : '—'}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

const ListChecksEmpty = () => (
  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
    <Clock className="h-6 w-6 text-muted-foreground" />
  </div>
);

export default MyRequestsList;
