import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type DcgWithRegionAndLeader = Database['public']['Tables']['dcgs']['Row'] & {
  leader: {
    profiles: {
      first_name: string | null;
      last_name: string | null;
    } | null;
  } | null;
  regions: {
    id: string;
    name: string;
    code: string;
  } | null;
  member_count?: number;
};

export const useAllDcgs = () => {
  return useQuery({
    queryKey: ['dcgs', 'all'],
    queryFn: async () => {
      const { data: dcgsData, error } = await supabase
        .from('dcgs')
        .select('*, leader:members!dcgs_leader_id_fkey(profiles:profiles!members_profile_id_fkey(first_name, last_name)), regions:regions!dcgs_region_id_fkey(id, name, code)')
        .order('name', { ascending: true });

      if (error) throw error;

      const dcgIds = dcgsData?.map(d => d.id) || [];
      if (dcgIds.length === 0) return (dcgsData || []) as DcgWithRegionAndLeader[];

      const { data: memberCounts, error: mcErr } = await supabase
        .from('dcg_members')
        .select('dcg_id')
        .in('dcg_id', dcgIds)
        .eq('is_active', true);

      if (mcErr) throw mcErr;

      const countMap = (memberCounts || []).reduce((acc, m) => {
        acc[m.dcg_id] = (acc[m.dcg_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return (dcgsData || []).map(d => ({ ...d, member_count: countMap[d.id] || 0 })) as DcgWithRegionAndLeader[];
    },
    staleTime: 5 * 60 * 1000,
  });
};
