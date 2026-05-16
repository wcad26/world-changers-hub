import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DcgRegionMembership {
  dcgMemberIds: Set<string>;
  totalDcgMembers: number;
}

/**
 * Returns the set of member ids that belong to any DCG in the given region
 * (active dcg_members rows only).
 */
export const useDcgRegionMembership = (regionId?: string) => {
  return useQuery<DcgRegionMembership>({
    queryKey: ['dcg-region-membership', regionId],
    queryFn: async () => {
      if (!regionId) return { dcgMemberIds: new Set<string>(), totalDcgMembers: 0 };

      const { data: dcgs } = await supabase
        .from('dcgs')
        .select('id')
        .eq('region_id', regionId)
        .eq('is_active', true);
      const dcgIds = (dcgs || []).map(d => d.id);
      if (!dcgIds.length) return { dcgMemberIds: new Set<string>(), totalDcgMembers: 0 };

      const { data: rows } = await supabase
        .from('dcg_members')
        .select('member_id')
        .in('dcg_id', dcgIds)
        .eq('is_active', true);

      const set = new Set<string>((rows || []).map((r: any) => r.member_id));
      return { dcgMemberIds: set, totalDcgMembers: set.size };
    },
    enabled: !!regionId,
  });
};
