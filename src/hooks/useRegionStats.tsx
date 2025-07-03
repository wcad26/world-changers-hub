
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface RegionStats {
  totalRegions: number;
  activeRegions: number;
  inactiveRegions: number;
  recentlyAdded: number;
  regionsWithMembers: number;
  regionsWithDCGs: number;
}

export const useRegionStats = () => {
  return useQuery({
    queryKey: ['region-stats'],
    queryFn: async (): Promise<RegionStats> => {
      console.log('Fetching region statistics...');

      // Get basic region counts
      const { data: allRegions } = await supabase
        .from('regions')
        .select('id, created_at, is_active');

      if (!allRegions) throw new Error('Failed to fetch regions');

      const totalRegions = allRegions.length;
      const activeRegions = allRegions.filter(r => r.is_active).length;
      const inactiveRegions = totalRegions - activeRegions;

      // Recently added (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentlyAdded = allRegions.filter(r => 
        new Date(r.created_at!) > thirtyDaysAgo
      ).length;

      // Get regions with members count
      const { data: memberCounts } = await supabase
        .from('members')
        .select('region_id')
        .not('region_id', 'is', null);

      const regionsWithMembers = new Set(memberCounts?.map(m => m.region_id) || []).size;

      // Get regions with DCGs count
      const { data: dcgCounts } = await supabase
        .from('dcgs')
        .select('region_id')
        .not('region_id', 'is', null);

      const regionsWithDCGs = new Set(dcgCounts?.map(d => d.region_id) || []).size;

      const stats = {
        totalRegions,
        activeRegions,
        inactiveRegions,
        recentlyAdded,
        regionsWithMembers,
        regionsWithDCGs
      };

      console.log('Region statistics fetched:', stats);
      return stats;
    }
  });
};
