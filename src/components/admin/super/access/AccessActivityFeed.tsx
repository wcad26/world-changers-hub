import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import {
  Activity,
  CheckCircle2,
  XCircle,
  UserPlus,
  UserMinus,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

interface Entry {
  id: string;
  ts: string;
  kind: 'approved' | 'rejected' | 'assigned' | 'revoked';
  who: string;
  detail: string;
}

const AccessActivityFeed: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['access-activity-feed'],
    queryFn: async (): Promise<Entry[]> => {
      // Approvals/rejections from user_roles
      const { data: decisions } = await supabase
        .from('user_roles')
        .select(`
          id, user_id, status, decided_at, assigned_at, rejection_reason,
          requested_regional_role_id, region_id
        `)
        .in('status', ['active', 'rejected'])
        .not('decided_at', 'is', null)
        .order('decided_at', { ascending: false })
        .limit(30);

      const { data: regionalAssigns } = await supabase
        .from('regional_user_roles')
        .select(`
          id, user_id, region_id, regional_role_id, assigned_at, is_active,
          regional_roles:regional_role_id ( name )
        `)
        .order('assigned_at', { ascending: false })
        .limit(30);

      const userIds = new Set<string>();
      const regionIds = new Set<string>();
      const roleIds = new Set<string>();

      (decisions ?? []).forEach((d: any) => {
        userIds.add(d.user_id);
        if (d.region_id) regionIds.add(d.region_id);
        if (d.requested_regional_role_id) roleIds.add(d.requested_regional_role_id);
      });
      (regionalAssigns ?? []).forEach((d: any) => {
        userIds.add(d.user_id);
        if (d.region_id) regionIds.add(d.region_id);
      });

      const [profilesRes, regionsRes, rolesRes] = await Promise.all([
        userIds.size
          ? supabase.from('profiles').select('id, first_name, last_name').in('id', Array.from(userIds))
          : Promise.resolve({ data: [] as any[] } as any),
        regionIds.size
          ? supabase.from('regions').select('id, name').in('id', Array.from(regionIds))
          : Promise.resolve({ data: [] as any[] } as any),
        roleIds.size
          ? supabase.from('regional_roles').select('id, name').in('id', Array.from(roleIds))
          : Promise.resolve({ data: [] as any[] } as any),
      ]);

      const profileMap = new Map<string, any>(
        (profilesRes.data ?? []).map((p: any) => [p.id, p]),
      );
      const regionMap = new Map<string, any>(
        (regionsRes.data ?? []).map((r: any) => [r.id, r]),
      );
      const roleMap = new Map<string, any>((rolesRes.data ?? []).map((r: any) => [r.id, r]));

      const entries: Entry[] = [];

      for (const d of decisions ?? []) {
        const p = profileMap.get((d as any).user_id) ?? {};
        const region = (d as any).region_id ? regionMap.get((d as any).region_id) : null;
        const role = (d as any).requested_regional_role_id
          ? roleMap.get((d as any).requested_regional_role_id)
          : null;
        const who = `${p.last_name ?? ''} ${p.first_name ?? ''}`.trim() || 'Unknown';
        entries.push({
          id: `dec-${(d as any).id}`,
          ts: (d as any).decided_at,
          kind: (d as any).status === 'active' ? 'approved' : 'rejected',
          who,
          detail: `${(d as any).status === 'active' ? 'Approved' : 'Rejected'} ${role?.name ?? 'role'} for ${region?.name ?? 'a region'}${
            (d as any).rejection_reason ? ` — "${(d as any).rejection_reason}"` : ''
          }`,
        });
      }

      for (const a of regionalAssigns ?? []) {
        const p = profileMap.get((a as any).user_id) ?? {};
        const region = (a as any).region_id ? regionMap.get((a as any).region_id) : null;
        const who = `${p.last_name ?? ''} ${p.first_name ?? ''}`.trim() || 'Unknown';
        entries.push({
          id: `assign-${(a as any).id}`,
          ts: (a as any).assigned_at,
          kind: (a as any).is_active ? 'assigned' : 'revoked',
          who,
          detail: `${(a as any).is_active ? 'Assigned' : 'Revoked'} ${(a as any).regional_roles?.name ?? 'role'} in ${region?.name ?? 'a region'}`,
        });
      }

      return entries
        .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
        .slice(0, 50);
    },
  });

  const iconFor = (k: Entry['kind']) => {
    switch (k) {
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'assigned':
        return <UserPlus className="h-4 w-4 text-primary" />;
      case 'revoked':
        return <UserMinus className="h-4 w-4 text-amber-600" />;
    }
  };

  const labelFor = (k: Entry['kind']) =>
    k === 'approved'
      ? 'Approved'
      : k === 'rejected'
      ? 'Rejected'
      : k === 'assigned'
      ? 'Assigned'
      : 'Revoked';

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground">Loading activity…</div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        <Activity className="h-8 w-8" />
        <p>No recent access activity.</p>
      </div>
    );
  }

  return (
    <ol className="relative ml-3 space-y-3 border-l border-border/60 pl-6">
      {data.map((e) => (
        <li key={e.id} className="relative">
          <span className="absolute -left-[34px] top-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-card border border-border/60">
            {iconFor(e.kind)}
          </span>
          <div className="rounded-lg border bg-card/60 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-medium">{e.who}</div>
              <Badge variant="outline" className="text-xs">
                {labelFor(e.kind)}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{e.detail}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(e.ts), { addSuffix: true })}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
};

export default AccessActivityFeed;
