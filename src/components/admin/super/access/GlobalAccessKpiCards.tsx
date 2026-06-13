import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, KeyRound, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { GlassKPICard } from '@/components/ui/GlassSection';

const GlobalAccessKpiCards: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['global-access-kpis'],
    queryFn: async () => {
      const [superRolesRes, superUsersRes, regionalUsersRes, pendingRes, regionsRes] = await Promise.all([
        supabase.from('super_admin_user_roles').select('user_id, is_active').eq('is_active', true),
        supabase
          .from('user_roles')
          .select('user_id, is_active, status')
          .eq('role', 'super_admin')
          .eq('is_active', true)
          .eq('status', 'active'),
        supabase
          .from('regional_user_roles')
          .select('user_id')
          .eq('is_active', true),
        supabase
          .from('user_roles')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending')
          .not('requested_regional_role_id', 'is', null),
        supabase.from('regions').select('id, is_active').eq('is_active', true),
      ]);

      const superAdmins = new Set(
        (superUsersRes.data ?? []).map((r: any) => r.user_id),
      );
      const regionalAdmins = new Set(
        (regionalUsersRes.data ?? []).map((r: any) => r.user_id),
      );

      // Regions with no admin assigned
      const { data: regionalAssigns } = await supabase
        .from('regional_user_roles')
        .select('region_id')
        .eq('is_active', true);
      const regionsWithAdmin = new Set(
        (regionalAssigns ?? []).map((r: any) => r.region_id),
      );
      const allRegions = (regionsRes.data ?? []).map((r: any) => r.id);
      const regionsWithoutAdmin = allRegions.filter(
        (id) => !regionsWithAdmin.has(id),
      ).length;

      return {
        superAdmins: superAdmins.size,
        regionalAdmins: regionalAdmins.size,
        pending: pendingRes.count ?? 0,
        regionsWithoutAdmin,
      };
    },
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <GlassKPICard
        icon={<ShieldCheck className="h-5 w-5" />}
        label="Super Admins"
        value={data?.superAdmins ?? 0}
        subtitle="Active platform admins"
        isLoading={isLoading}
      />
      <GlassKPICard
        icon={<KeyRound className="h-5 w-5" />}
        label="Regional Admins"
        value={data?.regionalAdmins ?? 0}
        subtitle="Users with regional access"
        isLoading={isLoading}
      />
      <GlassKPICard
        icon={<Clock className="h-5 w-5" />}
        label="Pending Approvals"
        value={data?.pending ?? 0}
        subtitle="Awaiting your decision"
        isLoading={isLoading}
      />
      <GlassKPICard
        icon={<AlertTriangle className="h-5 w-5" />}
        label="Regions Without Admin"
        value={data?.regionsWithoutAdmin ?? 0}
        subtitle={
          data?.regionsWithoutAdmin
            ? 'Needs an assignment'
            : 'Every region is covered'
        }
        isLoading={isLoading}
      />
    </div>
  );
};

export default GlobalAccessKpiCards;
