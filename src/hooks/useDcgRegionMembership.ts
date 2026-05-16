import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { buildChildrenSet } from '@/utils/childUtils';
import { fetchMemberRelationshipsForMembers } from '@/utils/fetchMemberRelationships';

export interface DcgRegionMembership {
  dcgMemberIds: Set<string>;
  dcgChildIds: Set<string>;
  totalDcgMembers: number;
  totalDcgChildren: number;
  totalDcgAdults: number;
}

const EMPTY: DcgRegionMembership = {
  dcgMemberIds: new Set(),
  dcgChildIds: new Set(),
  totalDcgMembers: 0,
  totalDcgChildren: 0,
  totalDcgAdults: 0,
};

/**
 * Returns the set of member ids that belong to any active DCG in the given
 * region, plus the strict-child subset (age <16 AND linked to ≥1 adult).
 */
export const useDcgRegionMembership = (regionId?: string) => {
  return useQuery<DcgRegionMembership>({
    queryKey: ['dcg-region-membership', regionId],
    queryFn: async () => {
      if (!regionId) return EMPTY;

      const { data: dcgs, error: dcgsErr } = await supabase
        .from('dcgs')
        .select('id')
        .eq('region_id', regionId)
        .eq('is_active', true);
      if (dcgsErr) throw dcgsErr;

      const dcgIds = (dcgs || []).map((d) => d.id);
      if (!dcgIds.length) return EMPTY;

      const { data: rows, error: dmErr } = await supabase
        .from('dcg_members')
        .select('member_id')
        .in('dcg_id', dcgIds)
        .eq('is_active', true);
      if (dmErr) throw dmErr;

      const dcgMemberIds = new Set<string>();
      (rows || []).forEach((r: any) => {
        if (r.member_id) dcgMemberIds.add(r.member_id as string);
      });

      if (dcgMemberIds.size === 0) {
        if (regionId) console.warn('[useDcgRegionMembership] 0 members for region', regionId);
        return EMPTY;
      }

      // Pull DOB for these members so we can apply the strict child rule.
      const ids = Array.from(dcgMemberIds);
      const { data: memberRows, error: mErr } = await supabase
        .from('members')
        .select('id, profiles:profile_id ( date_of_birth )')
        .in('id', ids);
      if (mErr) throw mErr;

      const relationships = await fetchMemberRelationshipsForMembers(ids);
      const dcgChildIds = buildChildrenSet(
        (memberRows || []).map((m: any) => ({
          id: m.id,
          profiles: { date_of_birth: m.profiles?.date_of_birth ?? null },
        })),
        relationships,
      );

      const totalDcgMembers = dcgMemberIds.size;
      const totalDcgChildren = dcgChildIds.size;
      return {
        dcgMemberIds,
        dcgChildIds,
        totalDcgMembers,
        totalDcgChildren,
        totalDcgAdults: Math.max(0, totalDcgMembers - totalDcgChildren),
      };
    },
    enabled: !!regionId,
  });
};
