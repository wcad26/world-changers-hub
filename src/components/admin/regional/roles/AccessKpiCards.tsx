import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { KeyRound, Users, Clock, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { GlassKPICard } from '@/components/ui/GlassSection';
import { RESERVED_ROLE_NAME } from '@/config/regionalPermissions';
import { useCanManageRegionalAccess } from '@/hooks/useCanManageRegionalAccess';

/**
 * 4 real-data KPI cards for the Access Management page.
 *
 * 1. Custom Roles  – active roles created in this region (excluding the auto-created Regional Admin)
 * 2. Users With Access – distinct users that hold at least one active regional role here
 * 3. Pending Requests – role requests awaiting Super Admin approval
 * 4. Most-Used Role  – the role with the most active assignments + count
 */
const AccessKpiCards: React.FC = () => {
  const { userRegion } = useAuth();
  const regionId = userRegion?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['access-management-kpis', regionId],
    queryFn: async () => {
      if (!regionId) return null;

      const [rolesRes, assignmentsRes, pendingRes] = await Promise.all([
        supabase
          .from('regional_roles')
          .select('id, name, is_active')
          .eq('region_id', regionId)
          .eq('is_active', true),
        supabase
          .from('regional_user_roles')
          .select('user_id, regional_role_id, regional_roles:regional_role_id (name)')
          .eq('region_id', regionId)
          .eq('is_active', true),
        supabase
          .from('user_roles')
          .select('id', { count: 'exact', head: true })
          .eq('region_id', regionId)
          .eq('status', 'pending')
          .not('requested_regional_role_id', 'is', null),
      ]);

      const roles = rolesRes.data ?? [];
      const assignments = assignmentsRes.data ?? [];

      const customRoles = roles.filter((r: any) => r.name !== RESERVED_ROLE_NAME).length;
      const distinctUsers = new Set(assignments.map((a: any) => a.user_id)).size;

      // Tally per role and find the most used.
      const counts = new Map<string, { name: string; count: number }>();
      for (const a of assignments) {
        const name = (a as any).regional_roles?.name ?? 'Unknown';
        const cur = counts.get(name) ?? { name, count: 0 };
        cur.count += 1;
        counts.set(name, cur);
      }
      let topRole: { name: string; count: number } | null = null;
      for (const entry of counts.values()) {
        if (!topRole || entry.count > topRole.count) topRole = entry;
      }

      return {
        customRoles,
        distinctUsers,
        pendingRequests: pendingRes.count ?? 0,
        topRole,
      };
    },
    enabled: !!regionId,
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <GlassKPICard
        icon={<KeyRound className="h-5 w-5" />}
        label="Custom Roles"
        value={data?.customRoles ?? 0}
        subtitle="Roles you've created"
        isLoading={isLoading}
      />
      <GlassKPICard
        icon={<Users className="h-5 w-5" />}
        label="Users With Access"
        value={canManageAccess === false ? '—' : data?.distinctUsers ?? 0}
        subtitle={
          canManageAccess === false
            ? 'Hidden — you lack permission'
            : 'People holding at least one role'
        }
        isLoading={isLoading || checkingAccess}
      />
      <GlassKPICard
        icon={<Clock className="h-5 w-5" />}
        label="Pending Requests"
        value={data?.pendingRequests ?? 0}
        subtitle="Awaiting Super Admin approval"
        isLoading={isLoading}
      />
      <GlassKPICard
        icon={<Award className="h-5 w-5" />}
        label="Most-Used Role"
        value={data?.topRole?.name ?? '—'}
        subtitle={
          data?.topRole
            ? `${data.topRole.count} ${data.topRole.count === 1 ? 'user' : 'users'}`
            : 'No assignments yet'
        }
        isLoading={isLoading}
      />
    </div>
  );
};

export default AccessKpiCards;
